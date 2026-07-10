/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not live
 * evidence enforcement. Not a document management system.
 *
 * Builds an evidence pack describing which governance evidence items are
 * required for a given use case/agent, and whether each is present, missing,
 * or not required, derived from tool access, autonomy level, risk level,
 * and data sensitivity.
 *
 * This module does not grade or validate anything and does not approve
 * production. production_approval_status is always false on every
 * EvidencePackOutput. No Evidence, No Institutional Recognition.
 * Agent Action != Approved Institutional Action.
 */

import type {
  EvidenceItemRequirement,
  EvidencePackInput,
  EvidencePackOutput,
  EvidenceRequirementStatus,
} from "./types";

export function getEvidenceRequirementStatus(
  required: boolean,
  present: boolean | undefined
): EvidenceRequirementStatus {
  if (!required) return "not_required";
  return present === true ? "present" : "missing";
}

export function buildEvidencePack(input: EvidencePackInput): EvidencePackOutput {
  const dataSensitivity = input.data_sensitivity ?? "low";
  const autonomyLevel = input.autonomy_level ?? "manual";
  const riskLevel = input.risk_level ?? "low";

  const hasWriteTools = input.has_write_tools === true;
  const hasExternalSystemAccess = input.has_external_system_access === true;
  const externalDataMovement = input.external_data_movement === true;

  const ownerRequired = true;

  const businessJustificationRequired = input.production_intended === true || input.decision_relevant === true;

  const authorityRequired =
    hasWriteTools ||
    hasExternalSystemAccess ||
    input.production_intended === true ||
    input.decision_relevant === true ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous";

  const dataScopeRequired = dataSensitivity === "medium" || dataSensitivity === "high" || hasExternalSystemAccess || externalDataMovement;

  const dataSensitivityRequired = dataSensitivity === "medium" || dataSensitivity === "high";

  const toolPermissionRequired = hasWriteTools || hasExternalSystemAccess;

  const externalSystemRequired = hasExternalSystemAccess;

  const auditRequired =
    hasWriteTools ||
    hasExternalSystemAccess ||
    externalDataMovement ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous";

  const policyBoundaryRequired =
    autonomyLevel === "assisted" ||
    autonomyLevel === "supervised" ||
    autonomyLevel === "autonomous" ||
    hasWriteTools ||
    hasExternalSystemAccess ||
    externalDataMovement;

  const approvalRequired = hasWriteTools || hasExternalSystemAccess || input.production_intended === true || autonomyLevel === "autonomous";

  const escalationRequired =
    riskLevel === "high" || dataSensitivity === "high" || (hasExternalSystemAccess && autonomyLevel === "autonomous");

  const evalRequired = input.eval_required === true;
  const governanceGateRequired = input.governance_gate_required === true;
  const agentPermissionRequired = input.agent_permission_required === true;

  const requirements: EvidenceItemRequirement[] = [
    {
      key: "owner_evidence",
      required: ownerRequired,
      status: getEvidenceRequirementStatus(ownerRequired, input.owner_evidence),
      severity: "CRITICAL",
      reason: "An owner must be evidenced for every use case/agent.",
    },
    {
      key: "authority_evidence",
      required: authorityRequired,
      status: getEvidenceRequirementStatus(authorityRequired, input.authority_evidence),
      severity: "HIGH",
      reason: "Authority evidence is required for write/external access, production intent, decision relevance, or supervised/autonomous autonomy.",
    },
    {
      key: "business_justification_evidence",
      required: businessJustificationRequired,
      status: getEvidenceRequirementStatus(businessJustificationRequired, input.business_justification_evidence),
      severity: "MEDIUM",
      reason: "Business justification evidence is required when production is intended or the output is decision-relevant.",
    },
    {
      key: "data_scope_evidence",
      required: dataScopeRequired,
      status: getEvidenceRequirementStatus(dataScopeRequired, input.data_scope_evidence),
      severity: "MEDIUM",
      reason: "Data scope evidence is required for medium/high sensitivity data, external-system access, or external data movement.",
    },
    {
      key: "data_sensitivity_evidence",
      required: dataSensitivityRequired,
      status: getEvidenceRequirementStatus(dataSensitivityRequired, input.data_sensitivity_evidence),
      severity: "HIGH",
      reason: "Data sensitivity evidence is required for medium/high sensitivity data.",
    },
    {
      key: "tool_permission_evidence",
      required: toolPermissionRequired,
      status: getEvidenceRequirementStatus(toolPermissionRequired, input.tool_permission_evidence),
      severity: "HIGH",
      reason: "Tool permission evidence is required for write or external-system tool access.",
    },
    {
      key: "external_system_evidence",
      required: externalSystemRequired,
      status: getEvidenceRequirementStatus(externalSystemRequired, input.external_system_evidence),
      severity: "MEDIUM",
      reason: "External-system evidence is required whenever external-system access is granted.",
    },
    {
      key: "audit_evidence",
      required: auditRequired,
      status: getEvidenceRequirementStatus(auditRequired, input.audit_evidence),
      severity: "HIGH",
      reason: "Audit evidence is required for write/external access, external data movement, or supervised/autonomous autonomy.",
    },
    {
      key: "policy_boundary_evidence",
      required: policyBoundaryRequired,
      status: getEvidenceRequirementStatus(policyBoundaryRequired, input.policy_boundary_evidence),
      severity: "CRITICAL",
      reason: "Policy boundary evidence is required for assisted/supervised/autonomous autonomy, write/external access, or external data movement.",
    },
    {
      key: "approval_evidence",
      required: approvalRequired,
      status: getEvidenceRequirementStatus(approvalRequired, input.approval_evidence),
      severity: "HIGH",
      reason: "Approval evidence is required for write/external access, production intent, or autonomous autonomy.",
    },
    {
      key: "escalation_evidence",
      required: escalationRequired,
      status: getEvidenceRequirementStatus(escalationRequired, input.escalation_evidence),
      severity: "HIGH",
      reason: "Escalation evidence is required for high risk, high data sensitivity, or autonomous external-system access.",
    },
    {
      key: "eval_evidence",
      required: evalRequired,
      status: getEvidenceRequirementStatus(evalRequired, input.eval_evidence),
      severity: "MEDIUM",
      reason: "Eval evidence is required whenever the eval stage is marked required.",
    },
    {
      key: "governance_gate_evidence",
      required: governanceGateRequired,
      status: getEvidenceRequirementStatus(governanceGateRequired, input.governance_gate_evidence),
      severity: "MEDIUM",
      reason: "Governance gate evidence is required whenever the governance gate stage is marked required.",
    },
    {
      key: "agent_permission_evidence",
      required: agentPermissionRequired,
      status: getEvidenceRequirementStatus(agentPermissionRequired, input.agent_permission_evidence),
      severity: "MEDIUM",
      reason: "Agent permission evidence is required whenever the agent permission stage is marked required.",
    },
  ];

  const required_evidence_keys = requirements.filter((r) => r.required).map((r) => r.key);
  const missing_evidence_keys = requirements.filter((r) => r.status === "missing").map((r) => r.key);
  const present_evidence_keys = requirements.filter((r) => r.status === "present").map((r) => r.key);

  return {
    use_case_name: input.use_case_name,
    agent_name: input.agent_name,
    requirements,
    required_evidence_keys,
    missing_evidence_keys,
    present_evidence_keys,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: [
      `Evidence pack built for use case: ${input.use_case_name}.`,
      "Evidence Pack Builder does not approve production.",
      "production_approval_status is always false.",
      "No Evidence, No Institutional Recognition.",
      "Agent Action != Approved Institutional Action.",
    ],
  };
}
