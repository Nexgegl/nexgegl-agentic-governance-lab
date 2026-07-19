import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ConnectorDefinitionRecord = Database["public"]["Tables"]["connector_definitions"]["Row"];
export type PluginConnectorPermissionRecord = Database["public"]["Tables"]["plugin_connector_permissions"]["Row"];

/** RLS (connector_definitions_select_own_org) scopes this to the caller's own organization. */
export async function listConnectors(client: SupabaseClient<Database>): Promise<ConnectorDefinitionRecord[]> {
  const { data, error } = await client.from("connector_definitions").select("*").order("connector_id");
  if (error) throw error;
  return data ?? [];
}

export async function getConnectorByConnectorId(
  client: SupabaseClient<Database>,
  connectorId: string,
): Promise<ConnectorDefinitionRecord | null> {
  const { data, error } = await client.from("connector_definitions").select("*").eq("connector_id", connectorId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listConnectorPermissionsForPlugin(
  client: SupabaseClient<Database>,
  pluginId: string,
): Promise<PluginConnectorPermissionRecord[]> {
  const { data, error } = await client.from("plugin_connector_permissions").select("*").eq("plugin_id", pluginId);
  if (error) throw error;
  return data ?? [];
}

/**
 * Fails closed: returns false unless an explicit, enabled permission grant
 * exists for this (plugin, connector) pair in the caller's own organization.
 */
export async function isConnectorAllowedForPlugin(
  client: SupabaseClient<Database>,
  pluginId: string,
  connectorId: string,
): Promise<boolean> {
  const connector = await getConnectorByConnectorId(client, connectorId);
  if (!connector || connector.status !== "enabled") return false;

  const { data, error } = await client
    .from("plugin_connector_permissions")
    .select("allowed")
    .eq("plugin_id", pluginId)
    .eq("connector_id", connector.id)
    .maybeSingle();
  if (error) throw error;
  return data?.allowed === true;
}
