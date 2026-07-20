import "server-only";
import {
  buildKfsaRequestBody,
  KfsaContractViolationError,
  PROMOTION_REQUEST_CONTRACT_VERSION,
  validateKfsaResponse,
  type KfsaPromotionRequestV1,
  type KfsaPromotionResponseV1,
} from "@/lib/kfsa/contracts/promotion-request-v1";

/**
 * Server-only. Never import this module from a client component -- it
 * reads KFSA_RUNTIME_API_KEY, which must never reach the browser bundle
 * (see docs/plugins/plugin-security-boundary.md and npm run validate:plugins).
 */

export class KfsaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KfsaConfigError";
  }
}

const MISSING_CONFIG_MESSAGE =
  "KFSA Runtime Core is not configured: KFSA_RUNTIME_BASE_URL and KFSA_RUNTIME_API_KEY must be set as server-only environment variables (never NEXT_PUBLIC_-prefixed). Copy .env.local.example, fill in your KFSA Runtime Core values, then restart the server.";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000; // 1 MB

export interface KfsaRuntimeEnv {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxResponseBytes: number;
}

/** Throws KfsaConfigError (never returns undefined values) if required server-only env vars are missing. */
export function getKfsaRuntimeEnv(): KfsaRuntimeEnv {
  const baseUrl = process.env.KFSA_RUNTIME_BASE_URL;
  const apiKey = process.env.KFSA_RUNTIME_API_KEY;
  const timeoutMsRaw = process.env.KFSA_RUNTIME_TIMEOUT_MS;
  const maxResponseBytesRaw = process.env.KFSA_RUNTIME_MAX_RESPONSE_BYTES;

  if (!baseUrl || !apiKey) {
    throw new KfsaConfigError(MISSING_CONFIG_MESSAGE);
  }

  const timeoutMs = timeoutMsRaw ? Number(timeoutMsRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new KfsaConfigError(`KFSA_RUNTIME_TIMEOUT_MS must be a positive number if set; got "${timeoutMsRaw}".`);
  }

  const maxResponseBytes = maxResponseBytesRaw ? Number(maxResponseBytesRaw) : DEFAULT_MAX_RESPONSE_BYTES;
  if (!Number.isFinite(maxResponseBytes) || maxResponseBytes <= 0) {
    throw new KfsaConfigError(`KFSA_RUNTIME_MAX_RESPONSE_BYTES must be a positive number if set; got "${maxResponseBytesRaw}".`);
  }

  return { baseUrl, apiKey, timeoutMs, maxResponseBytes };
}

/**
 * unavailable/timeout/invalid_response are the only codes
 * lib/kfsa/promotion-submission.ts treats as retryable. The HTTP-status
 * mapping below is this integration's best-effort guess, never confirmed
 * against a live KFSA Runtime Core -- see "Known limitations" in
 * docs/plugins/kfsa-promotion-request-integration-v1.md. In particular,
 * a bare 422 used to be assumed to mean tenant_mismatch; that assumption
 * had no evidence behind it and has been removed -- 422 now falls into
 * the same generic, non-retryable `rejected` bucket as other unclassified
 * 4xx responses (they typically mean the request itself was malformed,
 * which retrying will never fix without a code change).
 */
export type KfsaClientErrorCode = "unavailable" | "timeout" | "unauthorized" | "invalid_response" | "rejected" | "tenant_mismatch" | "correlation_conflict";

export class KfsaClientError extends Error {
  constructor(
    public readonly code: KfsaClientErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "KfsaClientError";
  }
}

/** Safe-to-log subset of a request: identifiers and metadata only, never authority_context or evidence content, never the API key. */
function safeRequestLogFields(request: KfsaPromotionRequestV1) {
  return {
    organization_id: request.organization_id,
    request_id: request.request_id,
    correlation_id: request.correlation_id,
    source_plugin_id: request.source_plugin_id,
    source_skill_id: request.source_skill_id,
    source_run_id: request.source_run_id,
  };
}

/**
 * Reads the response body bounded by maxBytes, rejecting oversized
 * responses as invalid_response *before* attempting to JSON-parse them --
 * a misbehaving or compromised endpoint should not be able to exhaust
 * server memory just because content-length was omitted or lied about.
 * Uses Content-Length as a fast rejection when present, and otherwise
 * streams the body, counting bytes as they arrive.
 */
