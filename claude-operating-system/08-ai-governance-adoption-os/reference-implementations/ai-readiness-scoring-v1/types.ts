/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors: claude-operating-system/08-ai-governance-adoption-os/03-ai-readiness-scoring-model.md
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as review_outcome values.
 * FIX may appear only as a review-control outcome, not as a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type TriageRecommendedMode =
  | "NO_AI"
  | "PROCESS_REPAIR"
  | "AUTOMATION"
  | "AUGMENTATION"
  | "WORKFLOW"
  | "AGENT"
  | "MULTI_AGENT_SYSTEM"
  | "GOVERNED_RUNTIME";

export type ReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type ReadinessBand =
  | "NOT_READY"
  | "REPAIR_REQUIRED"
  | "EVAL_READY"
  | "GOVERNANCE_GATE_READY"
  | "ESCALATE";

export type RiskLevel = "low" | "medium" | "high";

export type ImpactLevel = "none" | "low" | "medium" | "high";

export type ToolAccessRequired = "none" | "read_only" | "write" | "external_system";

export type KfsaReference = "external_applied_verdict_interface_only";

export interface AIReadinessInput {
  use_case_id?: string;
  use_case_name?: string;
  triage_recommended_mode?: TriageRecommendedMode;
  triage_review_outcome?: ReviewOutcome;
  business_owner?: string;
  process_owner?: string;
  decision_owner?: string;
  data_owner?: string;
  use_case_clarity_score?: number;
  process_clarity_score?: number;
  data_readiness_score?: number;
  evidence_readiness_score?: number;
  authority_clarity_score?: number;
  eval_readiness_score?: number;
  security_boundary_score?: number;
  tool_permission_score?: number;
  auditability_score?: number;
  adoption_readiness_score?: number;
  cost_control_score?: number;
  risk_level?: RiskLevel;
  data_sensitivity?: RiskLevel;
  external_action_required?: boolean;
  tool_access_required?: ToolAccessRequired;
  regulatory_or_legal_impact?: ImpactLevel;
  customer_impact?: ImpactLevel;
  financial_impact?: ImpactLevel;
  missing_controls?: string[];
  decision_relevant?: boolean;
  production_intended?: boolean;
}

export interface AIReadinessOutput {
  readiness_score: number;
  readiness_band: ReadinessBand;
  review_outcome: ReviewOutcome;
  recommended_next_action: string;
  blocking_controls: string[];
  missing_controls: string[];
  required_evidence: string[];
  required_authority: string;
  kfsa_gate_required: boolean;
  kfsa_reference: KfsaReference;
  production_approval: false;
  applied_score_cap?: number;
  notes: string[];
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: "FIX" | "FAIL";
}
