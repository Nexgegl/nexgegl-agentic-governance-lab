/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors the scoring model in:
 * claude-operating-system/08-ai-governance-adoption-os/03-ai-readiness-scoring-model.md
 *
 * This module does not create an official KFSA verdict, does not approve
 * production use, and does not call SDGM runtime. SDGM is treated as
 * doctrine/canon alignment only, referenced in documentation, never invoked
 * as a runtime dependency here.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review_outcome is always one of PASS / FIX / FAIL / ESCALATE
 * and is never KFSA vocabulary. production_approval is always false.
 */

import type { AIReadinessInput, AIReadinessOutput, ReadinessBand, ReviewOutcome } from "./types";

export const CATEGORY_WEIGHTS = {
  use_case_clarity_score: 10,
  process_clarity_score: 10,
  data_readiness_score: 12,
  evidence_readiness_score: 12,
  authority_clarity_score: 12,
  eval_readiness_score: 10,
  security_boundary_score: 10,
  tool_permission_score: 8,
  auditability_score: 8,
  adoption_readiness_score: 5,
  cost_control_score: 3,
} as const;

export const SCORE_FIELDS = Object.keys(CATEGORY_WEIGHTS) as (keyof typeof CATEGORY_WEIGHTS)[];

export function getTotalWeight(): number {
  return SCORE_FIELDS.reduce((sum, field) => sum + CATEGORY_WEIGHTS[field], 0);
}

if (getTotalWeight() !== 100) {
  throw new Error("CATEGORY_WEIGHTS must sum to exactly 100");
}

const AGENTIC_MODES = new Set(["AGENT", "MULTI_AGENT_SYSTEM", "GOVERNED_RUNTIME"]);

function scoreOf(input: Partial<AIReadinessInput>, field: keyof typeof CATEGORY_WEIGHTS): number {
  const value = input[field];
  return typeof value === "number" ? value : 0;
}

export function calculateRawReadinessScore(input: Partial<AIReadinessInput>): number {
  const weightedSum = SCORE_FIELDS.reduce((sum, field) => {
    const categoryScore = scoreOf(input, field);
    const weight = CATEGORY_WEIGHTS[field];
    return sum + (categoryScore / 5) * weight;
  }, 0);
  return Math.round(weightedSum);
}

export function assignReadinessBand(score: number): ReadinessBand {
  if (score <= 39) return "NOT_READY";
  if (score <= 59) return "REPAIR_REQUIRED";
  if (score <= 74) return "EVAL_READY";
  if (score <= 89) return "GOVERNANCE_GATE_READY";
  return "ESCALATE";
}

interface ForcedFailure {
  triggered: boolean;
  reasons: string[];
}

function detectForcedFailures(input: Partial<AIReadinessInput>): ForcedFailure {
  const anyInput = input as Record<string, unknown>;
  const reasons: string[] = [];

  if (anyInput.production_approval === true) {
    reasons.push("Any attempt to use readiness score as production approval");
  }
  if ("kfsa_verdict" in anyInput || "kfsa_kill_fix_scale_alert" in anyInput) {
    reasons.push("Any attempt to treat score as KFSA verdict");
  }
  if (
    "kfsa_reference" in anyInput &&
    anyInput.kfsa_reference !== undefined &&
    anyInput.kfsa_reference !== "external_applied_verdict_interface_only"
  ) {
    reasons.push("Any attempt to treat score as KFSA verdict");
  }
  if (
    ("kfsa_scale_options" in anyInput || "kfsa_options" in anyInput) &&
    Array.isArray((anyInput.kfsa_scale_options as unknown) ?? anyInput.kfsa_options) &&
    !((anyInput.kfsa_scale_options as string[]) ?? (anyInput.kfsa_options as string[])).includes("ALERT")
  ) {
    reasons.push("Any attempt to drop ALERT from KFSA");
  }

  return { triggered: reasons.length > 0, reasons };
}

