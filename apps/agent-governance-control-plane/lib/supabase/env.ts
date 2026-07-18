export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

const MISSING_CONFIG_MESSAGE =
  "Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local. Copy .env.local.example to .env.local and fill in your Supabase project's values, then restart the dev server.";

export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

/** Throws SupabaseConfigError (never returns undefined values) if required public env vars are missing. */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConfigError(MISSING_CONFIG_MESSAGE);
  }

  return { url, anonKey };
}
