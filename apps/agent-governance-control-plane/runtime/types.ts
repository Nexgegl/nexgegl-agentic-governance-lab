/**
 * Domain model for the Governed Research Runtime — the first governed agent
 * execution vertical slice of the NEXGEGL AI Governance Operating System.
 *
 * This is NOT a general-purpose autonomous agent runtime. Every skill, tool,
 * action, evidence item, and state transition is bounded by authority,
 * policy, auditability, and human oversight. No run in this runtime can ever
 * produce an official_decision, an official_verdict, a KFSA verdict, or a
 * production approval. production_approval_status is always false.
 *
 * Reuses the existing platform vocabulary (GateStatus, RiskLevel,
 * DataSensitivity, Department) from lib/governance-model.ts rather than
 * inventing a parallel one, so the runtime speaks the same governance
 * language as the rest of the product.
 */

import type { DataSensitivity, Department, GateStatus, RiskLevel } from "@/lib/governance-model";

/**
 * Review outcomes in this runtime (and across the platform) are PASS, FIX,
 * FAIL, ESCALATE only. This is NOT KFSA. KFSA remains an external judgment
 * with its own distinct vocabulary: KILL / FIX / SCALE / ALERT. KFSA's FIX
 * is not this ReviewOutcome's FIX — the two vocabularies are never merged,
 * and this runtime never generates a KFSA verdict. ALERT is never dropped
 * wherever the external KFSA vocabulary is referenced.
 */
export type ReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type RunStatus =
  | "SUBMITTED"
  | "PLANNING"
  | "WAITING_FOR_SKILL_APPROVAL"
  | "WAITING_FOR_TOOL_APPROVAL"
  | "EXECUTING"
  | "EVALUATING"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED"
  | "REPAIR_REQUIRED"
  | "BLOCKED"
  | "READY_FOR_AUTHORITY_REVIEW"
  | "COMPLETED_WITHOUT_DECISION"
  | "FAILED";

export type StopReason =
  | "COMPLETED"
  | "MAX_STEPS_REACHED"
  | "MAX_TOOL_CALLS_REACHED"
  | "LOOP_DETECTED"
  | "NO_PROGRESS"
  | "POLICY_BLOCK"
  | "AUTHORITY_REQUIRED"
  | "HUMAN_REVIEW_REQUIRED"
  | "EVIDENCE_INSUFFICIENT"
  | "TOOL_FAILURE";

// --- Governed Research Request ----------------------------------------------

export interface GovernedResearchRequest {
  id: string;
  titleAr: string;
  researchQuestionAr: string;
  businessPurposeAr: string;
  department: Department;
  requester: string;
  owner: string;
  riskLevel: RiskLevel;
  dataSensitivity: DataSensitivity;
  requiresExternalAccess: boolean;
  requiresWriteAction: boolean;
  authorityHolder: string;
  maxSteps: number;
  maxToolCalls: number;
  submittedAt: string;
}

// --- Skills -----------------------------------------------------------------

export type SkillSourceType = "INTERNAL" | "OFFICIAL_VENDOR" | "COMMUNITY" | "CUSTOM_ADAPTED";

export type SkillReviewStatus = "UNREVIEWED" | "UNDER_REVIEW" | "APPROVED_FOR_DEMO" | "REPAIR_REQUIRED" | "BLOCKED" | "RETIRED";

export type SkillActionType = "READ" | "ANALYSIS" | "GENERATION" | "WRITE";

export type SkillReversibility = "REVERSIBLE" | "IRREVERSIBLE" | "NOT_APPLICABLE";

export interface SkillRiskProfile {
  writeCapability: boolean;
  externalSystemAccess: boolean;
  dataSensitivityHandled: DataSensitivity;
  requiresHumanApproval: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  nameAr: string;
  version: string;
  description: string;
  descriptionAr: string;
  sourceType: SkillSourceType;
  sourceReference: string;
  category: string;
  triggerConditions: string[];
  requiredTools: string[];
  allowedDataClasses: DataSensitivity[];
  prohibitedDataClasses: DataSensitivity[];
  requiredAuthority: boolean;
  actionType: SkillActionType;
  reversibility: SkillReversibility;
  externalSystemAccess: boolean;
  writeCapability: boolean;
  auditRequired: boolean;
  humanApprovalRequired: boolean;
  riskLevel: RiskLevel;
  reviewStatus: SkillReviewStatus;
  /** Must default to false. A skill may not execute unless this is true AND its checksum matches the reviewed version. */
  approvedForUse: boolean;
  checksum: string;
  lastReviewed: string;
  reviewer: string;
  instructions: string[];
  riskProfile: SkillRiskProfile;
}

