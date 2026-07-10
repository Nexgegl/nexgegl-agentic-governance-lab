/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not live
 * evidence enforcement. Not a document management system.
 *
 * Consumes the output shape produced by AI Governance Flow v1.0
 * (../ai-governance-flow-v1/), Eval & Grader Matrix v1.0
 * (../eval-grader-matrix-v1/), Governance Gate v1.0
 * (../governance-gate-v1/), and Agent Permission Schema v1.0
 * (../agent-permission-schema-v1/), i.e. the result of running:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *     -> runEvalGraderMatrix(input) -> runGovernanceGate(input)
 *     -> validateAgentPermissions(input)
 *
 * No Evidence, No Institutional Recognition.
 * Agent Action != Approved Institutional Action.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as a review outcome.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type EvidenceReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type EvidenceRiskLevel = "low" | "medium" | "high";

export type EvidenceSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvidenceRequirementStatus = "present" | "missing" | "not_required";

export type KfsaReference = "external_applied_verdict_interface_only";

export interface EvidencePackInput {
  use_case_name: string;
  agent_name?: string;
  owner_evidence?: boolean;
  authority_evidence?: boolean;
  business_justification_evidence?: boolean;
  data_scope_evidence?: boolean;
  data_sensitivity_evidence?: boolean;
  tool_permission_evidence?: boolean;
  external_system_evidence?: boolean;
  audit_evidence?: boolean;
  policy_boundary_evidence?: boolean;
  approval_evidence?: boolean;
  escalation_evidence?: boolean;
  eval_evidence?: boolean;
  governance_gate_evidence?: boolean;
  agent_permission_evidence?: boolean;
  has_write_tools?: boolean;
  has_external_system_access?: boolean;
  external_data_movement?: boolean;
  autonomy_level?: "manual" | "assisted" | "supervised" | "autonomous";
  data_sensitivity?: "low" | "medium" | "high";
  risk_level?: EvidenceRiskLevel;
  eval_required?: boolean;
  governance_gate_required?: boolean;
  agent_permission_required?: boolean;
  production_intended?: boolean;
  decision_relevant?: boolean;
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
  notes?: string[];
}

export interface EvidenceItemRequirement {
  key: string;
  required: boolean;
  status: EvidenceRequirementStatus;
  severity: EvidenceSeverity;
  reason: string;
}

export interface EvidencePackOutput {
  use_case_name: string;
  agent_name?: string;
  requirements: EvidenceItemRequirement[];
  required_evidence_keys: string[];
  missing_evidence_keys: string[];
  present_evidence_keys: string[];
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface EvidenceFinding {
  severity: EvidenceSeverity;
  message: string;
  required_fix?: string;
}

export interface EvidencePackValidationInput {
  evidence_input: EvidencePackInput;
}

export interface EvidencePackValidationOutput {
  review_outcome: EvidenceReviewOutcome;
  findings: EvidenceFinding[];
  required_fixes: string[];
  blocking_failures: string[];
  escalation_reasons: string[];
  evidence_pack: EvidencePackOutput;
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface EvidencePackExample {
  name: string;
  input: EvidencePackValidationInput;
  expected_review_outcome: EvidenceReviewOutcome;
  expected_production_approval_status: false;
}

export interface EvidencePackExampleResult {
  name: string;
  expected_review_outcome: EvidenceReviewOutcome;
  actual_review_outcome: EvidenceReviewOutcome;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
