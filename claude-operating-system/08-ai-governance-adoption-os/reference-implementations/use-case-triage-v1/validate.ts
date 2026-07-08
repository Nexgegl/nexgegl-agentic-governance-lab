/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM.
 *
 * Mirrors the input validation intent of:
 * claude-operating-system/08-ai-governance-adoption-os/02-use-case-triage-algorithm.md
 *
 * This module never accepts KILL/FIX/SCALE/ALERT as a recommended_mode
 * or review_outcome value. KFSA vocabulary (KILL / FIX / SCALE / ALERT,
 * with ALERT preserved) is referenced only in documentation/comments as
 * an external applied verdict interface, never redefined here.
 */

import type { TriageInput, ValidationIssue } from "./types";

const LOW_MEDIUM_HIGH = ["low", "medium", "high"];
const EVIDENCE_AVAILABILITY = ["none", "partial", "sufficient"];
const AUTHORITY_CLARITY = ["missing", "unclear", "clear"];
const TOOL_ACCESS_REQUIRED = ["none", "read_only", "write", "external_system"];
const NONE_LOW_MEDIUM_HIGH = ["none", "low", "medium", "high"];

const VALID_RECOMMENDED_MODES = [
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

const BOOLEAN_FIELDS: (keyof TriageInput)[] = [
  "human_approval_required",
  "external_action_required",
  "audit_required",
  "requires_multi_role_reasoning",
  "requires_runtime_controls",
  "known_process_owner",
];

const ENUM_FIELDS: { field: keyof TriageInput; allowed: string[] }[] = [
  { field: "decision_relevance", allowed: LOW_MEDIUM_HIGH },
  { field: "process_clarity", allowed: LOW_MEDIUM_HIGH },
  { field: "repeatability", allowed: LOW_MEDIUM_HIGH },
  { field: "rule_clarity", allowed: LOW_MEDIUM_HIGH },
  { field: "data_sensitivity", allowed: LOW_MEDIUM_HIGH },
  { field: "data_readiness", allowed: LOW_MEDIUM_HIGH },
  { field: "evidence_availability", allowed: EVIDENCE_AVAILABILITY },
  { field: "authority_clarity", allowed: AUTHORITY_CLARITY },
  { field: "tool_access_required", allowed: TOOL_ACCESS_REQUIRED },
  { field: "customer_impact", allowed: NONE_LOW_MEDIUM_HIGH },
  { field: "financial_impact", allowed: NONE_LOW_MEDIUM_HIGH },
  { field: "regulatory_or_legal_impact", allowed: NONE_LOW_MEDIUM_HIGH },
  { field: "volume_frequency", allowed: LOW_MEDIUM_HIGH },
  { field: "variation_complexity", allowed: LOW_MEDIUM_HIGH },
];

const REQUIRED_STRING_FIELDS: (keyof TriageInput)[] = [
  "use_case_name",
  "business_owner",
  "problem_statement",
  "expected_outcome",
];

export function validateTriageInput(input: Partial<TriageInput>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    const value = input[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push({
        field,
        issue: `${field} is required and must be a non-empty string`,
        severity: "FAIL",
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

  const anyInput = input as Record<string, unknown>;

  if (
    "recommended_mode" in anyInput &&
    typeof anyInput.recommended_mode === "string" &&
    !VALID_RECOMMENDED_MODES.includes(anyInput.recommended_mode)
  ) {
    issues.push({
      field: "recommended_mode",
      issue: `unknown recommended_mode value: ${String(anyInput.recommended_mode)}`,
      severity: "FAIL",
    });
  }

  if (
    "review_outcome" in anyInput &&
    typeof anyInput.review_outcome === "string"
  ) {
    const value = anyInput.review_outcome;
    if (FORBIDDEN_REVIEW_OUTCOME_VALUES.includes(value)) {
      issues.push({
        field: "review_outcome",
        issue:
          "KILL/SCALE/ALERT are KFSA-only vocabulary and must never be used as a review_outcome",
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

  return issues;
}
