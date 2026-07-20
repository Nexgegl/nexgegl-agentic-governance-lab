import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentProfile } from "@/repositories/profiles-repository";
import { getInstallationForPlugin } from "@/repositories/plugins-repository";
import { getSkillDefinition } from "@/repositories/skill-definitions-repository";
import { isSkillEnabledForInstallation } from "@/repositories/plugin-skill-permissions-repository";
import { getRunById, getRunContextSnapshot, listEvidenceForRun, createAuditEvent } from "@/repositories/plugin-runs-repository";
import { getPromotionRequestById } from "@/repositories/promotion-requests-repository";
import {
  createSubmissionAttempt,
  markSubmissionAttemptFailed,
  markSubmissionAttemptSucceeded,
  listSubmissionAttemptsForPromotionRequest,
  createEvaluationResponse,
  getEvaluationResponseByCorrelationId,
  createExternalAuditLink,
  type KfsaSubmissionAttemptRecord,
  type KfsaEvaluationResponseRecord,
  type KfsaExternalAuditLinkRecord,
} from "@/repositories/kfsa-integration-repository";
import { rejectMissingOrganizationContext } from "@/lib/plugins/errors";
import {
  rejectPromotionRequestNotFound,
  rejectSourcePluginNotInstalled,
  rejectSourceSkillInvalid,
  rejectSourceRunNotCompleted,
  rejectContextSnapshotMissing,
  rejectEvidenceMismatch,
  rejectCorrelationConflict,
} from "@/lib/kfsa/errors";
import { submitPromotionRequestToKfsa, KfsaClientError, type KfsaClientErrorCode } from "@/lib/kfsa/client";
import type { KfsaPromotionRequestV1 } from "@/lib/kfsa/contracts/promotion-request-v1";

/**
 * Error codes that represent a transient condition worth letting the user
 * retry: the external system was unreachable, timed out, sent something
 * the response validator rejected, or returned a generic non-2xx. Codes
 * that mean "this will keep failing until a human fixes something"
 * (unauthorized credentials, a tenant mismatch, or a correlation_id KFSA
 * itself says conflicts) are deliberately excluded -- see "Do not retry
 * automatically" in docs/plugins/kfsa-promotion-request-integration-v1.md.
 */
const RETRYABLE_ERROR_CODES: ReadonlySet<KfsaClientErrorCode> = new Set(["unavailable", "timeout", "invalid_response", "rejected"]);

