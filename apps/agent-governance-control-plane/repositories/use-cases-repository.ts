import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type UseCaseRecord = Database["public"]["Tables"]["use_cases"]["Row"];

/** RLS (use_cases_select_own_org) scopes this to the caller's own organization. */
export async function listUseCases(client: SupabaseClient<Database>): Promise<UseCaseRecord[]> {
  const { data, error } = await client.from("use_cases").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getUseCaseById(client: SupabaseClient<Database>, id: string): Promise<UseCaseRecord | null> {
  const { data, error } = await client.from("use_cases").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listUseCasesByModelId(client: SupabaseClient<Database>, modelId: string): Promise<UseCaseRecord[]> {
  const { data, error } = await client.from("use_cases").select("*").eq("model_id", modelId);
  if (error) throw error;
  return data ?? [];
}

export async function listUseCasesByVendorId(client: SupabaseClient<Database>, vendorId: string): Promise<UseCaseRecord[]> {
  const { data, error } = await client.from("use_cases").select("*").eq("vendor_id", vendorId);
  if (error) throw error;
  return data ?? [];
}

