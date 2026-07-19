import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PluginDefinitionRecord = Database["public"]["Tables"]["plugin_definitions"]["Row"];
export type PluginVersionRecord = Database["public"]["Tables"]["plugin_versions"]["Row"];
export type PluginInstallationRecord = Database["public"]["Tables"]["plugin_installations"]["Row"];

/** RLS (plugin_definitions_select_authenticated): visible to any signed-in user — platform catalog, not tenant data. */
export async function listPluginDefinitions(client: SupabaseClient<Database>): Promise<PluginDefinitionRecord[]> {
  const { data, error } = await client.from("plugin_definitions").select("*").order("plugin_id");
  if (error) throw error;
  return data ?? [];
}

export async function getPluginDefinition(client: SupabaseClient<Database>, pluginId: string): Promise<PluginDefinitionRecord | null> {
  const { data, error } = await client.from("plugin_definitions").select("*").eq("plugin_id", pluginId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLatestPluginVersion(client: SupabaseClient<Database>, pluginId: string): Promise<PluginVersionRecord | null> {
  const { data, error } = await client
    .from("plugin_versions")
    .select("*")
    .eq("plugin_id", pluginId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** RLS (plugin_installations_select_own_org) scopes this to the caller's own organization. */
export async function getInstallationForPlugin(
  client: SupabaseClient<Database>,
  pluginId: string,
): Promise<PluginInstallationRecord | null> {
  const { data, error } = await client.from("plugin_installations").select("*").eq("plugin_id", pluginId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listInstallations(client: SupabaseClient<Database>): Promise<PluginInstallationRecord[]> {
  const { data, error } = await client.from("plugin_installations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** organization_id is derived server-side by the DB trigger — never trusted from the caller. */
export async function createInstallation(
  client: SupabaseClient<Database>,
  input: { plugin_id: string; plugin_version_id: string; state?: Database["public"]["Tables"]["plugin_installations"]["Row"]["state"] },
): Promise<PluginInstallationRecord> {
  const { data, error } = await client.from("plugin_installations").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateInstallationState(
  client: SupabaseClient<Database>,
  installationId: string,
  state: Database["public"]["Tables"]["plugin_installations"]["Row"]["state"],
): Promise<PluginInstallationRecord> {
  const update: Database["public"]["Tables"]["plugin_installations"]["Update"] = { state };
  if (state === "installed") {
    update.installed_at = new Date().toISOString();
  }
  const { data, error } = await client.from("plugin_installations").update(update).eq("id", installationId).select().single();
  if (error) throw error;
  return data;
}
