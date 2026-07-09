/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Integrates the output contracts of:
 * ../use-case-triage-v1/
 * ../ai-readiness-scoring-v1/
 * ../ai-readiness-gate-v1/
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as a review outcome.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

import type { TriageInput, TriageOutput } from "../use-case-triage-v1/types";
import type { AIReadinessInput, AIReadinessOutput } from "../ai-readiness-scoring-v1/types";
import type { AIReadinessGateOutput, GateStatus } from "../ai-readiness-gate-v1/types";

export type FlowFinalStatus =
  | "BLOCKED"
  | "REPAIR_REQUIRED"
  | "EVAL_ALLOWED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED";

export type FlowReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type KfsaReference = "external_applied_verdict_interface_only";

/**
 * Broad input covering every field consumed by triageUseCase() and
 * scoreAIReadiness(). Extends both dependency input contracts directly so
 * the flow module never needs an `any` escape hatch.
 */
export interface AIGovernanceFlowInput extends TriageInput, AIReadinessInput {}

export interface AIGovernanceFlowOutput {
  triage: TriageOutput;
  readiness: AIReadinessOutput;
  gate: AIReadinessGateOutput;
  final_status: FlowFinalStatus;
  final_review_outcome: FlowReviewOutcome;
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface AIGovernanceFlowExample {
  name: string;
  input: AIGovernanceFlowInput;
  expected_final_status: FlowFinalStatus;
  expected_final_review_outcome: FlowReviewOutcome;
  expected_gate_status: GateStatus;
  expected_production_approval_status: false;
}

export interface AIGovernanceFlowExampleResult {
  name: string;
  expected_final_status: FlowFinalStatus;
  actual_final_status: FlowFinalStatus;
  expected_final_review_outcome: FlowReviewOutcome;
  actual_final_review_outcome: FlowReviewOutcome;
  expected_gate_status: GateStatus;
  actual_gate_status: GateStatus;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
