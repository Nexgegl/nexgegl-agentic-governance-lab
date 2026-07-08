/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors: claude-operating-system/08-ai-governance-adoption-os/02-use-case-triage-algorithm.md
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

export type RiskLevel = "low" | "medium" | "high";

export type LowMediumHigh = "low" | "medium" | "high";

export type EvidenceAvailability = "none" | "partial" | "sufficient";

export type AuthorityClarity = "missing" | "unclear" | "clear";

export type ToolAccessRequired = "none" | "read_only" | "write" | "external_system";

export type NoneLowMediumHigh = "none" | "low" | "medium" | "high";

export interface TriageInput {
  use_case_id?: string;
  use_case_name?: string;
  business_owner?: string;
  problem_statement?: string;
  expected_outcome?: string;
  decision_relevance?: LowMediumHigh;
  process_clarity?: LowMediumHigh;
  repeatability?: LowMediumHigh;
  rule_clarity?: LowMediumHigh;
  data_sensitivity?: LowMediumHigh;
  data_readiness?: LowMediumHigh;
  evidence_availability?: EvidenceAvailability;
  authority_clarity?: AuthorityClarity;
  human_approval_required?: boolean;
  external_action_required?: boolean;
  tool_access_required?: ToolAccessRequired;
  customer_impact?: NoneLowMediumHigh;
  financial_impact?: NoneLowMediumHigh;
  regulatory_or_legal_impact?: NoneLowMediumHigh;
  audit_required?: boolean;
  volume_frequency?: LowMediumHigh;
  variation_complexity?: LowMediumHigh;
  requires_multi_role_reasoning?: boolean;
  requires_runtime_controls?: boolean;
  known_process_owner?: boolean;
}

export interface TriageOutput {
  recommended_mode: TriageRecommendedMode;
  review_outcome: ReviewOutcome;
  confidence_level: RiskLevel;
  primary_reason: string;
  risk_level: RiskLevel;
  missing_controls: string[];
  required_evidence: string[];
  required_authority: string;
  recommended_next_action: string;
  kfsa_gate_required: boolean;
  kfsa_reference: "external_applied_verdict_interface_only";
  notes: string[];
}

export interface ValidationIssue {
  field: string;
  issue: string;
  severity: "FIX" | "FAIL";
}
