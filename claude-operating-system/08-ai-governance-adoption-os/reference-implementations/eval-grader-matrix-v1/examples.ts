/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Executable examples for Eval & Grader Matrix v1.0, running:
 *   buildEvalMatrix(input) -> gradeEvalCase(...) -> runEvalGraderMatrix(input)
 * against use cases that have already passed through AI Governance Flow
 * v1.0 (../ai-governance-flow-v1/).
 */

import { runEvalGraderMatrix } from "./grader";
import type {
  EvalCaseStatus,
  EvalExample,
  EvalExampleResult,
  EvalGraderMatrixInput,
  EvalMatrixInput,
} from "./types";

const baseMatrixInput: EvalMatrixInput = {
  use_case_name: "Invoice field extraction",
  flow_final_status: "EVAL_ALLOWED",
  flow_final_review_outcome: "PASS",
  gate_status: "EVAL_ALLOWED",
  risk_level: "low",
  data_sensitivity: "low",
  tool_access_required: "read_only",
  decision_relevant: false,
  production_intended: false,
  regulatory_or_legal_impact: "none",
  customer_impact: "low",
  financial_impact: "low",
  audit_required: false,
};

const fullEvidence: Record<string, string[]> = {
  "ACCURACY-01": ["accuracy_test_run_log"],
  "GROUNDING-01": ["source_citation_log"],
  "AUTHORITY_SAFETY-01": ["authority_boundary_confirmation"],
  "DATA_SAFETY-01": ["data_handling_review"],
  "AUDITABILITY-01": ["audit_trail_export"],
  "BUSINESS_FIT-01": ["business_owner_review"],
  "FAILURE_HANDLING-01": ["failure_mode_test_log"],
};

const allPassResults: Record<string, EvalCaseStatus> = {
  "ACCURACY-01": "PASS",
  "GROUNDING-01": "PASS",
  "AUTHORITY_SAFETY-01": "PASS",
  "DATA_SAFETY-01": "PASS",
  "AUDITABILITY-01": "PASS",
  "BUSINESS_FIT-01": "PASS",
  "FAILURE_HANDLING-01": "PASS",
};

export const evalExamples: EvalExample[] = [
  {
    name: "Eval All Pass",
    input: {
      matrix_input: baseMatrixInput,
      observed_results: allPassResults,
      evidence_provided: fullEvidence,
    },
    expected_review_outcome: "PASS",
    expected_production_approval_status: false,
  },
  {
    name: "Eval Fix Required Due To Missing Evidence",
    input: {
      matrix_input: baseMatrixInput,
      observed_results: allPassResults,
      evidence_provided: {
        ...fullEvidence,
        "GROUNDING-01": [],
      },
    },
    // GROUNDING-01 is observed PASS but its required evidence is missing.
    // GROUNDING is not an AUTHORITY_SAFETY/ACTION_SAFETY/high-sensitivity
    // DATA_SAFETY dimension, so missing evidence downgrades it to FIX only.
    expected_review_outcome: "FIX",
    expected_production_approval_status: false,
  },
  {
    name: "Eval Fail Due To Authority Safety",
    input: {
      matrix_input: {
        ...baseMatrixInput,
        use_case_name: "Automated contract clause approval",
        decision_relevant: true,
      },
      observed_results: {
        ...allPassResults,
        "AUTHORITY_SAFETY-01": "FAIL",
      },
      evidence_provided: fullEvidence,
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Eval Escalate Due To Regulatory Risk",
    input: {
      matrix_input: {
        ...baseMatrixInput,
        use_case_name: "Cross-border compliance summary",
        regulatory_or_legal_impact: "high",
      },
      observed_results: {
        ...allPassResults,
        "AUTHORITY_SAFETY-01": "ESCALATE",
      },
      evidence_provided: fullEvidence,
    },
    expected_review_outcome: "ESCALATE",
    expected_production_approval_status: false,
  },
  {
    name: "Forbidden Production Approval Attempt",
    input: {
      matrix_input: baseMatrixInput,
      observed_results: allPassResults,
      evidence_provided: fullEvidence,
      // Unsafe external payload attempting to smuggle production approval.
      // EvalGraderMatrixInput only types production_approval as `false`, so
      // this requires an unsafe cast to construct at all.
      production_approval: true,
    } as unknown as EvalGraderMatrixInput,
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
];

export function runEvalExamples(): EvalExampleResult[] {
  return evalExamples.map((example) => {
    const output = runEvalGraderMatrix(example.input);
    return {
      name: example.name,
      expected_review_outcome: example.expected_review_outcome,
      actual_review_outcome: output.grade.review_outcome,
      expected_production_approval_status: example.expected_production_approval_status,
      actual_production_approval_status: output.production_approval_status,
      pass:
        output.grade.review_outcome === example.expected_review_outcome &&
        output.production_approval_status === example.expected_production_approval_status,
    };
  });
}
