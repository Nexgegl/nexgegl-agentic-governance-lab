/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Consumes the output shape produced by AI Governance Flow v1.0
 * (../ai-governance-flow-v1/) and Eval & Grader Matrix v1.0
 * (../eval-grader-matrix-v1/), i.e. the result of running:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *     -> runEvalGraderMatrix(input)
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as a review outcome.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type GovernanceGateStatus =
  | "BLOCKED"
  | "REPAIR_REQUIRED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED"
  | "READY_FOR_AUTHORITY_REVIEW";

export type ReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type KfsaReference = "external_applied_verdict_interface_only";

export interface GovernanceGateInput {
  use_case_name: string;
  flow_final_status: string;
  flow_final_review_outcome: ReviewOutcome;
  readiness_gate_status?: string;
  eval_review_outcome: ReviewOutcome;
  eval_score: number;
  eval_required_fixes?: string[];
  eval_blocking_failures?: string[];
  eval_escalation_reasons?: string[];
  authority_required?: boolean;
  authority_evidence_provided?: boolean;
  evidence_package_required?: boolean;
  evidence_package_provided?: boolean;
  production_intended?: boolean;
  decision_relevant?: boolean;
  regulatory_or_legal_impact?: "none" | "low" | "medium" | "high";
  customer_impact?: "none" | "low" | "medium" | "high";
  financial_impact?: "none" | "low" | "medium" | "high";
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
  notes?: string[];
}

export interface GovernanceGateOutput {
  gate_status: GovernanceGateStatus;
  review_outcome: ReviewOutcome;
  reasons: string[];
  required_actions: string[];
  escalation_reasons: string[];
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface GovernanceGateExample {
  name: string;
  input: GovernanceGateInput;
  expected_gate_status: GovernanceGateStatus;
  expected_review_outcome: ReviewOutcome;
  expected_production_approval_status: false;
}

export interface GovernanceGateExampleResult {
  name: string;
  expected_gate_status: GovernanceGateStatus;
  actual_gate_status: GovernanceGateStatus;
  expected_review_outcome: ReviewOutcome;
  actual_review_outcome: ReviewOutcome;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
