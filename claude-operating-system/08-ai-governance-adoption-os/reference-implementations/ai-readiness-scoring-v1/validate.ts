/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors the input validation intent of:
 * claude-operating-system/08-ai-governance-adoption-os/03-ai-readiness-scoring-model.md
 *
 * This module never accepts KILL / SCALE / ALERT as review_outcome values.
 * FIX is allowed only as a review-control outcome, not as a KFSA verdict.
 * KFSA vocabulary is referenced only in documentation/comments as an external
 * applied verdict interface, never redefined here.
 */

import type { AIReadinessInput, ValidationIssue } from "./types";

const VALID_TRIAGE_MODES = [
  "NO_AI",
  "PROCESS_REPAIR",
  "AUTOMATION",
  "AUGMENTATION",
  "WORKFLOW",
  "AGENT",
  "MULTI_AGENT_SYSTEM",
  "GOVERNED_RUNTIME",
];

const VALID_REVIEW_OUTCOMES = ["PASS", "FIX", "FAIL", "ESCALATE"];

const FORBIDDEN_REVIEW_OUTCOME_VALUES = ["KILL", "SCALE", "ALERT"];

const RISK_LEVEL_VALUES = ["low", "medium", "high"];

const IMPACT_LEVEL_VALUES = ["none", "low", "medium", "high"];

const TOOL_ACCESS_REQUIRED_VALUES = ["none", "read_only", "write", "external_system"];

const SCORE_FIELDS: (keyof AIReadinessInput)[] = [
  "use_case_clarity_score",
  "process_clarity_score",
  "data_readiness_score",
  "evidence_readiness_score",
  "authority_clarity_score",
  "eval_readiness_score",
  "security_boundary_score",
  "tool_permission_score",
  "auditability_score",
  "adoption_readiness_score",
  "cost_control_score",
];

const ENUM_FIELDS: { field: keyof AIReadinessInput; allowed: string[] }[] = [
  { field: "risk_level", allowed: RISK_LEVEL_VALUES },
  { field: "data_sensitivity", allowed: RISK_LEVEL_VALUES },
  { field: "regulatory_or_legal_impact", allowed: IMPACT_LEVEL_VALUES },
  { field: "customer_impact", allowed: IMPACT_LEVEL_VALUES },
  { field: "financial_impact", allowed: IMPACT_LEVEL_VALUES },
  { field: "tool_access_required", allowed: TOOL_ACCESS_REQUIRED_VALUES },
];

const BOOLEAN_FIELDS: (keyof AIReadinessInput)[] = [
  "external_action_required",
  "decision_relevant",
  "production_intended",
];

export function validateAIReadinessInput(input: Partial<AIReadinessInput>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const anyInput = input as Record<string, unknown>;

  if (typeof input.use_case_name !== "string" || input.use_case_name.trim().length === 0) {
    issues.push({
      field: "use_case_name",
      issue: "use_case_name is required and must be a non-empty string",
      severity: "FAIL",
    });
  }

  if (input.triage_recommended_mode === undefined) {
    issues.push({
      field: "triage_recommended_mode",
      issue: "triage_recommended_mode is required; scoring cannot occur without a prior triage outcome",
      severity: "FAIL",
    });
  } else if (!VALID_TRIAGE_MODES.includes(input.triage_recommended_mode)) {
    issues.push({
      field: "triage_recommended_mode",
      issue: `unknown triage_recommended_mode value: ${String(input.triage_recommended_mode)}`,
      severity: "FAIL",
    });
  }

  if (input.triage_review_outcome === undefined) {
    issues.push({
      field: "triage_review_outcome",
      issue: "triage_review_outcome is required; scoring cannot occur without a prior triage review outcome",
      severity: "FAIL",
    });
  } else if (FORBIDDEN_REVIEW_OUTCOME_VALUES.includes(input.triage_review_outcome as string)) {
    issues.push({
      field: "triage_review_outcome",
      issue: "KILL/SCALE/ALERT are KFSA-only vocabulary and must never be used as a review_outcome",
      severity: "FAIL",
    });
  } else if (!VALID_REVIEW_OUTCOMES.includes(input.triage_review_outcome)) {
    issues.push({
      field: "triage_review_outcome",
      issue: `unknown triage_review_outcome value: ${String(input.triage_review_outcome)}`,
      severity: "FAIL",
    });
  }

  for (const field of SCORE_FIELDS) {
    const value = input[field];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 5) {
      issues.push({
        field,
        issue: `${field} must be a number from 0 to 5 when provided`,
        severity: "FIX",
      });
    }
  }

  for (const { field, allowed } of ENUM_FIELDS) {
    const value = input[field];
    if (value !== undefined && !allowed.includes(value as string)) {
      issues.push({
        field,
        issue: `${field} must be one of: ${allowed.join(", ")}`,
        severity: "FIX",
      });
    }
  }

  for (const field of BOOLEAN_FIELDS) {
    const value = input[field];
    if (value !== undefined && typeof value !== "boolean") {
      issues.push({
        field,
        issue: `${field} must be a boolean when provided`,
        severity: "FIX",
      });
    }
  }

  if (input.missing_controls !== undefined) {
    const isStringArray =
      Array.isArray(input.missing_controls) &&
      input.missing_controls.every((item) => typeof item === "string");
    if (!isStringArray) {
      issues.push({
        field: "missing_controls",
        issue: "missing_controls must be a string[] when provided",
        severity: "FIX",
      });
    }
  }

  if (
    "review_outcome" in anyInput &&
    typeof anyInput.review_outcome === "string"
  ) {
    const value = anyInput.review_outcome;
    if (FORBIDDEN_REVIEW_OUTCOME_VALUES.includes(value)) {
      issues.push({
        field: "review_outcome",
        issue: "KILL/SCALE/ALERT are KFSA-only vocabulary and must never be used as a review_outcome",
        severity: "FAIL",
      });
    } else if (!VALID_REVIEW_OUTCOMES.includes(value)) {
      issues.push({
        field: "review_outcome",
        issue: `review_outcome must be one of: ${VALID_REVIEW_OUTCOMES.join(", ")}`,
        severity: "FAIL",
      });
    }
  }

  if ("production_approval" in anyInput && anyInput.production_approval !== false) {
    issues.push({
      field: "production_approval",
      issue: "production_approval must never be set to true; readiness score does not equal production approval",
      severity: "FAIL",
    });
  }

  return issues;
}
