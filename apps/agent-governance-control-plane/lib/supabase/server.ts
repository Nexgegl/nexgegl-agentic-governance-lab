import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

/**
 * Server Component / Route Handler client. Only uses the public anon key —
 * never import SUPABASE_SERVICE_ROLE_KEY here or anywhere reachable from a
 * request path. RLS is what enforces tenant isolation for this client.
 *
 * Throws SupabaseConfigError if NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are missing.
 */
export function createServerSupabaseClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — cookies are read-only there.
          // Session refresh already happens in middleware, so this is safe to ignore.
        }
      },
    },
  });
}
