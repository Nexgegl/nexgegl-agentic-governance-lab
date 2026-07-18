import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AuditEventRecord = Database["public"]["Tables"]["audit_events"]["Row"];

/** RLS (audit_events_select_own_org) scopes this to the caller's own organization. */
export async function listAuditEvents(client: SupabaseClient<Database>): Promise<AuditEventRecord[]> {
  const { data, error } = await client.from("audit_events").select("*").order("timestamp", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listRecentAuditEvents(client: SupabaseClient<Database>, limit: number): Promise<AuditEventRecord[]> {
  const { data, error } = await client
    .from("audit_events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
