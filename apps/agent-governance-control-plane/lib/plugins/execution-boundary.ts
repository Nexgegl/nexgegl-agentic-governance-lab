import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { composeContext, type ComposedContext } from "./context-composer";
import { runAiInventoryIntake, type AiInventoryIntakeInput, type SkillRunResult } from "./skills/ai-inventory-intake";
import { createRun, completeRun, rejectRun, createEvidenceOutput, createAuditEvent, getRunByCorrelationId } from "@/repositories/plugin-runs-repository";
import { PluginBoundaryError } from "./errors";

/**
 * One entry per implemented skill_id. Everything else in the manifest is
 * declared but not_implemented, and is rejected before this map is ever
 * consulted (see the executionStatus check below).
 */
const SKILL_HANDLERS: Record<string, (client: SupabaseClient<Database>, context: ComposedContext, input: Record<string, unknown>) => Promise<SkillRunResult>> = {
  "ai-governance.ai-inventory-intake": (client, context, input) => runAiInventoryIntake(client, context, input as unknown as AiInventoryIntakeInput),
};

const PROHIBITED_OUTPUT_FIELDS = [
  "official_decision",
  "official_verdict",
  "kfsa_verdict",
  "kfsa_decision_id",
  "kfsa_decision_code",
  "execution_authorization",
];

export interface RunSkillRequest {
  pluginId: string;
  skillId: string;
  useCaseId?: string;
  correlationId: string;
  input: Record<string, unknown>;
}

export interface RunSkillResult {
  runId: string;
  status: "completed" | "rejected";
  rejectionReason?: string;
  contextSnapshotId: string;
  output?: Record<string, unknown>;
  evidenceIds: string[];
  auditEventId: string;
}

/**
 * The governed execution boundary: POST /api/plugins/[pluginId]/skills/[skillId]/runs
 * calls this. Implements the 12 steps from
 * docs/architecture/ADR-vertical-plugin-foundation-v1.md's Phase 8:
 * authenticate (via the caller's own Supabase session — composeContext),
 * resolve organization, verify installation + status + skill ownership
 * (composeContext), verify connector permission, compose the context
 * snapshot, create the run record, execute only the one implemented pilot
 * skill (everything else rejects as not_implemented), persist evidence,
 * persist an audit event, and return a structured result.
 *
 * This function never creates a formal decision, never generates a KFSA
 * decision identifier, and rejects outright if the caller's input contains
 * any prohibited field name.
 */
