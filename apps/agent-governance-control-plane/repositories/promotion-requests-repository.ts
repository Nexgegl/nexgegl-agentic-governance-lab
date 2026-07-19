import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PromotionRequestRecord = Database["public"]["Tables"]["promotion_requests"]["Row"];

/**
 * Creates a Promotion Request. This is the plugin -> KFSA Ingress boundary:
 * it persists a structured request only. It never writes a formal decision,
 * a KFSA decision code, or sets production_approval_status — those columns
 * do not exist on this table by design.
 */
export async function createPromotionRequest(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["promotion_requests"]["Insert"],
): Promise<PromotionRequestRecord> {
  const { data, error } = await client.from("promotion_requests").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listPromotionRequests(client: SupabaseClient<Database>): Promise<PromotionRequestRecord[]> {
  const { data, error } = await client.from("promotion_requests").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPromotionRequestByRunId(client: SupabaseClient<Database>, runId: string): Promise<PromotionRequestRecord | null> {
  const { data, error } = await client.from("promotion_requests").select("*").eq("source_run_id", runId).maybeSingle();
  if (error) throw error;
  return data;
}
