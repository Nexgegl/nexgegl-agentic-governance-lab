/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable examples for Governance Gate v1.0, running:
 *   runGovernanceGate(input)
 * over combined AI Governance Flow v1.0 (../ai-governance-flow-v1/) and
 * Eval & Grader Matrix v1.0 (../eval-grader-matrix-v1/) output shapes.
 */

import { runGovernanceGate } from "./gate";
import type { GovernanceGateExample, GovernanceGateExampleResult, GovernanceGateInput } from "./types";

export const governanceGateExamples: GovernanceGateExample[] = [
  {
    name: "Ready For Authority Review",
    input: {
      use_case_name: "Invoice field extraction",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "PASS",
      eval_score: 95,
      authority_evidence_provided: true,
      evidence_package_provided: true,
      decision_relevant: false,
      production_intended: false,
    },
    expected_gate_status: "READY_FOR_AUTHORITY_REVIEW",
    expected_review_outcome: "PASS",
    expected_production_approval_status: false,
  },
  {
    name: "Blocked Due To Eval Fail",
    input: {
      use_case_name: "Automated contract clause approval",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "FAIL",
      eval_score: 40,
      eval_blocking_failures: ["AUTHORITY_SAFETY-01 failed: no confirmed decision authority."],
      authority_evidence_provided: true,
      evidence_package_provided: true,
    },
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Repair Required Due To Eval Fix",
    input: {
      use_case_name: "Customer support draft response",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "FIX",
      eval_score: 68,
      eval_required_fixes: ["Provide evidence: source_citation_log."],
      evidence_package_provided: true,
    },
    expected_gate_status: "REPAIR_REQUIRED",
    expected_review_outcome: "FIX",
    expected_production_approval_status: false,
  },
  {
    name: "Escalate Due To Eval Escalation",
    input: {
      use_case_name: "Cross-border compliance summary",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "ESCALATE",
      eval_score: 70,
      eval_escalation_reasons: ["Regulatory or legal impact detected — compliance review required."],
      evidence_package_provided: true,
    },
    expected_gate_status: "ESCALATE_REQUIRED",
    expected_review_outcome: "ESCALATE",
    expected_production_approval_status: false,
  },
  {
    name: "Blocked Due To Missing Authority Evidence",
    input: {
      use_case_name: "Automated deal approval",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "PASS",
      eval_score: 90,
      decision_relevant: true,
      authority_evidence_provided: false,
      evidence_package_provided: true,
    },
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Forbidden Production Approval Attempt",
    input: {
      use_case_name: "Invoice field extraction with forbidden approval",
      flow_final_status: "EVAL_ALLOWED",
      flow_final_review_outcome: "PASS",
      readiness_gate_status: "EVAL_ALLOWED",
      eval_review_outcome: "PASS",
      eval_score: 95,
      authority_evidence_provided: true,
      evidence_package_provided: true,
      decision_relevant: false,
      production_intended: false,
      // Unsafe external payload attempting to smuggle production approval.
      // GovernanceGateInput only types production_approval as `false`, so
      // this requires an unsafe cast to construct at all.
      production_approval: true,
    } as unknown as GovernanceGateInput,
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
];

export function runGovernanceGateExamples(): GovernanceGateExampleResult[] {
  return governanceGateExamples.map((example) => {
    const output = runGovernanceGate(example.input);
    return {
      name: example.name,
      expected_gate_status: example.expected_gate_status,
      actual_gate_status: output.gate_status,
      expected_review_outcome: example.expected_review_outcome,
      actual_review_outcome: output.review_outcome,
      expected_production_approval_status: example.expected_production_approval_status,
      actual_production_approval_status: output.production_approval_status,
      pass:
        output.gate_status === example.expected_gate_status &&
        output.review_outcome === example.expected_review_outcome &&
        output.production_approval_status === example.expected_production_approval_status,
    };
  });
}
