import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { KfsaSubmissionAttemptRecord, KfsaEvaluationResponseRecord, KfsaExternalAuditLinkRecord } from "./kfsa-integration-repository";

/**
 * Server-only. Every function here takes a service-role client
 * (lib/supabase/admin.ts's createSupabaseAdminClient()) that bypasses RLS
 * entirely -- so every function here takes its fields as explicit, named
 * parameters rather than a generic Insert-shaped object, and never spreads
 * a caller-supplied object into the write. The caller
 * (lib/kfsa/promotion-submission.ts) is responsible for having already
 * validated organization_id, promotion_request_id, and every other field
 * against the tenant-scoped client's own data *before* calling any of
 * these -- these functions do not re-derive or re-check ownership
 * themselves, and must never be called with a browser-supplied value for
 * any parameter.
 *
 * See docs/plugins/kfsa-promotion-request-integration-v1.md
 * "Server-only write architecture" for why this split exists (the
 * independent pre-PR review found that the session-scoped client's RLS
 * INSERT policies let an authenticated tenant fabricate their own "KFSA
 * evaluation result" directly, bypassing the server-only HTTP client and
 * contract validation entirely).
 */

export async function adminCreateSubmissionAttempt(
  adminClient: SupabaseClient<Database>,
  params: { organizationId: string; promotionRequestId: string; correlationId: string; attemptNumber: number },
): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await adminClient
    .from("kfsa_submission_attempts")
    .insert({
      organization_id: params.organizationId,
      promotion_request_id: params.promotionRequestId,
      correlation_id: params.correlationId,
      attempt_number: params.attemptNumber,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminMarkSubmissionAttemptSucceeded(adminClient: SupabaseClient<Database>, attemptId: string): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await adminClient
    .from("kfsa_submission_attempts")
    .update({ status: "succeeded", completed_at: new Date().toISOString() })
    .eq("id", attemptId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminMarkSubmissionAttemptFailed(
  adminClient: SupabaseClient<Database>,
  attemptId: string,
  errorCode: Database["public"]["Tables"]["kfsa_submission_attempts"]["Row"]["error_code"],
  safeErrorMessage: string,
): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await adminClient
    .from("kfsa_submission_attempts")
    .update({ status: "failed", completed_at: new Date().toISOString(), error_code: errorCode, safe_error_message: safeErrorMessage })
    .eq("id", attemptId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** unique(organization_id, correlation_id) makes a duplicate/concurrent insert idempotent -- the caller should catch a unique-violation (Postgres code 23505) and re-fetch via getEvaluationResponseByCorrelationId (tenant-scoped repository -- SELECT is still permitted there). */
export async function adminCreateEvaluationResponse(
  adminClient: SupabaseClient<Database>,
  params: {
    organizationId: string;
    promotionRequestId: string;
    submissionAttemptId: string;
    correlationId: string;
    externalPromotionRequestId: string;
    reviewOutcome: Database["public"]["Tables"]["kfsa_evaluation_responses"]["Row"]["review_outcome"];
    evidenceStatus: string;
    authorityStatus: string;
    escalationRequired: boolean;
    blockedActions: string[];
    responseHash: string;
  },
): Promise<KfsaEvaluationResponseRecord> {
  const { data, error } = await adminClient
    .from("kfsa_evaluation_responses")
    .insert({
      organization_id: params.organizationId,
      promotion_request_id: params.promotionRequestId,
      submission_attempt_id: params.submissionAttemptId,
      correlation_id: params.correlationId,
      external_promotion_request_id: params.externalPromotionRequestId,
      review_outcome: params.reviewOutcome,
      evidence_status: params.evidenceStatus,
      authority_status: params.authorityStatus,
      escalation_required: params.escalationRequired,
      blocked_actions: params.blockedActions,
      formal_decision_created: false,
      response_hash: params.responseHash,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminCreateExternalAuditLink(
  adminClient: SupabaseClient<Database>,
  params: { organizationId: string; promotionRequestId: string; externalAuditEventId: string; submissionAttemptId: string },
): Promise<KfsaExternalAuditLinkRecord> {
  const { data, error } = await adminClient
    .from("kfsa_external_audit_links")
    .insert({
      organization_id: params.organizationId,
      promotion_request_id: params.promotionRequestId,
      external_audit_event_id: params.externalAuditEventId,
      submission_attempt_id: params.submissionAttemptId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
