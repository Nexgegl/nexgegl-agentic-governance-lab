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
 *
 * Tests 5/6 additionally distinguish (a) an ordinary tenant blocked by RLS
 * from (b) a privileged, RLS-bypassing connection that reaches the row and
 * is rejected specifically by the immutability trigger's own logic, with a
 * (c) positive control proving that same trigger allows a genuine
 * service_role mutation -- see M-2 in the PR #99 independent review.
 *
 * Also covers the 9 multi-organization installation checks from the PR #99
 * remediation request (org A/B both see the 6 global skill definitions
 * through their own installation, org B can complete a run, cross-org
 * permission/run isolation, per-org disable independence, no duplication of
 * skill_definitions rows, no tenant mutation of the global catalog, and
 * legacy `skills` rows are unaffected).
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

async function asPrivilegedNonServiceRole(client: Client) {
  // Stays on the superuser connection (bypasses RLS entirely, so the row
  // is genuinely reachable -- this is not RLS blocking anything) but sets
  // the JWT role claim to 'authenticated', not service_role, so the
  // immutability trigger's own `auth.role() <> 'service_role'` check is
  // exercised on its own terms rather than short-circuited by RLS denying
  // access to the row before the trigger ever runs.
  await client.query(`select set_config('request.jwt.claim.role', 'authenticated', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
}

async function asServiceRoleClaim(client: Client) {
  // Same superuser connection, but with the role claim set to
  // service_role -- used as the positive control proving the trigger's
  // conditional actually distinguishes service_role from everything else,
  // rather than unconditionally rejecting every mutation attempt.
  await client.query(`select set_config('request.jwt.claim.role', 'service_role', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
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
  // A: an ordinary tenant is blocked by RLS (no UPDATE policy exists on
  //    plugin_versions for `authenticated` at all -- the row is never even
  //    reached).
  // B: a privileged connection that bypasses RLS (see
  //    asPrivilegedNonServiceRole) *does* reach the row, and it is
  //    specifically prevent_plugin_version_mutation()'s own
  //    `auth.role() <> 'service_role'` check -- not RLS -- that raises the
  //    exception. A positive control (asServiceRoleClaim) confirms the same
  //    trigger allows the mutation when the role claim genuinely is
  //    service_role, proving the rejection in B is the trigger's
  //    conditional logic actually running, not an unconditional failure.
  await test("5a. plugin_versions: ordinary tenant blocked by RLS (no UPDATE policy)", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const result = await client.query(`update public.plugin_versions set version = '9.9.9' where plugin_id = 'ai-governance'`);
      assertEqual(result.rowCount, 0, "an authenticated tenant must not be able to reach a plugin_versions row to update it (RLS has no UPDATE policy for this table)");
    });
  });

  await test("5b. plugin_versions: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
    await withClient(connectionString, async (client) => {
      await asPrivilegedNonServiceRole(client);
      let threw = false;
      try {
        await client.query(`update public.plugin_versions set version = '9.9.9' where plugin_id = 'ai-governance'`);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("immutable"), `expected the immutability trigger's error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a privileged (RLS-bypassing) connection presenting a non-service-role claim must still be rejected by the trigger itself");
    });
  });

  await test("5c. plugin_versions: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
    await withClient(connectionString, async (client) => {
      await asServiceRoleClaim(client);
      const result = await client.query(`update public.plugin_versions set manifest = manifest where plugin_id = 'ai-governance'`);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation, proving 5b's rejection is the trigger's conditional logic, not an unconditional failure");
    });
  });

  // --- 6: immutable plugin_run_contexts -------------------------------------
  // Same A/B/positive-control structure as test 5, for
  // prevent_run_context_mutation().
  await test("6a. plugin_run_contexts: ordinary tenant blocked by RLS (no UPDATE policy)", async () => {
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
      const result = await client.query(`update public.plugin_run_contexts set context = '{"tampered":true}'::jsonb where id = $1`, [snapshotId]);
      assertEqual(result.rowCount, 0, "an authenticated tenant must not be able to reach a plugin_run_contexts row to update it (RLS has no UPDATE policy for this table)");
    });
  });

  await test("6b. plugin_run_contexts: privileged non-service-role path reaches the row but the immutability trigger rejects it", async () => {
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
      await asPrivilegedNonServiceRole(client);
      let threw = false;
      try {
        await client.query(`update public.plugin_run_contexts set context = '{"tampered":true}'::jsonb where id = $1`, [snapshotId]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("immutable"), `expected the immutability trigger's error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a privileged (RLS-bypassing) connection presenting a non-service-role claim must still be rejected by the trigger itself");
    });
  });

  await test("6c. plugin_run_contexts: positive control -- the trigger allows mutation when the role claim genuinely is service_role", async () => {
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
      await asServiceRoleClaim(client);
      const result = await client.query(`update public.plugin_run_contexts set context = context where id = $1`, [snapshotId]);
      assertEqual(result.rowCount, 1, "the trigger must allow a service_role-claimed mutation, proving 6b's rejection is the trigger's conditional logic, not an unconditional failure");
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

  // --- Multi-organization installation tests --------------------------------
  // Regression coverage for the HIGH finding from the PR #99 independent
  // review: skill_definitions is global catalog data, so any organization
  // that installs ai-governance must see and be able to run the same skills
  // as the originally-seeded demo org, without any code path duplicating
  // skill rows per organization.

  await test("multi-org-1. org A sees all six global ai-governance skill definitions through its own installation", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const installation = await client.query(
        `select state from public.plugin_installations where organization_id = $1 and plugin_id = 'ai-governance'`,
        [f.orgAId],
      );
      assertEqual(installation.rows[0]?.state, "installed", "org A's ai-governance installation must be seeded as installed");
      const skills = await client.query(`select id from public.skill_definitions where plugin_id = 'ai-governance'`);
      assertEqual(skills.rowCount, 6, "org A must see all 6 global ai-governance skill definitions");
    });
  });

  const orgBInstallationId = await (async () => {
    return withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const version = await client.query(`select id from public.plugin_versions where plugin_id = 'ai-governance' order by created_at desc limit 1`);
      const installation = await client.query(
        `insert into public.plugin_installations (plugin_id, plugin_version_id, state, installed_at)
         values ('ai-governance', $1, 'installed', now())
         returning id, organization_id, state`,
        [version.rows[0].id],
      );
      return installation.rows[0] as { id: string; organization_id: string; state: string };
    });
  })();

  await test("multi-org-2. org B installs ai-governance (mirroring the real install route) and sees the same six global skill definitions", async () => {
    assertEqual(orgBInstallationId.organization_id, f.orgBId, "the install's organization_id must be forced to org B by force_organization_id_from_caller(), not left client-supplied");
    assertEqual(orgBInstallationId.state, "installed", "org B's installation must be in the installed state");
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const skills = await client.query(`select id from public.skill_definitions where plugin_id = 'ai-governance'`);
      assertEqual(skills.rowCount, 6, "org B must see the exact same 6 global skill definitions org A sees -- nothing was duplicated or withheld for a second installing organization");
    });
  });

  await test("multi-org-3. org B can complete the profile + run preconditions the implemented skill requires", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      await client.query(
        `insert into public.domain_profiles (domain, profile, completeness_score)
         values ('ai_governance', $1::jsonb, 100)`,
        [JSON.stringify({ ai_governance_owner: "Org B Governance Owner", risk_appetite: "medium" })],
      );
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userBId],
      );
      const run = await client.query(
        `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id, status)
         values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-org-b-run', 'completed')
         returning organization_id, status`,
        [snapshot.rows[0].id, f.userBId],
      );
      assertEqual(run.rows[0].organization_id, f.orgBId, "org B's run must be scoped to org B");
      assertEqual(run.rows[0].status, "completed", "org B must be able to complete a run against the implemented skill exactly as org A can");
    });
  });

  await test("multi-org-4. org B cannot see or modify org A's plugin_skill_permissions or plugin_runs", async () => {
    const { orgARunId, orgAPermissionId } = await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const installation = await client.query(
        `select id from public.plugin_installations where organization_id = $1 and plugin_id = 'ai-governance'`,
        [f.orgAId],
      );

      // plugin_skill_permissions has no INSERT policy for `authenticated`
      // at all -- enabling/disabling a skill for an installation is an
      // admin/service-role action by design (same posture as
      // connector_definitions), so this fixture insert has to go through
      // the privileged, RLS-bypassing path and supply organization_id
      // itself, exactly like an admin tool would.
      await asPrivilegedNoSession(client);
      const permission = await client.query(
        `insert into public.plugin_skill_permissions (organization_id, plugin_installation_id, skill_id, enabled)
         values ($1, $2, 'ai-governance.ai-inventory-intake', false)
         returning id`,
        [f.orgAId, installation.rows[0].id],
      );

      await asUser(client, f.userAId);
      const snapshot = await client.query(
        `insert into public.plugin_run_contexts (plugin_id, plugin_version, skill_id, skill_version, actor_user_id, context)
         values ('ai-governance', '0.1.0', 'ai-governance.ai-inventory-intake', '0.1.0', $1, '{}'::jsonb)
         returning id`,
        [f.userAId],
      );
      const run = await client.query(
        `insert into public.plugin_runs (plugin_id, skill_id, context_snapshot_id, actor_user_id, correlation_id)
         values ('ai-governance', 'ai-governance.ai-inventory-intake', $1, $2, 'corr-org-a-isolation-test')
         returning id`,
        [snapshot.rows[0].id, f.userAId],
      );
      return { orgARunId: run.rows[0].id as string, orgAPermissionId: permission.rows[0].id as string };
    });

    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const visibleRun = await client.query(`select id from public.plugin_runs where id = $1`, [orgARunId]);
      assertEqual(visibleRun.rowCount, 0, "org B must not be able to see org A's plugin_runs row");
      const visiblePermission = await client.query(`select id from public.plugin_skill_permissions where id = $1`, [orgAPermissionId]);
      assertEqual(visiblePermission.rowCount, 0, "org B must not be able to see org A's plugin_skill_permissions row");
      const updateResult = await client.query(`update public.plugin_runs set correlation_id = 'hijacked' where id = $1`, [orgARunId]);
      assertEqual(updateResult.rowCount, 0, "org B's attempt to modify org A's plugin_runs row must affect zero rows");
    });
  });

  await test("multi-org-5. disabling a skill for org A's installation does not disable it for org B's installation", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const installation = await client.query(
        `select id from public.plugin_installations where organization_id = $1 and plugin_id = 'ai-governance'`,
        [f.orgAId],
      );
      const orgADisabled = await client.query(
        `select enabled from public.plugin_skill_permissions where plugin_installation_id = $1 and skill_id = 'ai-governance.ai-inventory-intake'`,
        [installation.rows[0].id],
      );
      assertEqual(orgADisabled.rows[0]?.enabled, false, "org A's explicit disable (inserted in multi-org-4) must be visible to org A");
    });
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userBId);
      const orgBPermission = await client.query(
        `select enabled from public.plugin_skill_permissions where plugin_installation_id = $1 and skill_id = 'ai-governance.ai-inventory-intake'`,
        [orgBInstallationId.id],
      );
      assertEqual(orgBPermission.rowCount, 0, "org B must have no explicit permission row for this skill -- absence means enabled by default, independent of org A's explicit disable");
    });
  });

  await test("multi-org-6. a plugin skill definition is not duplicated per organization even after two organizations install the plugin", async () => {
    await withClient(connectionString, async (client) => {
      const count = await client.query(`select count(*)::int as count from public.skill_definitions where id = 'ai-governance.ai-inventory-intake'`);
      assertEqual(count.rows[0].count, 1, "exactly one global skill_definitions row must exist, regardless of how many organizations have installed the plugin");
    });
  });

  await test("multi-org-7. no tenant can mutate global skill_definitions or skill_definition_versions rows", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const defResult = await client.query(`update public.skill_definitions set name = 'Hijacked' where id = 'ai-governance.ai-inventory-intake'`);
      assertEqual(defResult.rowCount, 0, "an authenticated tenant must not be able to reach a skill_definitions row to update it (RLS has no UPDATE policy for this table)");

      const versionRow = await client.query(`select id from public.skill_definition_versions where skill_id = 'ai-governance.ai-inventory-intake' limit 1`);
      const versionResult = await client.query(`update public.skill_definition_versions set definition = '{}'::jsonb where id = $1`, [versionRow.rows[0].id]);
      assertEqual(versionResult.rowCount, 0, "an authenticated tenant must not be able to reach a skill_definition_versions row to update it (RLS has no UPDATE policy for this table)");
    });

    await withClient(connectionString, async (client) => {
      await asPrivilegedNonServiceRole(client);
      const versionRow = await client.query(`select id from public.skill_definition_versions where skill_id = 'ai-governance.ai-inventory-intake' limit 1`);
      let threw = false;
      try {
        await client.query(`update public.skill_definition_versions set definition = '{}'::jsonb where id = $1`, [versionRow.rows[0].id]);
      } catch (error) {
        threw = true;
        assert((error as PgError).message.includes("immutable"), `expected the immutability trigger's error, got: ${(error as PgError).message}`);
      }
      assert(threw, "a privileged (RLS-bypassing) connection presenting a non-service-role claim must still be rejected by skill_definition_versions' immutability trigger");
    });
  });

  await test("multi-org-8. existing legacy (non-plugin) skills behavior is unaffected: exactly the 5 seeded rows remain, none plugin-owned", async () => {
    await withClient(connectionString, async (client) => {
      await asUser(client, f.userAId);
      const legacySkills = await client.query(`select id, plugin_id from public.skills`);
      assertEqual(legacySkills.rowCount, 5, "the legacy skills table must still contain exactly its 5 pre-existing Governed Research Runtime rows");
      for (const row of legacySkills.rows) {
        assert(row.plugin_id === null, `legacy skill "${row.id}" must have plugin_id = null -- no plugin-owned row should exist in the legacy table`);
      }
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
