import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRecord = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(client: SupabaseClient<Database>): Promise<ProfileRecord | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

/** RLS (profiles_update_own) enforces that this can only ever affect the caller's own row. */
export async function updateOwnProfile(
  client: SupabaseClient<Database>,
  updates: Database["public"]["Tables"]["profiles"]["Update"],
): Promise<ProfileRecord> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client.from("profiles").update(updates).eq("id", user.id).select().single();
  if (error) throw error;
  return data;
}
