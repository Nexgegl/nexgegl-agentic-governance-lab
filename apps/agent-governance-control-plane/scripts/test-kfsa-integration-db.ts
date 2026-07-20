/**
 * Part A of `npm run test:kfsa-integration`: live-database tests against a
 * disposable, freshly rebuilt local Postgres instance (reuses
 * scripts/governance-tests/db-setup.ts's rebuildTestDatabase(), which runs
 * every migration in supabase/migrations/*.sql in filename order --
 * including 20260721100001/100002/100003 -- and supabase/seed.sql). This
 * is the only place tenant isolation / RLS / referential-integrity claims
 * are proven for the three KFSA integration tables: mock Supabase data is
 * never used to claim any of this.
 *
 * Remediation of the independent pre-PR review's HIGH findings (H-1: an
 * authenticated tenant could INSERT a fabricated "KFSA evaluation result"
 * directly; H-2: a concurrent attempt-creation race threw an uncaught
 * error) means every fixture row in this file that used to be inserted as
 * an ordinary tenant is now inserted with a service-role claim instead --
 * that IS the fix, not a workaround for these tests. Every test that
 * previously proved a tenant *could* reach these tables now proves the
 * opposite.
 *
 * Covers:
 *   - direct-write bypass is closed: an authenticated tenant cannot
 *     INSERT, UPDATE, or DELETE any row in any of the three tables,
 *     including a forged ReviewOutcome/external_promotion_request_id/
 *     response_hash for their own, legitimately-owned Promotion Request
 *     (this re-proves H-1 is fixed, not merely asserted)
 *   - the server-only administrative path (a service-role connection,
 *     standing in for repositories/kfsa-integration-admin-repository.ts)
 *     can create legitimate records
 *   - cross-tenant Promotion Request / Submission Attempt references are
 *     rejected by the composite tenant-aware foreign keys
 *   - cross-tenant read denial for all three tables
 *   - organization_id is forced server-side on a privileged insert with no
 *     JWT (matches the admin repository's own explicit-organization_id
 *     write path)
 *   - unique(organization_id, correlation_id) on kfsa_evaluation_responses
 *     rejects a second row reusing a correlation_id for a different
 *     Promotion Request; the same correlation_id is independently usable
 *     by two different organizations
 *   - formal_decision_created check constraint rejects anything but false
 *   - review_outcome check constraint rejects KILL/SCALE/ALERT, accepts
 *     PASS/FIX/FAIL/ESCALATE
 *   - kfsa_evaluation_responses / kfsa_external_audit_links immutability
 *     (privileged non-service-role blocked by the trigger, service_role
 *     positive control succeeds)
 *   - kfsa_submission_attempts is mutable (by service-role) while
 *     in_progress and locked once terminal
 *   - kfsa_submission_attempts unique(organization_id, promotion_request_id,
 *     correlation_id, attempt_number) rejects a duplicate attempt_number
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
  await client.query(`reset role`);
  await client.query(`select set_config('request.jwt.claim.role', 'authenticated', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
}

/**
 * Stands in for repositories/kfsa-integration-admin-repository.ts's
 * service-role client. RLS policies are evaluated against the actual
 * Postgres session role (not the request.jwt.claim.role GUC), so this
 * must genuinely `set role service_role` -- the auth stub's
 * `create role service_role ... bypassrls` (scripts/governance-tests/db-setup.ts)
 * only takes effect once the session is actually running as that role.
 * The GUC is set too, for the immutability triggers' own `auth.role()`
 * checks.
 */
