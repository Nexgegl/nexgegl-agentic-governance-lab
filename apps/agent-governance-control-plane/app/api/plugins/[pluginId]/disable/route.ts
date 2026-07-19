import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getInstallationForPlugin, updateInstallationState } from "@/repositories/plugins-repository";
import { createAuditEvent } from "@/repositories/plugin-runs-repository";

export async function POST(_request: Request, { params }: { params: { pluginId: string } }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  const existing = await getInstallationForPlugin(supabase, params.pluginId);
  if (!existing) {
    return NextResponse.json({ error: "plugin_not_installed", message: `Plugin "${params.pluginId}" is not installed.` }, { status: 404 });
  }

  const installation = await updateInstallationState(supabase, existing.id, "disabled");

  await createAuditEvent(supabase, {
    actor: user.id,
    event_type: "plugin.installation.disabled",
    plugin_id: params.pluginId,
    details: { installation_id: installation.id },
  });

  return NextResponse.json(installation);
}