export function detectBlockingControls(input: Partial<AIReadinessInput>): string[] {
  const blocking: string[] = [];

  if (!input.business_owner) {
    blocking.push("Missing business owner");
  }
  if (!input.process_owner) {
    blocking.push("Missing process owner");
  }
  if (input.decision_relevant === true && !input.decision_owner) {
    blocking.push("Missing decision owner for decision-relevant use case");
  }
  if (input.data_sensitivity === "high" && !input.data_owner) {
    blocking.push("Missing data owner for sensitive data");
  }
  if (input.decision_relevant === true && scoreOf(input, "authority_clarity_score") < 3) {
    blocking.push("Authority score below 3 for decision-relevant use case");
  }
  if (input.risk_level === "high" && scoreOf(input, "evidence_readiness_score") < 3) {
    blocking.push("Evidence score below 3 for high decision relevance");
  }
  if (input.production_intended === true && scoreOf(input, "eval_readiness_score") < 2) {
    blocking.push("Eval readiness score below 2 for production-intended use");
  }
  if (input.data_sensitivity === "high" && scoreOf(input, "security_boundary_score") < 3) {
    blocking.push("Security boundary score below 3 for high data sensitivity");
  }
  if (
    (input.tool_access_required === "write" || input.tool_access_required === "external_system") &&
    scoreOf(input, "tool_permission_score") < 3
  ) {
    blocking.push(
      `Tool permission score below 3 for ${input.tool_access_required === "write" ? "write" : "external system"} tool access`
    );
  }
  if (scoreOf(input, "auditability_score") < 3) {
    const mode = input.triage_recommended_mode;
    if (mode === "AGENT") {
      blocking.push("Auditability score below 3 for agent use case");
    } else if (mode === "MULTI_AGENT_SYSTEM") {
      blocking.push("Auditability score below 3 for multi-agent use case");
    } else if (mode === "GOVERNED_RUNTIME") {
      blocking.push("Auditability score below 3 for governed runtime use case");
    } else if (input.external_action_required === true) {
      blocking.push("Auditability score below 3 for external action");
    }
  }
  if (input.regulatory_or_legal_impact === "high" && scoreOf(input, "authority_clarity_score") < 4) {
    blocking.push("Regulatory/legal impact high with authority score below 4");
  }

  const forced = detectForcedFailures(input);
  blocking.push(...forced.reasons);

  return blocking;
}

export function collectMissingControls(input: Partial<AIReadinessInput>): string[] {
  const missing: string[] = [];

  for (const field of SCORE_FIELDS) {
    const value = input[field];
    if (value === undefined) {
      missing.push(`${field} not provided`);
    } else if (value < 3) {
      missing.push(`${field} below recommended threshold (${value}/5)`);
    }
  }

  if (input.decision_relevant === true && !input.decision_owner) {
    missing.push("decision_owner not provided");
  }
  if (input.data_sensitivity === "high" && !input.data_owner) {
    missing.push("data_owner not provided");
  }
  if (input.missing_controls) {
    missing.push(...input.missing_controls);
  }

  return missing;
}

export function applyScoreCaps(
  score: number,
  input: Partial<AIReadinessInput>,
  blockingControls: string[]
): { score: number; appliedCap?: number } {
  const caps: number[] = [];

  if (!input.business_owner || !input.process_owner) {
    caps.push(59);
  }
  if (input.decision_relevant === true && scoreOf(input, "authority_clarity_score") < 3) {
    caps.push(39);
  }
  if (input.risk_level === "high" && scoreOf(input, "evidence_readiness_score") < 3) {
    caps.push(39);
  }
  if (input.external_action_required === true && scoreOf(input, "auditability_score") < 3) {
    caps.push(59);
  }
  if (
    (input.tool_access_required === "write" || input.tool_access_required === "external_system") &&
    scoreOf(input, "tool_permission_score") < 3
  ) {
    caps.push(59);
  }
  if (input.regulatory_or_legal_impact === "high" && scoreOf(input, "authority_clarity_score") < 4) {
    caps.push(39);
  }

  if (caps.length === 0) {
    return { score };
  }

  const cap = Math.min(...caps);
  if (cap < score) {
    return { score: cap, appliedCap: cap };
  }
  return { score };
}

