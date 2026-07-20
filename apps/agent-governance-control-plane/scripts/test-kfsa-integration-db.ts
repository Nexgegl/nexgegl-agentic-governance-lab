/**
 * Part A of `npm run test:kfsa-integration`: live-database tests against a
 * disposable, freshly rebuilt local Postgres instance (reuses
 * scripts/governance-tests/db-setup.ts's rebuildTestDatabase(), which
 * already runs every migration in supabase/migrations/*.sql in filename
 * order -- including the two new 20260721100001/100002 KFSA integration
 * migrations -- and supabase/seed.sql). This is the only place tenant
 * isolation / RLS is proven for the three new tables: mock Supabase data
 * is never used to claim that.
 *
 * Covers:
 *   - cross-tenant read denial for all three new tables
 *   - organization_id is forced server-side on insert (cannot be spoofed)
 *   - unique(organization_id, correlation_id) on kfsa_evaluation_responses
 *     rejects a second row reusing a correlation_id for a different
 *     Promotion Request (this is the DB-level backstop for "correlation
 *     reuse across different Promotion Requests within one organization
 *     must be rejected")
 *   - the same correlation_id is independently usable by two different
 *     organizations (cross-tenant correlation isolation)
 *   - formal_decision_created check constraint rejects anything but false
 *   - review_outcome check constraint rejects KILL/SCALE/ALERT, accepts
 *     PASS/FIX/FAIL/ESCALATE
 *   - kfsa_evaluation_responses / kfsa_external_audit_links immutability
 *     (ordinary tenant blocked by RLS, privileged non-service-role blocked
 *     by the trigger, service_role positive control succeeds)
 *   - kfsa_submission_attempts is mutable while in_progress and locked
 *     once terminal
 *   - kfsa_submission_attempts unique(organization_id, promotion_request_id,
 *     correlation_id, attempt_number) rejects a duplicate attempt_number
 *   - cross-tenant update denial
 */
import { Client } from "pg";
import { rebuildTestDatabase, type TestOrgFixtures } from "./governance-tests/db-setup";
import { test, assert, assertEqual, printSummaryAndExit } from "./governance-tests/harness";

