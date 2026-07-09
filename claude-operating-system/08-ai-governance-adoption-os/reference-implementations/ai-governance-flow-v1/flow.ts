/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Runs one integrated governance flow using the existing reference
 * implementations, without modifying any of them:
 *
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *
 * This module does not create an official KFSA verdict, does not create an
 * official decision, and does not call SDGM runtime. SDGM is not referenced
 * here at all; KFSA is referenced only as an external applied verdict
 * interface.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review outcomes are always one of PASS / FIX / FAIL /
 * ESCALATE and are never KFSA vocabulary. FIX is a valid review-control
 * outcome here; it is never treated as a KFSA verdict.
 * production_approval_status is always false.
 */

import { triageUseCase } from "../use-case-triage-v1/triage";
import type { TriageOutput } from "../use-case-triage-v1/types";
import { scoreAIReadiness } from "../ai-readiness-scoring-v1/score";
import type { AIReadinessInput, AIReadinessOutput } from "../ai-readiness-scoring-v1/types";
import { runAIReadinessGate } from "../ai-readiness-gate-v1/gate";
import type { AIReadinessGateInput, AIReadinessGateOutput } from "../ai-readiness-gate-v1/types";
import type { AIGovernanceFlowInput, AIGovernanceFlowOutput, FlowFinalStatus, FlowReviewOutcome } from "./types";

function hasRequiredUseCaseFields(input: AIGovernanceFlowInput): boolean {
  return Boolean(
    input.use_case_name && input.problem_statement && input.expected_outcome && input.business_owner
  );
}

function deriveUseCaseClarityScore(input: AIGovernanceFlowInput): number {
  return hasRequiredUseCaseFields(input) ? 3 : 0;
}

function deriveProcessClarityScore(resolvedProcessOwner: string | undefined, input: AIGovernanceFlowInput): number {
  return resolvedProcessOwner || input.known_process_owner === true ? 3 : 1;
}

function deriveDataReadinessScore(input: AIGovernanceFlowInput): number {
  return input.data_readiness === "high" || input.data_readiness === "medium" ? 3 : 1;
}

function deriveEvidenceReadinessScore(input: AIGovernanceFlowInput): number {
  if (input.evidence_availability === "sufficient") return 3;
  if (input.evidence_availability === "partial") return 2;
  return 0;
}

function deriveAuthorityClarityScore(input: AIGovernanceFlowInput): number {
  if (input.authority_clarity === "clear") return 4;
  if (input.authority_clarity === "unclear") return 2;
  return 0;
}

function deriveSecurityBoundaryScore(input: AIGovernanceFlowInput): number {
  return input.data_sensitivity === "high" ? 2 : 3;
}

function deriveToolPermissionScore(input: AIGovernanceFlowInput): number {
  return input.tool_access_required === "write" || input.tool_access_required === "external_system" ? 2 : 3;
}

function deriveAuditabilityScore(input: AIGovernanceFlowInput): number {
  if (input.audit_required === true) return 4;
  if (input.audit_required === false) return 1;
  return 2;
}

/**
 * Maps flow input plus the triage stage's output into the input contract
 * expected by scoreAIReadiness(). If explicit readiness score fields are
 * already present on the flow input, they are passed through unchanged;
 * otherwise conservative defaults are derived from the available triage
 * and flow fields.
 */
