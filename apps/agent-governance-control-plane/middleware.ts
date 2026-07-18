import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getSupabasePublicEnv, SupabaseConfigError } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  try {
    getSupabasePublicEnv();
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return new NextResponse(
        "Development configuration error: Supabase is not configured.\n\n" +
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local " +
          "(copy .env.local.example to get started), then restart the dev server.",
        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
    throw error;
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
