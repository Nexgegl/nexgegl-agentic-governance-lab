/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors the gate-interpretation intent described for AI Readiness Gate
 * Engine v1.0, consuming the output contract of:
 * claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as review_outcome values.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type ReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type ReadinessBand =
  | "NOT_READY"
  | "REPAIR_REQUIRED"
  | "EVAL_READY"
  | "GOVERNANCE_GATE_READY"
  | "ESCALATE";

export type GateStatus =
  | "BLOCKED"
  | "REPAIR_REQUIRED"
  | "EVAL_ALLOWED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED";

export type NextAllowedArtifact =
  | "NONE"
  | "EVAL_MATRIX"
  | "GOVERNANCE_GATE_REVIEW"
  | "ESCALATION_REVIEW";

export type KfsaReference = "external_applied_verdict_interface_only";

/**
 * Mirrors the AIReadinessOutput contract produced by
 * reference-implementations/ai-readiness-scoring-v1/score.ts.
 *
 * official_verdict and official_decision are declared as `never` so that
 * no well-typed caller can construct one. They exist only so gate.ts can
 * defensively detect an unsafe external payload that attempts to smuggle
 * one in via an `as unknown as AIReadinessGateInput` cast.
 */
export interface AIReadinessGateInput {
  readiness_score: number;
  readiness_band: ReadinessBand;
  review_outcome: ReviewOutcome;
  recommended_next_action?: string;
  blocking_controls?: string[];
  missing_controls?: string[];
  required_evidence?: string[];
  required_authority?: string;
  kfsa_gate_required?: boolean;
  kfsa_reference?: "external_applied_verdict_interface_only";
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
  notes?: string[];
}

export interface AIReadinessGateOutput {
  gate_status: GateStatus;
  review_outcome: ReviewOutcome;
  production_approval_status: false;
  next_allowed_artifact: NextAllowedArtifact;
  blocking_reasons: string[];
  required_repairs: string[];
  required_authority: string;
  required_evidence: string[];
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface GateExample {
  name: string;
  input: AIReadinessGateInput;
  expected_gate_status: GateStatus;
  expected_review_outcome: ReviewOutcome;
  expected_next_allowed_artifact: NextAllowedArtifact;
  expected_production_approval_status: false;
}

export interface GateExampleResult {
  name: string;
  expected_gate_status: GateStatus;
  actual_gate_status: GateStatus;
  expected_review_outcome: ReviewOutcome;
  actual_review_outcome: ReviewOutcome;
  expected_next_allowed_artifact: NextAllowedArtifact;
  actual_next_allowed_artifact: NextAllowedArtifact;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
