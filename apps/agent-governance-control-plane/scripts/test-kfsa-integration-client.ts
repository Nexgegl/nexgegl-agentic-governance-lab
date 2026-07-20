/**
 * Part C of `npm run test:kfsa-integration`: exercises the *actual*
 * lib/kfsa/client.ts against an isolated, in-process mock HTTP server
 * standing in for the external KFSA Runtime Core -- no real network call,
 * no reimplementation of the client's logic. Per the integration spec,
 * this mock-server approach is reserved for exactly this external
 * boundary; RLS/tenant-isolation claims live in
 * scripts/test-kfsa-integration-db.ts against real Postgres instead.
 *
 * Covers:
 *   - successful submission for each ReviewOutcome value (PASS/FIX/FAIL/ESCALATE)
 *   - KILL/SCALE/ALERT rejected as invalid ReviewOutcome
 *   - formal_decision_created=true rejected
 *   - decision_code / official_decision (and the rest of the prohibited
 *     field list) rejected
 *   - malformed response (missing field, non-JSON body) rejected
 *   - timeout -> KfsaClientError("timeout")
 *   - unauthorized (401) -> KfsaClientError("unauthorized")
 *   - KFSA-reported correlation conflict (409) -> KfsaClientError("correlation_conflict")
 *   - a generic, unclassified 4xx such as 400 or 422 -> KfsaClientError("rejected"),
 *     non-retryable (422 is deliberately *not* assumed to mean
 *     tenant_mismatch -- that assumption was never verified against a
 *     live KFSA Runtime Core and has been removed; see lib/kfsa/client.ts)
 *   - 429 or any 5xx -> KfsaClientError("unavailable"), retryable
 *   - connection refused -> KfsaClientError("unavailable")
 *   - a schema-valid response whose total byte size exceeds
 *     KFSA_RUNTIME_MAX_RESPONSE_BYTES is rejected specifically because of
 *     the byte limit (proven by first confirming the same payload passes
 *     validateKfsaResponse() on its own, so the failure below cannot be
 *     attributed to any per-field length check)
 *   - the request carries the configured API key as a bearer token and the
 *     correlation_id as an idempotency header, and never logs the API key
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { submitPromotionRequestToKfsa, KfsaClientError } from "@/lib/kfsa/client";
import { validateKfsaResponse, type KfsaPromotionRequestV1 } from "@/lib/kfsa/contracts/promotion-request-v1";
import { startMockKfsaServer, validKfsaResponseBody, type MockKfsaServer } from "./kfsa-tests/mock-server";
import { test, assert, assertEqual, assertThrows, printSummaryAndExit } from "./governance-tests/harness";

const TEST_API_KEY = "test-kfsa-api-key-do-not-use-in-prod";

function baseRequest(overrides: Partial<KfsaPromotionRequestV1> = {}): KfsaPromotionRequestV1 {
  return {
    organization_id: "org-1",
    source_plugin_id: "ai-governance",
    source_skill_id: "ai-governance.ai-inventory-intake",
    source_run_id: "run-1",
    request_id: "pr-1",
    candidate_id: "candidate-1",
    signal_ids: [],
    evidence_ids: [],
    authority_context: { actor_role: "admin" },
    objective: "test objective",
    correlation_id: "corr-client-test",
    context_snapshot_id: "snap-1",
    plugin_version: "0.1.0",
    skill_version: "0.1.0",
    ...overrides,
  };
}

/**
 * A response that is fully schema-valid -- every field individually
 * respects its own bound (MAX_ERROR_FIELD_LENGTH=500, MAX_ERRORS_LENGTH=50,
 * MAX_BLOCKED_ACTION_ITEM_LENGTH=200, MAX_BLOCKED_ACTIONS_LENGTH=100,
 * MAX_IDENTIFIER_LENGTH=200, see lib/kfsa/contracts/promotion-request-v1.ts)
 * -- but whose total JSON size is large (tens of kilobytes) purely because
 * it uses the maximum allowed number of maximum-length array items. Used
 * to prove the response-body byte limit is rejecting on total size, not on
 * an unrelated per-field length check -- the prior version of this test
 * used a single 500-character audit_event_id, which is *also* rejected by
 * MAX_IDENTIFIER_LENGTH regardless of the byte limit, so it stayed green
 * even when the byte-limit implementation was completely removed.
 */
