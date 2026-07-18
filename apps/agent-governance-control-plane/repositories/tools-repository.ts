import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ToolRecord = Database["public"]["Tables"]["tools"]["Row"];

/** RLS (tools_select_own_org) scopes this to the caller's own organization. */
export async function listTools(client: SupabaseClient<Database>): Promise<ToolRecord[]> {
  const { data, error } = await client.from("tools").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getToolById(client: SupabaseClient<Database>, id: string): Promise<ToolRecord | null> {
  const { data, error } = await client.from("tools").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
