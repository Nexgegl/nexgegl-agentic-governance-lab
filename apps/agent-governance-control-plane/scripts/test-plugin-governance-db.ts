/**
 * Part A of `npm run test:plugin-governance`: live-database tests against a
 * disposable, freshly rebuilt local Postgres instance (drop, recreate, run
 * every migration, run supabase/seed.sql, add test-only cross-tenant
 * fixtures). This is the reproducible replacement for the earlier manual
 * live-Postgres verification session -- it exercises exactly the same
 * database objects (RLS policies, immutability triggers, unique
 * constraints, check constraints) instead of a human running ad hoc SQL by
 * hand. It requires a reachable Postgres superuser connection; see
 * PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL below. It does not talk to any real
 * or shared Supabase project.
 *
 * Covers:
 *   1  cross-tenant read denial
 *   2  cross-tenant insert/update denial or organization correction
 *   3  production_approval_status cannot be elevated by a normal user
 *   4  completed plugin run immutability
 *   5  immutable plugin version
 *   6  immutable context snapshot
 *   7  duplicate correlation_id idempotency
 *   13 PromotionRequest remains distinct from Decision (schema-level)
 *   14 ReviewOutcome accepts only PASS/FIX/FAIL/ESCALATE
 *   16 organization_id is not overwritten when auth.uid() is null (seed/reset)
 *   17 organization_id is enforced when auth.uid() is present
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

async function asPrivilegedNoSession(client: Client) {
  // Mimics a direct/raw connection with no JWT at all -- `supabase db
  // reset` running seed.sql, a plain psql session, migration tooling.
  await client.query(`reset role`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
  await client.query(`select set_config('request.jwt.claim.role', '', false)`);
}

interface PgError extends Error {
  code?: string;
}

async function run() {
  const { connectionString, fixtures } = await rebuildTestDatabase();
  const f: TestOrgFixtures = fixtures;

  // --- 1: cross-tenant read denial -----------------------------------------
  await test("1. cross-tenant read denial (use_cases)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const orgAUseCases = await client.query(`select id from public.use_cases where organization_id = $1`, [f.orgAId]);
      assertEqual(orgAUseCases.rowCount, 0, "org B user must see zero of org A's use_cases");

      const anyUseCases = await client.query(`select organization_id from public.use_cases`);
      for (const row of anyUseCases.rows) {
        assertEqual(row.organization_id, f.orgBId, "every use_case row visible to org B's user must belong to org B");
      }
    });
  });

  // --- 2 & 17: cross-tenant insert correction / organization_id enforced --
  await test("2/17. organization_id is forced to the caller's own org on insert, even when spoofed", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const result = await client.query(
        `insert into public.use_cases
           (organization_id, name, name_ar, risk_level, data_sensitivity, tool_access,
            governance_status, eval_outcome, evidence_status, authority_status, audit_trail_status, lifecycle_stage)
         values ($1, 'Spoof Attempt', 'محاولة انتحال', 'low', 'low', 'none',
                 'GOVERNANCE_REVIEW_REQUIRED', 'FIX', 'missing', 'missing', 'missing', 'proposed')
         returning organization_id`,
        [f.orgAId], // user B tries to claim this row belongs to org A
      );
      assertEqual(result.rows[0].organization_id, f.orgBId, "organization_id must be corrected to the real caller's org, not the spoofed value");
    });
  });

  await test("2b. cross-tenant update denial (use_cases)", async () => {
    const orgARow = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const r = await client.query(`select id from public.use_cases where organization_id = $1 limit 1`, [f.orgAId]);
      return r.rows[0].id as string;
    });
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const result = await client.query(`update public.use_cases set department = 'hijacked' where id = $1`, [orgARow]);
      assertEqual(result.rowCount, 0, "org B user's update of an org A row must affect zero rows");
    });
  });

  // --- 3: production_approval_status cannot be elevated by a normal user --
  await test("3. production_approval_status cannot be set true by a non-service-role user", async () => {
    const id = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const target = await client.query(`select id from public.use_cases where organization_id = $1 limit 1`, [f.orgAId]);
      return target.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      let threw = false;
      try {
        await client.query(`update public.use_cases set production_approval_status = true where id = $1`, [id]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("production_approval_status cannot be changed"), `expected the production_approval_status guard error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a non-service-role attempt to set production_approval_status = true must raise an exception, not silently succeed");
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const reread = await client.query(`select production_approval_status from public.use_cases where id = $1`, [id]);
      assertEqual(reread.rows[0].production_approval_status, false, "production_approval_status must remain false after the rejected update attempt");
    });
  });

  // --- 4: completed plugin run immutability --------------------------------
  await test("4. a completed plugin_runs row cannot be modified", async () => {
    const runId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const installation = await client.query(`select id from public.plugin_installations where organization_id = $1 and plugin_id = 'ai-governance'`, [f.orgAId]);
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userAId],
      );
      const run = await client.query(
        `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id, status)
         values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-immutability-test', 'completed')
         returning id`,
        [snapshot.rows[0].id, f.userAId],
      );
      assert(Boolean(installation.rows.length), "fixture sanity: ai-governance must be installed for org A");
      return run.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      let threw = false;
      try {
        await client.query(`update public.plugin_runs set output = '{"tampered":true}'::jsonb where id = $1`, [runId]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("cannot be modified"), `expected immutability error, got: ${(error as PgError).message}`);
      }
      assert(threw, "updating a completed plugin_runs row must raise an exception");
    });
  });

  // --- 5: immutable plugin_versions -----------------------------------------
  await test("5. plugin_versions rows cannot be mutated by an authenticated (non-service-role) user", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      let threw = false;
      let rowsAffected = -1;
      try {
        const result = await client.query(`update public.plugin_versions set version = '9.9.9' where plugin_id = 'ai-governance'`);
        rowsAffected = result.rowCount ?? 0;
      } catch {
        threw = true;
      }
      assert(threw || rowsAffected === 0, "plugin_versions must be immutable to an authenticated non-service-role user (exception or zero rows affected)");
    });
  });

  // --- 6: immutable plugin_run_contexts -------------------------------------
  await test("6. plugin_run_contexts rows cannot be mutated by an authenticated (non-service-role) user", async () => {
    const snapshotId = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userAId],
      );
      return snapshot.rows[0].id as string;
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      let threw = false;
      let rowsAffected = -1;
      try {
        const result = await client.query(`update public.plugin_run_contexts set context = '{"tampered":true}'::jsonb where id = $1`, [snapshotId]);
        rowsAffected = result.rowCount ?? 0;
      } catch {
        threw = true;
      }
      assert(threw || rowsAffected === 0, "plugin_run_contexts must be immutable to an authenticated non-service-role user (exception or zero rows affected)");
    });
  });

  // --- 7: duplicate correlation_id idempotency ------------------------------
  await test("7. duplicate (organization_id, correlation_id) is rejected by the unique constraint", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userAId],
      );
      await client.query(
        `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id)
         values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-idempotency-test')`,
        [snapshot.rows[0].id, f.userAId],
      );
      let code: string | undefined;
      try {
        await client.query(
          `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id)
           values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-idempotency-test')`,
          [snapshot.rows[0].id, f.userAId],
        );
      } catch (error) {
        code = (error as PgError).code;
      }
      assertEqual(code, "23505", "a duplicate correlation_id for the same organization must violate the unique constraint");
    });
  });

  // --- 13: PromotionRequest remains distinct from Decision (schema-level) --
  await test("13. promotion_requests has no formal-decision or KFSA-decision columns", async () => {
    await withClient(connectionString, async (client) => {
      const columns = await client.query(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'promotion_requests'`,
      );
      const names = columns.rows.map((r) => r.column_name as string);
      for (const forbidden of ["official_decision", "official_verdict", "kfsa_verdict", "kfsa_decision_id", "kfsa_decision_code"]) {
        assert(!names.includes(forbidden), `promotion_requests must not have a "${forbidden}" column`);
      }
    });
  });

  // --- 14: ReviewOutcome accepts only PASS/FIX/FAIL/ESCALATE ----------------
  await test("14. review_outcome check constraint rejects KFSA-only values and accepts the four ReviewOutcome values", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userAId],
      );
      const run = await client.query(
        `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id, status)
         values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-review-outcome-test', 'completed')
         returning id`,
        [snapshot.rows[0].id, f.userAId],
      );

      for (const kfsaValue of ["KILL", "SCALE", "ALERT"]) {
        let code: string | undefined;
        try {
          await client.query(
            `insert into public.promotion_requests
               (source_plugin_id, source_skill_id, source_run_id, request_id, candidate_id, objective, correlation_id, context_snapshot_id, plugin_version, skill_version, review_outcome)
             values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'candidate-1', 'test objective', 'corr-review-outcome-test', $3, '0.1.0', '0.1.0', $4)`,
            [run.rows[0].id, `pr-kfsa-reject-${kfsaValue}`, snapshot.rows[0].id, kfsaValue],
          );
        } catch (error) {
          code = (error as PgError).code;
        }
        assertEqual(code, "23514", `review_outcome must reject KFSA-only value "${kfsaValue}" via the check constraint`);
      }

      for (const validValue of ["PASS", "FIX", "FAIL", "ESCALATE"]) {
        const inserted = await client.query(
          `insert into public.promotion_requests
             (source_plugin_id, source_skill_id, source_run_id, request_id, candidate_id, objective, correlation_id, context_snapshot_id, plugin_version, skill_version, review_outcome)
           values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'candidate-1', 'test objective', 'corr-review-outcome-test', $3, '0.1.0', '0.1.0', $4)
           returning review_outcome`,
          [run.rows[0].id, `pr-reviewoutcome-accept-${validValue}`, snapshot.rows[0].id, validValue],
        );
        assertEqual(inserted.rows[0].review_outcome, validValue, `review_outcome must accept ReviewOutcome value "${validValue}"`);
      }
    });
  });

  // --- 16: organization_id not overwritten when auth.uid() is null ---------
  await test("16. organization_id supplied explicitly is preserved when there is no authenticated session (seed/reset context)", async () => {
    await withClient(connectionString, async (client) => {
      await asPrivilegedNoSession(client);
      const result = await client.query(
        `insert into public.use_cases
           (organization_id, name, name_ar, risk_level, data_sensitivity, tool_access,
            governance_status, eval_outcome, evidence_status, authority_status, audit_trail_status, lifecycle_stage)
         values ($1, 'No-Session Insert', 'إدخال بدون جلسة', 'low', 'low', 'none',
                 'GOVERNANCE_REVIEW_REQUIRED', 'FIX', 'missing', 'missing', 'missing', 'proposed')
         returning organization_id`,
        [f.orgAId],
      );
      assertEqual(result.rows[0].organization_id, f.orgAId, "an explicit organization_id must survive an insert made with no authenticated session (this is the bug the corrective migration fixed)");
    });
  });

  printSummaryAndExit("Part A: live-database tests");
}

run().catch((error) => {
  console.error("\nPart A test runner crashed (is a reachable Postgres superuser connection configured?):");
  console.error(`  PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL=${process.env.PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL ?? "(unset, using default postgresql://postgres:postgres@127.0.0.1:5432/postgres)"}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
