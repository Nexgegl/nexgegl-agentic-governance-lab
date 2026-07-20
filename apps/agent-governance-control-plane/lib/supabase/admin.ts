import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";

/**
 * Service-role client. This exists for exactly one purpose across this
 * codebase today: writing KFSA integration records
 * (repositories/kfsa-integration-admin-repository.ts) after the calling
 * code has already verified tenant ownership using the normal
 * session-scoped client (createServerSupabaseClient()). It is not a
 * general-purpose "elevated" client:
 *
 *   - Never use it to authenticate a browser session -- it has no cookie
 *     handling and no user identity of its own.
 *   - Never use it to skip an ownership check that the caller should have
 *     done itself first with the tenant-scoped client. This client
 *     bypasses RLS entirely, so every field it writes must already be
 *     validated by the caller, not inferred from anything user-supplied.
 *   - Never re-export it, wrap it in a generic "get me elevated access"
 *     helper, or import it from a client component -- `server-only`
 *     enforces the last one at build time.
 *
 * See docs/plugins/kfsa-promotion-request-integration-v1.md
 * "Server-only write architecture".
 */
export class SupabaseAdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAdminConfigError";
  }
}

const MISSING_CONFIG_MESSAGE =
  "Supabase admin access is not configured: SUPABASE_SERVICE_ROLE_KEY must be set as a server-only environment variable (never NEXT_PUBLIC_-prefixed, never committed to .env.local.example). Set it in the environment of the server process only.";

/** Throws SupabaseAdminConfigError if SUPABASE_SERVICE_ROLE_KEY is missing. Never logs the key. */
function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new SupabaseAdminConfigError(MISSING_CONFIG_MESSAGE);
  }
  return key;
}

/**
 * Creates a fresh service-role client. Deliberately not memoized as a
 * module-level singleton -- each caller (the Governance Gateway route)
 * creates its own short-lived instance per request, matching
 * createServerSupabaseClient()'s per-request construction pattern.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = getServiceRoleKey();
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
