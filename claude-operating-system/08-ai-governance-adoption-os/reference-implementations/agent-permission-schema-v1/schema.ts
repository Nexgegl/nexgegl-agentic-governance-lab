/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not a live
 * permission enforcement system.
 *
 * Builds an agent permission schema describing the required governance
 * controls (owner, authority, evidence, audit, approval, escalation, policy
 * boundary) for a given agent, derived from its declared tool access,
 * autonomy level, risk level, and data sensitivity.
 *
 * This module does not grade or validate anything and does not approve
 * production. production_approval_status is always false on every
 * AgentPermissionSchemaOutput. Agent Action != Approved Institutional
 * Action.
 */

import type {
  AgentAutonomyLevel,
  AgentDataSensitivity,
  AgentPermissionSchemaInput,
  AgentPermissionSchemaOutput,
  AgentRiskLevel,
  AgentToolPermissionLevel,
} from "./types";

export function getMaxToolPermissionLevel(input: AgentPermissionSchemaInput): AgentToolPermissionLevel {
  const externalSystems = input.external_systems ?? [];
  const writeTools = input.write_tools ?? [];
  const readOnlyTools = input.read_only_tools ?? [];
  const allowedTools = input.allowed_tools ?? [];

  if (externalSystems.length > 0) return "external_system";
  if (writeTools.length > 0) return "write";
  if (readOnlyTools.length > 0 || allowedTools.length > 0) return "read_only";
  return "none";
}

export function buildAgentPermissionSchema(input: AgentPermissionSchemaInput): AgentPermissionSchemaOutput {
  const dataSensitivity: AgentDataSensitivity = input.data_sensitivity ?? "low";
  const autonomyLevel: AgentAutonomyLevel = input.autonomy_level ?? "manual";
  const riskLevel: AgentRiskLevel = input.risk_level ?? "low";

  const allowedTools = input.allowed_tools ?? [];
  const forbiddenTools = input.forbidden_tools ?? [];
  const readOnlyTools = input.read_only_tools ?? [];
  const writeTools = input.write_tools ?? [];
  const externalSystems = input.external_systems ?? [];
  const dataScope = input.data_scope ?? [];

  const required_owner = true;

  const required_authority =
    input.authority_required === true ||
    input.production_intended === true ||
    input.decision_relevant === true ||
    writeTools.length > 0 ||
    externalSystems.length > 0 ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous";

  const required_evidence =
    input.evidence_required === true ||
    dataSensitivity === "medium" ||
    dataSensitivity === "high" ||
    riskLevel === "medium" ||
    riskLevel === "high" ||
    input.production_intended === true ||
    input.decision_relevant === true;

  const required_audit =
    input.audit_required === true ||
    writeTools.length > 0 ||
    externalSystems.length > 0 ||
    input.external_data_movement === true ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous";

  const required_approval =
    input.approval_required === true ||
    writeTools.length > 0 ||
    externalSystems.length > 0 ||
    input.production_intended === true ||
    autonomyLevel === "autonomous";

  const required_escalation =
    input.escalation_required === true ||
    riskLevel === "high" ||
    dataSensitivity === "high" ||
    (externalSystems.length > 0 && autonomyLevel === "autonomous");

  const policy_boundary_required =
    autonomyLevel === "assisted" ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous" ||
    writeTools.length > 0 ||
    externalSystems.length > 0 ||
    input.external_data_movement === true;

  return {
    agent_name: input.agent_name,
    required_owner,
    required_authority,
    required_evidence,
    required_audit,
    required_approval,
    required_escalation,
    max_tool_permission_level: getMaxToolPermissionLevel(input),
    allowed_tools: allowedTools,
    forbidden_tools: forbiddenTools,
    read_only_tools: readOnlyTools,
    write_tools: writeTools,
    external_systems: externalSystems,
    data_scope: dataScope,
    data_sensitivity: dataSensitivity,
    autonomy_level: autonomyLevel,
    risk_level: riskLevel,
    policy_boundary_required,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: [
      `Agent permission schema built for: ${input.agent_name}.`,
      "Agent Permission Schema does not approve production.",
      "production_approval_status is always false.",
      "Agent Action != Approved Institutional Action.",
    ],
  };
}
