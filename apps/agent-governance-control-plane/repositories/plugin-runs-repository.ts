import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PluginRunContextRecord = Database["public"]["Tables"]["plugin_run_contexts"]["Row"];
export type PluginRunRecord = Database["public"]["Tables"]["plugin_runs"]["Row"];
export type PluginEvidenceOutputRecord = Database["public"]["Tables"]["plugin_evidence_outputs"]["Row"];
export type PluginAuditEventRecord = Database["public"]["Tables"]["plugin_audit_events"]["Row"];

/** Immutable once inserted (DB trigger blocks update/delete for non-service-role). */
export async function createRunContextSnapshot(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["plugin_run_contexts"]["Insert"],
): Promise<PluginRunContextRecord> {
  const { data, error } = await client.from("plugin_run_contexts").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getRunContextSnapshot(client: SupabaseClient<Database>, id: string): Promise<PluginRunContextRecord | null> {
  const { data, error } = await client.from("plugin_run_contexts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** unique(organization_id, correlation_id) makes a duplicate submit idempotent — the caller should catch a unique-violation and re-fetch. */
export async function createRun(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["plugin_runs"]["Insert"],
): Promise<PluginRunRecord> {
  const { data, error } = await client.from("plugin_runs").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getRunByCorrelationId(client: SupabaseClient<Database>, correlationId: string): Promise<PluginRunRecord | null> {
  const { data, error } = await client.from("plugin_runs").select("*").eq("correlation_id", correlationId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRunById(client: SupabaseClient<Database>, id: string): Promise<PluginRunRecord | null> {
  const { data, error } = await client.from("plugin_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function completeRun(
  client: SupabaseClient<Database>,
  id: string,
  output: Record<string, unknown>,
): Promise<PluginRunRecord> {
  const { data, error } = await client.from("plugin_runs").update({ status: "completed", output }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function rejectRun(client: SupabaseClient<Database>, id: string, reason: string): Promise<PluginRunRecord> {
  const { data, error } = await client
    .from("plugin_runs")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listRunsForOrganization(client: SupabaseClient<Database>): Promise<PluginRunRecord[]> {
  const { data, error } = await client.from("plugin_runs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvidenceOutput(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["plugin_evidence_outputs"]["Insert"],
): Promise<PluginEvidenceOutputRecord> {
  const { data, error } = await client.from("plugin_evidence_outputs").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listEvidenceForRun(client: SupabaseClient<Database>, runId: string): Promise<PluginEvidenceOutputRecord[]> {
  const { data, error } = await client.from("plugin_evidence_outputs").select("*").eq("plugin_run_id", runId);
  if (error) throw error;
  return data ?? [];
}

/** Append-only: no update/delete policy exists for any non-service-role caller. */
export async function createAuditEvent(
  client: SupabaseClient<Database>,
  input: Database["public"]["Tables"]["plugin_audit_events"]["Insert"],
): Promise<PluginAuditEventRecord> {
  const { data, error } = await client.from("plugin_audit_events").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listAuditEvents(client: SupabaseClient<Database>): Promise<PluginAuditEventRecord[]> {
  const { data, error } = await client.from("plugin_audit_events").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
