/**
 * Part D of `npm run test:kfsa-integration`: drives the *actual*
 * submitPromotionRequestForEvaluation end to end -- ownership verification
 * (fake Supabase client, same approach as Part B) followed by a real call
 * through lib/kfsa/client.ts to the isolated mock KFSA HTTP server (same
 * server helper as Part C). This is the only place success/failure/retry
 * behavior is proven against the real composed flow rather than either
 * layer in isolation.
 *
 * Not proven here (see scripts/test-kfsa-integration-db.ts instead, which
 * uses real Postgres): genuine concurrent-request races. The fake
 * Supabase client has no unique constraints or transactions, so it cannot
 * model two requests racing to insert the same row -- only Postgres can,
 * and does (kfsa-3 / kfsa-10 in Part A). What this file proves instead is
 * the *sequential* idempotent-replay behavior: a second call against an
 * already-evaluated Promotion Request is a no-op that never reaches KFSA
 * again.
 *
 * Covers:
 *   - a full successful submission for each ReviewOutcome value, with the
 *     evaluation response and external audit link persisted correctly
 *   - a timeout is recorded as a retryable failure, and retrying the same
 *     Promotion Request afterward succeeds without creating a duplicate
 *     evaluation response
 *   - an unauthorized (401) response is recorded safely (no secret in the
 *     stored error message) and marked non-retryable
 *   - a malformed response is recorded safely and never creates an
 *     evaluation response row
 *   - a duplicate request against an already-succeeded Promotion Request
 *     returns the existing result without a second KFSA call
 *   - correlation_id reuse across two different Promotion Requests is
 *     rejected before any second KFSA call is made
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { submitPromotionRequestForEvaluation } from "@/lib/kfsa/promotion-submission";
import { KfsaSubmissionBoundaryError } from "@/lib/kfsa/errors";
import { FakeSupabaseClient } from "./governance-tests/fake-client";
import { startMockKfsaServer, validKfsaResponseBody, type MockKfsaServer } from "./kfsa-tests/mock-server";
import { test, assert, assertEqual, assertThrows, printSummaryAndExit } from "./governance-tests/harness";

const ORG_ID = "org-1";
const USER_ID = "user-1";
const PLUGIN_ID = "ai-governance";
const SKILL_ID = "ai-governance.ai-inventory-intake";

let fixtureCounter = 0;

function freshFixtures(): { client: FakeSupabaseClient; promotionRequestId: string; correlationId: string } {
  fixtureCounter += 1;
  const runId = `run-e2e-${fixtureCounter}`;
  const snapshotId = `snap-e2e-${fixtureCounter}`;
  const prId = `pr-e2e-${fixtureCounter}`;
  const evidenceId = `evidence-e2e-${fixtureCounter}`;
  const correlationId = `corr-e2e-${fixtureCounter}`;

  const client = new FakeSupabaseClient();
  client.setUser({ id: USER_ID });
  client.seed("profiles", [{ id: USER_ID, organization_id: ORG_ID, role: "member", full_name: "Test User", created_at: new Date().toISOString() }]);
  client.seed("plugin_installations", [{ id: "inst-1", organization_id: ORG_ID, plugin_id: PLUGIN_ID, plugin_version_id: "v1", state: "installed" }]);
  client.seed("skill_definitions", [{ id: SKILL_ID, plugin_id: PLUGIN_ID, version: "0.1.0", execution_status: "implemented" }]);
  client.seed("plugin_skill_permissions", []);
  client.seed("plugin_runs", [{ id: runId, organization_id: ORG_ID, plugin_id: PLUGIN_ID, skill_id: SKILL_ID, context_snapshot_id: snapshotId, status: "completed", correlation_id: correlationId }]);
  client.seed("plugin_run_contexts", [{ id: snapshotId, organization_id: ORG_ID, plugin_id: PLUGIN_ID, plugin_version: "0.1.0", skill_id: SKILL_ID, skill_version: "0.1.0" }]);
  client.seed("plugin_evidence_outputs", [{ id: evidenceId, organization_id: ORG_ID, plugin_run_id: runId, evidence_type: "decision_candidate", payload: {} }]);
  client.seed("promotion_requests", [
    {
      id: prId,
      organization_id: ORG_ID,
      source_plugin_id: PLUGIN_ID,
      source_skill_id: SKILL_ID,
      source_run_id: runId,
      request_id: `req-${prId}`,
      candidate_id: "candidate-1",
      signal_ids: [] as string[],
      evidence_ids: [evidenceId],
      authority_context: { actor_role: "member" },
      objective: "test objective",
      correlation_id: correlationId,
      context_snapshot_id: snapshotId,
      plugin_version: "0.1.0",
      skill_version: "0.1.0",
    },
  ]);
  client.seed("kfsa_submission_attempts", []);
  client.seed("kfsa_evaluation_responses", []);
  client.seed("kfsa_external_audit_links", []);
  client.seed("plugin_audit_events", []);

  return { client, promotionRequestId: prId, correlationId };
}

function asClient(client: FakeSupabaseClient): SupabaseClient<Database> {
  return client as unknown as SupabaseClient<Database>;
}

async function run() {
  const server: MockKfsaServer = await startMockKfsaServer();
  process.env.KFSA_RUNTIME_BASE_URL = server.url;
  process.env.KFSA_RUNTIME_API_KEY = "test-kfsa-api-key-do-not-use-in-prod";
  process.env.KFSA_RUNTIME_TIMEOUT_MS = "500";

  try {
    for (const outcome of ["PASS", "FIX", "FAIL", "ESCALATE"] as const) {
      await test(`e2e: a full successful submission with ${outcome} is persisted correctly with an external audit link`, async () => {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody({ review_outcome: outcome, audit_event_id: `ext-audit-${outcome}` })));
        });
        const { client, promotionRequestId } = freshFixtures();
        const outcomeResult = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
        assertEqual(outcomeResult.kind, "succeeded", "outcome kind");
        if (outcomeResult.kind === "succeeded") {
          assertEqual(outcomeResult.evaluationResponse.review_outcome, outcome, "persisted review_outcome");
          assertEqual(outcomeResult.evaluationResponse.formal_decision_created, false, "persisted formal_decision_created");
          assertEqual(outcomeResult.auditLink.external_audit_event_id, `ext-audit-${outcome}`, "persisted external audit event id");
          assertEqual(outcomeResult.submissionAttempt.status, "succeeded", "attempt status");
        }
      });
    }

    await test("e2e: a timeout is recorded as a retryable failure, and retrying afterward succeeds without a duplicate response", async () => {
      const { client, promotionRequestId } = freshFixtures();

      server.setHandler((_req, _body, res) => {
        setTimeout(() => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody()));
        }, 2000);
      });
      const firstOutcome = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(firstOutcome.kind, "failed", "first outcome kind");
      if (firstOutcome.kind === "failed") {
        assertEqual(firstOutcome.errorCode, "timeout", "error code");
        assertEqual(firstOutcome.retryable, true, "timeout must be retryable");
      }

      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody()));
      });
      const secondOutcome = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(secondOutcome.kind, "succeeded", "second (retry) outcome kind");

      const allResponses = (await client.from("kfsa_evaluation_responses").select("*")).data as unknown[];
      const matchingResponses = allResponses.filter((r) => (r as { promotion_request_id?: string }).promotion_request_id === promotionRequestId);
      assertEqual(matchingResponses.length, 1, "exactly one evaluation response must exist after a failed attempt followed by a successful retry");

      const allAttempts = (await client.from("kfsa_submission_attempts").select("*")).data as unknown[];
      const matchingAttempts = allAttempts.filter((a) => (a as { promotion_request_id?: string }).promotion_request_id === promotionRequestId);
      assertEqual(matchingAttempts.length, 2, "two attempt rows must exist: the failed one and the succeeded retry");
    });

    await test("e2e: an unauthorized (401) response is recorded safely and marked non-retryable", async () => {
      const { client, promotionRequestId } = freshFixtures();
      server.setHandler((_req, _body, res) => {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "invalid credentials" }));
      });
      const outcome = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(outcome.kind, "failed", "outcome kind");
      if (outcome.kind === "failed") {
        assertEqual(outcome.errorCode, "unauthorized", "error code");
        assertEqual(outcome.retryable, false, "unauthorized must not be retryable");
        assert(!outcome.submissionAttempt.safe_error_message?.includes("test-kfsa-api-key"), "the stored safe_error_message must never contain the API key");
      }
    });

    await test("e2e: a malformed response is recorded safely and never creates an evaluation response", async () => {
      const { client, promotionRequestId } = freshFixtures();
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "COMPLETED" }));
      });
      const outcome = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(outcome.kind, "failed", "outcome kind");
      if (outcome.kind === "failed") {
        assertEqual(outcome.errorCode, "invalid_response", "error code");
      }
      const allResponses = (await client.from("kfsa_evaluation_responses").select("*")).data as unknown[];
      const matching = allResponses.filter((r) => (r as { promotion_request_id?: string }).promotion_request_id === promotionRequestId);
      assertEqual(matching.length, 0, "a malformed response must never be persisted as an evaluation response");
    });

    await test("e2e: a duplicate request against an already-succeeded Promotion Request returns the existing result without a second KFSA call", async () => {
      const { client, promotionRequestId } = freshFixtures();
      let callCount = 0;
      server.setHandler((_req, _body, res) => {
        callCount += 1;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody()));
      });
      const first = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(first.kind, "succeeded", "first outcome kind");
      assertEqual(callCount, 1, "the first submission must call KFSA exactly once");

      const second = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId });
      assertEqual(second.kind, "replay", "second outcome kind");
      assertEqual(callCount, 1, "a duplicate submission against an already-succeeded Promotion Request must not call KFSA again");
    });

    await test("e2e: correlation_id reuse across two different Promotion Requests is rejected before a second KFSA call", async () => {
      const { client, promotionRequestId: prId1, correlationId } = freshFixtures();
      let callCount = 0;
      server.setHandler((_req, _body, res) => {
        callCount += 1;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody()));
      });
      const first = await submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: prId1 });
      assertEqual(first.kind, "succeeded", "first outcome kind");

      // A second Promotion Request in the same fake org, reusing the same correlation_id.
      const prId2 = "pr-e2e-shared-correlation-2";
      const existing = (await client.from("promotion_requests").select("*")).data as Record<string, unknown>[];
      const template = existing.find((r) => r.id === prId1)!;
      const seeded = (await client.from("promotion_requests").select("*")).data as Record<string, unknown>[];
      client.seed("promotion_requests", [...seeded, { ...template, id: prId2, request_id: `req-${prId2}`, correlation_id: correlationId }]);

      const error = await assertThrows(() => submitPromotionRequestForEvaluation(asClient(client), { promotionRequestId: prId2 }), "should reject correlation_id reuse for a different Promotion Request");
      assert(error instanceof KfsaSubmissionBoundaryError, "error should be a KfsaSubmissionBoundaryError");
      assertEqual((error as KfsaSubmissionBoundaryError).reason, "correlation_conflict", "rejection reason");
      assertEqual(callCount, 1, "the rejected duplicate must never reach KFSA");
    });
  } finally {
    await server.close();
  }

  printSummaryAndExit("Part D: KFSA end-to-end tests (fake Supabase client + mock HTTP server)");
}

run().catch((error) => {
  console.error("Part D test runner crashed:", error);
  process.exit(1);
});
