import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type SkillRecord = Database["public"]["Tables"]["skills"]["Row"];

/** RLS (skills_select_own_org) scopes this to the caller's own organization. */
export async function listSkills(client: SupabaseClient<Database>): Promise<SkillRecord[]> {
  const { data, error } = await client.from("skills").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getSkillById(client: SupabaseClient<Database>, id: string): Promise<SkillRecord | null> {
  const { data, error } = await client.from("skills").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
