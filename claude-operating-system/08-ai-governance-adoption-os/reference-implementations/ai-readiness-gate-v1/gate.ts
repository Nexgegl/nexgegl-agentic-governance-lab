/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Consumes the output contract of:
 * claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/
 *
 * This module does not approve production use, does not create an official
 * KFSA verdict, and does not call SDGM runtime. SDGM is not referenced here
 * at all; KFSA is referenced only as an external applied verdict interface.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review_outcome is always one of PASS / FIX / FAIL / ESCALATE
 * and is never KFSA vocabulary. FIX is a valid review-control outcome here;
 * it is never treated as a KFSA verdict. production_approval_status is
 * always false.
 */

import type {
  AIReadinessGateInput,
  AIReadinessGateOutput,
  GateStatus,
  NextAllowedArtifact,
  ReviewOutcome,
} from "./types";

const VALID_REVIEW_OUTCOMES: ReviewOutcome[] = ["PASS", "FIX", "FAIL", "ESCALATE"];

const FORBIDDEN_KFSA_REVIEW_OUTCOME_VALUES = ["KILL", "SCALE", "ALERT"];

export function validateReviewOutcomeVocabulary(input: AIReadinessGateInput): {
  valid: boolean;
  forbiddenKfsaVocabulary: boolean;
} {
  const value = (input as unknown as Record<string, unknown>).review_outcome;
  if (typeof value === "string" && FORBIDDEN_KFSA_REVIEW_OUTCOME_VALUES.includes(value)) {
    return { valid: false, forbiddenKfsaVocabulary: true };
  }
  if (typeof value === "string" && VALID_REVIEW_OUTCOMES.includes(value as ReviewOutcome)) {
    return { valid: true, forbiddenKfsaVocabulary: false };
  }
  return { valid: false, forbiddenKfsaVocabulary: false };
}

export function detectForbiddenProductionApproval(input: AIReadinessGateInput): boolean {
  const anyInput = input as unknown as Record<string, unknown>;
  return anyInput.production_approval === true || anyInput.production_approval_status === true;
}

export function detectForbiddenOfficialDecision(input: AIReadinessGateInput): boolean {
  const anyInput = input as unknown as Record<string, unknown>;
  return (
    ("official_verdict" in anyInput && anyInput.official_verdict !== undefined) ||
    ("official_decision" in anyInput && anyInput.official_decision !== undefined)
  );
}

export function detectBlockingReasons(input: AIReadinessGateInput): string[] {
  return Array.isArray(input.blocking_controls) ? [...input.blocking_controls] : [];
}

interface GateDecision {
  gate_status: GateStatus;
  review_outcome: ReviewOutcome;
  forced_reasons: string[];
}