export function mapToReadinessInput(
  input: AIGovernanceFlowInput,
  triageOutput: TriageOutput
): AIReadinessInput {
  const resolvedProcessOwner = input.process_owner ?? input.business_owner;
  const decisionRelevant = input.decision_relevant ?? input.decision_relevance !== "low";

  return {
    use_case_id: input.use_case_id,
    use_case_name: input.use_case_name,
    triage_recommended_mode: triageOutput.recommended_mode,
    triage_review_outcome: triageOutput.review_outcome,
    business_owner: input.business_owner,
    process_owner: resolvedProcessOwner,
    decision_owner: input.decision_owner,
    data_owner: input.data_owner,
    use_case_clarity_score: input.use_case_clarity_score ?? deriveUseCaseClarityScore(input),
    process_clarity_score: input.process_clarity_score ?? deriveProcessClarityScore(resolvedProcessOwner, input),
    data_readiness_score: input.data_readiness_score ?? deriveDataReadinessScore(input),
    evidence_readiness_score: input.evidence_readiness_score ?? deriveEvidenceReadinessScore(input),
    authority_clarity_score: input.authority_clarity_score ?? deriveAuthorityClarityScore(input),
    eval_readiness_score: input.eval_readiness_score ?? 2,
    security_boundary_score: input.security_boundary_score ?? deriveSecurityBoundaryScore(input),
    tool_permission_score: input.tool_permission_score ?? deriveToolPermissionScore(input),
    auditability_score: input.auditability_score ?? deriveAuditabilityScore(input),
    adoption_readiness_score: input.adoption_readiness_score ?? 2,
    cost_control_score: input.cost_control_score ?? 2,
    risk_level: input.risk_level ?? triageOutput.risk_level,
    data_sensitivity: input.data_sensitivity,
    external_action_required: input.external_action_required,
    tool_access_required: input.tool_access_required,
    regulatory_or_legal_impact: input.regulatory_or_legal_impact,
    customer_impact: input.customer_impact,
    financial_impact: input.financial_impact,
    missing_controls: [...(input.missing_controls ?? []), ...triageOutput.missing_controls],
    decision_relevant: decisionRelevant,
    production_intended: input.production_intended ?? false,
  };
}

/**
 * Derives the final review outcome across all three stages.
 *
 * FAIL takes priority: any stage reporting FAIL forces the final outcome to
 * FAIL. Otherwise, any stage reporting ESCALATE forces the final outcome to
 * ESCALATE. Otherwise the gate status determines PASS or FIX. This module
 * never returns KILL / SCALE / ALERT; those are KFSA-only vocabulary.
 */
export function deriveFinalReviewOutcome(
  triageOutput: TriageOutput,
  readinessOutput: AIReadinessOutput,
  gateOutput: AIReadinessGateOutput
): FlowReviewOutcome {
  if (
    triageOutput.review_outcome === "FAIL" ||
    readinessOutput.review_outcome === "FAIL" ||
    gateOutput.review_outcome === "FAIL"
  ) {
    return "FAIL";
  }

  if (
    triageOutput.review_outcome === "ESCALATE" ||
    readinessOutput.review_outcome === "ESCALATE" ||
    gateOutput.review_outcome === "ESCALATE"
  ) {
    return "ESCALATE";
  }

  if (gateOutput.gate_status === "EVAL_ALLOWED" || gateOutput.gate_status === "GOVERNANCE_REVIEW_REQUIRED") {
    return "PASS";
  }

  if (gateOutput.gate_status === "REPAIR_REQUIRED") {
    return "FIX";
  }

  // Fail closed for any combination not explicitly allowed above.
  return "FAIL";
}

/**
 * The flow's final status mirrors the gate stage's status directly — the
 * gate is the last governance checkpoint in this reference flow.
 */
export function deriveFinalStatus(gateOutput: AIReadinessGateOutput): FlowFinalStatus {
  return gateOutput.gate_status;
}

export function runAIGovernanceFlow(input: AIGovernanceFlowInput): AIGovernanceFlowOutput {
  const triageOutput = triageUseCase(input);
  const readinessInput = mapToReadinessInput(input, triageOutput);
  const readinessOutput = scoreAIReadiness(readinessInput);

  const gateInput: AIReadinessGateInput = {
    readiness_score: readinessOutput.readiness_score,
    readiness_band: readinessOutput.readiness_band,
    review_outcome: readinessOutput.review_outcome,
    recommended_next_action: readinessOutput.recommended_next_action,
    blocking_controls: readinessOutput.blocking_controls,
    missing_controls: readinessOutput.missing_controls,
    required_evidence: readinessOutput.required_evidence,
    required_authority: readinessOutput.required_authority,
    kfsa_gate_required: readinessOutput.kfsa_gate_required,
    kfsa_reference: readinessOutput.kfsa_reference,
    production_approval: readinessOutput.production_approval,
    notes: readinessOutput.notes,
  };
  const gateOutput = runAIReadinessGate(gateInput);

  return {
    triage: triageOutput,
    readiness: readinessOutput,
    gate: gateOutput,
    final_status: deriveFinalStatus(gateOutput),
    final_review_outcome: deriveFinalReviewOutcome(triageOutput, readinessOutput, gateOutput),
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: [...triageOutput.notes, ...readinessOutput.notes, ...gateOutput.notes],
  };
}
