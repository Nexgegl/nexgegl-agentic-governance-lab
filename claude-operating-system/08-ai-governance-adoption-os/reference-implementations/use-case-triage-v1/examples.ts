/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable regression examples derived from the six example patterns in:
 * claude-operating-system/08-ai-governance-adoption-os/02-use-case-triage-algorithm.md
 *
 * These examples validate expected modes and review outcomes.
 * They do not replace the specification examples.
 *
 * Includes one additional regression case for governed deterministic external automation.
 */

import { triageUseCase } from "./triage";
import type { TriageInput, TriageRecommendedMode, ReviewOutcome } from "./types";

export interface TriageExample {
  name: string;
  input: Partial<TriageInput>;
  expected_recommended_mode: TriageRecommendedMode;
  expected_review_outcome: ReviewOutcome;
}

export const examples: TriageExample[] = [
  {
    name: "Low-Value Manual Request",
    input: {
      use_case_name: "Ad hoc formatting request",
      business_owner: "Ops Team Lead",
      problem_statement: "Occasional request to reformat a small internal note",
      expected_outcome: "Reformatted note",
      decision_relevance: "low",
      volume_frequency: "low",
      known_process_owner: true,
    },
    expected_recommended_mode: "NO_AI",
    expected_review_outcome: "PASS",
  },
  {
    name: "Clear Rules and High Repeatability",
    input: {
      use_case_name: "Invoice field extraction",
      business_owner: "Finance Ops Manager",
      problem_statement: "Repetitive extraction of fixed fields from standard invoices",
      expected_outcome: "Structured invoice data",
      repeatability: "high",
      rule_clarity: "high",
      variation_complexity: "low",
      known_process_owner: true,
    },
    expected_recommended_mode: "AUTOMATION",
    expected_review_outcome: "PASS",
  },
  {
    name: "Drafting Assistant",
    input: {
      use_case_name: "Executive summary drafting",
      business_owner: "Strategy Director",
      problem_statement: "Draft first-pass executive summaries from source reports",
      expected_outcome: "Draft summary for human review",
      human_approval_required: true,
      variation_complexity: "medium",
      known_process_owner: true,
    },
    expected_recommended_mode: "AUGMENTATION",
    expected_review_outcome: "PASS",
  },
  {
    name: "Agent With Write Tool Missing Audit",
    input: {
      use_case_name: "Automated record updater",
      business_owner: "Data Ops Lead",
      problem_statement: "Agent proposed to write directly to production database",
      expected_outcome: "Updated records",
      tool_access_required: "write",
      audit_required: false,
      known_process_owner: true,
    },
    expected_recommended_mode: "AGENT",
    expected_review_outcome: "FAIL",
  },
  {
    name: "Multi-Agent Review Loop",
    input: {
      use_case_name: "Cross-functional deal review",
      business_owner: "Revenue Operations Director",
      problem_statement: "Coordinated legal, finance, and risk review of a deal package",
      expected_outcome: "Consolidated review recommendation",
      requires_multi_role_reasoning: true,
      known_process_owner: true,
    },
    expected_recommended_mode: "MULTI_AGENT_SYSTEM",
    expected_review_outcome: "ESCALATE",
  },
  {
    name: "Governed Runtime Candidate",
    input: {
      use_case_name: "Autonomous client-facing collections agent",
      business_owner: "Collections Director",
      problem_statement: "Agent proposed to autonomously negotiate and execute payment plans",
      expected_outcome: "Executed payment plan actions",
      requires_runtime_controls: true,
      audit_required: true,
      known_process_owner: true,
    },
    expected_recommended_mode: "GOVERNED_RUNTIME",
    expected_review_outcome: "ESCALATE",
  },
  {
    name: "Governed Deterministic External Automation",
    input: {
      use_case_name: "Invoice due reminder",
      business_owner: "Finance Ops Manager",
      problem_statement: "Send due-date reminders through an external system using clear rules",
      expected_outcome: "Audited reminders sent based on due date and status",
      decision_relevance: "low",
      process_clarity: "high",
      repeatability: "high",
      rule_clarity: "high",
      data_sensitivity: "medium",
      data_readiness: "high",
      evidence_availability: "sufficient",
      authority_clarity: "clear",
      human_approval_required: false,
      external_action_required: true,
      tool_access_required: "external_system",
      customer_impact: "medium",
      financial_impact: "medium",
      regulatory_or_legal_impact: "low",
      audit_required: true,
      volume_frequency: "high",
      variation_complexity: "low",
      requires_multi_role_reasoning: false,
      requires_runtime_controls: false,
      known_process_owner: true,
    },
    expected_recommended_mode: "AUTOMATION",
    expected_review_outcome: "PASS",
  },
];

export interface ExampleResult {
  name: string;
  expected_recommended_mode: TriageRecommendedMode;
  expected_review_outcome: ReviewOutcome;
  actual_recommended_mode: TriageRecommendedMode;
  actual_review_outcome: ReviewOutcome;
  pass: boolean;
}

export function runExamples(): ExampleResult[] {
  return examples.map((example) => {
    const output = triageUseCase(example.input);
    return {
      name: example.name,
      expected_recommended_mode: example.expected_recommended_mode,
      expected_review_outcome: example.expected_review_outcome,
      actual_recommended_mode: output.recommended_mode,
      actual_review_outcome: output.review_outcome,
      pass:
        output.recommended_mode === example.expected_recommended_mode &&
        output.review_outcome === example.expected_review_outcome,
    };
  });
}
