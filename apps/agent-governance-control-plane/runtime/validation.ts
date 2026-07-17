/**
 * Local runtime validators — pure functions, no UI wiring, intended to be
 * run ad hoc (e.g. via a one-off script) before committing changes to the
 * Governed Research Runtime.
 */

import { runGovernedResearch } from "./execution-engine";
import { checkSkillEligibility } from "./skill-registry";
import { checkToolPermission } from "./tool-registry";
import { demoRequests, getDemoRequestById } from "./demo-requests";
import { runs } from "./run-store";
import type { ExecutionRun } from "./types";

export interface ValidationIssue {
  check: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

function result(issues: ValidationIssue[]): ValidationResult {
  return { ok: issues.length === 0, issues };
}

/** Running the same request twice must produce byte-identical output (minus nothing — everything must match). */
export function validateDeterminism(): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const request of demoRequests) {
    const a = JSON.stringify(runGovernedResearch(request));
    const b = JSON.stringify(runGovernedResearch(request));
    if (a !== b) {
      issues.push({ check: "determinism", message: `${request.id} produced different output across two identical runs` });
    }
  }
  return result(issues);
}

export function validateForbiddenToolBlocked(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const permission = checkToolPermission("demo_crm_update", { runId: "validation", dataSensitivity: "high", hasAuthorityHolder: true, callsSoFar: 0 });
  if (permission.granted) {
    issues.push({ check: "forbiddenTool", message: "demo_crm_update was granted permission — it must always be refused." });
  }
  return result(issues);
}

export function validateUnapprovedSkillBlocked(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const eligibility = checkSkillEligibility("nonexistent-unapproved-skill", { dataSensitivity: "low", hasAuthorityHolder: true });
  if (eligibility.eligible) {
    issues.push({ check: "unapprovedSkill", message: "An unregistered/unapproved skill was reported eligible." });
  }
  return result(issues);
}

export function validateChecksumMismatchBlocked(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const eligibility = checkSkillEligibility("institutional-research-planning", {
    dataSensitivity: "medium",
    hasAuthorityHolder: true,
    reviewedChecksum: "sha256-tampered-checksum-does-not-match",
  });
  if (eligibility.eligible) {
    issues.push({ check: "checksumMismatch", message: "A skill with a mismatched checksum was reported eligible — it must require re-review." });
  }
  return result(issues);
}

export function validateHighRiskWithoutAuthority(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const run = runs.find((r) => r.runId === "run-003");
  if (!run) {
    issues.push({ check: "highRiskAuthority", message: "run-003 (high-risk financial request) not found in run store." });
    return result(issues);
  }
  if (run.status !== "ESCALATE_REQUIRED" && run.status !== "BLOCKED") {
    issues.push({ check: "highRiskAuthority", message: `run-003 resolved to ${run.status}, expected ESCALATE_REQUIRED or BLOCKED given missing authority.` });
  }
  return result(issues);
}

export function validateProductionApprovalAlwaysFalse(): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const run of runs) {
    if (run.production_approval_status !== false) {
      issues.push({ check: "productionApprovalFalse", message: `${run.runId} does not have production_approval_status === false` });
    }
    if (run.governanceGate && run.governanceGate.production_approval_status !== false) {
      issues.push({ check: "productionApprovalFalse", message: `${run.runId} governanceGate.production_approval_status is not false` });
    }
  }
  return result(issues);
}

const FORBIDDEN_TEXT_PATTERNS = [/official[_ ]?decision issued/i, /production approved/i, /kfsa verdict generated/i, /chain-of-thought/i, /hidden reasoning/i];

export function validateNoForbiddenClaims(): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const run of runs) {
    const text = JSON.stringify(run.decisionPacket) + JSON.stringify(run.trace);
    for (const pattern of FORBIDDEN_TEXT_PATTERNS) {
      if (pattern.test(text)) {
        issues.push({ check: "forbiddenClaim", message: `${run.runId} contains forbidden text matching ${pattern}` });
      }
    }
  }
  return result(issues);
}

export function validateLoopDetectionStops(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const run = runs.find((r) => r.runId === "run-005");
  if (!run) {
    issues.push({ check: "loopDetection", message: "run-005 (loop demo) not found in run store." });
    return result(issues);
  }
  if (run.stopReason !== "LOOP_DETECTED") {
    issues.push({ check: "loopDetection", message: `run-005 stopReason was ${run.stopReason}, expected LOOP_DETECTED.` });
  }
  if (run.status !== "FAILED") {
    issues.push({ check: "loopDetection", message: `run-005 status was ${run.status}, expected FAILED.` });
  }
  return result(issues);
}

export function validateMaxStepLimitStops(): ValidationResult {
  const issues: ValidationIssue[] = [];
  const base = getDemoRequestById("run-001");
  if (!base) {
    issues.push({ check: "maxSteps", message: "run-001 template not found." });
    return result(issues);
  }
  const constrained = { ...base, id: "validation-max-steps", maxSteps: 1, maxToolCalls: 1 };
  const run = runGovernedResearch(constrained);
  if (run.stopReason !== "MAX_STEPS_REACHED" && run.stopReason !== "MAX_TOOL_CALLS_REACHED") {
    issues.push({ check: "maxSteps", message: `Constrained run stopReason was ${run.stopReason}, expected a max-limit stop.` });
  }
  if (run.status !== "FAILED") {
    issues.push({ check: "maxSteps", message: `Constrained run status was ${run.status}, expected FAILED.` });
  }
  return result(issues);
}

export function validateEvidenceUnreviewedUntilHumanReview(): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const run of runs) {
    for (const item of run.evidence) {
      if (item.reviewerStatus !== "UNREVIEWED") {
        issues.push({ check: "evidenceUnreviewed", message: `${run.runId} evidence ${item.id} is not UNREVIEWED before any human review.` });
      }
    }
    if (run.humanReview !== null) {
      issues.push({ check: "evidenceUnreviewed", message: `${run.runId} has a humanReview record despite no review step in this MVP — investigate.` });
    }
  }
  return result(issues);
}

export function validatePassNeverApprovesProduction(): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const run of runs) {
    const hasPass = run.evaluations.some((e) => e.outcome === "PASS");
    const isReadyOrPass = run.status === "READY_FOR_AUTHORITY_REVIEW" || hasPass;
    if (isReadyOrPass && run.production_approval_status !== false) {
      issues.push({ check: "passNoProduction", message: `${run.runId} reached PASS/READY but production_approval_status is not false.` });
    }
  }
  return result(issues);
}

export function runAllRuntimeValidations(): ValidationResult {
  const results = [
    validateDeterminism(),
    validateForbiddenToolBlocked(),
    validateUnapprovedSkillBlocked(),
    validateChecksumMismatchBlocked(),
    validateHighRiskWithoutAuthority(),
    validateProductionApprovalAlwaysFalse(),
    validateNoForbiddenClaims(),
    validateLoopDetectionStops(),
    validateMaxStepLimitStops(),
    validateEvidenceUnreviewedUntilHumanReview(),
    validatePassNeverApprovesProduction(),
  ];
  const issues = results.flatMap((r) => r.issues);
  return result(issues);
}

export type { ExecutionRun };
