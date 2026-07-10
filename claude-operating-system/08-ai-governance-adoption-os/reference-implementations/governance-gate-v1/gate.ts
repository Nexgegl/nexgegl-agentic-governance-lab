/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Runs a post-eval governance gate over the combined output of AI
 * Governance Flow v1.0 and Eval & Grader Matrix v1.0:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *     -> runEvalGraderMatrix(input) -> runGovernanceGate(input)
 *
 * This module does not create an official KFSA verdict, does not create an
 * official decision, and does not approve production.
 * production_approval_status is always false. READY_FOR_AUTHORITY_REVIEW
 * means the case may be reviewed by the appropriate human authority — it is
 * never production approval.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review outcomes are always one of PASS / FIX / FAIL /
 * ESCALATE and are never KFSA vocabulary. FIX is a valid review-control
 * outcome here; it is never treated as a KFSA verdict.
 *
 * Fail-closed priority: FAIL > ESCALATE > FIX > PASS.
 */

import type { GovernanceGateInput, GovernanceGateOutput, GovernanceGateStatus, ReviewOutcome } from "./types";

/**
 * Detects an unsafe external payload attempting to claim production
 * approval. GovernanceGateInput only types these fields as `false` at the
 * type level, so this can only be true if the caller used an unsafe cast to
 * smuggle `true` in.
 */
export function detectForbiddenProductionApproval(input: GovernanceGateInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  return unsafeInput.production_approval === true || unsafeInput.production_approval_status === true;
}

/**
 * Detects an unsafe external payload attempting to smuggle an official
 * verdict or official decision. GovernanceGateInput types these fields as
 * `never`, so this can only be true via an unsafe cast.
 */
export function detectForbiddenOfficialDecision(input: GovernanceGateInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  return (
    ("official_verdict" in unsafeInput && unsafeInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeInput && unsafeInput.official_decision !== undefined)
  );
}

export function requiresAuthority(input: GovernanceGateInput): boolean {
  return (
    input.authority_required === true ||
    input.production_intended === true ||
    input.decision_relevant === true ||
    input.regulatory_or_legal_impact === "medium" ||
    input.regulatory_or_legal_impact === "high" ||
    input.customer_impact === "high" ||
    input.financial_impact === "high"
  );
}

export function requiresEvidencePackage(input: GovernanceGateInput): boolean {
  return (
    input.evidence_package_required === true ||
    input.production_intended === true ||
    input.eval_review_outcome === "FIX" ||
    input.eval_review_outcome === "FAIL" ||
    input.eval_review_outcome === "ESCALATE" ||
    (input.eval_required_fixes ?? []).length > 0 ||
    (input.eval_blocking_failures ?? []).length > 0 ||
    (input.eval_escalation_reasons ?? []).length > 0
  );
}

interface GateDecision {
  gate_status: GovernanceGateStatus;
  review_outcome: ReviewOutcome;
  reasons: string[];
  required_actions: string[];
  escalation_reasons: string[];
}