export async function runSkill(client: SupabaseClient<Database>, request: RunSkillRequest): Promise<RunSkillResult> {
  for (const field of PROHIBITED_OUTPUT_FIELDS) {
    if (field in request.input) {
      throw new PluginBoundaryError("prohibited_field", `Input field "${field}" is prohibited.`);
    }
  }

  const existingRun = await getRunByCorrelationId(client, request.correlationId);
  if (existingRun) {
    return {
      runId: existingRun.id,
      status: existingRun.status === "submitted" ? "rejected" : (existingRun.status as "completed" | "rejected"),
      rejectionReason: existingRun.rejection_reason ?? undefined,
      contextSnapshotId: existingRun.context_snapshot_id,
      output: (existingRun.output as Record<string, unknown> | null) ?? undefined,
      evidenceIds: [],
      auditEventId: "idempotent_replay_no_new_audit_event",
    };
  }

  const { snapshotId, context } = await composeContext(client, {
    pluginId: request.pluginId,
    skillId: request.skillId,
    useCaseId: request.useCaseId,
  });

  for (const connectorId of context.skill.permittedConnectors) {
    if (!context.allowedConnectorIds.includes(connectorId)) {
      const run = await createRun(client, {
        plugin_id: request.pluginId,
        skill_id: request.skillId,
        context_snapshot_id: snapshotId,
        actor_user_id: context.actor.userId,
        correlation_id: request.correlationId,
        use_case_id: request.useCaseId ?? null,
      });
      const rejected = await rejectRun(client, run.id, `connector_not_permitted:${connectorId}`);
      const audit = await createAuditEvent(client, {
        actor: context.actor.userId,
        event_type: "plugin.skill.run.rejected",
        plugin_id: request.pluginId,
        skill_id: request.skillId,
        plugin_run_id: run.id,
        details: { reason: "connector_not_permitted", connector_id: connectorId },
      });
      return {
        runId: rejected.id,
        status: "rejected",
        rejectionReason: rejected.rejection_reason ?? undefined,
        contextSnapshotId: snapshotId,
        evidenceIds: [],
        auditEventId: audit.id,
      };
    }
  }

  const run = await createRun(client, {
    plugin_id: request.pluginId,
    skill_id: request.skillId,
    context_snapshot_id: snapshotId,
    actor_user_id: context.actor.userId,
    correlation_id: request.correlationId,
    use_case_id: request.useCaseId ?? null,
  });

  await createAuditEvent(client, {
    actor: context.actor.userId,
    event_type: "plugin.skill.run.started",
    plugin_id: request.pluginId,
    skill_id: request.skillId,
    plugin_run_id: run.id,
    details: { correlation_id: request.correlationId },
  });

  if (context.skill.executionStatus !== "implemented") {
    const rejected = await rejectRun(client, run.id, "skill_not_implemented");
    const audit = await createAuditEvent(client, {
      actor: context.actor.userId,
      event_type: "plugin.skill.run.rejected",
      plugin_id: request.pluginId,
      skill_id: request.skillId,
      plugin_run_id: run.id,
      details: { reason: "skill_not_implemented" },
    });
    return {
      runId: rejected.id,
      status: "rejected",
      rejectionReason: rejected.rejection_reason ?? undefined,
      contextSnapshotId: snapshotId,
      evidenceIds: [],
      auditEventId: audit.id,
    };
  }

  const handler = SKILL_HANDLERS[request.skillId];
  const skillResult: SkillRunResult = handler
    ? await handler(client, context, request.input)
    : { status: "rejected", rejectionReason: "no_handler_registered" };

  for (const field of PROHIBITED_OUTPUT_FIELDS) {
    if (skillResult.output && field in skillResult.output) {
      throw new PluginBoundaryError("prohibited_field", `Output field "${field}" is prohibited.`);
    }
  }

  if (skillResult.status === "rejected") {
    const rejected = await rejectRun(client, run.id, skillResult.rejectionReason ?? "rejected");
    const audit = await createAuditEvent(client, {
      actor: context.actor.userId,
      event_type: "plugin.skill.run.rejected",
      plugin_id: request.pluginId,
      skill_id: request.skillId,
      plugin_run_id: run.id,
      details: { reason: skillResult.rejectionReason ?? "rejected" },
    });
    return {
      runId: rejected.id,
      status: "rejected",
      rejectionReason: rejected.rejection_reason ?? undefined,
      contextSnapshotId: snapshotId,
      evidenceIds: [],
      auditEventId: audit.id,
    };
  }

  const evidenceIds: string[] = [];
  for (const evidence of skillResult.evidence ?? []) {
    const created = await createEvidenceOutput(client, {
      plugin_run_id: run.id,
      use_case_id: request.useCaseId ?? (skillResult.output?.use_case_id as string | undefined) ?? null,
      evidence_type: evidence.evidenceType,
      payload: evidence.payload,
    });
    evidenceIds.push(created.id);
    await createAuditEvent(client, {
      actor: context.actor.userId,
      event_type: "plugin.evidence.created",
      plugin_id: request.pluginId,
      skill_id: request.skillId,
      plugin_run_id: run.id,
      details: { evidence_id: created.id, evidence_type: evidence.evidenceType },
    });
  }

  const completed = await completeRun(client, run.id, skillResult.output ?? {});
  const audit = await createAuditEvent(client, {
    actor: context.actor.userId,
    event_type: "plugin.skill.run.completed",
    plugin_id: request.pluginId,
    skill_id: request.skillId,
    plugin_run_id: run.id,
    details: { evidence_ids: evidenceIds },
  });

  return {
    runId: completed.id,
    status: "completed",
    contextSnapshotId: snapshotId,
    output: (completed.output as Record<string, unknown>) ?? undefined,
    evidenceIds,
    auditEventId: audit.id,
  };
}