export function assignGateStatus(input: AIReadinessGateInput): GateDecision {
  const blockingReasons = detectBlockingReasons(input);

  // 1 & 2. Any attempt to claim production approval is blocked outright.
  if (detectForbiddenProductionApproval(input)) {
    return {
      gate_status: "BLOCKED",
      review_outcome: "FAIL",
      forced_reasons: ["Any attempt to use readiness score as production approval"],
    };
  }

  // 3. Any attempt to smuggle an official verdict or decision is blocked outright.
  if (detectForbiddenOfficialDecision(input)) {
    return {
      gate_status: "BLOCKED",
      review_outcome: "FAIL",
      forced_reasons: ["Any attempt to treat gate output as an official verdict or decision"],
    };
  }

  const vocabulary = validateReviewOutcomeVocabulary(input);

  // 4. KFSA-only vocabulary must never be used as review_outcome.
  if (vocabulary.forbiddenKfsaVocabulary) {
    return {
      gate_status: "BLOCKED",
      review_outcome: "FAIL",
      forced_reasons: ["KILL/SCALE/ALERT are KFSA-only vocabulary and must never be used as a review_outcome"],
    };
  }

  // 5. Unknown review_outcome values fail closed.
  if (!vocabulary.valid) {
    return {
      gate_status: "BLOCKED",
      review_outcome: "FAIL",
      forced_reasons: [`Unknown review_outcome value: ${String((input as unknown as Record<string, unknown>).review_outcome)}`],
    };
  }

  // 6. A prior FAIL review outcome blocks the gate regardless of band.
  if (input.review_outcome === "FAIL") {
    return { gate_status: "BLOCKED", review_outcome: "FAIL", forced_reasons: [] };
  }

  // 7. NOT_READY blocks the gate regardless of review_outcome.
  if (input.readiness_band === "NOT_READY") {
    return { gate_status: "BLOCKED", review_outcome: "FAIL", forced_reasons: [] };
  }

  // 8. REPAIR_REQUIRED allows repair unless blocking controls force FAIL.
  if (input.readiness_band === "REPAIR_REQUIRED") {
    if (blockingReasons.length > 0) {
      return { gate_status: "BLOCKED", review_outcome: "FAIL", forced_reasons: [] };
    }
    return { gate_status: "REPAIR_REQUIRED", review_outcome: "FIX", forced_reasons: [] };
  }

  // 9. EVAL_READY + PASS with no blocking controls allows eval.
  if (input.readiness_band === "EVAL_READY" && input.review_outcome === "PASS" && blockingReasons.length === 0) {
    return { gate_status: "EVAL_ALLOWED", review_outcome: "PASS", forced_reasons: [] };
  }

  // 10. GOVERNANCE_GATE_READY + PASS with no blocking controls allows governance review.
  if (
    input.readiness_band === "GOVERNANCE_GATE_READY" &&
    input.review_outcome === "PASS" &&
    blockingReasons.length === 0
  ) {
    return { gate_status: "GOVERNANCE_REVIEW_REQUIRED", review_outcome: "PASS", forced_reasons: [] };
  }

  // 11. ESCALATE band or ESCALATE review outcome routes to governance authority.
  if (input.readiness_band === "ESCALATE" || input.review_outcome === "ESCALATE") {
    return { gate_status: "ESCALATE_REQUIRED", review_outcome: "ESCALATE", forced_reasons: [] };
  }

  // 12. Any remaining non-empty blocking controls fail closed. Escalation is
  // already handled by rule 11 above, so review_outcome cannot be ESCALATE
  // by this point.
  if (blockingReasons.length > 0) {
    return { gate_status: "BLOCKED", review_outcome: "FAIL", forced_reasons: [] };
  }

  // 13. Fail closed by default for any combination not explicitly allowed above.
  return {
    gate_status: "BLOCKED",
    review_outcome: "FAIL",
    forced_reasons: ["No explicit gate rule allowed this combination of band and review outcome; failing closed"],
  };
}

export function assignNextAllowedArtifact(gateStatus: GateStatus): NextAllowedArtifact {
  switch (gateStatus) {
    case "EVAL_ALLOWED":
      return "EVAL_MATRIX";
    case "GOVERNANCE_REVIEW_REQUIRED":
      return "GOVERNANCE_GATE_REVIEW";
    case "ESCALATE_REQUIRED":
      return "ESCALATION_REVIEW";
    case "BLOCKED":
    case "REPAIR_REQUIRED":
    default:
      return "NONE";
  }
}

export function runAIReadinessGate(input: AIReadinessGateInput): AIReadinessGateOutput {
  const decision = assignGateStatus(input);
  const nextAllowedArtifact = assignNextAllowedArtifact(decision.gate_status);

  const blockingReasons =
    decision.gate_status === "BLOCKED" || decision.gate_status === "ESCALATE_REQUIRED"
      ? [...decision.forced_reasons, ...detectBlockingReasons(input)]
      : decision.gate_status === "REPAIR_REQUIRED"
        ? detectBlockingReasons(input)
        : [];

  const requiredRepairs =
    decision.gate_status === "BLOCKED" || decision.gate_status === "REPAIR_REQUIRED"
      ? Array.isArray(input.missing_controls)
        ? [...input.missing_controls]
        : []
      : [];

  return {
    gate_status: decision.gate_status,
    review_outcome: decision.review_outcome,
    production_approval_status: false,
    next_allowed_artifact: nextAllowedArtifact,
    blocking_reasons: blockingReasons,
    required_repairs: requiredRepairs,
    required_authority: input.required_authority ?? "",
    required_evidence: Array.isArray(input.required_evidence) ? [...input.required_evidence] : [],
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: Array.isArray(input.notes) ? [...input.notes] : [],
  };
}
