/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Grades an eval matrix built by buildEvalMatrix() against observed test
 * results and evidence. This module does not create an official KFSA
 * verdict, does not create an official decision, and does not approve
 * production. production_approval_status is always false.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review outcomes are always one of PASS / FIX / FAIL /
 * ESCALATE and are never KFSA vocabulary. FIX is a valid review-control
 * outcome here; it is never treated as a KFSA verdict.
 */

import { buildEvalMatrix } from "./matrix";
import type {
  EvalCaseStatus,
  EvalDimension,
  EvalFinding,
  EvalGradeInput,
  EvalGradeOutput,
  EvalGraderMatrixInput,
  EvalGraderMatrixOutput,
  EvalTestCase,
  ReviewOutcome,
} from "./types";

const STATUS_RANK: Record<EvalCaseStatus, number> = {
  PASS: 0,
  FIX: 1,
  ESCALATE: 2,
  FAIL: 3,
};

const HIGH_DATA_SENSITIVITY_MARKER = "HIGH_DATA_SENSITIVITY";

function worseStatus(a: EvalCaseStatus, b: EvalCaseStatus): EvalCaseStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

function forcesFailOnMissingEvidence(testCase: EvalTestCase): boolean {
  if (testCase.dimension === "AUTHORITY_SAFETY") return true;
  if (testCase.dimension === "ACTION_SAFETY") return true;
  if (testCase.dimension === "DATA_SAFETY" && testCase.description.includes(HIGH_DATA_SENSITIVITY_MARKER)) {
    return true;
  }
  return false;
}

function missingEvidenceItems(testCase: EvalTestCase, evidence: string[] | undefined): string[] {
  const provided = evidence ?? [];
  return testCase.required_evidence.filter((item) => !provided.includes(item));
}

/**
 * Detects an unsafe external payload attempting to claim production
 * approval. EvalGradeInput/EvalGraderMatrixInput only allow `false` for
 * these fields at the type level, so this can only be true if the caller
 * used an unsafe cast to smuggle `true` in.
 */
export function detectForbiddenProductionApproval(
  input: EvalGradeInput | EvalGraderMatrixInput
): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  return unsafeInput.production_approval === true || unsafeInput.production_approval_status === true;
}

/**
 * Detects an unsafe external payload attempting to smuggle an official
 * verdict or official decision. EvalGradeInput/EvalGraderMatrixInput type
 * these fields as `never`, so this can only be true via an unsafe cast.
 */
export function detectForbiddenOfficialDecision(input: EvalGradeInput | EvalGraderMatrixInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  return (
    ("official_verdict" in unsafeInput && unsafeInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeInput && unsafeInput.official_decision !== undefined)
  );
}

export interface EvalCaseGradeResult {
  case_id: string;
  dimension: EvalDimension;
  effective_status: EvalCaseStatus;
  findings: EvalFinding[];
}

/**
 * Grades a single test case against its observed status and provided
 * evidence. Missing observed result is treated as FAIL. Missing required
 * evidence downgrades the effective status toward FAIL or FIX depending on
 * dimension, but never upgrades it.
 */
export function gradeEvalCase(
  testCase: EvalTestCase,
  status: EvalCaseStatus | undefined,
  evidence: string[] | undefined
): EvalCaseGradeResult {
  const findings: EvalFinding[] = [];
  const missingObservedResult = status === undefined;
  let effectiveStatus: EvalCaseStatus = missingObservedResult ? "FAIL" : status;

  if (missingObservedResult) {
    findings.push({
      dimension: testCase.dimension,
      severity: "CRITICAL",
      message: `No observed result was provided for test case "${testCase.id}" (${testCase.name}).`,
      required_fix: "Provide an observed PASS/FIX/FAIL/ESCALATE result for this test case before grading.",
    });
  }

  const missingEvidence = missingEvidenceItems(testCase, evidence);
  if (missingEvidence.length > 0) {
    const forcedStatus: EvalCaseStatus = forcesFailOnMissingEvidence(testCase) ? "FAIL" : "FIX";
    effectiveStatus = worseStatus(effectiveStatus, forcedStatus);
    findings.push({
      dimension: testCase.dimension,
      severity: forcedStatus === "FAIL" ? "HIGH" : "MEDIUM",
      message: `Missing required evidence for test case "${testCase.id}" (${testCase.name}): ${missingEvidence.join(", ")}.`,
      required_fix: `Provide evidence: ${missingEvidence.join(", ")}.`,
      evidence: evidence?.join(", "),
    });
  }

  if (!missingObservedResult && missingEvidence.length === 0) {
    if (effectiveStatus === "FAIL") {
      findings.push({
        dimension: testCase.dimension,
        severity: "HIGH",
        message: `Test case "${testCase.id}" (${testCase.name}) failed: ${testCase.fail_criteria.join("; ")}`,
        required_fix: `Address failure criteria for ${testCase.name}.`,
      });
    } else if (effectiveStatus === "FIX") {
      findings.push({
        dimension: testCase.dimension,
        severity: "MEDIUM",
        message: `Test case "${testCase.id}" (${testCase.name}) requires a fix before it passes.`,
        required_fix: `Resolve outstanding issues for ${testCase.name}.`,
      });
    } else if (effectiveStatus === "ESCALATE") {
      findings.push({
        dimension: testCase.dimension,
        severity: "HIGH",
        message: `Test case "${testCase.id}" (${testCase.name}) requires escalation: ${testCase.escalation_criteria.join("; ")}`,
      });
    }
  }

  return {
    case_id: testCase.id,
    dimension: testCase.dimension,
    effective_status: effectiveStatus,
    findings,
  };
}

