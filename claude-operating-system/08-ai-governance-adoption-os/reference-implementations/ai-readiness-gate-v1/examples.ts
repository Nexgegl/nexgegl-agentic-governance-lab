/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable examples for AI Readiness Gate Engine v1.0, mirroring the
 * output contract of:
 * claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/
 */

import { runAIReadinessGate } from "./gate";
import type { AIReadinessGateInput, GateExample, GateExampleResult } from "./types";

export const gateExamples: GateExample[] = [
  {
    name: "No-AI Confirmed / Eval Allowed",
    input: {
      readiness_score: 62,
      readiness_band: "EVAL_READY",
      review_outcome: "PASS",
      production_approval: false,
    },
    expected_gate_status: "EVAL_ALLOWED",
    expected_review_outcome: "PASS",
    expected_next_allowed_artifact: "EVAL_MATRIX",
    expected_production_approval_status: false,
  },
  {
    name: "Process Repair Required / Blocked",
    input: {
      readiness_score: 38,
      readiness_band: "NOT_READY",
      review_outcome: "FAIL",
      blocking_controls: ["Missing process owner"],
      production_approval: false,
    },
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_next_allowed_artifact: "NONE",
    expected_production_approval_status: false,
  },
  {
    name: "Automation Governance Review Required",
    input: {
      readiness_score: 81,
      readiness_band: "GOVERNANCE_GATE_READY",
      review_outcome: "PASS",
      production_approval: false,
    },
    expected_gate_status: "GOVERNANCE_REVIEW_REQUIRED",
    expected_review_outcome: "PASS",
    expected_next_allowed_artifact: "GOVERNANCE_GATE_REVIEW",
    expected_production_approval_status: false,
  },
  {
    name: "Agent Not Ready Due to Tool Permission/Audit Gap",
    input: {
      readiness_score: 52,
      readiness_band: "REPAIR_REQUIRED",
      review_outcome: "FAIL",
      blocking_controls: [
        "Tool permission score below 3 for write tool access",
        "Auditability score below 3 for agent use case",
      ],
      production_approval: false,
    },
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_next_allowed_artifact: "NONE",
    expected_production_approval_status: false,
  },
  {
    name: "Multi-Agent Escalation Required",
    input: {
      readiness_score: 70,
      readiness_band: "EVAL_READY",
      review_outcome: "ESCALATE",
      production_approval: false,
    },
    expected_gate_status: "ESCALATE_REQUIRED",
    expected_review_outcome: "ESCALATE",
    expected_next_allowed_artifact: "ESCALATION_REVIEW",
    expected_production_approval_status: false,
  },
  {
    name: "Forbidden Production Approval Attempt",
    input: {
      readiness_score: 90,
      readiness_band: "ESCALATE",
      review_outcome: "ESCALATE",
      production_approval: true,
    } as unknown as AIReadinessGateInput,
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_next_allowed_artifact: "NONE",
    expected_production_approval_status: false,
  },
  {
    // Intentionally invalid ReviewOutcome. ALERT is KFSA-only vocabulary and
    // must never be accepted as a ReviewOutcome. Constructed as an unsafe
    // external payload cast to prove the gate blocks it at runtime while
    // keeping TypeScript strict mode passing (ReviewOutcome itself never
    // widens to include "ALERT").
    name: "Forbidden KFSA Vocabulary As ReviewOutcome",
    input: {
      readiness_score: 80,
      readiness_band: "GOVERNANCE_GATE_READY",
      review_outcome: "ALERT",
      production_approval: false,
    } as unknown as AIReadinessGateInput,
    expected_gate_status: "BLOCKED",
    expected_review_outcome: "FAIL",
    expected_next_allowed_artifact: "NONE",
    expected_production_approval_status: false,
  },
];

export function runGateExamples(): GateExampleResult[] {
  return gateExamples.map((example) => {
    const output = runAIReadinessGate(example.input);
    return {
      name: example.name,
      expected_gate_status: example.expected_gate_status,
      actual_gate_status: output.gate_status,
      expected_review_outcome: example.expected_review_outcome,
      actual_review_outcome: output.review_outcome,
      expected_next_allowed_artifact: example.expected_next_allowed_artifact,
      actual_next_allowed_artifact: output.next_allowed_artifact,
      expected_production_approval_status: example.expected_production_approval_status,
      actual_production_approval_status: output.production_approval_status,
      pass:
        output.gate_status === example.expected_gate_status &&
        output.review_outcome === example.expected_review_outcome &&
        output.next_allowed_artifact === example.expected_next_allowed_artifact &&
        output.production_approval_status === example.expected_production_approval_status,
    };
  });
}
