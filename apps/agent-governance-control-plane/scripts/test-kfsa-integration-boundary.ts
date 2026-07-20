/**
 * Part B of `npm run test:kfsa-integration`: exercises the *actual*
 * lib/kfsa/promotion-submission.ts (submitPromotionRequestForEvaluation)
 * against a minimal fake Supabase client, with no network or database
 * dependency -- mirrors scripts/test-plugin-governance-boundary.ts's
 * approach for the pre-existing plugin boundary. Every test here stops
 * before step 11 (the actual external KFSA call), so no mock HTTP server
 * is needed.
 *
 * Covers the ownership/verification steps (1-10 in
 * docs/plugins/kfsa-promotion-request-integration-v1.md) that are enforced
 * in application code:
 *   - cross-tenant Promotion Request blocked (defense-in-depth check,
 *     independent of RLS -- RLS itself is proven in
 *     scripts/test-kfsa-integration-db.ts)
 *   - source plugin not installed / disabled rejected
 *   - source skill invalid (wrong plugin, disabled for installation) rejected
 *   - incomplete (non-completed) source run rejected
 *   - context snapshot ownership mismatch rejected
 *   - evidence ownership mismatch rejected
 *   - correlation_id reuse for a different Promotion Request rejected
 *   - an already-successfully-evaluated Promotion Request returns the
 *     existing result (idempotent replay) instead of re-submitting
 *   - browser cannot submit canonical server fields (static scan of the
 *     Gateway route's prohibited-field list)
 *   - no automatic ReviewOutcome -> KFSA vocabulary mapping (static scan)
 *   - production_approval_status is never touched by this integration (static scan)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { submitPromotionRequestForEvaluation } from "@/lib/kfsa/promotion-submission";
import { KfsaSubmissionBoundaryError } from "@/lib/kfsa/errors";
import { FakeSupabaseClient, type FakeRow } from "./governance-tests/fake-client";
import { test, assert, assertEqual, assertThrows, printSummaryAndExit } from "./governance-tests/harness";

const ORG_ID = "org-1";
const OTHER_ORG_ID = "org-2";
const USER_ID = "user-1";
const PLUGIN_ID = "ai-governance";
const SKILL_ID = "ai-governance.ai-inventory-intake";
const RUN_ID = "run-1";
const SNAPSHOT_ID = "snap-1";
const PR_ID = "pr-1";
const EVIDENCE_ID = "evidence-1";

function baseFixtures(overrides: {
  promotionRequestOrgId?: string;
  installationState?: string;
  installationMissing?: boolean;
  skillPluginId?: string;
  skillPermissions?: FakeRow[];
  runStatus?: string;
  snapshotOrgId?: string | null;
  evidenceIds?: string[];
  existingEvaluationResponses?: FakeRow[];
} = {}): FakeSupabaseClient {
  const client = new FakeSupabaseClient();
  client.setUser({ id: USER_ID });

  client.seed("profiles", [{ id: USER_ID, organization_id: ORG_ID, role: "member", full_name: "Test User", created_at: new Date().toISOString() }]);

  if (!overrides.installationMissing) {
    client.seed("plugin_installations", [
      { id: "inst-1", organization_id: ORG_ID, plugin_id: PLUGIN_ID, plugin_version_id: "v1", state: overrides.installationState ?? "installed" },
    ]);
  } else {
    client.seed("plugin_installations", []);
  }

  client.seed("skill_definitions", [{ id: SKILL_ID, plugin_id: overrides.skillPluginId ?? PLUGIN_ID, version: "0.1.0", execution_status: "implemented" }]);
  client.seed("plugin_skill_permissions", overrides.skillPermissions ?? []);

  client.seed("plugin_runs", [{ id: RUN_ID, organization_id: ORG_ID, plugin_id: PLUGIN_ID, skill_id: SKILL_ID, context_snapshot_id: SNAPSHOT_ID, status: overrides.runStatus ?? "completed", correlation_id: "corr-boundary-test" }]);

  if (overrides.snapshotOrgId !== null) {
    client.seed("plugin_run_contexts", [{ id: SNAPSHOT_ID, organization_id: overrides.snapshotOrgId ?? ORG_ID, plugin_id: PLUGIN_ID, plugin_version: "0.1.0", skill_id: SKILL_ID, skill_version: "0.1.0" }]);
  } else {
    client.seed("plugin_run_contexts", []);
  }

  client.seed("plugin_evidence_outputs", [{ id: EVIDENCE_ID, organization_id: ORG_ID, plugin_run_id: RUN_ID, evidence_type: "decision_candidate", payload: {} }]);

  client.seed("promotion_requests", [
    {
      id: PR_ID,
      organization_id: overrides.promotionRequestOrgId ?? ORG_ID,
      source_plugin_id: PLUGIN_ID,
      source_skill_id: SKILL_ID,
      source_run_id: RUN_ID,
      request_id: "req-1",
      candidate_id: "candidate-1",
      signal_ids: [] as string[],
      evidence_ids: overrides.evidenceIds ?? [EVIDENCE_ID],
      authority_context: { actor_role: "member" },
      objective: "test objective",
      correlation_id: "corr-boundary-test",
      context_snapshot_id: SNAPSHOT_ID,
      plugin_version: "0.1.0",
      skill_version: "0.1.0",
    },
  ]);

  client.seed("kfsa_submission_attempts", []);
  client.seed("kfsa_evaluation_responses", overrides.existingEvaluationResponses ?? []);
  client.seed("kfsa_external_audit_links", []);
  client.seed("plugin_audit_events", []);

  return client;
}

function asClient(client: FakeSupabaseClient): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}

async function run() {
  await test("boundary: a Promotion Request owned by a different organization is rejected as not found", async () => {
    const client = baseFixtures({ promotionRequestOrgId: OTHER_ORG_ID });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a cross-tenant Promotion Request");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "promotion_request_not_found", "rejection reason");
  });

  await test("boundary: an unknown promotion_request_id is rejected as not found", async () => {
    const client = baseFixtures();
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: "no-such-id" }), "should reject an unknown id");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "promotion_request_not_found", "rejection reason");
  });

  await test("boundary: a disabled source plugin installation is rejected", async () => {
    const client = baseFixtures({ installationState: "disabled" });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a disabled installation");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "source_plugin_not_installed", "rejection reason");
  });

  await test("boundary: a missing source plugin installation is rejected", async () => {
    const client = baseFixtures({ installationMissing: true });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a missing installation");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "source_plugin_not_installed", "rejection reason");
  });

  await test("boundary: a source skill not owned by the source plugin is rejected", async () => {
    const client = baseFixtures({ skillPluginId: "some-other-plugin" });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a mismatched skill");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "source_skill_invalid", "rejection reason");
  });

  await test("boundary: a source skill disabled for this installation is rejected", async () => {
    const client = baseFixtures({ skillPermissions: [{ plugin_installation_id: "inst-1", skill_id: SKILL_ID, enabled: false }] });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a disabled skill");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "source_skill_invalid", "rejection reason");
  });

  await test("boundary: an incomplete (non-completed) source run is rejected", async () => {
    const client = baseFixtures({ runStatus: "submitted" });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject an incomplete run");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "source_run_not_completed", "rejection reason");
  });

  await test("boundary: a missing context snapshot is rejected", async () => {
    const client = baseFixtures({ snapshotOrgId: null });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a missing snapshot");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "context_snapshot_missing", "rejection reason");
  });

  await test("boundary: a context snapshot owned by a different organization is rejected", async () => {
    const client = baseFixtures({ snapshotOrgId: OTHER_ORG_ID });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject a cross-tenant snapshot");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "context_snapshot_missing", "rejection reason");
  });

  await test("boundary: evidence_ids that do not resolve to this organization's evidence are rejected", async () => {
    const client = baseFixtures({ evidenceIds: [EVIDENCE_ID, "evidence-not-owned"] });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject unresolved evidence_ids");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "evidence_mismatch", "rejection reason");
  });

  await test("boundary: correlation_id reuse for a different Promotion Request within the same org is rejected", async () => {
    const client = baseFixtures({
      existingEvaluationResponses: [
        {
          id: "resp-other",
          organization_id: ORG_ID,
          promotion_request_id: "pr-other",
          submission_attempt_id: "attempt-other",
          correlation_id: "corr-boundary-test",
          external_promotion_request_id: "ext-1",
          review_outcome: "PASS",
          evidence_status: "complete",
          authority_status: "confirmed",
          escalation_required: false,
          blocked_actions: [] as string[],
          formal_decision_created: false,
          response_hash: "hash-1",
        },
      ],
    });
    const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID }), "should reject correlation_id reuse for a different PR");
    assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
    assertEqual((error as KfsaSubmissionBoundaryError).reason, "correlation_conflict", "rejection reason");
  });

  await test("boundary: a Promotion Request already successfully evaluated returns the existing result instead of re-submitting", async () => {
    const client = baseFixtures({
      existingEvaluationResponses: [
        {
          id: "resp-existing",
          organization_id: ORG_ID,
          promotion_request_id: PR_ID,
          submission_attempt_id: "attempt-existing",
          correlation_id: "corr-boundary-test",
          external_promotion_request_id: "ext-existing",
          review_outcome: "PASS",
          evidence_status: "complete",
          authority_status: "confirmed",
          escalation_required: false,
          blocked_actions: [] as string[],
          formal_decision_created: false,
          response_hash: "hash-existing",
        },
      ],
    });
    const outcome = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: PR_ID });
    assertEqual(outcome.kind, "replay", "outcome kind");
    if (outcome.kind === "replay") {
      assertEqual(outcome.evaluationResponse.external_promotion_request_id, "ext-existing", "the existing response must be returned unchanged");
    }
  });

  await test("boundary: the Gateway route rejects every client-authored canonical field", () => {
    const source = readFileSync(path.resolve(__dirname, "../app/api/kfsa/promotion-requests/route.ts"), "utf8");
    const requiredProhibited = [
      "organization_id",
      "source_plugin_id",
      "source_skill_id",
      "source_run_id",
      "evidence_ids",
      "authority_context",
      "review_outcome",
      "formal_decision_created",
      "decision_code",
    ];
    for (const field of requiredProhibited) {
      assert(source.includes(`"${field}"`), `the Gateway route's prohibited-field list must include "${field}"`);
    }
  });

  await test("boundary: no source file assigns review_outcome to a KFSA-only value (KILL/SCALE/ALERT)", () => {
    const root = path.resolve(__dirname, "..");
    const filesToScan = ["lib/kfsa/promotion-submission.ts", "lib/kfsa/client.ts", "app/api/kfsa/promotion-requests/route.ts"];
    for (const relPath of filesToScan) {
      const content = readFileSync(path.join(root, relPath), "utf8");
      for (const value of ["KILL", "SCALE", "ALERT"]) {
        const pattern = new RegExp(`review_outcome\\s*[:=]\\s*["']${value}["']`);
        assert(!pattern.test(content), `${relPath} must never assign review_outcome to KFSA value "${value}"`);
      }
    }
  });

  await test("boundary: this integration never sets production_approval_status or approved_for_production to true", () => {
    const root = path.resolve(__dirname, "..");
    const filesToScan = ["lib/kfsa/promotion-submission.ts", "lib/kfsa/client.ts", "app/api/kfsa/promotion-requests/route.ts", "repositories/kfsa-integration-repository.ts"];
    for (const relPath of filesToScan) {
      const content = readFileSync(path.join(root, relPath), "utf8");
      assert(!/production_approval_status\s*[:=]\s*true|approved_for_production\s*[:=]\s*true/.test(content), `${relPath} must never set a production-approval field to true`);
    }
  });

  printSummaryAndExit("Part B: KFSA application-boundary tests (no database, no network)");
}

run().catch((error) => {
  console.error("Part B test runner crashed:", error);
  process.exit(1);
});
