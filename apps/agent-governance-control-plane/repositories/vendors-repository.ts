import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type VendorRecord = Database["public"]["Tables"]["vendors"]["Row"];

/** RLS (vendors_select_own_org) scopes this to the caller's own organization. */
export async function listVendors(client: SupabaseClient<Database>): Promise<VendorRecord[]> {
  const { data, error } = await client.from("vendors").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getVendorById(client: SupabaseClient<Database>, id: string): Promise<VendorRecord | null> {
  const { data, error } = await client.from("vendors").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}