export interface SkillVersion {
  skillId: string;
  version: string;
  checksum: string;
  reviewedAt: string;
}

// --- Skill intake / review ----------------------------------------------------

export type SkillReviewOutcome = ReviewOutcome;

export interface SkillIntakeSubmission {
  skillName: string;
  sourceUrl: string;
  sourceType: SkillSourceType;
  descriptionAr: string;
  requiredTools: string[];
  dataCategories: DataSensitivity[];
  writeCapability: boolean;
  externalAccess: boolean;
  requiresAuthority: boolean;
  auditRequired: boolean;
  humanApprovalRequired: boolean;
  /** Free-text procedural instructions submitted for quality scanning — optional. */
  rawInstructionsAr?: string;
}

export interface SkillIntakeResult {
  outcome: SkillReviewOutcome;
  riskLevel: RiskLevel;
  findingsAr: string[];
  requiredFixesAr: string[];
  approvedForUse: boolean;
  allowedTools: string[];
  prohibitedActionsAr: string[];
  requiredHumanAuthority: boolean;
}

// --- Tools --------------------------------------------------------------------

export type ToolType =
  | "WEB_SEARCH"
  | "DOCUMENT_RETRIEVAL"
  | "INTERNAL_DATA_LOOKUP"
  | "CALCULATOR"
  | "REPORT_GENERATOR"
  | "EXTERNAL_API"
  | "WRITE_ACTION";

export type ApprovalMode = "NONE" | "PRE_APPROVAL" | "PER_CALL_APPROVAL" | "HUMAN_CONFIRMATION" | "FORBIDDEN";

export type ReadWriteClass = "READ_ONLY" | "WRITE";

export interface ToolDefinition {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  toolType: ToolType;
  system: string;
  actionType: SkillActionType;
  readWriteClass: ReadWriteClass;
  dataClasses: DataSensitivity[];
  externalAccess: boolean;
  requiredAuthority: boolean;
  approvalMode: ApprovalMode;
  reversible: boolean;
  auditRequired: boolean;
  maxCallsPerRun: number;
  enabled: boolean;
  demoOnly: boolean;
}

export interface ToolPermission {
  toolId: string;
  runId: string;
  granted: boolean;
  reasonAr: string;
}

export interface ToolCall {
  id: string;
  runId: string;
  stepId: string;
  toolId: string;
  skillId: string;
  arguments: Record<string, string>;
  startedAt: string;
  endedAt: string;
  status: "SUCCESS" | "FAILED" | "REFUSED";
  resultSummaryAr: string;
  rawResultReference: string;
  evidenceIds: string[];
  approvalEvidenceAr: string;
  policyFindingAr: string;
}

export interface ToolResult {
  toolCallId: string;
  summaryAr: string;
  dataReference: string;
}

// --- Plan -----------------------------------------------------------------------

export interface PlanStep {
  stepId: string;
  objectiveAr: string;
  skillId: string;
  toolIds: string[];
  expectedEvidenceAr: string;
  requiredAuthority: boolean;
  blockingConditionsAr: string[];
  completionConditionAr: string;
}

export interface ExecutionPlan {
  requestId: string;
  objectiveAr: string;
  classification: string;
  steps: PlanStep[];
  maxSteps: number;
  maxToolCalls: number;
  evaluationRequired: boolean;
  stopConditionsAr: string[];
  rejectedAr: string[];
}

// --- Evidence ---------------------------------------------------------------------

export type EvidenceSourceQuality = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type EvidenceProvenanceStatus = "SIMULATED_DEMO_SOURCE" | "UNVERIFIED" | "VERIFIED";

export type EvidenceFreshnessStatus = "CURRENT" | "STALE" | "UNKNOWN";

export type EvidenceReviewerStatus = "UNREVIEWED" | "ACCEPTED_FOR_REVIEW" | "REJECTED" | "REQUIRES_ESCALATION";

export interface EvidenceItem {
  id: string;
  runId: string;
  sourceType: ToolType;
  sourceReference: string;
  title: string;
  titleAr: string;
  summaryAr: string;
  capturedAt: string;
  capturedByTool: string;
  capturedBySkill: string;
  dataClassification: DataSensitivity;
  provenanceStatus: EvidenceProvenanceStatus;
  freshnessStatus: EvidenceFreshnessStatus;
  sourceQuality: EvidenceSourceQuality;
  relevanceScore: number;
  integrityStatus: "INTACT" | "UNVERIFIABLE";
  reviewerStatus: EvidenceReviewerStatus;
}

