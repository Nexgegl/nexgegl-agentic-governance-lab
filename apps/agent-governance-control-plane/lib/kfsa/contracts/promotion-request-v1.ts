/**
 * Versioned server-side contract for POST /v1/promotion-requests against
 * the external KFSA Runtime Core. This is a wire-format contract, not a
 * database type -- it exists so the shape sent to (and received from) an
 * external system is validated independently of whatever
 * database.types.ts says about promotion_requests.
 *
 * Constitutional boundary (see docs/plugins/kfsa-integration-boundary.md):
 * ReviewOutcome (PASS/FIX/FAIL/ESCALATE) is a governance-review verdict
 * family, distinct from KFSA's own decision/action vocabulary
 * (KILL/FIX/SCALE/ALERT -- see
 * claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md).
 * ReviewOutcome.FIX is not KFSA FIX. Nothing in this contract maps one
 * family to the other, and ALERT is never referenced here because this
 * plugin boundary never touches KFSA's own vocabulary at all.
 */

export const PROMOTION_REQUEST_CONTRACT_VERSION = "v1" as const;

export const REVIEW_OUTCOMES = ["PASS", "FIX", "FAIL", "ESCALATE"] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

export const SUBMISSION_STATUSES = ["RECEIVED", "EVALUATING", "COMPLETED", "BLOCKED"] as const;
export type KfsaSubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * Field names this contract must never accept or expose, on either the
 * request or the response side. A response containing any of these is
 * rejected outright by validateKfsaResponse -- never persisted, never
 * displayed. These are exactly the fields prohibited elsewhere in the
 * plugin execution boundary (lib/plugins/execution-boundary.ts), applied
 * here to the external-system wire format too.
 */
export const PROHIBITED_RESPONSE_FIELDS = [
  "decision_code",
  "formal_decision",
  "official_decision",
  "official_verdict",
  "kfsa_verdict",
  "kfsa_decision_id",
  "kfsa_decision_code",
  "execution_authorization",
  "production_approval",
] as const;

/** KFSA's own decision/action vocabulary -- never a valid ReviewOutcome value. */
export const KFSA_ONLY_VOCABULARY = ["KILL", "SCALE", "ALERT"] as const;

export interface KfsaPromotionRequestV1 {
  organization_id: string;
  source_plugin_id: string;
  source_skill_id: string;
  source_run_id: string;
  request_id: string;
  candidate_id: string;
  signal_ids: string[];
  evidence_ids: string[];
  authority_context: Record<string, unknown>;
  objective: string;
  correlation_id: string;
  context_snapshot_id: string;
  plugin_version: string;
  skill_version: string;
}

export interface KfsaPromotionResponseError {
  code: string;
  message: string;
}

export interface KfsaPromotionResponseV1 {
  promotion_request_id: string;
  status: KfsaSubmissionStatus;
  review_outcome: ReviewOutcome;
  evidence_status: string;
  authority_status: string;
  escalation_required: boolean;
  blocked_actions: string[];
  audit_event_id: string;
  formal_decision_created: false;
  errors: KfsaPromotionResponseError[];
  created_at: string;
}

export class KfsaContractViolationError extends Error {
  constructor(
    public readonly code: "prohibited_field" | "invalid_review_outcome" | "malformed_response" | "formal_decision_created",
    message: string,
  ) {
    super(message);
    this.name = "KfsaContractViolationError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates a raw, untrusted response body against the v1 response
 * contract. Throws KfsaContractViolationError (never returns a partially
 * validated object) if:
 *   - the response is not a plain object with the required shape
 *   - review_outcome is anything other than PASS/FIX/FAIL/ESCALATE
 *     (including KILL/SCALE/ALERT -- KFSA's own vocabulary is never a
 *     valid ReviewOutcome value here)
 *   - formal_decision_created is not literally `false`
 *   - any prohibited field name is present anywhere in the top-level
 *     response object
 *
 * This is the single point every byte the external KFSA system returns
 * must pass through before any part of it is persisted or displayed.
 */
export function validateKfsaResponse(raw: unknown): KfsaPromotionResponseV1 {
  if (!isPlainObject(raw)) {
    throw new KfsaContractViolationError("malformed_response", "KFSA response is not a JSON object.");
  }

  for (const field of PROHIBITED_RESPONSE_FIELDS) {
    if (field in raw) {
      throw new KfsaContractViolationError("prohibited_field", `KFSA response contains prohibited field "${field}".`);
    }
  }

  const requiredStringFields = ["promotion_request_id", "status", "review_outcome", "evidence_status", "authority_status", "audit_event_id", "created_at"] as const;
  for (const field of requiredStringFields) {
    if (typeof raw[field] !== "string") {
      throw new KfsaContractViolationError("malformed_response", `KFSA response field "${field}" must be a string.`);
    }
  }

  if (!SUBMISSION_STATUSES.includes(raw.status as KfsaSubmissionStatus)) {
    throw new KfsaContractViolationError("malformed_response", `KFSA response has unrecognized status "${String(raw.status)}".`);
  }

  if ((KFSA_ONLY_VOCABULARY as readonly string[]).includes(raw.review_outcome as string)) {
    throw new KfsaContractViolationError(
      "invalid_review_outcome",
      `KFSA response used "${String(raw.review_outcome)}" as review_outcome -- KILL/SCALE/ALERT are KFSA's own decision vocabulary, never a valid ReviewOutcome value.`,
    );
  }
  if (!REVIEW_OUTCOMES.includes(raw.review_outcome as ReviewOutcome)) {
    throw new KfsaContractViolationError("invalid_review_outcome", `KFSA response has unrecognized review_outcome "${String(raw.review_outcome)}".`);
  }

  if (typeof raw.escalation_required !== "boolean") {
    throw new KfsaContractViolationError("malformed_response", `KFSA response field "escalation_required" must be a boolean.`);
  }

  if (!Array.isArray(raw.blocked_actions) || !raw.blocked_actions.every((v) => typeof v === "string")) {
    throw new KfsaContractViolationError("malformed_response", `KFSA response field "blocked_actions" must be a string array.`);
  }

  if (raw.formal_decision_created !== false) {
    throw new KfsaContractViolationError(
      "formal_decision_created",
      `KFSA response set formal_decision_created to "${String(raw.formal_decision_created)}" -- this plugin boundary never accepts a response that claims to have created a formal decision.`,
    );
  }

  if (!Array.isArray(raw.errors)) {
    throw new KfsaContractViolationError("malformed_response", `KFSA response field "errors" must be an array.`);
  }
  for (const err of raw.errors) {
    if (!isPlainObject(err) || typeof err.code !== "string" || typeof err.message !== "string") {
      throw new KfsaContractViolationError("malformed_response", `KFSA response field "errors" must contain { code, message } objects.`);
    }
  }

  return {
    promotion_request_id: raw.promotion_request_id as string,
    status: raw.status as KfsaSubmissionStatus,
    review_outcome: raw.review_outcome as ReviewOutcome,
    evidence_status: raw.evidence_status as string,
    authority_status: raw.authority_status as string,
    escalation_required: raw.escalation_required as boolean,
    blocked_actions: raw.blocked_actions as string[],
    audit_event_id: raw.audit_event_id as string,
    formal_decision_created: false,
    errors: raw.errors as KfsaPromotionResponseError[],
    created_at: raw.created_at as string,
  };
}

/** Builds the exact wire-format request body from already-verified, server-resolved fields. Never accepts client-authored values for any of these. */
export function buildKfsaRequestBody(input: KfsaPromotionRequestV1): KfsaPromotionRequestV1 {
  return { ...input };
}
