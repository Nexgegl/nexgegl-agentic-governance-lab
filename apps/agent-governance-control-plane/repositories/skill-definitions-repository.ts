import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type SkillDefinitionRecord = Database["public"]["Tables"]["skill_definitions"]["Row"];

/**
 * Global plugin skill catalog -- not tenant data (no organization_id).
 * RLS (skill_definitions_select_authenticated) allows any signed-in user
 * to read it; there is no insert/update/delete policy for any role but
 * service_role, so this repository never writes to the table.
 */
export async function getSkillDefinition(client: SupabaseClient<Database>, skillId: string): Promise<SkillDefinitionRecord | null> {
  const { data, error } = await client.from("skill_definitions").select("*").eq("id", skillId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listSkillDefinitionsForPlugin(client: SupabaseClient<Database>, pluginId: string): Promise<SkillDefinitionRecord[]> {
  const { data, error } = await client.from("skill_definitions").select("*").eq("plugin_id", pluginId).order("name");
  if (error) throw error;
  return data ?? [];
}
