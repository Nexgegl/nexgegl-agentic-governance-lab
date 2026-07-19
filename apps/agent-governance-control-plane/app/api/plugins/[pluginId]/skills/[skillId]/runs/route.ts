import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runSkill } from "@/lib/plugins/execution-boundary";
import { PluginBoundaryError } from "@/lib/plugins/errors";

/**
 * The only entry point the browser uses to execute a plugin skill. The
 * browser never talks to Supabase directly for this — see
 * docs/plugins/plugin-security-boundary.md. This route never returns a
 * formal decision, a KFSA decision identifier, or an execution
 * authorization — see lib/plugins/execution-boundary.ts.
 */
export async function POST(request: Request, { params }: { params: { pluginId: string; skillId: string } }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  let body: { useCaseId?: string; correlationId?: string; input?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be valid JSON." }, { status: 400 });
  }

  const correlationId = body.correlationId ?? randomUUID();

  try {
    const result = await runSkill(supabase, {
      pluginId: params.pluginId,
      skillId: decodeURIComponent(params.skillId),
      useCaseId: body.useCaseId,
      correlationId,
      input: body.input ?? {},
    });
    return NextResponse.json(result, { status: result.status === "completed" ? 200 : 422 });
  } catch (error) {
    if (error instanceof PluginBoundaryError) {
      return NextResponse.json({ error: error.reason, message: error.message }, { status: 403 });
    }
    throw error;
  }
}
