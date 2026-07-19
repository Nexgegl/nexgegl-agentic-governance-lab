import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentProfile } from "@/repositories/profiles-repository";
import { getRunById, getRunContextSnapshot, listEvidenceForRun, createAuditEvent } from "@/repositories/plugin-runs-repository";
import { createPromotionRequest, type PromotionRequestRecord } from "@/repositories/promotion-requests-repository";
import { PluginBoundaryError } from "./errors";

/**
 * Prepares and persists a Promotion Request from a completed plugin run's
 * decision candidate and evidence. This is the plugin -> KFSA Ingress
 * boundary this repository stops at: it creates a structured request row
 * only. It never creates a formal decision, never generates a KFSA
 * decision identifier, and never sets review_outcome to anything other
 * than PASS/FIX/FAIL/ESCALATE (or leaves it null) — those four values are
 * ReviewOutcome values only, never mapped to KILL/FIX/SCALE/ALERT here or
 * anywhere else in this module.
 */
export async function preparePromotionRequestFromRun(
  client: SupabaseClient<Database>,
  input: { runId: string; objective: string },
): Promise<PromotionRequestRecord> {
  const profile = await getCurrentProfile(client);
  if (!profile) {
    throw new PluginBoundaryError("missing_organization_context", "No organization profile is associated with this signed-in user.");
  }

  const run = await getRunById(client, input.runId);
  if (!run) {
    throw new PluginBoundaryError("run_not_found", `No run exists with id "${input.runId}".`);
  }
  if (run.status !== "completed") {
    throw new PluginBoundaryError("run_not_completed", `Run "${input.runId}" is not completed; a Promotion Request can only be prepared from a completed run.`);
  }

  const output = (run.output ?? {}) as Record<string, unknown>;
  const decisionCandidate = output.decision_candidate as Record<string, unknown> | undefined;
  if (!decisionCandidate) {
    throw new PluginBoundaryError("no_decision_candidate", `Run "${input.runId}" produced no decision candidate to promote.`);
  }

  const evidence = await listEvidenceForRun(client, input.runId);

  const snapshot = await getRunContextSnapshot(client, run.context_snapshot_id);
  if (!snapshot) {
    throw new PluginBoundaryError("run_context_snapshot_missing", `Run "${input.runId}" has no retrievable context snapshot "${run.context_snapshot_id}".`);
  }

  const authorityConfirmed = profile.role === "admin";

  const request = await createPromotionRequest(client, {
    source_plugin_id: run.plugin_id,
    source_skill_id: run.skill_id,
    source_run_id: run.id,
    request_id: `pr-${randomUUID()}`,
    candidate_id: String(decisionCandidate.candidate_id ?? decisionCandidate.use_case_id ?? run.id),
    signal_ids: [],
    evidence_ids: evidence.map((e) => e.id),
    authority_context: { actor_role: profile.role },
    objective: input.objective,
    correlation_id: run.correlation_id,
    context_snapshot_id: run.context_snapshot_id,
    plugin_version: snapshot.plugin_version,
    skill_version: snapshot.skill_version,
    review_outcome: null,
    evidence_status: evidence.length > 0 ? "partial" : "missing",
    authority_status: authorityConfirmed ? "confirmed" : "missing",
    escalation_required: !authorityConfirmed,
    blocked_actions: authorityConfirmed ? [] : ["awaiting_authority_confirmation"],
  });

  await createAuditEvent(client, {
    actor: profile.id,
    event_type: "plugin.promotion_request.created",
    plugin_id: run.plugin_id,
    skill_id: run.skill_id,
    plugin_run_id: run.id,
    details: { promotion_request_id: request.id },
  });

  return request;
}
