import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type KfsaSubmissionAttemptRecord = Database["public"]["Tables"]["kfsa_submission_attempts"]["Row"];
export type KfsaEvaluationResponseRecord = Database["public"]["Tables"]["kfsa_evaluation_responses"]["Row"];
export type KfsaExternalAuditLinkRecord = Database["public"]["Tables"]["kfsa_external_audit_links"]["Row"];

/** Mutable only while status = 'in_progress' (DB trigger locks it once succeeded/failed). */
export async function createSubmissionAttempt(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["kfsa_submission_attempts"]["Insert"],
): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await client.from("kfsa_submission_attempts").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function markSubmissionAttemptSucceeded(client: SupabaseClient<Database>, id: string): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await client
    .from("kfsa_submission_attempts")
    .update({ status: "succeeded", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markSubmissionAttemptFailed(
  client: SupabaseClient<Database>,
  id: string,
  errorCode: Database["public"]["Tables"]["kfsa_submission_attempts"]["Row"]["error_code"],
  safeErrorMessage: string,
): Promise<KfsaSubmissionAttemptRecord> {
  const { data, error } = await client
    .from("kfsa_submission_attempts")
    .update({ status: "failed", completed_at: new Date().toISOString(), error_code: errorCode, safe_error_message: safeErrorMessage })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listSubmissionAttemptsForPromotionRequest(
  client: SupabaseClient<Database>,
  promotionRequestId: string,
): Promise<KfsaSubmissionAttemptRecord[]> {
  const { data, error } = await client
    .from("kfsa_submission_attempts")
    .select("*")
    .eq("promotion_request_id", promotionRequestId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** unique(organization_id, correlation_id) makes a duplicate/concurrent insert idempotent — the caller should catch a unique-violation (Postgres code 23505) and re-fetch via getEvaluationResponseByCorrelationId. */
export async function createEvaluationResponse(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["kfsa_evaluation_responses"]["Insert"],
): Promise<KfsaEvaluationResponseRecord> {
  const { data, error } = await client.from("kfsa_evaluation_responses").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getEvaluationResponseByCorrelationId(client: SupabaseClient<Database>, correlationId: string): Promise<KfsaEvaluationResponseRecord | null> {
  const { data, error } = await client.from("kfsa_evaluation_responses").select("*").eq("correlation_id", correlationId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getEvaluationResponseByPromotionRequestId(
  client: SupabaseClient<Database>,
  promotionRequestId: string,
): Promise<KfsaEvaluationResponseRecord | null> {
  const { data, error } = await client.from("kfsa_evaluation_responses").select("*").eq("promotion_request_id", promotionRequestId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getExternalAuditLinkByPromotionRequestId(
  client: SupabaseClient<Database>,
  promotionRequestId: string,
): Promise<KfsaExternalAuditLinkRecord | null> {
  const { data, error } = await client.from("kfsa_external_audit_links").select("*").eq("promotion_request_id", promotionRequestId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Append-only: no update/delete policy exists for any non-service-role caller. */
export async function createExternalAuditLink(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["kfsa_external_audit_links"]["Insert"],
): Promise<KfsaExternalAuditLinkRecord> {
  const { data, error } = await client.from("kfsa_external_audit_links").insert(input).select().single();
  if (error) throw error;
  return data;
}