function decideGate(
  input: GovernanceGateInput,
  forbiddenProductionApproval: boolean,
  forbiddenOfficialDecision: boolean
): GateDecision {
  const authorityRequired = requiresAuthority(input);
  const evidencePackageRequired = requiresEvidencePackage(input);
  const authorityMissing = authorityRequired && input.authority_evidence_provided !== true;
  const evidencePackageMissing = evidencePackageRequired && input.evidence_package_provided !== true;

  const blockingFailures = input.eval_blocking_failures ?? [];
  const requiredFixes = input.eval_required_fixes ?? [];
  const escalationReasons = input.eval_escalation_reasons ?? [];

  // FAIL tier: fail-closed conditions, checked first. FAIL outranks
  // ESCALATE, FIX, and PASS.
  const failReasons: string[] = [];
  const failActions: string[] = [];

  if (forbiddenProductionApproval) {
    failReasons.push("Forbidden production approval attempt detected in governance gate input.");
  }
  if (forbiddenOfficialDecision) {
    failReasons.push("Forbidden official_verdict/official_decision attempt detected in governance gate input.");
  }
  if (input.flow_final_status === "BLOCKED") {
    failReasons.push("Upstream AI Governance Flow final_status is BLOCKED.");
  }
  if (input.flow_final_review_outcome === "FAIL") {
    failReasons.push("Upstream AI Governance Flow final_review_outcome is FAIL.");
  }
  if (input.eval_review_outcome === "FAIL") {
    failReasons.push("Eval & Grader Matrix review_outcome is FAIL.");
  }
  if (blockingFailures.length > 0) {
    failReasons.push("Eval & Grader Matrix reported blocking failures.");
    failActions.push(...blockingFailures);
  }
  if (authorityMissing) {
    failReasons.push("Authority evidence is required but was not provided.");
    failActions.push("Provide confirmed authority evidence before re-review.");
  }

  if (failReasons.length > 0) {
    return {
      gate_status: "BLOCKED",
      review_outcome: "FAIL",
      reasons: failReasons,
      required_actions: failActions,
      escalation_reasons: [],
    };
  }

  // ESCALATE tier: outranks FIX and PASS.
  const escalateReasons: string[] = [];
  const gateEscalationReasons: string[] = [];

  if (input.flow_final_status === "ESCALATE_REQUIRED" || input.flow_final_review_outcome === "ESCALATE") {
    escalateReasons.push("Upstream AI Governance Flow requires escalation.");
  }
  if (input.eval_review_outcome === "ESCALATE" || escalationReasons.length > 0) {
    escalateReasons.push("Eval & Grader Matrix requires escalation.");
    gateEscalationReasons.push(...escalationReasons);
  }

  if (escalateReasons.length > 0) {
    return {
      gate_status: "ESCALATE_REQUIRED",
      review_outcome: "ESCALATE",
      reasons: escalateReasons,
      required_actions: [],
      escalation_reasons: gateEscalationReasons,
    };
  }

  // FIX tier: outranks PASS.
  const fixReasons: string[] = [];
  const fixActions: string[] = [];

  if (evidencePackageMissing) {
    fixReasons.push("Evidence package is required but was not provided.");
    fixActions.push("Provide the required evidence package before re-review.");
  }
  if (input.eval_review_outcome === "FIX" || requiredFixes.length > 0) {
    fixReasons.push("Eval & Grader Matrix requires fixes before proceeding.");
    fixActions.push(...requiredFixes);
  }

  if (fixReasons.length > 0) {
    return {
      gate_status: "REPAIR_REQUIRED",
      review_outcome: "FIX",
      reasons: fixReasons,
      required_actions: fixActions,
      escalation_reasons: [],
    };
  }

  // PASS tier: all fail-closed, escalation, and fix conditions cleared.
  if (input.flow_final_status === "GOVERNANCE_REVIEW_REQUIRED") {
    return {
      gate_status: "GOVERNANCE_REVIEW_REQUIRED",
      review_outcome: "PASS",
      reasons: ["Upstream AI Governance Flow requires governance review; all other gate conditions pass."],
      required_actions: [],
      escalation_reasons: [],
    };
  }

  return {
    gate_status: "READY_FOR_AUTHORITY_REVIEW",
    review_outcome: "PASS",
    reasons: ["All gate conditions pass. Case is ready for human authority review."],
    required_actions: [],
    escalation_reasons: [],
  };
}

/**
 * Runs the post-eval governance gate. Does not approve production, does
 * not generate an official_verdict or official_decision, and does not
 * generate a KFSA verdict. production_approval_status is always false.
 * READY_FOR_AUTHORITY_REVIEW means the case may be reviewed by the
 * appropriate human authority — it is never production approval.
 */
export function runGovernanceGate(input: GovernanceGateInput): GovernanceGateOutput {
  const forbiddenProductionApproval = detectForbiddenProductionApproval(input);
  const forbiddenOfficialDecision = detectForbiddenOfficialDecision(input);

  const decision = decideGate(input, forbiddenProductionApproval, forbiddenOfficialDecision);

  const notes: string[] = [
    `Governance gate evaluated for use case: ${input.use_case_name}.`,
    "Governance Gate does not approve production.",
    "READY_FOR_AUTHORITY_REVIEW does not approve production.",
    "production_approval_status is always false.",
    ...(input.notes ?? []),
  ];
  if (forbiddenProductionApproval) {
    notes.push("Forbidden production approval attempt was detected and blocked.");
  }
  if (forbiddenOfficialDecision) {
    notes.push("Forbidden official decision/verdict attempt was detected and blocked.");
  }

  return {
    gate_status: decision.gate_status,
    review_outcome: decision.review_outcome,
    reasons: decision.reasons,
    required_actions: decision.required_actions,
    escalation_reasons: decision.escalation_reasons,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes,
  };
}
