import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPluginDefinition, getLatestPluginVersion, getInstallationForPlugin, createInstallation, updateInstallationState } from "@/repositories/plugins-repository";
import { createAuditEvent } from "@/repositories/plugin-runs-repository";
import { getCurrentProfile } from "@/repositories/profiles-repository";

/**
 * Installs (or re-enables) a plugin for the caller's own organization.
 * Installing an `experimental` plugin never implies production approval —
 * plugin_definitions.production_approval_status stays false regardless of
 * installation state.
 */
export async function POST(_request: Request, { params }: { params: { pluginId: string } }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return NextResponse.json({ error: "missing_organization_context", message: "No organization profile found." }, { status: 403 });
  }

  const plugin = await getPluginDefinition(supabase, params.pluginId);
  if (!plugin) {
    return NextResponse.json({ error: "plugin_not_found", message: `No plugin "${params.pluginId}".` }, { status: 404 });
  }

  const version = await getLatestPluginVersion(supabase, params.pluginId);
  if (!version) {
    return NextResponse.json({ error: "no_plugin_version", message: `Plugin "${params.pluginId}" has no version to install.` }, { status: 409 });
  }

  const existing = await getInstallationForPlugin(supabase, params.pluginId);
  const installation = existing
    ? await updateInstallationState(supabase, existing.id, "installed")
    : await createInstallation(supabase, { plugin_id: params.pluginId, plugin_version_id: version.id, state: "installed" });

  await createAuditEvent(supabase, {
    actor: user.id,
    event_type: "plugin.installation.installed",
    plugin_id: params.pluginId,
    details: { installation_id: installation.id },
  });

  return NextResponse.json(installation);
}