async function readBoundedResponseText(response: Response, maxBytes: number): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new KfsaClientError("invalid_response", `KFSA response declared content-length ${contentLength}, exceeding the configured maximum of ${maxBytes} bytes.`);
  }

  if (!response.body) {
    const text = await response.text();
    if (text.length > maxBytes) {
      throw new KfsaClientError("invalid_response", `KFSA response body exceeded the configured maximum of ${maxBytes} bytes.`);
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new KfsaClientError("invalid_response", `KFSA response body exceeded the configured maximum of ${maxBytes} bytes while streaming.`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

/**
 * Calls POST {baseUrl}/v1/promotion-requests on the external KFSA Runtime
 * Core. Server-only -- authenticated server-to-server HTTP with a bounded
 * timeout, a bounded response size, response-schema validation, and typed
 * errors. Does not retry and does not fall back to a mock; the caller
 * (the Governance Gateway route) owns retry/idempotency policy.
 */
export async function submitPromotionRequestToKfsa(request: KfsaPromotionRequestV1): Promise<KfsaPromotionResponseV1> {
  const env = getKfsaRuntimeEnv();
  const body = buildKfsaRequestBody(request);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.timeoutMs);

  let response: Response;
  try {
    response = await fetch(new URL("/v1/promotion-requests", env.baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.apiKey}`,
        "x-kfsa-api-version": PROMOTION_REQUEST_CONTRACT_VERSION,
        "x-idempotency-key": request.correlation_id,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[kfsa-client] request timed out", { ...safeRequestLogFields(request), timeoutMs: env.timeoutMs });
      throw new KfsaClientError("timeout", `KFSA Runtime Core did not respond within ${env.timeoutMs}ms.`, error);
    }
    console.error("[kfsa-client] request failed", { ...safeRequestLogFields(request), error: error instanceof Error ? error.message : String(error) });
    throw new KfsaClientError("unavailable", "KFSA Runtime Core is unreachable.", error);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    console.error("[kfsa-client] unauthorized", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("unauthorized", `KFSA Runtime Core rejected credentials (HTTP ${response.status}).`);
  }

  if (response.status === 409) {
    console.error("[kfsa-client] correlation conflict", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("correlation_conflict", "KFSA Runtime Core reports a correlation_id conflict for this request.");
  }

  if (response.status === 429 || response.status >= 500) {
    console.error("[kfsa-client] unavailable (rate-limited or server error)", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("unavailable", `KFSA Runtime Core is temporarily unavailable (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    // Any other non-2xx (400, 404, 405, 422, ...): a generic, non-retryable
    // rejection. See the KfsaClientErrorCode doc comment above for why 422
    // is no longer assumed to mean tenant_mismatch.
    console.error("[kfsa-client] rejected", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("rejected", `KFSA Runtime Core rejected the request (HTTP ${response.status}).`);
  }

  let rawText: string;
  try {
    rawText = await readBoundedResponseText(response, env.maxResponseBytes);
  } catch (error) {
    if (error instanceof KfsaClientError) throw error;
    console.error("[kfsa-client] failed to read response body", { ...safeRequestLogFields(request) });
    throw new KfsaClientError("invalid_response", "KFSA Runtime Core response body could not be read.", error);
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
  } catch (error) {
    console.error("[kfsa-client] response was not valid JSON", { ...safeRequestLogFields(request) });
    throw new KfsaClientError("invalid_response", "KFSA Runtime Core response was not valid JSON.", error);
  }

  try {
    const validated = validateKfsaResponse(rawBody);
    console.info("[kfsa-client] submission evaluated", {
      ...safeRequestLogFields(request),
      promotion_request_id: validated.promotion_request_id,
      status: validated.status,
      review_outcome: validated.review_outcome,
    });
    return validated;
  } catch (error) {
    if (error instanceof KfsaContractViolationError) {
      console.error("[kfsa-client] response failed contract validation", { ...safeRequestLogFields(request), violationCode: error.code });
      throw new KfsaClientError("invalid_response", error.message, error);
    }
    throw error;
  }
}
