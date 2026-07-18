import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type IncidentRecord = Database["public"]["Tables"]["incidents"]["Row"];

/** RLS (incidents_select_own_org) scopes this to the caller's own organization. */
export async function listIncidents(client: SupabaseClient<Database>): Promise<IncidentRecord[]> {
  const { data, error } = await client.from("incidents").select("*").order("reported_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
