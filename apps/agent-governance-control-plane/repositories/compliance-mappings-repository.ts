import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ComplianceMappingRecord = Database["public"]["Tables"]["compliance_mappings"]["Row"];

/** RLS (compliance_mappings_select_own_org) scopes this to the caller's own organization. */
export async function listComplianceMappings(client: SupabaseClient<Database>): Promise<ComplianceMappingRecord[]> {
  const { data, error } = await client.from("compliance_mappings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