export function isRetryableKfsaErrorCode(code: KfsaClientErrorCode): boolean {
  return RETRYABLE_ERROR_CODES.has(code);
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

export type KfsaSubmissionOutcome =
  | { kind: "replay"; evaluationResponse: KfsaEvaluationResponseRecord; submissionAttempt: KfsaSubmissionAttemptRecord | null }
  | { kind: "succeeded"; evaluationResponse: KfsaEvaluationResponseRecord; submissionAttempt: KfsaSubmissionAttemptRecord; auditLink: KfsaExternalAuditLinkRecord }
  | { kind: "failed"; submissionAttempt: KfsaSubmissionAttemptRecord; errorCode: KfsaClientErrorCode; retryable: boolean };

/**
 * The Governance Gateway's server-side flow for
 * POST /api/kfsa/promotion-requests. Verifies ownership of every field the
 * external request will carry (steps 1-10 of
 * docs/plugins/kfsa-promotion-request-integration-v1.md), then calls the
 * server-only KFSA client (step 11), and persists the attempt/response/
 * audit-link (steps 12-14). Never accepts any canonical field from the
 * caller besides promotionRequestId -- everything else is resolved here,
 * from already-persisted, RLS-scoped rows.
 */
export async function submitPromotionRequestForEvaluation(
  client: SupabaseClient<Database>,
  input: { promotionRequestId: string },
): Promise<KfsaSubmissionOutcome> {
  const profile = await getCurrentProfile(client);
  if (!profile) rejectMissingOrganizationContext();

  const promotionRequest = await getPromotionRequestById(client, input.promotionRequestId);
  if (!promotionRequest) rejectPromotionRequestNotFound(input.promotionRequestId);
  // Defense in depth: RLS already scopes getPromotionRequestById to the
  // caller's own organization (see docs/plugins/plugin-security-boundary.md
  // "Auth is enforced twice"), but this makes the check explicit rather
  // than relying solely on the database layer.
  if (promotionRequest.organization_id !== profile.organization_id) rejectPromotionRequestNotFound(input.promotionRequestId);

  const installation = await getInstallationForPlugin(client, promotionRequest.source_plugin_id);
  if (!installation || installation.state !== "installed") rejectSourcePluginNotInstalled(promotionRequest.source_plugin_id);

  const skillRow = await getSkillDefinition(client, promotionRequest.source_skill_id);
  if (!skillRow || skillRow.plugin_id !== promotionRequest.source_plugin_id) rejectSourceSkillInvalid(promotionRequest.source_skill_id);
  const skillEnabled = await isSkillEnabledForInstallation(client, installation.id, skillRow.id);
  if (!skillEnabled) rejectSourceSkillInvalid(promotionRequest.source_skill_id);

  const run = await getRunById(client, promotionRequest.source_run_id);
  if (!run || run.status !== "completed") rejectSourceRunNotCompleted(promotionRequest.source_run_id);

  const snapshot = await getRunContextSnapshot(client, promotionRequest.context_snapshot_id);
  if (!snapshot || snapshot.organization_id !== profile.organization_id) rejectContextSnapshotMissing(promotionRequest.context_snapshot_id);

  const evidence = await listEvidenceForRun(client, promotionRequest.source_run_id);
  const ownedEvidenceIds = new Set(evidence.map((e) => e.id));
  if (promotionRequest.evidence_ids.some((id) => !ownedEvidenceIds.has(id))) rejectEvidenceMismatch();

  const correlationId = promotionRequest.correlation_id;
  const auditContext = {
    actor: profile.id,
    plugin_id: promotionRequest.source_plugin_id,
    skill_id: promotionRequest.source_skill_id,
    plugin_run_id: promotionRequest.source_run_id,
  } as const;

  const existingByCorrelation = await getEvaluationResponseByCorrelationId(client, correlationId);
  if (existingByCorrelation) {
    if (existingByCorrelation.promotion_request_id === promotionRequest.id) {
      return { kind: "replay", evaluationResponse: existingByCorrelation, submissionAttempt: null };
    }
    await createAuditEvent(client, {
      ...auditContext,
      event_type: "kfsa.correlation_conflict_rejected",
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, conflicting_promotion_request_id: existingByCorrelation.promotion_request_id },
    });
    rejectCorrelationConflict(correlationId);
  }

  const priorAttempts = await listSubmissionAttemptsForPromotionRequest(client, promotionRequest.id);
  const attemptNumber = priorAttempts.length + 1;

  await createAuditEvent(client, {
    ...auditContext,
    event_type: "kfsa.submission_requested",
    details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, attempt_number: attemptNumber },
  });
  if (attemptNumber > 1) {
    await createAuditEvent(client, {
      ...auditContext,
      event_type: "kfsa.submission_retried",
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, attempt_number: attemptNumber },
    });
  }

  let attempt: KfsaSubmissionAttemptRecord;
  try {
    attempt = await createSubmissionAttempt(client, {
      promotion_request_id: promotionRequest.id,
      correlation_id: correlationId,
      attempt_number: attemptNumber,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Lost a concurrent race to create this attempt_number; the other
      // request owns this attempt. Report as a retryable failure rather
      // than a 500 -- the caller can simply try again.
      throw new KfsaClientError("unavailable", "A concurrent submission attempt is already in progress for this Promotion Request.", error);
    }
    throw error;
  }

  await createAuditEvent(client, {
    ...auditContext,
    event_type: "kfsa.submission_started",
    details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, submission_attempt_id: attempt.id },
  });

  const kfsaRequest: KfsaPromotionRequestV1 = {
    organization_id: promotionRequest.organization_id,
    source_plugin_id: promotionRequest.source_plugin_id,
    source_skill_id: promotionRequest.source_skill_id,
    source_run_id: promotionRequest.source_run_id,
    request_id: promotionRequest.request_id,
    candidate_id: promotionRequest.candidate_id,
    signal_ids: promotionRequest.signal_ids,
    evidence_ids: promotionRequest.evidence_ids,
    authority_context: promotionRequest.authority_context,
    objective: promotionRequest.objective,
    correlation_id: correlationId,
    context_snapshot_id: promotionRequest.context_snapshot_id,
    plugin_version: promotionRequest.plugin_version,
    skill_version: promotionRequest.skill_version,
  };

  let validated;
  try {
    validated = await submitPromotionRequestToKfsa(kfsaRequest);
  } catch (error) {
    const errorCode: KfsaClientErrorCode = error instanceof KfsaClientError ? error.code : "unavailable";
    const safeMessage = (error instanceof Error ? error.message : "Unknown KFSA client error.").slice(0, 500);

    const failedAttempt = await markSubmissionAttemptFailed(client, attempt.id, errorCode, safeMessage);

    const eventType = errorCode === "tenant_mismatch" ? "kfsa.tenant_mismatch_rejected" : errorCode === "invalid_response" ? "kfsa.invalid_response_rejected" : errorCode === "correlation_conflict" ? "kfsa.correlation_conflict_rejected" : "kfsa.submission_failed";
    await createAuditEvent(client, {
      ...auditContext,
      event_type: eventType,
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, submission_attempt_id: attempt.id, error_code: errorCode },
    });

    return { kind: "failed", submissionAttempt: failedAttempt, errorCode, retryable: RETRYABLE_ERROR_CODES.has(errorCode) };
  }

  const responseHash = createHash("sha256").update(JSON.stringify(validated)).digest("hex");

  let evaluationResponse: KfsaEvaluationResponseRecord;
  try {
    evaluationResponse = await createEvaluationResponse(client, {
      promotion_request_id: promotionRequest.id,
      submission_attempt_id: attempt.id,
      correlation_id: correlationId,
      external_promotion_request_id: validated.promotion_request_id,
      review_outcome: validated.review_outcome,
      evidence_status: validated.evidence_status,
      authority_status: validated.authority_status,
      escalation_required: validated.escalation_required,
      blocked_actions: validated.blocked_actions,
      formal_decision_created: false,
      response_hash: responseHash,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await getEvaluationResponseByCorrelationId(client, correlationId);
      if (existing && existing.promotion_request_id === promotionRequest.id) {
        const succeededAttempt = await markSubmissionAttemptSucceeded(client, attempt.id);
        return { kind: "replay", evaluationResponse: existing, submissionAttempt: succeededAttempt };
      }
      const failedAttempt = await markSubmissionAttemptFailed(client, attempt.id, "correlation_conflict", "correlation_id already has a persisted evaluation for a different Promotion Request.");
      await createAuditEvent(client, {
        ...auditContext,
        event_type: "kfsa.correlation_conflict_rejected",
        details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, submission_attempt_id: attempt.id },
      });
      return { kind: "failed", submissionAttempt: failedAttempt, errorCode: "correlation_conflict", retryable: false };
    }
    throw error;
  }

  const submissionAttempt = await markSubmissionAttemptSucceeded(client, attempt.id);
  const auditLink = await createExternalAuditLink(client, {
    promotion_request_id: promotionRequest.id,
    external_audit_event_id: validated.audit_event_id,
    submission_attempt_id: attempt.id,
  });

  await createAuditEvent(client, {
    ...auditContext,
    event_type: "kfsa.submission_succeeded",
    details: {
      promotion_request_id: promotionRequest.id,
      correlation_id: correlationId,
      submission_attempt_id: attempt.id,
      review_outcome: validated.review_outcome,
      external_audit_event_id: validated.audit_event_id,
    },
  });

  return { kind: "succeeded", evaluationResponse, submissionAttempt, auditLink };
}
