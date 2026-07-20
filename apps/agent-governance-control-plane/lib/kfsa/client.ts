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

export interface KfsaRuntimeEnv {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

/** Throws KfsaConfigError (never returns undefined values) if required server-only env vars are missing. */
export function getKfsaRuntimeEnv(): KfsaRuntimeEnv {
  const baseUrl = process.env.KFSA_RUNTIME_BASE_URL;
  const apiKey = process.env.KFSA_RUNTIME_API_KEY;
  const timeoutMsRaw = process.env.KFSA_RUNTIME_TIMEOUT_MS;

  if (!baseUrl || !apiKey) {
    throw new KfsaConfigError(MISSING_CONFIG_MESSAGE);
  }

  const timeoutMs = timeoutMsRaw ? Number(timeoutMsRaw) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new KfsaConfigError(`KFSA_RUNTIME_TIMEOUT_MS must be a positive number if set; got "${timeoutMsRaw}".`);
  }

  return { baseUrl, apiKey, timeoutMs };
}

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
 * Calls POST {baseUrl}/v1/promotion-requests on the external KFSA Runtime
 * Core. Server-only -- authenticated server-to-server HTTP with a bounded
 * timeout, response-schema validation, and typed errors. Does not retry
 * and does not fall back to a mock; the caller (the Governance Gateway
 * route) owns retry/idempotency policy.
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

  if (response.status === 422) {
    console.error("[kfsa-client] tenant mismatch reported by KFSA", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("tenant_mismatch", "KFSA Runtime Core reports the request does not match the expected tenant.");
  }

  if (!response.ok) {
    console.error("[kfsa-client] rejected", { ...safeRequestLogFields(request), status: response.status });
    throw new KfsaClientError("rejected", `KFSA Runtime Core rejected the request (HTTP ${response.status}).`);
  }

  let rawBody: unknown;
  try {
    rawBody = await response.json();
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
