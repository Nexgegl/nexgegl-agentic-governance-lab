/**
 * Part E of `npm run test:kfsa-integration`: drives the *actual*
 * submitPromotionRequestForEvaluation with genuine concurrency -- two
 * real Postgres connections, each running the real function with
 * Promise.all, racing for real against real unique constraints. This is
 * the only place H-2 (a concurrent attempt-creation race throwing an
 * uncaught KfsaClientError instead of a structured result) is proven
 * fixed against the real composed flow, not simulated via fault
 * injection or tested only at the raw-SQL layer.
 *
 * scripts/governance-tests/pg-client-adapter.ts bridges the real
 * repositories/*.ts call shapes to real SQL over a real pg.Client
 * connection, running as either `authenticated` (a genuine tenant
 * session, real RLS) or `service_role` (the administrative write path) --
 * see that file's own comment for why scripts/governance-tests/fake-client.ts
 * cannot be used for this: it has no transactions or unique constraints
 * of its own to race against.
 *
 * Covers:
 *   - two simultaneous Promise.all submissions for one Promotion Request
 *   - only one evaluation response is ever created
 *   - no unhandled exception escapes either call
 *   - the losing request returns a structured result (replay, failed, or
 *     in_progress -- never a throw)
 *   - the mock KFSA server receives at most one call for the race
 *   - correlation_id conflict against a *different* Promotion Request is
 *     a structured rejection, not a throw that escapes as a raw error
 *   - a stale in_progress attempt is recovered and a fresh submission
 *     proceeds
 *   - a fresh in_progress attempt is protected from a duplicate
 *     submission (no second KFSA call, no second attempt row)
 */
import { Client } from "pg";
import { rebuildTestDatabase, type TestOrgFixtures } from "./governance-tests/db-setup";
import { PgSupabaseClient } from "./governance-tests/pg-client-adapter";
import { submitPromotionRequestForEvaluation } from "@/lib/kfsa/promotion-submission";
import { KfsaSubmissionBoundaryError } from "@/lib/kfsa/errors";
import { startMockKfsaServer, validKfsaResponseBody, type MockKfsaServer } from "./kfsa-tests/mock-server";
import { test, assert, assertEqual, printSummaryAndExit } from "./governance-tests/harness";

async function connectAsUser(connectionString: string, userId: string): Promise<Client> {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(`set role authenticated`);
  await client.query(`set request.jwt.claim.sub = '${userId}'`);
  await client.query(`set request.jwt.claim.role = 'authenticated'`);
  return client;
}

async function connectAsServiceRole(connectionString: string): Promise<Client> {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(`set role service_role`);
  await client.query(`select set_config('request.jwt.claim.role', 'service_role', false)`);
  return client;
}

async function insertPromotionRequestFixture(client: Client, userId: string, correlationId: string): Promise<string> {
  const snapshot = await client.query(
    `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
     values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
     returning id`,
    [userId],
  );
  const run = await client.query(
    `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id, status)
     values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, $3, 'completed')
     returning id`,
    [snapshot.rows[0].id, userId, `run-${correlationId}`],
  );
  const pr = await client.query(
    `insert into public.promotion_requests
       (source_plugin_id, source_skill_id, source_run_id, request_id, candidate_id, objective, correlation_id, context_snapshot_id, plugin_version, skill_version)
     values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'candidate-1', 'test objective', $3, $4, '0.1.0', '0.1.0')
     returning id`,
    [run.rows[0].id, `req-${correlationId}`, correlationId, snapshot.rows[0].id],
  );
  return pr.rows[0].id as string;
}

