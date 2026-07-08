/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors the decision order in:
 * claude-operating-system/08-ai-governance-adoption-os/02-use-case-triage-algorithm.md
 *
 * This module does not create an official KFSA verdict, does not create
 * or approve an institutional decision, and does not call SDGM runtime.
 * SDGM is treated as doctrine/canon alignment only, referenced in
 * documentation, never invoked as a runtime dependency here.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This function's review_outcome is always one of PASS / FIX / FAIL / ESCALATE
 * and is never KFSA vocabulary.
 */

import type { TriageInput, TriageOutput, ReviewOutcome, RiskLevel } from "./types";

function isMissing(value: string | undefined): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

function baseOutput(overrides: Partial<TriageOutput> & Pick<TriageOutput, "recommended_mode" | "review_outcome" | "primary_reason">): TriageOutput {
  return {
    confidence_level: "medium",
    risk_level: "medium",
    missing_controls: [],
    required_evidence: [],
    required_authority: "",
    recommended_next_action: "",
    kfsa_gate_required: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: [],
    ...overrides,
  };
}

/**
 * triageUseCase
 *
 * Decision order (must match the specification exactly):
 * 1. Missing minimum fields => NO_AI + FAIL
 * 2. process_clarity low or known_process_owner false => PROCESS_REPAIR + FIX
 * 3. authority missing and decision relevance not low => NO_AI + FAIL
 * 4. high data sensitivity with low data readiness => NO_AI + FAIL
 * 5. external action without clear authority => NO_AI + FAIL
 * 6. regulatory_or_legal_impact high and authority not clear => NO_AI + ESCALATE
 * 7. evidence_availability none and decision_relevance high => NO_AI + FAIL
 * 8. requires_runtime_controls true:
 *    - audit_required false => GOVERNED_RUNTIME + FAIL
 *    - else => GOVERNED_RUNTIME + ESCALATE
 * 9. requires_multi_role_reasoning true => MULTI_AGENT_SYSTEM + ESCALATE
 * 10. deterministic automation with tool access already governed
 *     (high repeatability + high rule_clarity + low variation_complexity +
 *      clear authority + audit_required true) => AUTOMATION + PASS
 * 11. tool_access_required write/external_system:
 *    - audit_required false => AGENT + FAIL
 *    - else => AGENT + FIX
 * 12. high repeatability + high rule_clarity + low variation_complexity => AUTOMATION + PASS
 * 13. human_approval_required + medium/high variation_complexity => AUGMENTATION + PASS
 * 14. low volume_frequency + low decision_relevance => NO_AI + PASS
 * 15. default => WORKFLOW + FIX
 */
