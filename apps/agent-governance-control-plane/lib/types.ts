/**
 * Domain types for the eight governance layers of the NEXGEGL AI Governance
 * Operating System MVP. Frontend-only, mock data. Extends the existing
 * governance-model.ts vocabulary (GateStatus, RiskLevel, EvidenceStatus,
 * etc.) rather than replacing it — the AI Inventory layer is the existing
 * UseCase model from governance-model.ts.
 */

import type { DataSensitivity, EvidenceStatus, RiskLevel, ToolAccessLevel, UseCase } from "./governance-model";

/** AI Inventory & Ownership layer — an AI asset is the existing UseCase record. */
export type AIAsset = UseCase;

export type LifecycleStage = "proposed" | "pilot" | "governed_runtime" | "retired";

export type GovernanceLayer =
  | "ai_inventory"
  | "data_foundation"
  | "model_lifecycle"
  | "data_security_privacy"
  | "access_control"
  | "agent_governance"
  | "human_oversight"
  | "compliance_audit";

// --- Layer 6: Agent Governance -------------------------------------------

export type AgentStatus = "active" | "suspended" | "under_review";

export interface Agent {
  id: string;
  name: string;
  nameAr: string;
  assetId: string;
  agentType: string;
  toolAccess: ToolAccessLevel;
  status: AgentStatus;
  ownerTeam: string;
  lastPermissionReview: string;
}

// --- Layer 3: Model Lifecycle ----------------------------------------------

export type ModelProvider = "OpenAI" | "Anthropic" | "Microsoft" | "Google" | "Open-source" | "Internal";

export type DataResidency = "in_country" | "regional" | "unknown";

export interface ModelRecord {
  id: string;
  name: string;
  provider: ModelProvider;
  version: string;
  usedByAssetIds: string[];
  dataResidency: DataResidency;
  evaluationStatus: EvidenceStatus;
  lastEvaluated: string;
  riskTier: RiskLevel;
  /** Always false — this platform never claims production approval for any model. */
  approvedForProduction: false;
}

// --- Vendors (supports Model Lifecycle + Data Foundation) ------------------

export type VendorRiskTier = "low" | "medium" | "high";
export type VendorContractStatus = "active" | "under_review" | "expired";

export interface VendorRecord {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  dataAccessLevel: DataSensitivity;
  contractStatus: VendorContractStatus;
  riskTier: VendorRiskTier;
  lastAssessed: string;
}

// --- Layer 2: Data Foundation -----------------------------------------------

export type DataSourceType = "structured" | "unstructured" | "document_repository" | "api_feed";

export interface DataSource {
  id: string;
  name: string;
  nameAr: string;
  type: DataSourceType;
  sensitivity: DataSensitivity;
  owner: string;
  usedByAssetIds: string[];
  classificationStatus: EvidenceStatus;
  lastClassified: string;
}

export interface DataLineageRecord {
  id: string;
  dataSourceId: string;
  assetId: string;
  flowDescriptionAr: string;
  flowDescription: string;
}

// --- Layer 4: Data Security & Privacy ---------------------------------------

export type SecurityControlCategory = "access" | "encryption" | "monitoring" | "network" | "secrets";

export interface SecurityControl {
  id: string;
  name: string;
  nameAr: string;
  category: SecurityControlCategory;
  status: EvidenceStatus;
  appliesToAssetIds: string[];
}

export type PrivacyControlCategory = "pii_minimization" | "consent" | "retention" | "anonymization";

export interface PrivacyControl {
  id: string;
  name: string;
  nameAr: string;
  category: PrivacyControlCategory;
  status: EvidenceStatus;
  appliesToAssetIds: string[];
}

// --- Evaluation ledger (Eval & Grader Matrix vocabulary) -------------------

export interface EvaluationRecord {
  id: string;
  assetId: string;
  evaluatedAt: string;
  score: number;
  outcome: "PASS" | "FIX" | "FAIL" | "ESCALATE";
  graderNotes: string;
  graderNotesAr: string;
}

// --- Layer 7: Human Oversight ------------------------------------------------

export type HumanReviewDecision = "approved_for_next_stage" | "returned_for_repair" | "escalated";

export interface HumanReview {
  id: string;
  assetId: string;
  reviewer: string;
  reviewDate: string;
  decision: HumanReviewDecision;
  notes: string;
  notesAr: string;
}

export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "investigating" | "resolved";

export interface IncidentRecord {
  id: string;
  assetId: string;
  title: string;
  titleAr: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedDate: string;
  resolvedDate?: string;
  summaryAr: string;
}

// --- Layer 8: Compliance & Audit ---------------------------------------------

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  actionAr: string;
  assetId?: string;
  layer: GovernanceLayer;
}

export interface ComplianceMapping {
  id: string;
  frameworkName: string;
  requirement: string;
  requirementAr: string;
  mappedControlIds: string[];
  status: EvidenceStatus;
}