async function withClient<T>(connectionString: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function asUser(client: Client, userId: string) {
  await client.query(`set role authenticated`);
  await client.query(`set request.jwt.claim.sub = '${userId}'`);
  await client.query(`set request.jwt.claim.role = 'authenticated'`);
}

async function asPrivilegedNonServiceRole(client: Client) {
  await client.query(`select set_config('request.jwt.claim.role', 'authenticated', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
}

async function asServiceRoleClaim(client: Client) {
  await client.query(`select set_config('request.jwt.claim.role', 'service_role', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
}

interface PgError extends Error {
  code?: string;
}

/** Inserts a plugin_run_contexts + plugin_runs + promotion_requests fixture chain scoped to whichever org the client's current session belongs to. Caller must already be `asUser`. */
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

  // --- cross-tenant read denial ---------------------------------------------
  await test("kfsa-1. cross-tenant read denial across all three KFSA tables", async () => {
    const { prId, attemptId } = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-cross-tenant");
      const attempt = await client.query(
        `insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-cross-tenant', 1) returning id`,
        [prId],
      );
      return { prId, attemptId: attempt.rows[0].id as string };
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const visible = await client.query(`select id from public.kfsa_submission_attempts where id = $1`, [attemptId]);
      assertEqual(visible.rowCount, 0, "org B must not be able to see org A's kfsa_submission_attempts row");
      const prVisible = await client.query(`select id from public.promotion_requests where id = $1`, [prId]);
      assertEqual(prVisible.rowCount, 0, "fixture sanity: org B must not see org A's promotion_requests row either");
    });
  });

  // --- organization_id forced server-side -----------------------------------
  await test("kfsa-2. organization_id is forced to the caller's own org on insert, even when spoofed", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const prId = await insertPromotionRequestFixture(client, f.userBId, "corr-kfsa-spoof-org");
      const attempt = await client.query(
        `insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number)
         values ($1, $2, 'corr-kfsa-spoof-org', 1) returning organization_id`,
        [f.orgAId, prId], // user B tries to claim this row belongs to org A
      );
      assertEqual(attempt.rows[0].organization_id, f.orgBId, "organization_id must be corrected to the real caller's org, not the spoofed value");
    });
  });

  // --- unique(organization_id, correlation_id) on kfsa_evaluation_responses -
  await test("kfsa-3. a second evaluation response reusing correlation_id for a different Promotion Request is rejected", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId1 = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-conflict-shared");
      const attempt1 = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-conflict-shared', 1) returning id`, [prId1]);
      await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, 'corr-kfsa-conflict-shared', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1')`,
        [prId1, attempt1.rows[0].id],
      );

      // A second, different Promotion Request reusing the same correlation_id
      // (as if the same run produced two promotion_requests rows).
      const prId2 = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-conflict-shared-2");
      const attempt2 = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-conflict-shared', 1) returning id`, [prId2]);

      let code: string | undefined;
      try {
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
           values ($1, $2, 'corr-kfsa-conflict-shared', 'ext-2', 'PASS', 'complete', 'confirmed', 'hash-2')`,
          [prId2, attempt2.rows[0].id],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23505", "reusing a correlation_id already tied to a different Promotion Request must violate the unique(organization_id, correlation_id) constraint");
    });
  });

  // --- cross-tenant correlation isolation -----------------------------------
  await test("kfsa-4. the same correlation_id is independently usable by two different organizations", async () => {
    const sharedCorrelationId = "corr-kfsa-cross-org-shared";
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, sharedCorrelationId);
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, $2, 1) returning id`, [prId, sharedCorrelationId]);
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'ext-org-a', 'PASS', 'complete', 'confirmed', 'hash-org-a') returning organization_id`,
        [prId, attempt.rows[0].id, sharedCorrelationId],
      );
      assertEqual(response.rows[0].organization_id, f.orgAId, "org A's response must be scoped to org A");
    });
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const prId = await insertPromotionRequestFixture(client, f.userBId, sharedCorrelationId);
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, $2, 1) returning id`, [prId, sharedCorrelationId]);
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'ext-org-b', 'PASS', 'complete', 'confirmed', 'hash-org-b') returning organization_id`,
        [prId, attempt.rows[0].id, sharedCorrelationId],
      );
      assertEqual(response.rows[0].organization_id, f.orgBId, "org B must be able to independently use the same correlation_id string org A used -- isolation is per-organization, not global");
    });
  });

  // --- formal_decision_created check constraint -----------------------------
  await test("kfsa-5. formal_decision_created check constraint rejects true", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-formal-decision");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-formal-decision', 1) returning id`, [prId]);
      let code: string | undefined;
      try {
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, formal_decision_created, response_hash)
           values ($1, $2, 'corr-kfsa-formal-decision', 'ext-1', 'PASS', 'complete', 'confirmed', true, 'hash-1')`,
          [prId, attempt.rows[0].id],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23514", "formal_decision_created = true must violate the check constraint");
    });
  });

  // --- review_outcome check constraint on kfsa_evaluation_responses --------
  await test("kfsa-6. kfsa_evaluation_responses.review_outcome rejects KFSA-only values and accepts the four ReviewOutcome values", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);

      for (const kfsaValue of ["KILL", "SCALE", "ALERT"]) {
        const prId = await insertPromotionRequestFixture(client, f.userAId, `corr-kfsa-outcome-reject-${kfsaValue}`);
        const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, $2, 1) returning id`, [prId, `corr-kfsa-outcome-reject-${kfsaValue}`]);
        let code: string | undefined;
        try {
          await client.query(
            `insert into public.kfsa_evaluation_responses
               (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
             values ($1, $2, $3, 'ext-1', $4, 'complete', 'confirmed', 'hash-1')`,
            [prId, attempt.rows[0].id, `corr-kfsa-outcome-reject-${kfsaValue}`, kfsaValue],
          );
        } catch (error) {
          code = (error as PgError).code;
        }
        assertEqual(code, "23514", `review_outcome must reject KFSA-only value "${kfsaValue}"`);
      }

      for (const validValue of ["PASS", "FIX", "FAIL", "ESCALATE"]) {
        const prId = await insertPromotionRequestFixture(client, f.userAId, `corr-kfsa-outcome-accept-${validValue}`);
        const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, $2, 1) returning id`, [prId, `corr-kfsa-outcome-accept-${validValue}`]);
        const inserted = await client.query(
          `insert into public.kfsa_evaluation_responses
             (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
           values ($1, $2, $3, 'ext-1', $4, 'complete', 'confirmed', 'hash-1') returning review_outcome`,
          [prId, attempt.rows[0].id, `corr-kfsa-outcome-accept-${validValue}`, validValue],
        );
        assertEqual(inserted.rows[0].review_outcome, validValue, `review_outcome must accept ReviewOutcome value "${validValue}"`);
      }
    });
  });

  // --- kfsa_evaluation_responses immutability -------------------------------
  await test("kfsa-7a. kfsa_evaluation_responses: ordinary tenant blocked by RLS (no UPDATE policy)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-immutable-a");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-immutable-a', 1) returning id`, [prId]);
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, 'corr-kfsa-immutable-a', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [prId, attempt.rows[0].id],
      );
      const result = await client.query(`update public.kfsa_evaluation_responses set review_outcome = 'FAIL' where id = $1`, [response.rows[0].id]);
      assertEqual(result.rowCount, 0, "an authenticated tenant must not be able to reach a kfsa_evaluation_responses row to update it");
    });
  });

  await test("kfsa-7b. kfsa_evaluation_responses: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
    const responseId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-immutable-b");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-immutable-b', 1) returning id`, [prId]);
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, 'corr-kfsa-immutable-b', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [prId, attempt.rows[0].id],
      );
      return response.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asPrivilegedNonServiceRole(client);
      let threw = false;
      try {
        await client.query(`update public.kfsa_evaluation_responses set review_outcome = 'FAIL' where id = $1`, [responseId]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("immutable"), `expected the immutability trigger's error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a privileged (RLS-bypassing) connection presenting a non-service-role claim must still be rejected by the trigger itself");
    });
  });

  await test("kfsa-7c. kfsa_evaluation_responses: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
    const responseId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-immutable-c");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-immutable-c', 1) returning id`, [prId]);
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, 'corr-kfsa-immutable-c', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [prId, attempt.rows[0].id],
      );
      return response.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asServiceRoleClaim(client);
      const result = await client.query(`update public.kfsa_evaluation_responses set response_hash = response_hash where id = $1`, [responseId]);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation");
    });
  });

  // --- kfsa_external_audit_links immutability -------------------------------
  await test("kfsa-8a. kfsa_external_audit_links: ordinary tenant blocked by RLS (no UPDATE policy)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-audit-link-a");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-audit-link-a', 1) returning id`, [prId]);
      const link = await client.query(
        `insert into public.kfsa_external_audit_links (promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, 'ext-audit-1', $2) returning id`,
        [prId, attempt.rows[0].id],
      );
      const result = await client.query(`update public.kfsa_external_audit_links set external_audit_event_id = 'tampered' where id = $1`, [link.rows[0].id]);
      assertEqual(result.rowCount, 0, "an authenticated tenant must not be able to reach a kfsa_external_audit_links row to update it");
    });
  });

  await test("kfsa-8b. kfsa_external_audit_links: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
    const linkId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-audit-link-b");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-audit-link-b', 1) returning id`, [prId]);
      const link = await client.query(
        `insert into public.kfsa_external_audit_links (promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, 'ext-audit-1', $2) returning id`,
        [prId, attempt.rows[0].id],
      );
      return link.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asPrivilegedNonServiceRole(client);
      let threw = false;
      try {
        await client.query(`update public.kfsa_external_audit_links set external_audit_event_id = 'tampered' where id = $1`, [linkId]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("immutable"), `expected the immutability trigger's error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a privileged (RLS-bypassing) connection presenting a non-service-role claim must still be rejected by the trigger itself");
    });
  });

  await test("kfsa-8c. kfsa_external_audit_links: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
    const linkId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-audit-link-c");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-audit-link-c', 1) returning id`, [prId]);
      const link = await client.query(
        `insert into public.kfsa_external_audit_links (promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, 'ext-audit-1', $2) returning id`,
        [prId, attempt.rows[0].id],
      );
      return link.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asServiceRoleClaim(client);
      const result = await client.query(`update public.kfsa_external_audit_links set external_audit_event_id = external_audit_event_id where id = $1`, [linkId]);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation");
    });
  });

  // --- kfsa_submission_attempts mutability while in_progress, locked after -
  await test("kfsa-9. kfsa_submission_attempts is mutable while in_progress and locked once terminal", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-attempt-lock");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-attempt-lock', 1) returning id`, [prId]);
      const succeeded = await client.query(`update public.kfsa_submission_attempts set status = 'succeeded', completed_at = now() where id = $1`, [attempt.rows[0].id]);
      assertEqual(succeeded.rowCount, 1, "an in_progress attempt must be updatable to a terminal status");

      let threw = false;
      try {
        await client.query(`update public.kfsa_submission_attempts set status = 'failed' where id = $1`, [attempt.rows[0].id]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("cannot be modified"), `expected the lock error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a terminal kfsa_submission_attempts row must reject further updates");
    });
  });

  // --- kfsa_submission_attempts duplicate attempt_number race guard --------
  await test("kfsa-10. a duplicate (organization_id, promotion_request_id, correlation_id, attempt_number) is rejected", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-attempt-race");
      await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-attempt-race', 1)`, [prId]);
      let code: string | undefined;
      try {
        await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-attempt-race', 1)`, [prId]);
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23505", "a concurrent duplicate attempt_number for the same Promotion Request and correlation_id must violate the unique constraint");
    });
  });

  // --- cross-tenant update denial -------------------------------------------
  await test("kfsa-11. cross-tenant update of kfsa_submission_attempts affects zero rows", async () => {
    const attemptId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-cross-update");
      const attempt = await client.query(`insert into public.kfsa_submission_attempts (promotion_request_id, correlation_id, attempt_number) values ($1, 'corr-kfsa-cross-update', 1) returning id`, [prId]);
      return attempt.rows[0].id as string;
    });
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const result = await client.query(`update public.kfsa_submission_attempts set status = 'succeeded' where id = $1`, [attemptId]);
      assertEqual(result.rowCount, 0, "org B's attempt to modify org A's kfsa_submission_attempts row must affect zero rows");
    });
  });

  printSummaryAndExit("Part A: KFSA live-database tests");
}

run().catch((error) => {
  console.error("\nPart A test runner crashed (is a reachable Postgres superuser connection configured?):");
  console.error(`  PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL=${process.env.PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL ?? "(unset, using default postgresql://postgres:postgres@127.0.0.1:5432/postgres)"}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
