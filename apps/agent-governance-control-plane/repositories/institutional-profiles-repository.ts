import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type OrganizationProfileRecord = Database["public"]["Tables"]["organization_profiles"]["Row"];
export type DomainProfileRecord = Database["public"]["Tables"]["domain_profiles"]["Row"];

/** RLS (organization_profiles_select_own_org) scopes this to the caller's own organization. */
export async function getOwnOrganizationProfile(client: SupabaseClient<Database>): Promise<OrganizationProfileRecord | null> {
  const { data, error } = await client.from("organization_profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

/** organization_id is derived server-side by the DB trigger. Upserts on the unique organization_id constraint. */
export async function upsertOwnOrganizationProfile(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["organization_profiles"]["Insert"],
): Promise<OrganizationProfileRecord> {
  const existing = await getOwnOrganizationProfile(client);
  if (existing) {
    const { data, error } = await client.from("organization_profiles").update(input).eq("id", existing.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client.from("organization_profiles").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getDomainProfile(client: SupabaseClient<Database>, domain: string): Promise<DomainProfileRecord | null> {
  const { data, error } = await client.from("domain_profiles").select("*").eq("domain", domain).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDomainProfile(
  client: SupabaseClient<Database>,
  domain: string,
  profile: Record<string, unknown>,
  completenessScore: number,
): Promise<DomainProfileRecord> {
  const existing = await getDomainProfile(client, domain);
  if (existing) {
    const { data, error } = await client
      .from("domain_profiles")
      .update({ profile, completeness_score: completenessScore })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await client
    .from("domain_profiles")
    .insert({ domain, profile, completeness_score: completenessScore })
    .select()
    .single();
  if (error) throw error;
  return data;
}
