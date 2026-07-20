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
 * The only top-level fields this contract's response side will ever
 * accept. validateKfsaResponse rejects a response containing *any* other
 * top-level key outright, rather than silently dropping it during
 * reconstruction -- an unrecognized, decision-shaped field name (e.g. a
 * bare `decision_id` distinct from `kfsa_decision_id`) should make noise,
 * not disappear quietly. See PROHIBITED_RESPONSE_FIELDS below for the
 * names specific, friendlier error messages are given for.
 */
export const ALLOWED_RESPONSE_FIELDS = [
  "promotion_request_id",
  "status",
  "review_outcome",
  "evidence_status",
  "authority_status",
  "escalation_required",
  "blocked_actions",
  "audit_event_id",
  "formal_decision_created",
  "errors",
  "created_at",
] as const;

/**
 * Field names this contract must never accept or expose, on either the
 * request or the response side. A response containing any of these is
 * rejected outright by validateKfsaResponse -- never persisted, never
 * displayed. These are exactly the fields prohibited elsewhere in the
 * plugin execution boundary (lib/plugins/execution-boundary.ts), applied
 * here to the external-system wire format too, plus a few additional
 * decision-shaped names that are not otherwise part of
 * ALLOWED_RESPONSE_FIELDS (and would therefore already be rejected by the
 * allowlist check -- these are listed explicitly only so the resulting
 * error message names the specific concern rather than a generic
 * "unrecognized field").
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
  "decision_id",
  "decision",
  "verdict",
  "formal_verdict",
  "decision_number",
  "authorization",
  "approval",
] as const;

/** KFSA's own decision/action vocabulary -- never a valid ReviewOutcome value. */
export const KFSA_ONLY_VOCABULARY = ["KILL", "SCALE", "ALERT"] as const;

const MAX_IDENTIFIER_LENGTH = 200;
const MAX_ERRORS_LENGTH = 50;
const MAX_ERROR_FIELD_LENGTH = 500;
const MAX_BLOCKED_ACTIONS_LENGTH = 100;
const MAX_BLOCKED_ACTION_ITEM_LENGTH = 200;

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
    public readonly code: "prohibited_field" | "unknown_field" | "invalid_review_outcome" | "malformed_response" | "formal_decision_created",
    message: string,
  ) {
    super(message);
    this.name = "KfsaContractViolationError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Non-empty, typeof string, and no longer than maxLength. */
function isBoundedNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

/**
 * Validates a raw, untrusted response body against the v1 response
 * contract. Throws KfsaContractViolationError (never returns a partially
 * validated object) if:
 *   - the response is not a plain object with the required shape
 *   - the response contains any top-level field outside
 *     ALLOWED_RESPONSE_FIELDS (see PROHIBITED_RESPONSE_FIELDS for the
 *     subset given a specific, named error)
 *   - any required string identifier is missing, empty, not a string, or
 *     exceeds its bounded length
 *   - created_at is not a parseable timestamp
 *   - review_outcome is anything other than PASS/FIX/FAIL/ESCALATE
 *     (including KILL/SCALE/ALERT -- KFSA's own vocabulary is never a
 *     valid ReviewOutcome value here)
 *   - formal_decision_created is not literally `false`
 *   - errors/blocked_actions are not arrays of bounded-length strings/
 *     {code, message} objects, or exceed their maximum array length
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

  const allowed = new Set<string>(ALLOWED_RESPONSE_FIELDS);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) {
      throw new KfsaContractViolationError("unknown_field", `KFSA response contains an unrecognized field "${key}" -- only the fields in ALLOWED_RESPONSE_FIELDS are accepted.`);
    }
  }

  const requiredBoundedIdentifiers = ["promotion_request_id", "status", "review_outcome", "evidence_status", "authority_status", "audit_event_id"] as const;
  for (const field of requiredBoundedIdentifiers) {
    if (!isBoundedNonEmptyString(raw[field], MAX_IDENTIFIER_LENGTH)) {
      throw new KfsaContractViolationError("malformed_response", `KFSA response field "${field}" must be a non-empty string of at most ${MAX_IDENTIFIER_LENGTH} characters.`);
    }
  }

  if (typeof raw.created_at !== "string" || raw.created_at.length === 0 || Number.isNaN(Date.parse(raw.created_at))) {
    throw new KfsaContractViolationError("malformed_response", `KFSA response field "created_at" must be a non-empty, parseable timestamp.`);
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

  if (!Array.isArray(raw.blocked_actions) || raw.blocked_actions.length > MAX_BLOCKED_ACTIONS_LENGTH || !raw.blocked_actions.every((v) => typeof v === "string" && v.length <= MAX_BLOCKED_ACTION_ITEM_LENGTH)) {
    throw new KfsaContractViolationError(
      "malformed_response",
      `KFSA response field "blocked_actions" must be an array of at most ${MAX_BLOCKED_ACTIONS_LENGTH} strings, each at most ${MAX_BLOCKED_ACTION_ITEM_LENGTH} characters.`,
    );
  }

  if (raw.formal_decision_created !== false) {
    throw new KfsaContractViolationError(
      "formal_decision_created",
      `KFSA response set formal_decision_created to "${String(raw.formal_decision_created)}" -- this plugin boundary never accepts a response that claims to have created a formal decision.`,
    );
  }

  if (!Array.isArray(raw.errors) || raw.errors.length > MAX_ERRORS_LENGTH) {
    throw new KfsaContractViolationError("malformed_response", `KFSA response field "errors" must be an array of at most ${MAX_ERRORS_LENGTH} items.`);
  }
  for (const err of raw.errors) {
    if (!isPlainObject(err) || typeof err.code !== "string" || err.code.length > MAX_ERROR_FIELD_LENGTH || typeof err.message !== "string" || err.message.length > MAX_ERROR_FIELD_LENGTH) {
      throw new KfsaContractViolationError("malformed_response", `KFSA response field "errors" must contain { code, message } objects with strings no longer than ${MAX_ERROR_FIELD_LENGTH} characters.`);
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
