/**
 * Cross-layer governance engine for the NEXGEGL AI Governance Operating
 * System MVP. Deterministic, pure functions over mock data only — no
 * network calls, no persistence. Reuses the existing Governance Gate
 * vocabulary (FAIL > ESCALATE > FIX > PASS priority) from governance-model.ts
 * for any status derived across layers.
 */

import type { EvidenceStatus, UseCase } from "./governance-model";
import type {
  Agent,
  AuditEvent,
  ComplianceMapping,
  DataSource,
  GovernanceLayer,
  HumanReview,
  IncidentRecord,
  ModelRecord,
  PrivacyControl,
  SecurityControl,
  VendorRecord,
} from "./types";

function statusScore(status: EvidenceStatus): number {
  if (status === "complete") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function averagePercent(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100);
}

export function computeAssetRisk(asset: UseCase): "low" | "medium" | "high" {
  return asset.riskLevel;
}

export function computeDataGovernancePosture(sources: DataSource[]): {
  readinessPercent: number;
  missingClassification: number;
  totalSources: number;
} {
  return {
    readinessPercent: averagePercent(sources.map((s) => statusScore(s.classificationStatus))),
    missingClassification: sources.filter((s) => s.classificationStatus === "missing").length,
    totalSources: sources.length,
  };
}

export function computeModelLifecyclePosture(models: ModelRecord[]): {
  readinessPercent: number;
  unreviewedModels: number;
  highRiskModels: number;
  totalModels: number;
} {
  return {
    readinessPercent: averagePercent(models.map((m) => statusScore(m.evaluationStatus))),
    unreviewedModels: models.filter((m) => m.evaluationStatus === "missing").length,
    highRiskModels: models.filter((m) => m.riskTier === "high").length,
    totalModels: models.length,
  };
}

export function computeSecurityPosture(
  security: SecurityControl[],
  privacy: PrivacyControl[]
): {
  readinessPercent: number;
  missingSecurityControls: number;
  missingPrivacyControls: number;
} {
  const scores = [...security.map((s) => statusScore(s.status)), ...privacy.map((p) => statusScore(p.status))];
  return {
    readinessPercent: averagePercent(scores),
    missingSecurityControls: security.filter((s) => s.status === "missing").length,
    missingPrivacyControls: privacy.filter((p) => p.status === "missing").length,
  };
}

export function computeAgentGovernancePosture(agents: Agent[]): {
  readinessPercent: number;
  activeAgents: number;
  underReviewAgents: number;
  suspendedAgents: number;
} {
  const total = agents.length || 1;
  const active = agents.filter((a) => a.status === "active").length;
  return {
    readinessPercent: Math.round((active / total) * 100),
    activeAgents: active,
    underReviewAgents: agents.filter((a) => a.status === "under_review").length,
    suspendedAgents: agents.filter((a) => a.status === "suspended").length,
  };
}

export function computeOversightPosture(
  reviews: HumanReview[],
  incidents: IncidentRecord[]
): {
  approvedReviews: number;
  returnedReviews: number;
  escalatedReviews: number;
  openIncidents: number;
  resolvedIncidents: number;
} {
  return {
    approvedReviews: reviews.filter((r) => r.decision === "approved_for_next_stage").length,
    returnedReviews: reviews.filter((r) => r.decision === "returned_for_repair").length,
    escalatedReviews: reviews.filter((r) => r.decision === "escalated").length,
    openIncidents: incidents.filter((i) => i.status !== "resolved").length,
    resolvedIncidents: incidents.filter((i) => i.status === "resolved").length,
  };
}

export function computeComplianceReadiness(mappings: ComplianceMapping[]): {
  readinessPercent: number;
  missingRequirements: number;
  totalRequirements: number;
} {
  return {
    readinessPercent: averagePercent(mappings.map((m) => statusScore(m.status))),
    missingRequirements: mappings.filter((m) => m.status === "missing").length,
    totalRequirements: mappings.length,
  };
}

export function computeVendorRiskSummary(vendors: VendorRecord[]): {
  highRiskVendors: number;
  expiredContracts: number;
  totalVendors: number;
} {
  return {
    highRiskVendors: vendors.filter((v) => v.riskTier === "high").length,
    expiredContracts: vendors.filter((v) => v.contractStatus === "expired").length,
    totalVendors: vendors.length,
  };
}

export function computeAuditEventsForAsset(events: AuditEvent[], assetId: string): AuditEvent[] {
  return events
    .filter((e) => e.assetId === assetId)
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export function computeAuditEventsByLayer(events: AuditEvent[], layer: GovernanceLayer): AuditEvent[] {
  return events.filter((e) => e.layer === layer);
}

export interface LayerCoverage {
  layer: GovernanceLayer;
  readinessPercent: number;
}

export function computeLayerReadiness(input: {
  useCases: UseCase[];
  dataSources: DataSource[];
  models: ModelRecord[];
  securityControls: SecurityControl[];
  privacyControls: PrivacyControl[];
  agents: Agent[];
  humanReviews: HumanReview[];
  incidents: IncidentRecord[];
  complianceMappings: ComplianceMapping[];
}): LayerCoverage[] {
  const inventoryReadiness = averagePercent(input.useCases.map((u) => statusScore(u.evidenceStatus)));
  const dataFoundation = computeDataGovernancePosture(input.dataSources).readinessPercent;
  const modelLifecycle = computeModelLifecyclePosture(input.models).readinessPercent;
  const security = computeSecurityPosture(input.securityControls, input.privacyControls).readinessPercent;
  const accessControl = averagePercent(
    input.useCases.map((u) => (u.evidenceDetail.policy_boundary_evidence ? 1 : 0))
  );
  const agentGovernance = computeAgentGovernancePosture(input.agents).readinessPercent;
  const oversight = averagePercent(
    input.humanReviews.map((r) => (r.decision === "approved_for_next_stage" ? 1 : r.decision === "escalated" ? 0.5 : 0))
  );
  const compliance = computeComplianceReadiness(input.complianceMappings).readinessPercent;

  return [
    { layer: "ai_inventory", readinessPercent: inventoryReadiness },
    { layer: "data_foundation", readinessPercent: dataFoundation },
    { layer: "model_lifecycle", readinessPercent: modelLifecycle },
    { layer: "data_security_privacy", readinessPercent: security },
    { layer: "access_control", readinessPercent: accessControl },
    { layer: "agent_governance", readinessPercent: agentGovernance },
    { layer: "human_oversight", readinessPercent: oversight },
    { layer: "compliance_audit", readinessPercent: compliance },
  ];
}