function buildValidButOversizedResponseBody(): Record<string, unknown> {
  const errors = Array.from({ length: 50 }, (_, i) => ({
    code: `error-code-${i}-`.padEnd(500, "c"),
    message: `error-message-${i}-`.padEnd(500, "m"),
  }));
  const blockedActions = Array.from({ length: 100 }, (_, i) => `blocked-action-${i}-`.padEnd(200, "b"));
  return validKfsaResponseBody({ errors, blocked_actions: blockedActions });
}

async function run() {
  const server: MockKfsaServer = await startMockKfsaServer();
  process.env.KFSA_RUNTIME_BASE_URL = server.url;
  process.env.KFSA_RUNTIME_API_KEY = TEST_API_KEY;
  process.env.KFSA_RUNTIME_TIMEOUT_MS = "500";

  try {
    for (const outcome of ["PASS", "FIX", "FAIL", "ESCALATE"] as const) {
      await test(`client: a valid ${outcome} response is accepted and passed through unchanged`, async () => {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody({ review_outcome: outcome })));
        });
        const result = await submitPromotionRequestToKfsa(baseRequest({ correlation_id: `corr-outcome-${outcome}` }));
        assertEqual(result.review_outcome, outcome, "review_outcome must pass through unchanged");
        assertEqual(result.formal_decision_created, false, "formal_decision_created must be false");
      });
    }

    for (const kfsaValue of ["KILL", "SCALE", "ALERT"]) {
      await test(`client: a response using KFSA vocabulary "${kfsaValue}" as review_outcome is rejected`, async () => {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody({ review_outcome: kfsaValue })));
        });
        const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: `corr-kfsa-${kfsaValue}` })), `should reject review_outcome "${kfsaValue}"`);
        assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
        assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
      });
    }

    await test("client: formal_decision_created=true is rejected", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody({ formal_decision_created: true })));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-formal-decision" })), "should reject formal_decision_created=true");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    for (const field of [
      "decision_code",
      "official_decision",
      "official_verdict",
      "kfsa_verdict",
      "kfsa_decision_id",
      "kfsa_decision_code",
      "execution_authorization",
      "production_approval",
      "decision_id",
      "decision",
      "verdict",
      "formal_verdict",
      "decision_number",
      "authorization",
      "approval",
    ]) {
      await test(`client: a response containing prohibited field "${field}" is rejected`, async () => {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody({ [field]: "anything" })));
        });
        const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: `corr-prohibited-${field}` })), `should reject prohibited field "${field}"`);
        assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
        assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
      });
    }

    await test("client: a response containing an entirely unrecognized top-level field is rejected (strict allowlist, not silently dropped)", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody({ some_future_field_nobody_anticipated: "x" })));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-unknown-field" })), "should reject an unrecognized field");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    await test("client: an empty-string identifier is rejected", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody({ promotion_request_id: "" })));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-empty-id" })), "should reject an empty identifier");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    await test("client: a non-parseable created_at timestamp is rejected", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody({ created_at: "not-a-timestamp" })));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-bad-timestamp" })), "should reject a malformed timestamp");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    await test("client: a malformed (missing-field) response is rejected as invalid_response", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "COMPLETED" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-malformed-missing-field" })), "should reject a response missing required fields");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    await test("client: a non-JSON response body is rejected as invalid_response", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("not json");
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-malformed-non-json" })), "should reject a non-JSON body");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
    });

    await test("client: a response slower than KFSA_RUNTIME_TIMEOUT_MS raises a timeout error", async () => {
      server.setHandler((_req, _body, res) => {
        setTimeout(() => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(validKfsaResponseBody()));
        }, 2000);
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-timeout" })), "should time out");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "timeout", "error code");
    });

    await test("client: HTTP 401 raises an unauthorized error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "invalid credentials" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-401" })), "should raise unauthorized");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "unauthorized", "error code");
    });

    await test("client: HTTP 409 raises a correlation_conflict error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(409, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "conflict" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-409" })), "should raise correlation_conflict");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "correlation_conflict", "error code");
    });

    await test("client: HTTP 422 raises a generic rejected error, not an assumed tenant_mismatch", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(422, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unprocessable" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-422" })), "should raise rejected");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "rejected", "error code");
    });

    await test("client: HTTP 400 raises a rejected error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "bad request" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-400" })), "should raise rejected");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "rejected", "error code");
    });

    await test("client: HTTP 404 raises a rejected error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "not found" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-404" })), "should raise rejected");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "rejected", "error code");
    });

    await test("client: HTTP 500 raises an unavailable (retryable) error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "internal error" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-500" })), "should raise unavailable");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "unavailable", "error code");
    });

    await test("client: HTTP 429 raises an unavailable (retryable) error", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(429, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "rate limited" }));
      });
      const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-429" })), "should raise unavailable");
      assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
      assertEqual((error as KfsaClientError).code, "unavailable", "error code");
    });

    await test("client: a schema-valid-but-oversized response is rejected specifically because of KFSA_RUNTIME_MAX_RESPONSE_BYTES, not any field-level bound", async () => {
      const oversizedButValidBody = buildValidButOversizedResponseBody();

      // Sanity check #1: this payload is genuinely schema-valid on its
      // own -- if this line throws, the test below would prove nothing
      // about the byte limit specifically.
      const validated = validateKfsaResponse(oversizedButValidBody);
      assertEqual(validated.errors.length, 50, "sanity: the oversized-but-valid payload must itself pass schema validation");

      // Sanity check #2: the payload's real JSON size actually exceeds
      // the limit configured below.
      const bodyByteLength = Buffer.byteLength(JSON.stringify(oversizedButValidBody), "utf8");
      const configuredMax = 40_000;
      assert(bodyByteLength > configuredMax, `sanity: the test payload (${bodyByteLength} bytes) must exceed the configured limit (${configuredMax} bytes) used below`);

      const originalMax = process.env.KFSA_RUNTIME_MAX_RESPONSE_BYTES;
      process.env.KFSA_RUNTIME_MAX_RESPONSE_BYTES = String(configuredMax); // well above any single field's own bound (max 500 chars), well below this payload's real size
      try {
        server.setHandler((_req, _body, res) => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(oversizedButValidBody));
        });
        const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-oversized-but-valid" })), "should reject a schema-valid but oversized response");
        assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
        assertEqual((error as KfsaClientError).code, "invalid_response", "error code");
      } finally {
        if (originalMax === undefined) delete process.env.KFSA_RUNTIME_MAX_RESPONSE_BYTES;
        else process.env.KFSA_RUNTIME_MAX_RESPONSE_BYTES = originalMax;
      }
    });

    await test("client: a connection that cannot be reached raises an unavailable error", async () => {
      const originalUrl = process.env.KFSA_RUNTIME_BASE_URL;
      process.env.KFSA_RUNTIME_BASE_URL = "http://127.0.0.1:1"; // reserved, nothing listens here
      try {
        const error = await assertThrows(() => submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-unavailable" })), "should raise unavailable");
        assert(error instanceof KfsaClientError, "error should be a KfsaClientError");
        assertEqual((error as KfsaClientError).code, "unavailable", "error code");
      } finally {
        process.env.KFSA_RUNTIME_BASE_URL = originalUrl;
      }
    });

    await test("client: the request carries the API key as a bearer token and correlation_id as the idempotency key", async () => {
      server.setHandler((_req, _body, res) => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(validKfsaResponseBody()));
      });
      await submitPromotionRequestToKfsa(baseRequest({ correlation_id: "corr-headers-test" }));
      const last = server.lastRequest();
      assert(last !== null, "server must have received a request");
      assertEqual(last!.headers["authorization"], `Bearer ${TEST_API_KEY}`, "authorization header");
      assertEqual(last!.headers["x-idempotency-key"], "corr-headers-test", "idempotency header must equal correlation_id");
    });

    await test("client: lib/kfsa/client.ts never logs the raw API key value", () => {
      const source = readFileSync(path.resolve(__dirname, "../lib/kfsa/client.ts"), "utf8");
      const consoleCalls = source.match(/console\.(log|info|warn|error)\([^)]*\)/g) ?? [];
      for (const call of consoleCalls) {
        assert(!/env\.apiKey|apiKey\b/.test(call), `a console.* call appears to log the API key: ${call.slice(0, 120)}`);
      }
    });
  } finally {
    await server.close();
  }

  printSummaryAndExit("Part C: external KFSA client tests (mock HTTP server)");
}

run().catch((error) => {
  console.error("Part C test runner crashed:", error);
  process.exit(1);
});
