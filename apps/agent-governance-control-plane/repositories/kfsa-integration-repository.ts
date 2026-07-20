import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type KfsaSubmissionAttemptRecord = Database["public"]["Tables"]["kfsa_submission_attempts"]["Row"];
export type KfsaEvaluationResponseRecord = Database["public"]["Tables"]["kfsa_evaluation_responses"]["Row"];
export type KfsaExternalAuditLinkRecord = Database["public"]["Tables"]["kfsa_external_audit_links"]["Row"];

/**
 * Read-only. This repository is for the normal, session-scoped tenant
 * client (createServerSupabaseClient()) -- RLS grants authenticated users
 * SELECT-only access to their own organization's rows on all three KFSA
 * integration tables (see 20260721100003_lock_down_kfsa_tenant_writes.sql).
 * Every write (create/mark-terminal) goes through the separate,
 * server-only repositories/kfsa-integration-admin-repository.ts instead --
 * see docs/plugins/kfsa-promotion-request-integration-v1.md
 * "Server-only write architecture" for why.
 */
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
