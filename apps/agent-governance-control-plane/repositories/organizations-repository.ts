import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type OrganizationRecord = Database["public"]["Tables"]["organizations"]["Row"];

/** Relies on RLS to scope this to the caller's own organization — never filters by id client-side. */
export async function getOwnOrganization(client: SupabaseClient<Database>): Promise<OrganizationRecord | null> {
  const { data, error } = await client.from("organizations").select("*").maybeSingle();
  if (error) throw error;
  return data;
}