// --- Execution trace ------------------------------------------------------------

export type TraceStage =
  | "REQUEST_RECEIVED"
  | "PLAN_CREATED"
  | "SKILL_SELECTED"
  | "TOOL_SELECTED"
  | "PERMISSION_CHECK"
  | "TOOL_CALL"
  | "RESULT_REFERENCE"
  | "EVIDENCE_CREATED"
  | "EVALUATION_RESULT"
  | "GOVERNANCE_FINDING"
  | "RETRY"
  | "STOP"
  | "HUMAN_REVIEW_TRANSITION";

export interface ExecutionTraceEntry {
  id: string;
  runId: string;
  timestamp: string;
  stage: TraceStage;
  actor: string;
  action: string;
  actionAr: string;
  inputReference: string;
  outputReference: string;
  summaryAr: string;
  status: "OK" | "WARNING" | "BLOCKED";
  policyReference: string;
  evidenceIds: string[];
}

// --- Evaluation -------------------------------------------------------------------

export type EvaluationDimension =
  | "ACCURACY"
  | "GROUNDING"
  | "AUTHORITY_SAFETY"
  | "DATA_SAFETY"
  | "ACTION_SAFETY"
  | "AUDITABILITY"
  | "BUSINESS_FIT"
  | "FAILURE_HANDLING";

export interface EvaluationResult {
  dimension: EvaluationDimension;
  score: number;
  outcome: ReviewOutcome;
  findingsAr: string[];
  evidenceIds: string[];
  requiredFixesAr: string[];
  blockingFailuresAr: string[];
  escalationReasonsAr: string[];
}

// --- Loop control -------------------------------------------------------------------

export interface LoopControlState {
  stepsTaken: number;
  toolCallsMade: number;
  maxSteps: number;
  maxToolCalls: number;
  retries: number;
  retryLimit: number;
  toolCallSignatures: string[];
  evidenceSignatures: string[];
  lastProgressStep: number;
  stopReason: StopReason | null;
}

// --- Governance findings / gate --------------------------------------------------

export interface GovernanceFinding {
  id: string;
  runId: string;
  category: string;
  severity: "info" | "warning" | "critical";
  findingAr: string;
  relatedEvidenceIds: string[];
}

export interface GovernanceGateResult {
  status: GateStatus | "BLOCKED_PRE_EXECUTION";
  reasonAr: string;
  missingControlsAr: string[];
  /** Always false. This runtime never approves production. */
  production_approval_status: false;
}

// --- Human review ------------------------------------------------------------------

export type HumanReviewDecision = "approved_for_next_stage" | "returned_for_repair" | "escalated";

export interface HumanReviewRecord {
  runId: string;
  reviewer: string;
  reviewDate: string;
  decision: HumanReviewDecision;
  notesAr: string;
}

// --- Draft decision packet ----------------------------------------------------------

export interface DraftDecisionPacket {
  runId: string;
  requestSummaryAr: string;
  planSummaryAr: string;
  skillsUsed: string[];
  toolsUsed: string[];
  evidenceSummaryAr: string;
  evaluationSummaryAr: string;
  governanceFindingsAr: string[];
  unresolvedGapsAr: string[];
  humanReviewSummaryAr: string;
  recommendedNextActionAr: string;
  executionTraceReference: string;
  boundaryAr: string;
}

// --- Execution run -----------------------------------------------------------------

export interface ExecutionRun {
  runId: string;
  tenantId: string;
  requestId: string;
  requester: string;
  businessPurposeAr: string;
  submittedAt: string;
  status: RunStatus;
  request: GovernedResearchRequest;
  plan: ExecutionPlan | null;
  selectedSkills: string[];
  selectedTools: string[];
  toolCalls: ToolCall[];
  evidence: EvidenceItem[];
  trace: ExecutionTraceEntry[];
  evaluations: EvaluationResult[];
  findings: GovernanceFinding[];
  governanceGate: GovernanceGateResult | null;
  humanReview: HumanReviewRecord | null;
  decisionPacket: DraftDecisionPacket | null;
  loopControl: LoopControlState;
  stopReason: StopReason | null;
  retries: number;
  /** Always false — no run in this runtime ever approves production. */
  production_approval_status: false;
}
