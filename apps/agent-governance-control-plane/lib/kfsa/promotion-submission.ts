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
  listSubmissionAttemptsForPromotionRequest,
  getEvaluationResponseByCorrelationId,
  type KfsaSubmissionAttemptRecord,
  type KfsaEvaluationResponseRecord,
  type KfsaExternalAuditLinkRecord,
} from "@/repositories/kfsa-integration-repository";
import {
  adminCreateSubmissionAttempt,
  adminMarkSubmissionAttemptFailed,
  adminMarkSubmissionAttemptSucceeded,
  adminCreateEvaluationResponse,
  adminCreateExternalAuditLink,
} from "@/repositories/kfsa-integration-admin-repository";
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
 * retry: the external system was unreachable, timed out, or sent something
 * the response validator rejected. Codes that mean "this will keep
 * failing until a human fixes something" (unauthorized credentials, a
 * generic client-error rejection, a tenant mismatch, or a correlation_id
 * conflict) are deliberately excluded -- see "Do not retry automatically"
 * in docs/plugins/kfsa-promotion-request-integration-v1.md. See
 * lib/kfsa/client.ts for the HTTP-status-to-code mapping this set is
 * paired with.
 */
const RETRYABLE_ERROR_CODES: ReadonlySet<KfsaClientErrorCode> = new Set(["unavailable", "timeout", "invalid_response"]);

export function isRetryableKfsaErrorCode(code: KfsaClientErrorCode): boolean {
  return RETRYABLE_ERROR_CODES.has(code);
}

const DEFAULT_STALE_AFTER_MS = 5 * 60_000; // 5 minutes

/**
 * How long an `in_progress` attempt is trusted to still be genuinely in
 * flight before the server-only repository is allowed to mark it stale
 * and let a new attempt be created. Server-controlled only -- no request
 * input ever influences this. See "Stale in-progress recovery" in
 * docs/plugins/kfsa-promotion-request-integration-v1.md.
 */