async function asServiceRole(client: Client) {
  await client.query(`set role service_role`);
  await client.query(`select set_config('request.jwt.claim.role', 'service_role', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
}

interface PgError extends Error {
  code?: string;
}

/** Inserts a plugin_run_contexts + plugin_runs + promotion_requests fixture chain scoped to whichever org the client's current session belongs to. Caller must already be `asUser`. Unaffected by this remediation -- promotion_requests tenant-write access is unchanged. */
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

/** Creates a legitimate submission attempt exactly the way repositories/kfsa-integration-admin-repository.ts's adminCreateSubmissionAttempt() does: service-role, explicit organization_id (required since auth.uid() is null for service-role, so force_organization_id_from_caller() is a no-op -- the caller must supply the correct value itself). Caller must already be `asServiceRole`. */
async function adminInsertSubmissionAttempt(
  client: Client,
  params: { organizationId: string; promotionRequestId: string; correlationId: string; attemptNumber?: number; status?: string },
): Promise<string> {
  const result = await client.query(
    `insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number, status)
     values ($1, $2, $3, $4, $5) returning id`,
    [params.organizationId, params.promotionRequestId, params.correlationId, params.attemptNumber ?? 1, params.status ?? "in_progress"],
  );
  return result.rows[0].id as string;
}

async function run() {
  const { connectionString, fixtures } = await rebuildTestDatabase();
  const f: TestOrgFixtures = fixtures;

  // === Direct-write bypass closed (remediation of H-1) ======================

  await test("bypass-1. an authenticated tenant cannot directly INSERT into kfsa_submission_attempts", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-1");
      let code: string | undefined;
      try {
        await client.query(`insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number) values ($1, $2, 'corr-bypass-1', 1)`, [f.orgAId, prId]);
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "42501", "an authenticated tenant's direct INSERT into kfsa_submission_attempts must be denied by RLS (insufficient_privilege)");
    });
  });

  await test("bypass-2. an authenticated tenant cannot directly INSERT a fabricated kfsa_evaluation_responses row for their own Promotion Request (re-proves H-1 is fixed)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-2");
      // Set up a submission_attempt to reference via service-role first,
      // exactly as the real flow would leave one behind, then switch back
      // to the tenant to attempt the forgery.
      const attemptId = await (async () => {
        await asServiceRole(client);
        return adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-2", status: "succeeded" });
      })();
      await asUser(client, f.userAId);

      let code: string | undefined;
      try {
        // The exact forgery reproduced during the independent pre-PR
        // review: a fake PASS result, a made-up external id, and a
        // self-chosen response_hash -- for a Promotion Request the tenant
        // genuinely owns.
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id,
              review_outcome, evidence_status, authority_status, escalation_required, blocked_actions, formal_decision_created, response_hash)
           values ($1, $2, $3, 'corr-bypass-2', 'FORGED-EXTERNAL-ID-999', 'PASS', 'complete', 'confirmed', false, '{}', false, 'forged-hash-not-from-kfsa')`,
          [f.orgAId, prId, attemptId],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "42501", "a tenant's direct INSERT of a forged evaluation response must be denied by RLS (insufficient_privilege) -- ReviewOutcome, external_promotion_request_id, and response_hash cannot be forged this way");
    });
  });

  await test("bypass-3. an authenticated tenant cannot directly INSERT into kfsa_external_audit_links", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-3");
      const attemptId = await (async () => {
        await asServiceRole(client);
        return adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-3" });
      })();
      await asUser(client, f.userAId);

      let code: string | undefined;
      try {
        await client.query(`insert into public.kfsa_external_audit_links (organization_id, promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, $2, 'forged-audit-id', $3)`, [f.orgAId, prId, attemptId]);
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "42501", "an authenticated tenant's direct INSERT into kfsa_external_audit_links must be denied by RLS (insufficient_privilege)");
    });
  });

  await test("bypass-4. an authenticated tenant cannot directly UPDATE a kfsa_submission_attempts row, terminal or not", async () => {
    const { inProgressId, terminalId } = await withClient(connectionString, async (client) => {
      await asServiceRole(client);
      const prId = await (async () => {
        await asUser(client, f.userAId);
        const id = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-4");
        await asServiceRole(client);
        return id;
      })();
      const inProgressId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-4", attemptNumber: 1 });
      const terminalId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-4", attemptNumber: 2, status: "succeeded" });
      return { inProgressId, terminalId };
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const r1 = await client.query(`update public.kfsa_submission_attempts set status = 'succeeded' where id = $1`, [inProgressId]);
      assertEqual(r1.rowCount, 0, "an authenticated tenant must not be able to update an in_progress kfsa_submission_attempts row");
      const r2 = await client.query(`update public.kfsa_submission_attempts set status = 'failed' where id = $1`, [terminalId]);
      assertEqual(r2.rowCount, 0, "an authenticated tenant must not be able to update a terminal kfsa_submission_attempts row");
    });
  });

  await test("bypass-5. an authenticated tenant cannot directly UPDATE a kfsa_evaluation_responses row", async () => {
    const responseId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-5");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-5" });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-bypass-5', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [f.orgAId, prId, attemptId],
      );
      return response.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const result = await client.query(`update public.kfsa_evaluation_responses set review_outcome = 'FAIL' where id = $1`, [responseId]);
      assertEqual(result.rowCount, 0, "an authenticated tenant must not be able to update a kfsa_evaluation_responses row");
    });
  });

  await test("bypass-6. an authenticated tenant cannot directly DELETE any KFSA integration record", async () => {
    const { attemptId, responseId, linkId } = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-6");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-6" });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-bypass-6', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [f.orgAId, prId, attemptId],
      );
      const link = await client.query(`insert into public.kfsa_external_audit_links (organization_id, promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, $2, 'ext-audit-1', $3) returning id`, [
        f.orgAId,
        prId,
        attemptId,
      ]);
      return { attemptId, responseId: response.rows[0].id as string, linkId: link.rows[0].id as string };
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const r1 = await client.query(`delete from public.kfsa_submission_attempts where id = $1`, [attemptId]);
      assertEqual(r1.rowCount, 0, "an authenticated tenant must not be able to delete a kfsa_submission_attempts row");
      const r2 = await client.query(`delete from public.kfsa_evaluation_responses where id = $1`, [responseId]);
      assertEqual(r2.rowCount, 0, "an authenticated tenant must not be able to delete a kfsa_evaluation_responses row");
      const r3 = await client.query(`delete from public.kfsa_external_audit_links where id = $1`, [linkId]);
      assertEqual(r3.rowCount, 0, "an authenticated tenant must not be able to delete a kfsa_external_audit_links row");
    });
  });

  await test("bypass-7. the server-only administrative path (service-role) can create legitimate records end to end", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-bypass-7");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-bypass-7" });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-bypass-7', 'ext-legit-1', 'PASS', 'complete', 'confirmed', 'hash-legit-1') returning id, review_outcome`,
        [f.orgAId, prId, attemptId],
      );
      assertEqual(response.rows[0].review_outcome, "PASS", "the service-role administrative path must be able to persist a legitimate evaluation response");
      const link = await client.query(`insert into public.kfsa_external_audit_links (organization_id, promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, $2, 'ext-audit-legit-1', $3) returning id`, [
        f.orgAId,
        prId,
        attemptId,
      ]);
      assert(Boolean(link.rows[0].id), "the service-role administrative path must be able to persist an external audit link");
    });
  });

  // === Tenant-consistent referential integrity ==============================

  await test("tenant-fk-1. a cross-tenant Promotion Request reference is rejected by the composite foreign key", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const orgAPrId = await insertPromotionRequestFixture(client, f.userAId, "corr-tenant-fk-1");

      await asServiceRole(client);
      let code: string | undefined;
      try {
        // Org B's organization_id, but Org A's real promotion_request_id.
        await client.query(`insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number) values ($1, $2, 'corr-tenant-fk-1-cross', 1)`, [f.orgBId, orgAPrId]);
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23503", "a kfsa_submission_attempts row whose organization_id does not match its promotion_request_id's real owner must violate the composite foreign key");
    });
  });

  await test("tenant-fk-2. a cross-tenant Submission Attempt reference is rejected by the composite foreign key", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const orgAPrId = await insertPromotionRequestFixture(client, f.userAId, "corr-tenant-fk-2");
      await asServiceRole(client);
      const orgAAttemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: orgAPrId, correlationId: "corr-tenant-fk-2" });

      await asUser(client, f.userBId);
      const orgBPrId = await (async () => {
        await asUser(client, f.userBId);
        return insertPromotionRequestFixture(client, f.userBId, "corr-tenant-fk-2-org-b");
      })();

      await asServiceRole(client);
      let code: string | undefined;
      try {
        // Org B's organization_id and Org B's own promotion_request_id, but Org A's real submission_attempt_id.
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
           values ($1, $2, $3, 'corr-tenant-fk-2-cross', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1')`,
          [f.orgBId, orgBPrId, orgAAttemptId],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23503", "a kfsa_evaluation_responses row whose organization_id does not match its submission_attempt_id's real owner must violate the composite foreign key");
    });
  });

  // === Cross-tenant read denial, correlation isolation, check constraints ===

  await test("kfsa-1. cross-tenant read denial across all three KFSA tables", async () => {
    const { prId, attemptId } = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-cross-tenant");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-cross-tenant" });
      return { prId, attemptId };
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const visible = await client.query(`select id from public.kfsa_submission_attempts where id = $1`, [attemptId]);
      assertEqual(visible.rowCount, 0, "org B must not be able to see org A's kfsa_submission_attempts row");
      const prVisible = await client.query(`select id from public.promotion_requests where id = $1`, [prId]);
      assertEqual(prVisible.rowCount, 0, "fixture sanity: org B must not see org A's promotion_requests row either");
    });
  });

  await test("kfsa-2. organization_id must be supplied explicitly by the service-role caller (no JWT to force it from)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const prId = await insertPromotionRequestFixture(client, f.userBId, "corr-kfsa-explicit-org");
      await asServiceRole(client);
      const attempt = await client.query(
        `insert into public.kfsa_submission_attempts (organization_id, promotion_request_id, correlation_id, attempt_number) values ($1, $2, 'corr-kfsa-explicit-org', 1) returning organization_id`,
        [f.orgBId, prId],
      );
      assertEqual(attempt.rows[0].organization_id, f.orgBId, "the service-role administrative path must persist exactly the organization_id it was given -- force_organization_id_from_caller() is a no-op when auth.uid() is null, by design, so correctness here depends entirely on the admin repository always supplying the right value itself");
    });
  });

  await test("kfsa-3. a second evaluation response reusing correlation_id for a different Promotion Request is rejected", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId1 = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-conflict-shared");
      const prId2 = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-conflict-shared-2");
      await asServiceRole(client);
      const attempt1Id = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId1, correlationId: "corr-kfsa-conflict-shared" });
      await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-kfsa-conflict-shared', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1')`,
        [f.orgAId, prId1, attempt1Id],
      );

      // A second, different Promotion Request reusing the same correlation_id
      // (as if the same run produced two promotion_requests rows).
      const attempt2Id = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId2, correlationId: "corr-kfsa-conflict-shared" });
      let code: string | undefined;
      try {
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
           values ($1, $2, $3, 'corr-kfsa-conflict-shared', 'ext-2', 'PASS', 'complete', 'confirmed', 'hash-2')`,
          [f.orgAId, prId2, attempt2Id],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23505", "reusing a correlation_id already tied to a different Promotion Request must violate the unique(organization_id, correlation_id) constraint");
    });
  });

  await test("kfsa-4. the same correlation_id is independently usable by two different organizations", async () => {
    const sharedCorrelationId = "corr-kfsa-cross-org-shared";
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, sharedCorrelationId);
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: sharedCorrelationId });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, $4, 'ext-org-a', 'PASS', 'complete', 'confirmed', 'hash-org-a') returning organization_id`,
        [f.orgAId, prId, attemptId, sharedCorrelationId],
      );
      assertEqual(response.rows[0].organization_id, f.orgAId, "org A's response must be scoped to org A");
    });
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const prId = await insertPromotionRequestFixture(client, f.userBId, sharedCorrelationId);
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgBId, promotionRequestId: prId, correlationId: sharedCorrelationId });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, $4, 'ext-org-b', 'PASS', 'complete', 'confirmed', 'hash-org-b') returning organization_id`,
        [f.orgBId, prId, attemptId, sharedCorrelationId],
      );
      assertEqual(response.rows[0].organization_id, f.orgBId, "org B must be able to independently use the same correlation_id string org A used -- isolation is per-organization, not global");
    });
  });

  await test("kfsa-5. formal_decision_created check constraint rejects true", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-formal-decision");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-formal-decision" });
      let code: string | undefined;
      try {
        await client.query(
          `insert into public.kfsa_evaluation_responses
             (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, formal_decision_created, response_hash)
           values ($1, $2, $3, 'corr-kfsa-formal-decision', 'ext-1', 'PASS', 'complete', 'confirmed', true, 'hash-1')`,
          [f.orgAId, prId, attemptId],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23514", "formal_decision_created = true must violate the check constraint");
    });
  });

  await test("kfsa-6. kfsa_evaluation_responses.review_outcome rejects KFSA-only values and accepts the four ReviewOutcome values", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);

      for (const kfsaValue of ["KILL", "SCALE", "ALERT"]) {
        const prId = await insertPromotionRequestFixture(client, f.userAId, `corr-kfsa-outcome-reject-${kfsaValue}`);
        await asServiceRole(client);
        const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: `corr-kfsa-outcome-reject-${kfsaValue}` });
        let code: string | undefined;
        try {
          await client.query(
            `insert into public.kfsa_evaluation_responses
               (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
             values ($1, $2, $3, $4, 'ext-1', $5, 'complete', 'confirmed', 'hash-1')`,
            [f.orgAId, prId, attemptId, `corr-kfsa-outcome-reject-${kfsaValue}`, kfsaValue],
          );
        } catch (error) {
          code = (error as PgError).code;
        }
        assertEqual(code, "23514", `review_outcome must reject KFSA-only value "${kfsaValue}"`);
        await asUser(client, f.userAId);
      }

      for (const validValue of ["PASS", "FIX", "FAIL", "ESCALATE"]) {
        const prId = await insertPromotionRequestFixture(client, f.userAId, `corr-kfsa-outcome-accept-${validValue}`);
        await asServiceRole(client);
        const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: `corr-kfsa-outcome-accept-${validValue}` });
        const inserted = await client.query(
          `insert into public.kfsa_evaluation_responses
             (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
           values ($1, $2, $3, $4, 'ext-1', $5, 'complete', 'confirmed', 'hash-1') returning review_outcome`,
          [f.orgAId, prId, attemptId, `corr-kfsa-outcome-accept-${validValue}`, validValue],
        );
        assertEqual(inserted.rows[0].review_outcome, validValue, `review_outcome must accept ReviewOutcome value "${validValue}"`);
        await asUser(client, f.userAId);
      }
    });
  });

  // === Immutability (service-role positive control / non-service-role negative control) ===

  await test("kfsa-7a. kfsa_evaluation_responses: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
    const responseId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-immutable-b");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-immutable-b" });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-kfsa-immutable-b', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [f.orgAId, prId, attemptId],
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

  await test("kfsa-7b. kfsa_evaluation_responses: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
    const responseId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-immutable-c");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-immutable-c" });
      const response = await client.query(
        `insert into public.kfsa_evaluation_responses
           (organization_id, promotion_request_id, submission_attempt_id, correlation_id, external_promotion_request_id, review_outcome, evidence_status, authority_status, response_hash)
         values ($1, $2, $3, 'corr-kfsa-immutable-c', 'ext-1', 'PASS', 'complete', 'confirmed', 'hash-1') returning id`,
        [f.orgAId, prId, attemptId],
      );
      return response.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asServiceRole(client);
      const result = await client.query(`update public.kfsa_evaluation_responses set response_hash = response_hash where id = $1`, [responseId]);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation");
    });
  });

  await test("kfsa-8a. kfsa_external_audit_links: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
    const linkId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-audit-link-b");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-audit-link-b" });
      const link = await client.query(`insert into public.kfsa_external_audit_links (organization_id, promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, $2, 'ext-audit-1', $3) returning id`, [
        f.orgAId,
        prId,
        attemptId,
      ]);
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

  await test("kfsa-8b. kfsa_external_audit_links: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
    const linkId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-audit-link-c");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-audit-link-c" });
      const link = await client.query(`insert into public.kfsa_external_audit_links (organization_id, promotion_request_id, external_audit_event_id, submission_attempt_id) values ($1, $2, 'ext-audit-1', $3) returning id`, [
        f.orgAId,
        prId,
        attemptId,
      ]);
      return link.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asServiceRole(client);
      const result = await client.query(`update public.kfsa_external_audit_links set external_audit_event_id = external_audit_event_id where id = $1`, [linkId]);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation");
    });
  });

  await test("kfsa-9. kfsa_submission_attempts is mutable (by service-role) while in_progress and locked once terminal", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-attempt-lock");
      await asServiceRole(client);
      const attemptId = await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-attempt-lock" });
      const succeeded = await client.query(`update public.kfsa_submission_attempts set status = 'succeeded', completed_at = now() where id = $1`, [attemptId]);
      assertEqual(succeeded.rowCount, 1, "a service-role update of an in_progress attempt to a terminal status must succeed");

      let threw = false;
      try {
        await client.query(`update public.kfsa_submission_attempts set status = 'failed' where id = $1`, [attemptId]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("cannot be modified"), `expected the lock error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a terminal kfsa_submission_attempts row must reject further updates, even from service-role");
    });
  });

  await test("kfsa-10. a duplicate (organization_id, promotion_request_id, correlation_id, attempt_number) is rejected", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const prId = await insertPromotionRequestFixture(client, f.userAId, "corr-kfsa-attempt-race");
      await asServiceRole(client);
      await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-attempt-race" });
      let code: string | undefined;
      try {
        await adminInsertSubmissionAttempt(client, { organizationId: f.orgAId, promotionRequestId: prId, correlationId: "corr-kfsa-attempt-race" });
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23505", "a concurrent duplicate attempt_number for the same Promotion Request and correlation_id must violate the unique constraint");
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
