/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable examples for AI Governance Flow v1.0, running:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 */

import { runAIGovernanceFlow } from "./flow";
import type { AIGovernanceFlowExample, AIGovernanceFlowExampleResult, AIGovernanceFlowInput } from "./types";

export const flowExamples: AIGovernanceFlowExample[] = [
  {
    name: "No-AI Flow",
    input: {
      use_case_name: "Ad hoc formatting request",
      business_owner: "Ops Team Lead",
      process_owner: "Ops Team Lead",
      problem_statement: "Occasional request to reformat a small internal note",
      expected_outcome: "Reformatted note",
      decision_relevance: "low",
      volume_frequency: "low",
      known_process_owner: true,
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
      decision_relevant: false,
      production_intended: false,
    },
    expected_final_status: "EVAL_ALLOWED",
    expected_final_review_outcome: "PASS",
    expected_gate_status: "EVAL_ALLOWED",
    expected_production_approval_status: false,
  },
  {
    name: "Automation Eval Allowed Flow",
    input: {
      use_case_name: "Invoice field extraction",
      business_owner: "Finance Ops Manager",
      process_owner: "Finance Ops Manager",
      problem_statement: "Repetitive extraction of fixed fields from standard invoices",
      expected_outcome: "Structured invoice data",
      repeatability: "high",
      rule_clarity: "high",
      variation_complexity: "low",
      known_process_owner: true,
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
      decision_relevant: false,
      production_intended: false,
    },
    expected_final_status: "EVAL_ALLOWED",
    expected_final_review_outcome: "PASS",
    expected_gate_status: "EVAL_ALLOWED",
    expected_production_approval_status: false,
  },
  {
    name: "Agent Blocked Due To Audit/Tool Gap",
    input: {
      use_case_name: "Automated record updater",
      business_owner: "Data Ops Lead",
      process_owner: "Data Ops Lead",
      problem_statement: "Agent proposed to write directly to production database",
      expected_outcome: "Updated records",
      tool_access_required: "write",
      audit_required: false,
      known_process_owner: true,
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
      decision_relevant: true,
      production_intended: true,
    },
    // Proves FAIL propagates: triage AGENT+FAIL -> readiness forced FAIL -> gate BLOCKED+FAIL.
    expected_final_status: "BLOCKED",
    expected_final_review_outcome: "FAIL",
    expected_gate_status: "BLOCKED",
    expected_production_approval_status: false,
  },
  {
    name: "Multi-Agent Escalation Flow",
    input: {
      use_case_name: "Cross-functional deal review",
      business_owner: "Revenue Operations Director",
      process_owner: "Revenue Operations Director",
      decision_owner: "Revenue Operations Director",
      data_owner: "Revenue Operations Director",
      problem_statement: "Coordinated legal, finance, and risk review of a deal package",
      expected_outcome: "Consolidated review recommendation",
      requires_multi_role_reasoning: true,
      known_process_owner: true,
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
      regulatory_or_legal_impact: "medium",
      customer_impact: "high",
      financial_impact: "high",
      decision_relevant: true,
      production_intended: true,
    },
    // Proves ESCALATE propagates: triage MULTI_AGENT_SYSTEM+ESCALATE -> readiness forced
    // ESCALATE -> gate ESCALATE_REQUIRED+ESCALATE.
    expected_final_status: "ESCALATE_REQUIRED",
    expected_final_review_outcome: "ESCALATE",
    expected_gate_status: "ESCALATE_REQUIRED",
    expected_production_approval_status: false,
  },
  {
    // Intentionally valid eval-allowed flow with an unsafe external payload
    // attempting to smuggle production_approval: true before the gate stage.
    // This proves the flow propagates the forbidden attempt to the gate and
    // runAIReadinessGate blocks it, while final production_approval_status
    // remains false.
    name: "Forbidden Production Approval Must Remain Blocked",
    input: {
      use_case_name: "Invoice field extraction with forbidden approval",
      business_owner: "Finance Ops Manager",
      process_owner: "Finance Ops Manager",
      problem_statement: "Repetitive extraction of fixed fields from standard invoices",
      expected_outcome: "Structured invoice data",
      repeatability: "high",
      rule_clarity: "high",
      variation_complexity: "low",
      known_process_owner: true,
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
      decision_relevant: false,
      production_intended: false,
      production_approval: true,
    } as unknown as AIGovernanceFlowInput,
    expected_final_status: "BLOCKED",
    expected_final_review_outcome: "FAIL",
    expected_gate_status: "BLOCKED",
    expected_production_approval_status: false,
  },
];

export function runFlowExamples(): AIGovernanceFlowExampleResult[] {
  return flowExamples.map((example) => {
    const output = runAIGovernanceFlow(example.input);
    return {
      name: example.name,
      expected_final_status: example.expected_final_status,
      actual_final_status: output.final_status,
      expected_final_review_outcome: example.expected_final_review_outcome,
      actual_final_review_outcome: output.final_review_outcome,
      expected_gate_status: example.expected_gate_status,
      actual_gate_status: output.gate.gate_status,
      expected_production_approval_status: example.expected_production_approval_status,
      actual_production_approval_status: output.production_approval_status,
      pass:
        output.final_status === example.expected_final_status &&
        output.final_review_outcome === example.expected_final_review_outcome &&
        output.gate.gate_status === example.expected_gate_status &&
        output.production_approval_status === example.expected_production_approval_status,
    };
  });
}
