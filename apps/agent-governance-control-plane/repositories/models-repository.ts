import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ModelRecord = Database["public"]["Tables"]["models"]["Row"];

/** RLS (models_select_own_org) scopes this to the caller's own organization. */
export async function listModels(client: SupabaseClient<Database>): Promise<ModelRecord[]> {
  const { data, error } = await client.from("models").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getModelById(client: SupabaseClient<Database>, id: string): Promise<ModelRecord | null> {
  const { data, error } = await client.from("models").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listUseCaseCountsByModel(client: SupabaseClient<Database>): Promise<Record<string, number>> {
  const { data, error } = await client.from("use_cases").select("model_id").not("model_id", "is", null);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.model_id) counts[row.model_id] = (counts[row.model_id] ?? 0) + 1;
  }
  return counts;
}
