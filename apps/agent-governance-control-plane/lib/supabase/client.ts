"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

/** Throws SupabaseConfigError if NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. */
export function createClient() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
