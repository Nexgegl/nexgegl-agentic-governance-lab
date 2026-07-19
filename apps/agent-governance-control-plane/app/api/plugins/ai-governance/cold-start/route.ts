import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitColdStart, type ColdStartInput } from "@/lib/plugins/cold-start";
import { PluginBoundaryError } from "@/lib/plugins/errors";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated", message: "Sign in required." }, { status: 401 });
  }

  let body: ColdStartInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const result = await submitColdStart(supabase, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PluginBoundaryError) {
      return NextResponse.json({ error: error.reason, message: error.message }, { status: 403 });
    }
    throw error;
  }
}
