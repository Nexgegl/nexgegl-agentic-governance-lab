/**
 * Local integrity validators for the NEXGEGL AI Governance Operating System
 * MVP. Pure functions over mock data — no network calls, no persistence.
 * Intended to be run ad hoc (e.g. via a one-off script) as a regression
 * check before commits, not wired into the UI.
 */

import type { UseCase } from "./governance-model";
import { computeAgentGovernancePosture } from "./governance-engine";
import type { Agent, ComplianceMapping, HumanReview, ModelRecord, PrivacyControl, SecurityControl } from "./types";

export interface IntegrityIssue {
  check: string;
  message: string;
}

export interface IntegrityResult {
  ok: boolean;
  issues: IntegrityIssue[];
}

function result(issues: IntegrityIssue[]): IntegrityResult {
  return { ok: issues.length === 0, issues };
}

/** No compliance mapping may be "complete" with zero mapped controls, a missing owner, or all mapped control IDs must resolve. */
export function validateComplianceMappingIntegrity(
  mappings: ComplianceMapping[],
  securityControls: SecurityControl[],
  privacyControls: PrivacyControl[]
): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  const controlIds = new Set([...securityControls.map((c) => c.id), ...privacyControls.map((c) => c.id)]);

  for (const m of mappings) {
    if (m.status === "complete" && m.mappedControlIds.length === 0) {
      issues.push({ check: "complianceMapping.complete_without_control", message: `${m.id} is "complete" with zero mapped controls` });
    }
    if (m.status === "complete" && (!m.owner || m.owner.trim().length === 0)) {
      issues.push({ check: "complianceMapping.missing_owner", message: `${m.id} is "complete" with no owner` });
    }
    for (const controlId of m.mappedControlIds) {
      if (!controlIds.has(controlId)) {
        issues.push({ check: "complianceMapping.dead_control_ref", message: `${m.id} references non-existent control "${controlId}"` });
      }
    }
  }
  return result(issues);
}

/** Every READY_FOR_AUTHORITY_REVIEW, high-risk, or blocked asset must have an explicit human oversight state. */
export function validateHumanOversightIntegrity(useCases: UseCase[], humanReviews: HumanReview[]): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  const reviewedAssetIds = new Set(humanReviews.map((r) => r.assetId));

  for (const u of useCases) {
    const needsExplicitOversight = u.governanceStatus === "READY_FOR_AUTHORITY_REVIEW" || u.riskLevel === "high" || u.governanceStatus === "BLOCKED";
    if (needsExplicitOversight && !reviewedAssetIds.has(u.id)) {
      issues.push({
        check: "humanOversight.missing_review",
        message: `${u.id} (${u.governanceStatus}, risk=${u.riskLevel}) has no HumanReview record`,
      });
    }
  }
  return result(issues);
}

/** Every asset must carry Arabic-first business purpose text. */
export function validateBusinessPurposeLocalization(useCases: UseCase[]): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  for (const u of useCases) {
    if (!u.businessPurposeAr || u.businessPurposeAr.trim().length === 0) {
      issues.push({ check: "businessPurpose.missing_arabic", message: `${u.id} has no businessPurposeAr` });
    }
  }
  return result(issues);
}

/** No model may ever claim production approval. */
export function validateProductionApprovalFalse(models: ModelRecord[]): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  for (const m of models) {
    if (m.approvedForProduction !== false) {
      issues.push({ check: "model.production_approval_not_false", message: `${m.id} does not have approvedForProduction === false` });
    }
  }
  return result(issues);
}

/** The Dashboard's Active Agents KPI must equal the real count of Agent records with status "active". */
export function validateDashboardActiveAgentsReconciliation(agents: Agent[]): IntegrityResult {
  const issues: IntegrityIssue[] = [];
  const direct = agents.filter((a) => a.status === "active").length;
  const viaEngine = computeAgentGovernancePosture(agents).activeAgents;
  if (direct !== viaEngine) {
    issues.push({
      check: "dashboard.active_agents_mismatch",
      message: `Direct count (${direct}) does not match computeAgentGovernancePosture (${viaEngine})`,
    });
  }
  return result(issues);
}

export function runAllIntegrityChecks(data: {
  useCases: UseCase[];
  agents: Agent[];
  models: ModelRecord[];
  securityControls: SecurityControl[];
  privacyControls: PrivacyControl[];
  humanReviews: HumanReview[];
  complianceMappings: ComplianceMapping[];
}): IntegrityResult {
  const results = [
    validateDashboardActiveAgentsReconciliation(data.agents),
    validateComplianceMappingIntegrity(data.complianceMappings, data.securityControls, data.privacyControls),
    validateHumanOversightIntegrity(data.useCases, data.humanReviews),
    validateBusinessPurposeLocalization(data.useCases),
    validateProductionApprovalFalse(data.models),
  ];
  const issues = results.flatMap((r) => r.issues);
  return result(issues);
}
