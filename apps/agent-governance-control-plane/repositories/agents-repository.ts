import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AgentRecord = Database["public"]["Tables"]["agents"]["Row"];

/** RLS (agents_select_own_org) scopes this to the caller's own organization. */
export async function listAgents(client: SupabaseClient<Database>): Promise<AgentRecord[]> {
  const { data, error } = await client.from("agents").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAgentById(client: SupabaseClient<Database>, id: string): Promise<AgentRecord | null> {
  const { data, error } = await client.from("agents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
