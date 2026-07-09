/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Consumes the output shape produced by AI Governance Flow v1.0
 * (../ai-governance-flow-v1/), i.e. the result of running:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as a review outcome.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type EvalDimension =
  | "ACCURACY"
  | "GROUNDING"
  | "AUTHORITY_SAFETY"
  | "DATA_SAFETY"
  | "ACTION_SAFETY"
  | "AUDITABILITY"
  | "BUSINESS_FIT"
  | "FAILURE_HANDLING";

export type ReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type EvalSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvalCaseStatus = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type KfsaReference = "external_applied_verdict_interface_only";

export interface EvalTestCase {
  id: string;
  name: string;
  dimension: EvalDimension;
  description: string;
  required_evidence: string[];
  pass_criteria: string[];
  fail_criteria: string[];
  escalation_criteria: string[];
  audit_required: boolean;
}

export interface EvalFinding {
  dimension: EvalDimension;
  severity: EvalSeverity;
  message: string;
  required_fix?: string;
  evidence?: string;
}

export interface EvalMatrixInput {
  use_case_name: string;
  flow_final_status: string;
  flow_final_review_outcome: ReviewOutcome;
  gate_status: string;
  risk_level?: "low" | "medium" | "high";
  data_sensitivity?: "low" | "medium" | "high";
  tool_access_required?: "none" | "read_only" | "write" | "external_system";
  decision_relevant?: boolean;
  production_intended?: boolean;
  regulatory_or_legal_impact?: "none" | "low" | "medium" | "high";
  customer_impact?: "none" | "low" | "medium" | "high";
  financial_impact?: "none" | "low" | "medium" | "high";
  audit_required?: boolean;
  required_evidence?: string[];
  notes?: string[];
}

export interface EvalMatrixOutput {
  test_cases: EvalTestCase[];
  required_dimensions: EvalDimension[];
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface EvalGradeInput {
  use_case_name: string;
  test_cases: EvalTestCase[];
  observed_results: Record<string, EvalCaseStatus>;
  evidence_provided?: Record<string, string[]>;
  findings?: EvalFinding[];
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
}

export interface EvalGradeOutput {
  eval_score: number;
  review_outcome: ReviewOutcome;
  passed_cases: number;
  fixed_cases: number;
  failed_cases: number;
  escalated_cases: number;
  findings: EvalFinding[];
  required_fixes: string[];
  blocking_failures: string[];
  escalation_reasons: string[];
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface EvalGraderMatrixInput {
  matrix_input: EvalMatrixInput;
  observed_results: Record<string, EvalCaseStatus>;
  evidence_provided?: Record<string, string[]>;
  findings?: EvalFinding[];
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
}

export interface EvalGraderMatrixOutput {
  matrix: EvalMatrixOutput;
  grade: EvalGradeOutput;
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface EvalExample {
  name: string;
  input: EvalGraderMatrixInput;
  expected_review_outcome: ReviewOutcome;
  expected_production_approval_status: false;
}

export interface EvalExampleResult {
  name: string;
  expected_review_outcome: ReviewOutcome;
  actual_review_outcome: ReviewOutcome;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