export function assignReviewOutcome(
  score: number,
  band: ReadinessBand,
  input: Partial<AIReadinessInput>,
  blockingControls: string[]
): ReviewOutcome {
  const forced = detectForcedFailures(input);
  if (forced.triggered) {
    return "FAIL";
  }

  if (input.triage_review_outcome === "FAIL") {
    return "FAIL";
  }

  if (input.triage_review_outcome === "ESCALATE") {
    return "ESCALATE";
  }

  if (input.regulatory_or_legal_impact === "high" && scoreOf(input, "authority_clarity_score") < 4) {
    return "ESCALATE";
  }

  if (input.triage_recommended_mode && AGENTIC_MODES.has(input.triage_recommended_mode) &&
      (input.triage_recommended_mode === "MULTI_AGENT_SYSTEM" || input.triage_recommended_mode === "GOVERNED_RUNTIME")) {
    return "ESCALATE";
  }

  if (
    (input.customer_impact === "high" || input.financial_impact === "high") &&
    score >= 60
  ) {
    return "ESCALATE";
  }

  if (blockingControls.length > 0) {
    return "FAIL";
  }

  if (score >= 60) return "PASS";
  if (score >= 40) return "FIX";
  return "FAIL";
}

export function recommendNextAction(
  band: ReadinessBand,
  outcome: ReviewOutcome,
  blockingControls: string[]
): string {
  if (outcome === "ESCALATE") {
    return "Escalate to governance authority before proceeding";
  }
  if (outcome === "FAIL" && blockingControls.length > 0) {
    return "Do not proceed; repair the listed blocking controls before rescoring";
  }
  switch (band) {
    case "NOT_READY":
      return "Do not proceed; repair fundamentals before rescoring";
    case "REPAIR_REQUIRED":
      return "Repair missing controls and rescore";
    case "EVAL_READY":
      return "Proceed to Eval & Grader Matrix";
    case "GOVERNANCE_GATE_READY":
      return "Proceed to governance gate only after eval is complete";
    case "ESCALATE":
      return "Escalate to governance authority";
    default:
      return "Review readiness output before proceeding";
  }
}

export function scoreAIReadiness(input: Partial<AIReadinessInput>): AIReadinessOutput {
  const rawScore = calculateRawReadinessScore(input);
  const blockingControls = detectBlockingControls(input);
  const missingControls = collectMissingControls(input);
  const { score, appliedCap } = applyScoreCaps(rawScore, input, blockingControls);
  const band = assignReadinessBand(score);
  const outcome = assignReviewOutcome(score, band, input, blockingControls);
  const nextAction = recommendNextAction(band, outcome, blockingControls);

  const requiredEvidence: string[] = [];
  if (input.risk_level === "high" && scoreOf(input, "evidence_readiness_score") < 3) {
    requiredEvidence.push("traceable evidence is required before proceeding");
  }

  const requiredAuthority =
    input.decision_relevant === true && scoreOf(input, "authority_clarity_score") < 3
      ? "decision authority must be defined before proceeding"
      : "";

  const kfsaGateRequired =
    input.triage_recommended_mode === "AGENT" ||
    input.triage_recommended_mode === "MULTI_AGENT_SYSTEM" ||
    input.triage_recommended_mode === "GOVERNED_RUNTIME" ||
    outcome === "ESCALATE";

  return {
    readiness_score: score,
    readiness_band: band,
    review_outcome: outcome,
    recommended_next_action: nextAction,
    blocking_controls: blockingControls,
    missing_controls: missingControls,
    required_evidence: requiredEvidence,
    required_authority: requiredAuthority,
    kfsa_gate_required: kfsaGateRequired,
    kfsa_reference: "external_applied_verdict_interface_only",
    production_approval: false,
    applied_score_cap: appliedCap,
    notes: [],
  };
}
