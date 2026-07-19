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

/**
 * Creates a new use case in a neutral, ungoverned starting state:
 * governance_status = GOVERNANCE_REVIEW_REQUIRED, evidence/authority/audit
 * trail statuses = missing, lifecycle_stage = proposed. organization_id is
 * derived server-side by the use_cases_set_organization_id trigger, and
 * production_approval_status defaults to false — neither is settable here.
 * Used by the ai-governance plugin's AI Inventory Intake skill; callers
 * must not pass governance/eval/production fields.
 */
export async function createUseCase(
  client: SupabaseClient<Database>,
  input: {
    name: string;
    name_ar: string;
    department?: string | null;
    owner_name?: string | null;
    ai_type?: string | null;
    business_purpose?: string | null;
    business_purpose_ar?: string | null;
    risk_level: UseCaseRecord["risk_level"];
    data_sensitivity: UseCaseRecord["data_sensitivity"];
    tool_access: UseCaseRecord["tool_access"];
  },
): Promise<UseCaseRecord> {
  const { data, error } = await client
    .from("use_cases")
    .insert({
      ...input,
      governance_status: "GOVERNANCE_REVIEW_REQUIRED",
      eval_outcome: "FIX",
      evidence_status: "missing",
      authority_status: "missing",
      audit_trail_status: "missing",
      lifecycle_stage: "proposed",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