function getStaleAfterMs(): number {
  const raw = process.env.KFSA_SUBMISSION_STALE_AFTER_MS;
  const parsed = raw ? Number(raw) : DEFAULT_STALE_AFTER_MS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STALE_AFTER_MS;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

export type KfsaSubmissionOutcome =
  | { kind: "replay"; evaluationResponse: KfsaEvaluationResponseRecord; submissionAttempt: KfsaSubmissionAttemptRecord | null }
  | { kind: "succeeded"; evaluationResponse: KfsaEvaluationResponseRecord; submissionAttempt: KfsaSubmissionAttemptRecord; auditLink: KfsaExternalAuditLinkRecord }
  | { kind: "failed"; submissionAttempt: KfsaSubmissionAttemptRecord | null; errorCode: KfsaClientErrorCode; retryable: boolean }
  | { kind: "in_progress"; submissionAttempt: KfsaSubmissionAttemptRecord | null };

/**
 * The Governance Gateway's server-side flow for
 * POST /api/kfsa/promotion-requests. Takes two clients with deliberately
 * different privilege:
 *
 *   - tenantClient: the caller's own session-scoped client
 *     (createServerSupabaseClient()). Used for every ownership-
 *     verification read (steps 1-10 of
 *     docs/plugins/kfsa-promotion-request-integration-v1.md) -- RLS is
 *     what proves these reads are actually scoped to the caller's own
 *     organization.
 *   - adminClient: a service-role client (lib/supabase/admin.ts). Used
 *     only for the KFSA-integration writes themselves (steps 12-14),
 *     after every field being written has already been validated against
 *     the tenantClient's own RLS-scoped data. This split exists because
 *     the independent pre-PR review found that granting the tenant client
 *     INSERT access on these tables let an authenticated tenant fabricate
 *     their own "KFSA evaluation result" directly, bypassing this
 *     function, the server-only HTTP client, and contract validation
 *     entirely -- see 20260721100003_lock_down_kfsa_tenant_writes.sql.
 *
 * Never accepts any canonical field from the caller besides
 * promotionRequestId -- everything else is resolved here, from
 * already-persisted, RLS-scoped rows.
 */
export async function submitPromotionRequestForEvaluation(
  tenantClient: SupabaseClient<Database>,
  adminClient: SupabaseClient<Database>,
  input: { promotionRequestId: string },
): Promise<KfsaSubmissionOutcome> {
  const profile = await getCurrentProfile(tenantClient);
  if (!profile) rejectMissingOrganizationContext();

  const promotionRequest = await getPromotionRequestById(tenantClient, input.promotionRequestId);
  if (!promotionRequest) rejectPromotionRequestNotFound(input.promotionRequestId);
  // Defense in depth: RLS already scopes getPromotionRequestById to the
  // caller's own organization (see docs/plugins/plugin-security-boundary.md
  // "Auth is enforced twice"), but this makes the check explicit rather
  // than relying solely on the database layer.
  if (promotionRequest.organization_id !== profile.organization_id) rejectPromotionRequestNotFound(input.promotionRequestId);

  const installation = await getInstallationForPlugin(tenantClient, promotionRequest.source_plugin_id);
  if (!installation || installation.state !== "installed") rejectSourcePluginNotInstalled(promotionRequest.source_plugin_id);

  const skillRow = await getSkillDefinition(tenantClient, promotionRequest.source_skill_id);
  if (!skillRow || skillRow.plugin_id !== promotionRequest.source_plugin_id) rejectSourceSkillInvalid(promotionRequest.source_skill_id);
  const skillEnabled = await isSkillEnabledForInstallation(tenantClient, installation.id, skillRow.id);
  if (!skillEnabled) rejectSourceSkillInvalid(promotionRequest.source_skill_id);

  const run = await getRunById(tenantClient, promotionRequest.source_run_id);
  if (!run || run.status !== "completed") rejectSourceRunNotCompleted(promotionRequest.source_run_id);

  const snapshot = await getRunContextSnapshot(tenantClient, promotionRequest.context_snapshot_id);
  if (!snapshot || snapshot.organization_id !== profile.organization_id) rejectContextSnapshotMissing(promotionRequest.context_snapshot_id);

  const evidence = await listEvidenceForRun(tenantClient, promotionRequest.source_run_id);
  const ownedEvidenceIds = new Set(evidence.map((e) => e.id));
  if (promotionRequest.evidence_ids.some((id) => !ownedEvidenceIds.has(id))) rejectEvidenceMismatch();

  const organizationId = promotionRequest.organization_id;
  const correlationId = promotionRequest.correlation_id;
  const auditContext = {
    actor: profile.id,
    plugin_id: promotionRequest.source_plugin_id,
    skill_id: promotionRequest.source_skill_id,
    plugin_run_id: promotionRequest.source_run_id,
  } as const;

  const existingByCorrelation = await getEvaluationResponseByCorrelationId(tenantClient, correlationId);
  if (existingByCorrelation) {
    if (existingByCorrelation.promotion_request_id === promotionRequest.id) {
      return { kind: "replay", evaluationResponse: existingByCorrelation, submissionAttempt: null };
    }
    await createAuditEvent(tenantClient, {
      ...auditContext,
      event_type: "kfsa.correlation_conflict_rejected",
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, conflicting_promotion_request_id: existingByCorrelation.promotion_request_id },
    });
    rejectCorrelationConflict(correlationId);
  }

  // Stale in-progress recovery (server-controlled only -- see
  // getStaleAfterMs()). A fresh in_progress attempt is protected from a
  // duplicate submission by returning its current state rather than
  // starting a second one; a stale one is marked failed so a genuinely
  // new attempt can proceed.
  const priorAttempts = await listSubmissionAttemptsForPromotionRequest(tenantClient, promotionRequest.id);
  const latestAttempt = priorAttempts[0] ?? null;
  if (latestAttempt && latestAttempt.status === "in_progress") {
    const ageMs = Date.now() - new Date(latestAttempt.submitted_at).getTime();
    if (ageMs < getStaleAfterMs()) {
      return { kind: "in_progress", submissionAttempt: latestAttempt };
    }
    await adminMarkSubmissionAttemptFailed(adminClient, latestAttempt.id, "unavailable", "Marked stale after exceeding KFSA_SUBMISSION_STALE_AFTER_MS without reaching a terminal state.");
  }

  const attemptNumber = priorAttempts.length + 1;

  await createAuditEvent(tenantClient, {
    ...auditContext,
    event_type: "kfsa.submission_requested",
    details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, attempt_number: attemptNumber },
  });
  if (attemptNumber > 1) {
    await createAuditEvent(tenantClient, {
      ...auditContext,
      event_type: "kfsa.submission_retried",
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, attempt_number: attemptNumber },
    });
  }

  let attempt: KfsaSubmissionAttemptRecord;
  try {
    attempt = await adminCreateSubmissionAttempt(adminClient, {
      organizationId,
      promotionRequestId: promotionRequest.id,
      correlationId,
      attemptNumber,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Lost a concurrent race to create this exact attempt_number --
      // another request (e.g. a second browser tab) already owns it.
      // Recover the current state rather than throwing: never an
      // unhandled error, never a duplicate attempt/response, and never an
      // unrelated Promotion Request's result.
      return await recoverFromLostAttemptRace(tenantClient, promotionRequest.id, promotionRequest.organization_id, correlationId, attemptNumber);
    }
    throw error;
  }

  await createAuditEvent(tenantClient, {
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

    const failedAttempt = await adminMarkSubmissionAttemptFailed(adminClient, attempt.id, errorCode, safeMessage);

    const eventType = errorCode === "tenant_mismatch" ? "kfsa.tenant_mismatch_rejected" : errorCode === "invalid_response" ? "kfsa.invalid_response_rejected" : errorCode === "correlation_conflict" ? "kfsa.correlation_conflict_rejected" : "kfsa.submission_failed";
    await createAuditEvent(tenantClient, {
      ...auditContext,
      event_type: eventType,
      details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, submission_attempt_id: attempt.id, error_code: errorCode },
    });

    return { kind: "failed", submissionAttempt: failedAttempt, errorCode, retryable: RETRYABLE_ERROR_CODES.has(errorCode) };
  }

  const responseHash = createHash("sha256").update(JSON.stringify(validated)).digest("hex");

  let evaluationResponse: KfsaEvaluationResponseRecord;
  try {
    evaluationResponse = await adminCreateEvaluationResponse(adminClient, {
      organizationId,
      promotionRequestId: promotionRequest.id,
      submissionAttemptId: attempt.id,
      correlationId,
      externalPromotionRequestId: validated.promotion_request_id,
      reviewOutcome: validated.review_outcome,
      evidenceStatus: validated.evidence_status,
      authorityStatus: validated.authority_status,
      escalationRequired: validated.escalation_required,
      blockedActions: validated.blocked_actions,
      responseHash,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await getEvaluationResponseByCorrelationId(tenantClient, correlationId);
      if (existing && existing.promotion_request_id === promotionRequest.id) {
        const succeededAttempt = await adminMarkSubmissionAttemptSucceeded(adminClient, attempt.id);
        return { kind: "replay", evaluationResponse: existing, submissionAttempt: succeededAttempt };
      }
      const failedAttempt = await adminMarkSubmissionAttemptFailed(adminClient, attempt.id, "correlation_conflict", "correlation_id already has a persisted evaluation for a different Promotion Request.");
      await createAuditEvent(tenantClient, {
        ...auditContext,
        event_type: "kfsa.correlation_conflict_rejected",
        details: { promotion_request_id: promotionRequest.id, correlation_id: correlationId, submission_attempt_id: attempt.id },
      });
      return { kind: "failed", submissionAttempt: failedAttempt, errorCode: "correlation_conflict", retryable: false };
    }
    throw error;
  }

  const submissionAttempt = await adminMarkSubmissionAttemptSucceeded(adminClient, attempt.id);
  const auditLink = await adminCreateExternalAuditLink(adminClient, {
    organizationId,
    promotionRequestId: promotionRequest.id,
    externalAuditEventId: validated.audit_event_id,
    submissionAttemptId: attempt.id,
  });

  // Audit consistency policy (see docs/plugins/kfsa-promotion-request-integration-v1.md
  // "Audit consistency"): the evaluation response above is already
  // durably persisted and is authoritative for the submission result by
  // itself. This final audit-trail write is a secondary notification, not
  // part of that authority -- if it fails, the operation must still be
  // reported to the caller as succeeded (a page refresh would show the
  // correct persisted state regardless), so its failure is caught and
  // logged as a warning rather than allowed to turn an already-successful
  // submission into an apparent failure.
  try {
    await createAuditEvent(tenantClient, {
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
  } catch (auditError) {
    console.error("[kfsa-promotion-submission] audit warning: failed to record kfsa.submission_succeeded after a successful, already-persisted evaluation", {
      promotion_request_id: promotionRequest.id,
      correlation_id: correlationId,
      submission_attempt_id: attempt.id,
      error: auditError instanceof Error ? auditError.message : String(auditError),
    });
  }

  return { kind: "succeeded", evaluationResponse, submissionAttempt, auditLink };
}

/**
 * Recovers gracefully after losing the race to create a given
 * attempt_number (a real unique-constraint violation on
 * kfsa_submission_attempts). Never throws for this case -- always
 * returns one of the three outcomes a losing request is allowed to see:
 * the winner's already-successful result (replay), the winner's already-
 * failed result (failed), or the winner's still in_progress state
 * (in_progress).
 */
async function recoverFromLostAttemptRace(
  tenantClient: SupabaseClient<Database>,
  promotionRequestId: string,
  organizationId: string,
  correlationId: string,
  attemptNumber: number,
): Promise<KfsaSubmissionOutcome> {
  const existingResponse = await getEvaluationResponseByCorrelationId(tenantClient, correlationId);
  if (existingResponse && existingResponse.promotion_request_id === promotionRequestId) {
    return { kind: "replay", evaluationResponse: existingResponse, submissionAttempt: null };
  }

  const currentAttempts = await listSubmissionAttemptsForPromotionRequest(tenantClient, promotionRequestId);
  const winningAttempt = currentAttempts.find((a) => a.attempt_number === attemptNumber) ?? currentAttempts[0] ?? null;

  if (winningAttempt?.status === "failed") {
    const errorCode = (winningAttempt.error_code as KfsaClientErrorCode | null) ?? "unavailable";
    return { kind: "failed", submissionAttempt: winningAttempt, errorCode, retryable: isRetryableKfsaErrorCode(errorCode) };
  }

  // Still in_progress (or, in a very narrow window, already succeeded but
  // the response row hasn't been read back yet) -- report in_progress
  // either way; a subsequent request will see the response once it lands.
  return { kind: "in_progress", submissionAttempt: winningAttempt };
}
