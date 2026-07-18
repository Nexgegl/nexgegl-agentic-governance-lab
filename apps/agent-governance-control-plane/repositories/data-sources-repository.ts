import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type DataSourceRecord = Database["public"]["Tables"]["data_sources"]["Row"];
export type DataLineageRecord = Database["public"]["Tables"]["data_lineage"]["Row"];

/** RLS (data_sources_select_own_org) scopes this to the caller's own organization. */
export async function listDataSources(client: SupabaseClient<Database>): Promise<DataSourceRecord[]> {
  const { data, error } = await client.from("data_sources").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDataSourceById(client: SupabaseClient<Database>, id: string): Promise<DataSourceRecord | null> {
  const { data, error } = await client.from("data_sources").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function countUseCasesForDataSource(client: SupabaseClient<Database>, dataSourceId: string): Promise<number> {
  const { count, error } = await client
    .from("use_case_data_sources")
    .select("*", { count: "exact", head: true })
    .eq("data_source_id", dataSourceId);
  if (error) throw error;
  return count ?? 0;
}

export async function listUseCaseIdsForDataSources(client: SupabaseClient<Database>): Promise<Record<string, number>> {
  const { data, error } = await client.from("use_case_data_sources").select("data_source_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.data_source_id] = (counts[row.data_source_id] ?? 0) + 1;
  }
  return counts;
}

export async function listLineageForDataSource(client: SupabaseClient<Database>, dataSourceId: string): Promise<DataLineageRecord[]> {
  const { data, error } = await client.from("data_lineage").select("*").eq("data_source_id", dataSourceId);
  if (error) throw error;
  return data ?? [];
}
