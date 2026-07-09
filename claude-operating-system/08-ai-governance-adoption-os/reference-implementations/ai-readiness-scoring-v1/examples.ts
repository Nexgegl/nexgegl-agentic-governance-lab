/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable examples mirroring the five example scoring cases in:
 * claude-operating-system/08-ai-governance-adoption-os/03-ai-readiness-scoring-model.md
 */

import { scoreAIReadiness } from "./score";
import type { AIReadinessInput, ReadinessBand, ReviewOutcome } from "./types";

export interface AIReadinessExample {
  name: string;
  input: Partial<AIReadinessInput>;
  expected_readiness_score: number;
  expected_readiness_band: ReadinessBand;
  expected_review_outcome: ReviewOutcome;
  expected_production_approval: false;
}

export const examples: AIReadinessExample[] = [
  {
    name: "No-AI Confirmed",
    input: {
      use_case_name: "Ad hoc formatting request",
      triage_recommended_mode: "NO_AI",
      triage_review_outcome: "PASS",
      business_owner: "Ops Team Lead",
      process_owner: "Ops Team Lead",
      use_case_clarity_score: 4,
      process_clarity_score: 4,
      data_readiness_score: 3,
      evidence_readiness_score: 3,
      authority_clarity_score: 3,
      eval_readiness_score: 2,
      security_boundary_score: 3,
      tool_permission_score: 3,
      auditability_score: 3,
      adoption_readiness_score: 3,
      cost_control_score: 3,
      risk_level: "low",
      data_sensitivity: "low",
      external_action_required: false,
      tool_access_required: "none",
      regulatory_or_legal_impact: "none",
      customer_impact: "none",
      financial_impact: "none",
      decision_relevant: false,
      production_intended: false,
    },
    expected_readiness_score: 62,
    expected_readiness_band: "EVAL_READY",
    expected_review_outcome: "PASS",
    expected_production_approval: false,
  },
  {
    name: "Process Repair Required",
    input: {
      use_case_name: "Undocumented approval workflow",
      triage_recommended_mode: "PROCESS_REPAIR",
      triage_review_outcome: "FIX",
      business_owner: "Ops Director",
      process_owner: undefined,
      use_case_clarity_score: 3,
      process_clarity_score: 1,
      data_readiness_score: 2,
      evidence_readiness_score: 2,
      authority_clarity_score: 2,
      eval_readiness_score: 1,
      security_boundary_score: 2,
      tool_permission_score: 2,
      auditability_score: 2,
      adoption_readiness_score: 2,
      cost_control_score: 2,
      risk_level: "low",
      data_sensitivity: "low",
      external_action_required: false,
      tool_access_required: "none",
      regulatory_or_legal_impact: "none",
      customer_impact: "none",
      financial_impact: "none",
      decision_relevant: false,
      production_intended: false,
    },
    expected_readiness_score: 38,
    expected_readiness_band: "NOT_READY",
    expected_review_outcome: "FAIL",
    expected_production_approval: false,
  },
  {
    name: "Automation Eval-Ready",
    input: {
      use_case_name: "Invoice field extraction",
      triage_recommended_mode: "AUTOMATION",
      triage_review_outcome: "PASS",
      business_owner: "Finance Ops Manager",
      process_owner: "Finance Ops Manager",
      decision_owner: "Finance Ops Manager",
      data_owner: "Finance Ops Manager",
      use_case_clarity_score: 5,
      process_clarity_score: 5,
      data_readiness_score: 4,
      evidence_readiness_score: 4,
      authority_clarity_score: 4,
      eval_readiness_score: 3,
      security_boundary_score: 4,
      tool_permission_score: 4,
      auditability_score: 4,
      adoption_readiness_score: 3,
      cost_control_score: 4,
      risk_level: "medium",
      data_sensitivity: "medium",
      external_action_required: false,
      tool_access_required: "none",
      regulatory_or_legal_impact: "none",
      customer_impact: "low",
      financial_impact: "low",
      decision_relevant: true,
      production_intended: true,
    },
    expected_readiness_score: 81,
    expected_readiness_band: "GOVERNANCE_GATE_READY",
    expected_review_outcome: "PASS",
    expected_production_approval: false,
  },
  {
    name: "Agent Not Ready Due to Tool Permission/Audit Gap",
    input: {
      use_case_name: "Automated record updater",
      triage_recommended_mode: "AGENT",
      triage_review_outcome: "FIX",
      business_owner: "Data Ops Lead",
      process_owner: "Data Ops Lead",
      decision_owner: "Data Ops Lead",
      use_case_clarity_score: 4,
      process_clarity_score: 3,
      data_readiness_score: 3,
      evidence_readiness_score: 3,
      authority_clarity_score: 3,
      eval_readiness_score: 2,
      security_boundary_score: 2,
      tool_permission_score: 2,
      auditability_score: 1,
      adoption_readiness_score: 2,
      cost_control_score: 2,
      risk_level: "medium",
      data_sensitivity: "medium",
      external_action_required: true,
      tool_access_required: "write",
      regulatory_or_legal_impact: "low",
      customer_impact: "low",
      financial_impact: "low",
      decision_relevant: true,
      production_intended: true,
    },
    expected_readiness_score: 52,
    expected_readiness_band: "REPAIR_REQUIRED",
    expected_review_outcome: "FAIL",
    expected_production_approval: false,
  },
  {
    name: "Multi-Agent / Governed Runtime Escalation",
    input: {
      use_case_name: "Cross-functional deal review",
      triage_recommended_mode: "MULTI_AGENT_SYSTEM",
      triage_review_outcome: "ESCALATE",
      business_owner: "Revenue Operations Director",
      process_owner: "Revenue Operations Director",
      decision_owner: "Revenue Operations Director",
      data_owner: "Revenue Operations Director",
      use_case_clarity_score: 4,
      process_clarity_score: 4,
      data_readiness_score: 4,
      evidence_readiness_score: 3,
      authority_clarity_score: 3,
      eval_readiness_score: 3,
      security_boundary_score: 4,
      tool_permission_score: 3,
      auditability_score: 4,
      adoption_readiness_score: 3,
      cost_control_score: 3,
      risk_level: "high",
      data_sensitivity: "medium",
      external_action_required: true,
      tool_access_required: "external_system",
      regulatory_or_legal_impact: "medium",
      customer_impact: "high",
      financial_impact: "high",
      decision_relevant: true,
      production_intended: true,
    },
    expected_readiness_score: 70,
    expected_readiness_band: "EVAL_READY",
    expected_review_outcome: "ESCALATE",
    expected_production_approval: false,
  },
];

export interface AIReadinessExampleResult {
  name: string;
  expected_readiness_score: number;
  actual_readiness_score: number;
  expected_readiness_band: ReadinessBand;
  actual_readiness_band: ReadinessBand;
  expected_review_outcome: ReviewOutcome;
  actual_review_outcome: ReviewOutcome;
  expected_production_approval: false;
  actual_production_approval: false;
  pass: boolean;
}

export function runExamples(): AIReadinessExampleResult[] {
  return examples.map((example) => {
    const output = scoreAIReadiness(example.input);
    return {
      name: example.name,
      expected_readiness_score: example.expected_readiness_score,
      actual_readiness_score: output.readiness_score,
      expected_readiness_band: example.expected_readiness_band,
      actual_readiness_band: output.readiness_band,
      expected_review_outcome: example.expected_review_outcome,
      actual_review_outcome: output.review_outcome,
      expected_production_approval: example.expected_production_approval,
      actual_production_approval: output.production_approval,
      pass:
        output.readiness_score === example.expected_readiness_score &&
        output.readiness_band === example.expected_readiness_band &&
        output.review_outcome === example.expected_review_outcome &&
        output.production_approval === example.expected_production_approval,
    };
  });
}