export function triageUseCase(input: Partial<TriageInput>): TriageOutput {
  // 1. Missing minimum fields => NO_AI + FAIL
  if (
    isMissing(input.use_case_name) ||
    isMissing(input.problem_statement) ||
    isMissing(input.expected_outcome) ||
    isMissing(input.business_owner)
  ) {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "FAIL",
      primary_reason: "minimum use case fields are incomplete",
      risk_level: "high",
      missing_controls: ["use_case_name", "business_owner", "problem_statement", "expected_outcome"].filter(
        (field) => isMissing((input as Record<string, string | undefined>)[field])
      ),
      recommended_next_action: "supply missing use case fields before re-triage",
    });
  }

  // 2. process_clarity low or known_process_owner false => PROCESS_REPAIR + FIX
  if (input.process_clarity === "low" || input.known_process_owner === false) {
    return baseOutput({
      recommended_mode: "PROCESS_REPAIR",
      review_outcome: "FIX",
      primary_reason: "underlying process is unclear or unowned",
      risk_level: "medium",
      recommended_next_action: "repair and assign ownership of the process before considering AI",
    });
  }

  // 3. authority missing and decision relevance not low => NO_AI + FAIL
  if (input.authority_clarity === "missing" && input.decision_relevance !== "low") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "FAIL",
      primary_reason: "authority missing for a decision-relevant use case",
      risk_level: "high",
      required_authority: "decision authority must be defined before proceeding",
      recommended_next_action: "define decision authority before re-triage",
    });
  }

  // 4. high data sensitivity with low data readiness => NO_AI + FAIL
  if (input.data_sensitivity === "high" && input.data_readiness === "low") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "FAIL",
      primary_reason: "high sensitivity data without adequate readiness",
      risk_level: "high",
      missing_controls: ["data_readiness"],
      recommended_next_action: "improve data readiness before re-triage",
    });
  }

  // 5. external action without clear authority => NO_AI + FAIL
  if (input.external_action_required === true && input.authority_clarity !== "clear") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "FAIL",
      primary_reason: "external action requested without clear authority",
      risk_level: "high",
      required_authority: "clear authority is required for external action",
      recommended_next_action: "define clear authority before re-triage",
    });
  }

  // 6. regulatory_or_legal_impact high and authority not clear => NO_AI + ESCALATE
  if (input.regulatory_or_legal_impact === "high" && input.authority_clarity !== "clear") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "ESCALATE",
      primary_reason: "high legal or regulatory impact requires clear authority",
      risk_level: "high",
      required_authority: "clear authority is required for high legal or regulatory impact",
      recommended_next_action: "escalate to legal, compliance, and decision authority before re-triage",
      kfsa_gate_required: true,
    });
  }

  // 7. evidence_availability none and decision_relevance high => NO_AI + FAIL
  if (input.evidence_availability === "none" && input.decision_relevance === "high") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "FAIL",
      primary_reason: "high decision relevance without evidence",
      risk_level: "high",
      required_evidence: ["traceable evidence is required before proceeding"],
      recommended_next_action: "supply evidence before re-triage",
    });
  }

  // 8. requires_runtime_controls => GOVERNED_RUNTIME
  if (input.requires_runtime_controls === true) {
    if (input.audit_required === false) {
      return baseOutput({
        recommended_mode: "GOVERNED_RUNTIME",
        review_outcome: "FAIL",
        primary_reason: "runtime enforcement controls required without audit",
        risk_level: "high",
        missing_controls: ["audit_required"],
        kfsa_gate_required: true,
        recommended_next_action: "define audit requirements before governance gate escalation",
      });
    }
    return baseOutput({
      recommended_mode: "GOVERNED_RUNTIME",
      review_outcome: "ESCALATE",
      primary_reason: "use case requires full governed runtime enforcement before execution",
      risk_level: "high",
      kfsa_gate_required: true,
      recommended_next_action: "escalate to governance gate algorithm and runtime reference architecture review",
    });
  }

  // 9. requires_multi_role_reasoning => MULTI_AGENT_SYSTEM + ESCALATE
  if (input.requires_multi_role_reasoning === true) {
    return baseOutput({
      recommended_mode: "MULTI_AGENT_SYSTEM",
      review_outcome: "ESCALATE",
      primary_reason: "coordinated multi-role reasoning required",
      risk_level: "medium",
      kfsa_gate_required: true,
      recommended_next_action: "escalate for multi-agent architecture and governance review",
    });
  }

  // 10. Deterministic external/write-tool action can remain AUTOMATION when rules
  // are clear, authority is clear, audit exists, and variation is low. This must be
  // checked before the AGENT branch so a governed, deterministic automation is not
  // misclassified as an ungoverned agent.
  if (
    input.repeatability === "high" &&
    input.rule_clarity === "high" &&
    input.variation_complexity === "low" &&
    input.authority_clarity === "clear" &&
    input.audit_required === true
  ) {
    return baseOutput({
      recommended_mode: "AUTOMATION",
      review_outcome: "PASS",
      primary_reason: "deterministic, repeatable, rule-based task",
      risk_level: input.tool_access_required === "external_system" ? "medium" : "low",
      confidence_level: "high",
      recommended_next_action:
        "implement rule-based automation with audit and authority controls; no model reasoning required",
    });
  }

  // 11. tool_access_required write/external_system => AGENT
  if (input.tool_access_required === "write" || input.tool_access_required === "external_system") {
    if (input.audit_required === false) {
      return baseOutput({
        recommended_mode: "AGENT",
        review_outcome: "FAIL",
        primary_reason: "write or external tool access without audit",
        risk_level: "high",
        missing_controls: ["audit_required"],
        kfsa_gate_required: true,
        recommended_next_action: "define audit requirements before granting tool access",
      });
    }
    return baseOutput({
      recommended_mode: "AGENT",
      review_outcome: "FIX",
      primary_reason: "agent authority and permission profile required",
      risk_level: "medium",
      kfsa_gate_required: true,
      recommended_next_action: "define agent authority profile, tool permissions, and escalation rules before proceeding",
    });
  }

  // 12. high repeatability + high rule_clarity + low variation_complexity => AUTOMATION + PASS
  if (
    input.repeatability === "high" &&
    input.rule_clarity === "high" &&
    input.variation_complexity === "low"
  ) {
    return baseOutput({
      recommended_mode: "AUTOMATION",
      review_outcome: "PASS",
      primary_reason: "deterministic, repeatable, rule-based task",
      risk_level: "low",
      confidence_level: "high",
      recommended_next_action: "implement rule-based automation; no model reasoning required",
    });
  }

  // 13. human_approval_required + medium/high variation_complexity => AUGMENTATION + PASS
  if (
    input.human_approval_required === true &&
    (input.variation_complexity === "medium" || input.variation_complexity === "high")
  ) {
    return baseOutput({
      recommended_mode: "AUGMENTATION",
      review_outcome: "PASS",
      primary_reason: "human remains decision-maker on variable work",
      risk_level: "low",
      confidence_level: "high",
      recommended_next_action: "deploy AI as thinking partner with mandatory human review",
    });
  }

  // 14. low volume_frequency + low decision_relevance => NO_AI + PASS
  if (input.volume_frequency === "low" && input.decision_relevance === "low") {
    return baseOutput({
      recommended_mode: "NO_AI",
      review_outcome: "PASS",
      primary_reason: "volume and decision relevance do not justify AI investment",
      risk_level: "low",
      recommended_next_action: "handle manually or defer",
    });
  }

  // 15. default => WORKFLOW + FIX
  return baseOutput({
    recommended_mode: "WORKFLOW",
    review_outcome: "FIX",
    primary_reason: "default to structured workflow definition",
    risk_level: "medium",
    recommended_next_action: "define workflow steps, owners, and handoffs before re-triage",
  });
}

export type { ReviewOutcome, RiskLevel };