async function run() {
  const { connectionString, fixtures } = await rebuildTestDatabase();
  const f: TestOrgFixtures = fixtures;

  const server: MockKfsaServer = await startMockKfsaServer();
  process.env.KFSA_RUNTIME_BASE_URL = server.url;
  process.env.KFSA_RUNTIME_API_KEY = "test-kfsa-api-key-do-not-use-in-prod";
  process.env.KFSA_RUNTIME_TIMEOUT_MS = "2000";

  try {
    await test("concurrency-1. two simultaneous submissions for one Promotion Request: no unhandled exception, exactly one evaluation response, structured loser result", async () => {
      let callCount = 0;
      server.setHandler((_req, _body, res) => {
        callCount += 1;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody({ audit_event_id: "ext-audit-concurrency-1" })));
      });

      const tenantConnA = await connectAsUser(connectionString, f.userAId);
      const adminConnA = await connectAsServiceRole(connectionString);
      const tenantConnB = await connectAsUser(connectionString, f.userAId);
      const adminConnB = await connectAsServiceRole(connectionString);

      try {
        const prId = await insertPromotionRequestFixture(tenantConnA, f.userAId, "corr-concurrency-1");

        const tenantClientA = new PgSupabaseClient(tenantConnA, f.userAId) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[0];
        const adminClientA = new PgSupabaseClient(adminConnA, null) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[1];
        const tenantClientB = new PgSupabaseClient(tenantConnB, f.userAId) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[0];
        const adminClientB = new PgSupabaseClient(adminConnB, null) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[1];

        const [resultA, resultB] = await Promise.allSettled([
          submitPromotionRequestForEvaluation(tenantClientA, adminClientA, { promotionRequestId: prId }),
          submitPromotionRequestForEvaluation(tenantClientB, adminClientB, { promotionRequestId: prId }),
        ]);

        assertEqual(resultA.status, "fulfilled", `call A must not throw an unhandled exception${resultA.status === "rejected" ? `: ${String(resultA.reason)}` : ""}`);
        assertEqual(resultB.status, "fulfilled", `call B must not throw an unhandled exception${resultB.status === "rejected" ? `: ${String(resultB.reason)}` : ""}`);

        const outcomes = [resultA, resultB].filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof submitPromotionRequestForEvaluation>>> => r.status === "fulfilled").map((r) => r.value);
        for (const outcome of outcomes) {
          assert(["succeeded", "replay", "in_progress", "failed"].includes(outcome.kind), `every outcome must be one of the structured kinds, got "${outcome.kind}"`);
        }

        const succeededOrReplayed = outcomes.filter((o) => o.kind === "succeeded" || o.kind === "replay");
        assert(succeededOrReplayed.length >= 1, "at least one of the two concurrent requests must reach a persisted result (succeeded or, if it lost the race, replay)");

        assert(callCount <= 1, `the external KFSA server must receive at most one call for this race, got ${callCount}`);

        const finalCheck = await tenantConnA.query(`select count(*)::int as count from public.kfsa_evaluation_responses where promotion_request_id = $1`, [prId]);
        assertEqual(finalCheck.rows[0].count, 1, "exactly one evaluation response row must exist after the race resolves");
      } finally {
        await tenantConnA.end();
        await adminConnA.end();
        await tenantConnB.end();
        await adminConnB.end();
      }
    });

    await test("concurrency-2. correlation_id conflict against a different Promotion Request is a structured rejection, not an unhandled throw", async () => {
      const tenantConn = await connectAsUser(connectionString, f.userAId);
      const adminConn = await connectAsServiceRole(connectionString);
      try {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody()));
        });

        const sharedCorrelationId = "corr-concurrency-conflict";
        const prId1 = await insertPromotionRequestFixture(tenantConn, f.userAId, sharedCorrelationId);
        const tenantClient = new PgSupabaseClient(tenantConn, f.userAId) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[0];
        const adminClient = new PgSupabaseClient(adminConn, null) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[1];

        const first = await submitPromotionRequestForEvaluation(tenantClient, adminClient, { promotionRequestId: prId1 });
        assertEqual(first.kind, "succeeded", "first submission must succeed");

        const prId2 = await tenantConn
          .query(
            `insert into public.promotion_requests
               (source_plugin_id, source_skill_id, source_run_id, request_id, candidate_id, objective, correlation_id, context_snapshot_id, plugin_version, skill_version)
             select source_plugin_id, source_skill_id, source_run_id, 'req-concurrency-conflict-2', candidate_id, objective, correlation_id, context_snapshot_id, plugin_version, skill_version
             from public.promotion_requests where id = $1 returning id`,
            [prId1],
          )
          .then((r) => r.rows[0].id as string);

        let threw: unknown;
        try {
          await submitPromotionRequestForEvaluation(tenantClient, adminClient, { promotionRequestId: prId2 });
        } catch (error) {
          threw = error;
        }
        assert(threw instanceof KfsaSubmissionBoundaryError, "a correlation_id conflict against a different Promotion Request must be a structured KfsaSubmissionBoundaryError");
        assertEqual((threw as KfsaSubmissionBoundaryError).reason, "correlation_conflict", "rejection reason");
      } finally {
        await tenantConn.end();
        await adminConn.end();
      }
    });

    await test("concurrency-3. a stale in_progress attempt is recovered and a fresh submission proceeds", async () => {
      const tenantConn = await connectAsUser(connectionString, f.userAId);
      const adminConn = await connectAsServiceRole(connectionString);
      try {
        process.env.KFSA_SUBMISSION_STALE_AFTER_MS = "50";
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody()));
        });

        const prId = await insertPromotionRequestFixture(tenantConn, f.userAId, "corr-concurrency-stale");
        // Simulate an abandoned attempt (e.g. a crashed server process) left behind in_progress.
        await adminConn.query(
          `insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number, submitted_at)
           values ($1, $2, 'corr-concurrency-stale', 1, now() - interval '1 hour')`,
          [f.orgAId, prId],
        );

        const tenantClient = new PgSupabaseClient(tenantConn, f.userAId) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[0];
        const adminClient = new PgSupabaseClient(adminConn, null) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[1];
        const outcome = await submitPromotionRequestForEvaluation(tenantClient, adminClient, { promotionRequestId: prId });
        assertEqual(outcome.kind, "succeeded", "a submission against a Promotion Request whose only attempt is stale must proceed and succeed");

        const attempts = await tenantConn.query(`select status from public.kfsa_submission_attempts where promotion_request_id = $1 order by attempt_number asc`, [prId]);
        assertEqual(attempts.rows.length, 2, "the stale attempt must be marked terminal and a new attempt created");
        assertEqual(attempts.rows[0].status, "failed", "the stale attempt must be marked failed by the server-only repository");
        assertEqual(attempts.rows[1].status, "succeeded", "the new attempt must succeed");
      } finally {
        delete process.env.KFSA_SUBMISSION_STALE_AFTER_MS;
        await tenantConn.end();
        await adminConn.end();
      }
    });

    await test("concurrency-4. a fresh in_progress attempt is protected from a duplicate submission (no second KFSA call, no second attempt row)", async () => {
      const tenantConn = await connectAsUser(connectionString, f.userAId);
      const adminConn = await connectAsServiceRole(connectionString);
      try {
        process.env.KFSA_SUBMISSION_STALE_AFTER_MS = "300000"; // 5 minutes -- the fixture below is fresh (now())
        let callCount = 0;
        server.setHandler((_req, _body, res) => {
          callCount += 1;
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody()));
        });

        const prId = await insertPromotionRequestFixture(tenantConn, f.userAId, "corr-concurrency-fresh");
        await adminConn.query(`insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number) values ($1, $2, 'corr-concurrency-fresh', 1)`, [f.orgAId, prId]);

        const tenantClient = new PgSupabaseClient(tenantConn, f.userAId) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[0];
        const adminClient = new PgSupabaseClient(adminConn, null) as unknown as Parameters<typeof submitPromotionRequestForEvaluation>[1];
        const outcome = await submitPromotionRequestForEvaluation(tenantClient, adminClient, { promotionRequestId: prId });
        assertEqual(outcome.kind, "in_progress", "a submission against a Promotion Request with a fresh in_progress attempt must report in_progress rather than starting a duplicate");
        assertEqual(callCount, 0, "a fresh in_progress attempt must never reach the external KFSA server a second time");

        const attempts = await tenantConn.query(`select count(*)::int as count from public.kfsa_submission_attempts where promotion_request_id = $1`, [prId]);
        assertEqual(attempts.rows[0].count, 1, "no second attempt row may be created while the existing one is fresh");
      } finally {
        delete process.env.KFSA_SUBMISSION_STALE_AFTER_MS;
        await tenantConn.end();
        await adminConn.end();
      }
    });
  } finally {
    await server.close();
  }

  printSummaryAndExit("Part E: KFSA real-concurrency tests (real Postgres + mock HTTP server)");
}

run().catch((error) => {
  console.error("Part E test runner crashed:", error);
  process.exit(1);
});