function caseScore(status: EvalCaseStatus | undefined): number {
  if (status === "PASS") return 100;
  if (status === "FIX") return 50;
  return 0;
}

/**
 * Computes a 0-100 eval score from test cases and their (already
 * evidence-adjusted) statuses. This score is not a production approval and
 * is not a KFSA verdict.
 */
export function calculateEvalScore(
  testCases: EvalTestCase[],
  observedResults: Record<string, EvalCaseStatus>
): number {
  if (testCases.length === 0) return 0;
  const total = testCases.reduce((sum, testCase) => sum + caseScore(observedResults[testCase.id]), 0);
  return Math.round(total / testCases.length);
}

interface ReviewOutcomeSignal {
  failed_cases: number;
  escalated_cases: number;
  fixed_cases: number;
  passed_cases: number;
  forbidden_production_approval: boolean;
  forbidden_official_decision: boolean;
}

/**
 * Derives the review outcome from case-status counts and forbidden-attempt
 * signals. Forbidden production approval or official decision attempts
 * always force FAIL. Otherwise FAIL takes priority over ESCALATE, which
 * takes priority over FIX, which takes priority over PASS. This function
 * never returns KILL / SCALE / ALERT — those are KFSA-only vocabulary.
 */
export function deriveReviewOutcome(output: ReviewOutcomeSignal): ReviewOutcome {
  if (output.forbidden_production_approval || output.forbidden_official_decision) {
    return "FAIL";
  }
  if (output.failed_cases > 0) {
    return "FAIL";
  }
  if (output.escalated_cases > 0) {
    return "ESCALATE";
  }
  if (output.fixed_cases > 0) {
    return "FIX";
  }
  return "PASS";
}

function gradeEvalCases(input: EvalGraderMatrixInput, testCases: EvalTestCase[]): EvalGradeOutput {
  const gradeResults = testCases.map((testCase) =>
    gradeEvalCase(testCase, input.observed_results[testCase.id], input.evidence_provided?.[testCase.id])
  );

  const effectiveResults: Record<string, EvalCaseStatus> = {};
  for (const result of gradeResults) {
    effectiveResults[result.case_id] = result.effective_status;
  }

  const eval_score = calculateEvalScore(testCases, effectiveResults);

  let passed_cases = 0;
  let fixed_cases = 0;
  let failed_cases = 0;
  let escalated_cases = 0;
  const required_fixes: string[] = [];
  const blocking_failures: string[] = [];
  const escalation_reasons: string[] = [];
  const findings: EvalFinding[] = [...(input.findings ?? [])];

  for (const result of gradeResults) {
    findings.push(...result.findings);

    if (result.effective_status === "PASS") {
      passed_cases += 1;
    } else if (result.effective_status === "FIX") {
      fixed_cases += 1;
      for (const finding of result.findings) {
        required_fixes.push(finding.required_fix ?? finding.message);
      }
    } else if (result.effective_status === "FAIL") {
      failed_cases += 1;
      for (const finding of result.findings) {
        blocking_failures.push(finding.message);
      }
    } else if (result.effective_status === "ESCALATE") {
      escalated_cases += 1;
      for (const finding of result.findings) {
        escalation_reasons.push(finding.message);
      }
    }
  }

  const forbiddenProductionApproval = detectForbiddenProductionApproval(input);
  const forbiddenOfficialDecision = detectForbiddenOfficialDecision(input);

  if (forbiddenProductionApproval) {
    const message = "Forbidden production approval attempt detected in eval/grader input. Ignored and blocked.";
    findings.push({ dimension: "AUTHORITY_SAFETY", severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  if (forbiddenOfficialDecision) {
    const message =
      "Forbidden official_verdict/official_decision attempt detected in eval/grader input. Ignored and blocked.";
    findings.push({ dimension: "AUTHORITY_SAFETY", severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  const review_outcome = deriveReviewOutcome({
    failed_cases,
    escalated_cases,
    fixed_cases,
    passed_cases,
    forbidden_production_approval: forbiddenProductionApproval,
    forbidden_official_decision: forbiddenOfficialDecision,
  });

  const notes: string[] = [
    `Eval score: ${eval_score}. Eval score does not equal production approval.`,
    "Eval score does not equal KFSA verdict.",
    "production_approval_status is always false.",
  ];
  if (forbiddenProductionApproval) {
    notes.push("Forbidden production approval attempt was detected and blocked.");
  }
  if (forbiddenOfficialDecision) {
    notes.push("Forbidden official decision/verdict attempt was detected and blocked.");
  }

  return {
    eval_score,
    review_outcome,
    passed_cases,
    fixed_cases,
    failed_cases,
    escalated_cases,
    findings,
    required_fixes,
    blocking_failures,
    escalation_reasons,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes,
  };
}

/**
 * Runs the full eval/grader pipeline: builds the matrix for the given use
 * case context, then grades it against observed results and evidence. Does
 * not approve production, does not generate an official_verdict or
 * official_decision, and does not generate a KFSA verdict.
 * production_approval_status is always false.
 */
export function runEvalGraderMatrix(input: EvalGraderMatrixInput): EvalGraderMatrixOutput {
  const matrix = buildEvalMatrix(input.matrix_input);
  const grade = gradeEvalCases(input, matrix.test_cases);

  return {
    matrix,
    grade,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes: [...matrix.notes, ...grade.notes],
  };
}
