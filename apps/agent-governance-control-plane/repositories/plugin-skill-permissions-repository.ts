import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PluginSkillPermissionRecord = Database["public"]["Tables"]["plugin_skill_permissions"]["Row"];

/**
 * Fails open only in the documented sense that an *absent* row means "no
 * explicit restriction has been configured" — the caller must still treat
 * a disabled plugin installation as blocking (checked separately). An
 * explicit row with enabled=false always wins.
 */
export async function isSkillEnabledForInstallation(
  client: SupabaseClient<Database>,
  installationId: string,
  skillId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("plugin_skill_permissions")
    .select("enabled")
    .eq("plugin_installation_id", installationId)
    .eq("skill_id", skillId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.enabled : true;
}
