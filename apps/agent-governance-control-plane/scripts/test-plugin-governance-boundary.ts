/**
 * Part B of `npm run test:plugin-governance`: exercises the *actual*
 * lib/plugins/* boundary functions (not reimplementations of them) against
 * a minimal fake Supabase client, with no network or database dependency.
 * Requires NODE_OPTIONS=--conditions=react-server so the `server-only`
 * import guard in those modules resolves to its no-op export instead of
 * throwing (the same "react-server" condition Next.js itself uses when
 * bundling Server Components) -- see scripts/test-plugin-governance.ts.
 *
 * Covers the items from the pre-push review request that are enforced in
 * application code rather than by the database:
 *   8  disabled plugin rejection
 *   9  unapproved skill rejection (not owned by plugin / disabled for install)
 *   10 undeclared/not-permitted connector rejection
 *   11 client-authored formal decision fields rejected
 *   12 client-authored KFSA decision code fields rejected
 *   15 no automatic ReviewOutcome-to-KFSA mapping (static source scan)
 *
 * Also covers multi-org item 6 from the PR #99 remediation request (the
 * five not_implemented skills remain non-executable regardless of which
 * organization's context is composed) -- the other 8 multi-organization
 * items are DB-level and live in test-plugin-governance-db.ts, since they
 * depend on real RLS/global-catalog behavior this fake client can't prove.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { composeContext } from "@/lib/plugins/context-composer";
import { runSkill } from "@/lib/plugins/execution-boundary";
import { PluginBoundaryError } from "@/lib/plugins/errors";
import { FakeSupabaseClient, type FakeRow } from "./governance-tests/fake-client";
import { test, assert, assertEqual, assertThrows, printSummaryAndExit } from "./governance-tests/harness";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const PLUGIN_ID = "ai-governance";
const SKILL_ID = "ai-governance.ai-inventory-intake";

function baseFixtures(overrides: {
  organizationId?: string;
  userId?: string;
  installationState?: string;
  skillPluginId?: string;
  skillId?: string;
  executionStatus?: "implemented" | "not_implemented";
  skillPermissions?: FakeRow[];
  permittedConnectors?: string[];
  connectorPermissions?: FakeRow[];
} = {}): FakeSupabaseClient {
  const organizationId = overrides.organizationId ?? ORG_ID;
  const userId = overrides.userId ?? USER_ID;
  const skillId = overrides.skillId ?? SKILL_ID;

  const client = new FakeSupabaseClient();
  client.setUser({ id: userId });

  client.seed("profiles", [{ id: userId, organization_id: organizationId, role: "member", full_name: "Test User", created_at: new Date().toISOString() }]);
  client.seed("plugin_definitions", [
    { plugin_id: PLUGIN_ID, status: "experimental", production_approval_status: false, domain: "ai_governance", name: { en: "AI Governance" }, owner: "x", constitutional_reference: [], created_at: new Date().toISOString() },
  ]);
  client.seed("plugin_versions", [{ id: "v1", plugin_id: PLUGIN_ID, version: "0.1.0", manifest: {}, created_at: new Date().toISOString() }]);
  client.seed("plugin_installations", [
    { id: "inst-1", organization_id: organizationId, plugin_id: PLUGIN_ID, plugin_version_id: "v1", state: overrides.installationState ?? "installed", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);
  client.seed("skill_definitions", [
    {
      id: skillId,
      plugin_id: overrides.skillPluginId ?? PLUGIN_ID,
      version: "0.1.0",
      execution_status: overrides.executionStatus ?? "implemented",
      required_profile_fields: [] as string[],
      permitted_connectors: overrides.permittedConnectors ?? ["supabase-internal"],
      escalation_conditions: [] as string[],
    },
  ]);
  client.seed("plugin_skill_permissions", overrides.skillPermissions ?? []);
  client.seed("domain_profiles", []);
  client.seed("organization_profiles", []);
  client.seed("connector_definitions", [{ id: "conn-1", connector_id: "supabase-internal", status: "enabled", organization_id: organizationId }]);
  client.seed(
    "plugin_connector_permissions",
    overrides.connectorPermissions ?? [{ plugin_id: PLUGIN_ID, connector_id: "conn-1", allowed: true, organization_id: organizationId }],
  );
  client.seed("use_cases", []);
  client.seed("plugin_runs", []);
  client.seed("plugin_run_contexts", []);
  client.seed("plugin_audit_events", []);
  client.seed("plugin_evidence_outputs", []);

  return client;
}

function asClient(client: FakeSupabaseClient): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}

async function run() {
  // --- 8: disabled plugin rejection --------------------------------------
  await test("8. disabled plugin installation is rejected by composeContext", async () => {
    const client = baseFixtures({ installationState: "disabled" });
    const error = await assertThrows(
      () => composeContext(asClient(client), { pluginId: PLUGIN_ID, skillId: SKILL_ID }),
      "composeContext should reject a disabled installation",
    );
    assert(error instanceof PluginBoundaryError, "error should be a PluginBoundaryError");
    assertEqual((error as PluginBoundaryError).reason, "plugin_disabled", "rejection reason");
  });

  // --- 9: unapproved skill rejection ---------------------------------------
  await test("9a. a skill explicitly disabled for this org's installation is rejected", async () => {
    const client = baseFixtures({ skillPermissions: [{ plugin_installation_id: "inst-1", skill_id: SKILL_ID, enabled: false }] });
    const error = await assertThrows(
      () => composeContext(asClient(client), { pluginId: PLUGIN_ID, skillId: SKILL_ID }),
      "composeContext should reject a disabled skill permission",
    );
    assert(error instanceof PluginBoundaryError, "error should be a PluginBoundaryError");
    assertEqual((error as PluginBoundaryError).reason, "skill_disabled_for_installation", "rejection reason");
  });

  await test("9b. a skill that does not belong to the requested plugin is rejected", async () => {
    const client = baseFixtures({ skillPluginId: "some-other-plugin" });
    const error = await assertThrows(
      () => composeContext(asClient(client), { pluginId: PLUGIN_ID, skillId: SKILL_ID }),
      "composeContext should reject a skill owned by a different plugin",
    );
    assert(error instanceof PluginBoundaryError, "error should be a PluginBoundaryError");
    assertEqual((error as PluginBoundaryError).reason, "skill_not_owned_by_plugin", "rejection reason");
  });

  // --- 10: undeclared / not-permitted connector rejection ------------------
  await test("10. a connector the org has not granted to this plugin is rejected", async () => {
    const client = baseFixtures({ connectorPermissions: [] });
    const result = await runSkill(asClient(client), {
      pluginId: PLUGIN_ID,
      skillId: SKILL_ID,
      correlationId: "corr-connector-test",
      input: { name: "x", name_ar: "س", risk_level: "low", data_sensitivity: "low", tool_access: "read_only" },
    });
    assertEqual(result.status, "rejected", "run status");
    assert(Boolean(result.rejectionReason?.startsWith("connector_not_permitted")), `expected connector_not_permitted reason, got "${result.rejectionReason}"`);
  });

  // --- 11 & 12: client-authored formal-decision / KFSA fields rejected -----
  const prohibitedFields = ["official_decision", "official_verdict", "kfsa_verdict", "kfsa_decision_id", "kfsa_decision_code", "execution_authorization"];
  for (const field of prohibitedFields) {
    await test(`11/12. runSkill rejects input containing prohibited field "${field}"`, async () => {
      const client = baseFixtures();
      const error = await assertThrows(
        () =>
          runSkill(asClient(client), {
            pluginId: PLUGIN_ID,
            skillId: SKILL_ID,
            correlationId: `corr-prohibited-${field}`,
            input: { [field]: "KILL" },
          }),
        `runSkill should reject input containing "${field}"`,
      );
      assert(error instanceof PluginBoundaryError, "error should be a PluginBoundaryError");
      assertEqual((error as PluginBoundaryError).reason, "prohibited_field", "rejection reason");
    });
  }

  // --- multi-org-9: not_implemented skills stay non-executable regardless
  // of which organization's context is composed --------------------------
  for (const org of [
    { organizationId: ORG_ID, userId: USER_ID, label: "org A" },
    { organizationId: "org-2", userId: "user-2", label: "org B" },
  ]) {
    await test(`multi-org-9. a not_implemented skill is rejected for ${org.label}, not just for one hardcoded organization`, async () => {
      const client = baseFixtures({ organizationId: org.organizationId, userId: org.userId, executionStatus: "not_implemented" });
      const result = await runSkill(asClient(client), {
        pluginId: PLUGIN_ID,
        skillId: SKILL_ID,
        correlationId: `corr-not-implemented-${org.organizationId}`,
        input: { name: "x", name_ar: "س", risk_level: "low", data_sensitivity: "low", tool_access: "read_only" },
      });
      assertEqual(result.status, "rejected", "run status");
      assertEqual(result.rejectionReason, "skill_not_implemented", "rejection reason");
    });
  }

  // --- 15: no automatic ReviewOutcome -> KFSA mapping (static source scan) -
  await test("15. no source file assigns review_outcome to a KFSA-only value (KILL/SCALE/ALERT)", () => {
    const root = path.resolve(__dirname, "..");
    const filesToScan = [
      "lib/plugins/promotion-request-composer.ts",
      "lib/plugins/execution-boundary.ts",
      "lib/plugins/context-composer.ts",
      "repositories/promotion-requests-repository.ts",
      "app/api/plugins/runs/[runId]/promotion-requests/route.ts",
    ];
    const kfsaOnlyValues = ["KILL", "SCALE", "ALERT"];
    for (const relPath of filesToScan) {
      const content = readFileSync(path.join(root, relPath), "utf8");
      for (const value of kfsaOnlyValues) {
        const pattern = new RegExp(`review_outcome\\s*[:=]\\s*["']${value}["']`);
        assert(!pattern.test(content), `${relPath} must never assign review_outcome to KFSA value "${value}"`);
      }
    }
  });

  printSummaryAndExit("Part B: application-boundary tests (no database)");
}

run().catch((error) => {
  console.error("Part B test runner crashed:", error);
  process.exit(1);
});
