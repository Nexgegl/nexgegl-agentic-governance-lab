/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not live
 * evidence enforcement. Not a document management system.
 *
 * Validates an evidence pack built by buildEvidencePack() against the
 * governance context of the use case/agent (tool access, autonomy, risk,
 * data sensitivity, and downstream stage requirements). This module does
 * not create an official KFSA verdict, does not create an official
 * decision, and does not approve production. production_approval_status is
 * always false. No Evidence, No Institutional Recognition. Agent Action !=
 * Approved Institutional Action.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review outcomes are always one of PASS / FIX / FAIL /
 * ESCALATE and are never KFSA vocabulary. FIX is a valid review-control
 * outcome here; it is never treated as a KFSA verdict.
 */

import { buildEvidencePack } from "./evidence";
import type {
  EvidenceFinding,
  EvidencePackOutput,
  EvidencePackValidationInput,
  EvidencePackValidationOutput,
} from "./types";

/**
 * Detects an unsafe external payload attempting to claim production
 * approval. EvidencePackInput only types these fields as `false` at the
 * type level, so this can only be true if the caller used an unsafe cast to
 * smuggle `true` in — either on the validation input itself or on its
 * nested evidence_input.
 */
export function detectForbiddenProductionApproval(input: EvidencePackValidationInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  const unsafeEvidenceInput = input.evidence_input as unknown as Record<string, unknown>;
  return (
    unsafeInput.production_approval === true ||
    unsafeInput.production_approval_status === true ||
    unsafeEvidenceInput.production_approval === true ||
    unsafeEvidenceInput.production_approval_status === true
  );
}

/**
 * Detects an unsafe external payload attempting to smuggle an official
 * verdict or official decision. EvidencePackInput types these fields as
 * `never`, so this can only be true via an unsafe cast.
 */
export function detectForbiddenOfficialDecision(input: EvidencePackValidationInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  const unsafeEvidenceInput = input.evidence_input as unknown as Record<string, unknown>;
  return (
    ("official_verdict" in unsafeInput && unsafeInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeInput && unsafeInput.official_decision !== undefined) ||
    ("official_verdict" in unsafeEvidenceInput && unsafeEvidenceInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeEvidenceInput && unsafeEvidenceInput.official_decision !== undefined)
  );
}

function requirementStatus(pack: EvidencePackOutput, key: string): "present" | "missing" | "not_required" {
  return pack.requirements.find((r) => r.key === key)?.status ?? "not_required";
}

export function validateEvidencePack(input: EvidencePackValidationInput): EvidencePackValidationOutput {
  const evidenceInput = input.evidence_input;
  const pack = buildEvidencePack(evidenceInput);

  const findings: EvidenceFinding[] = [];
  const required_fixes: string[] = [];
  const blocking_failures: string[] = [];
  const escalation_reasons: string[] = [];

  const forbiddenProductionApproval = detectForbiddenProductionApproval(input);
  const forbiddenOfficialDecision = detectForbiddenOfficialDecision(input);

  if (forbiddenProductionApproval) {
    const message = "Forbidden production approval attempt detected in evidence pack input. Ignored and blocked.";
    findings.push({ severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  if (forbiddenOfficialDecision) {
    const message =
      "Forbidden official_verdict/official_decision attempt detected in evidence pack input. Ignored and blocked.";
    findings.push({ severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  const hasWriteTools = evidenceInput.has_write_tools === true;
  const hasExternalSystemAccess = evidenceInput.has_external_system_access === true;
  const externalDataMovement = evidenceInput.external_data_movement === true;
  const autonomyLevel = evidenceInput.autonomy_level ?? "manual";
  const riskLevel = evidenceInput.risk_level ?? "low";
  const dataSensitivity = evidenceInput.data_sensitivity ?? "low";

  if (requirementStatus(pack, "owner_evidence") === "missing") {
    const message = "Missing owner evidence.";
    findings.push({ severity: "CRITICAL", message, required_fix: "Provide owner evidence." });
    blocking_failures.push(message);
  }

  if ((hasWriteTools || hasExternalSystemAccess) && evidenceInput.authority_evidence !== true) {
    const message = "Missing authority evidence for write/external-system access.";
    findings.push({ severity: "HIGH", message, required_fix: "Provide authority evidence." });
    blocking_failures.push(message);
  }

  if (externalDataMovement && evidenceInput.audit_evidence !== true) {
    const message = "Missing audit evidence for external data movement.";
    findings.push({ severity: "HIGH", message, required_fix: "Provide audit evidence." });
    blocking_failures.push(message);
  }

  if (
    (autonomyLevel === "supervised" || autonomyLevel === "autonomous" || hasWriteTools || hasExternalSystemAccess || externalDataMovement) &&
    evidenceInput.policy_boundary_evidence !== true
  ) {
    const message = "Missing policy boundary evidence for autonomous/supervised/write/external-system action.";
    findings.push({ severity: "CRITICAL", message, required_fix: "Provide policy boundary evidence." });
    blocking_failures.push(message);
  }

  if ((hasWriteTools || hasExternalSystemAccess) && evidenceInput.approval_evidence !== true) {
    const message = "Missing approval evidence for write/external-system access.";
    findings.push({ severity: "HIGH", message, required_fix: "Provide approval evidence." });
    blocking_failures.push(message);
  }

  if (dataSensitivity === "high" && evidenceInput.data_sensitivity_evidence !== true) {
    const message = "Missing data sensitivity evidence for high-sensitivity data.";
    findings.push({ severity: "HIGH", message, required_fix: "Provide data sensitivity evidence." });
    blocking_failures.push(message);
  }

  if ((hasWriteTools || hasExternalSystemAccess) && evidenceInput.tool_permission_evidence !== true) {
    const message = "Missing tool permission evidence for write/external-system access.";
    findings.push({ severity: "HIGH", message, required_fix: "Provide tool permission evidence." });
    blocking_failures.push(message);
  }

  if (evidenceInput.eval_required === true && evidenceInput.eval_evidence !== true) {
    const message = "Missing eval evidence for eval-required case.";
    if (riskLevel === "high") {
      findings.push({ severity: "HIGH", message, required_fix: "Provide eval evidence." });
      blocking_failures.push(message);
    } else {
      findings.push({ severity: "MEDIUM", message, required_fix: "Provide eval evidence." });
      required_fixes.push(message);
    }
  }

  if (requirementStatus(pack, "governance_gate_evidence") === "missing") {
    const message = "Missing governance gate evidence.";
    findings.push({ severity: "MEDIUM", message, required_fix: "Provide governance gate evidence." });
    required_fixes.push(message);
  }

  if (requirementStatus(pack, "agent_permission_evidence") === "missing") {
    const message = "Missing agent permission evidence.";
    findings.push({ severity: "MEDIUM", message, required_fix: "Provide agent permission evidence." });
    required_fixes.push(message);
  }

  if (requirementStatus(pack, "business_justification_evidence") === "missing") {
    const message = "Missing business justification evidence.";
    if (evidenceInput.production_intended === true) {
      findings.push({ severity: "HIGH", message, required_fix: "Provide business justification evidence." });
      blocking_failures.push(message);
    } else {
      findings.push({ severity: "MEDIUM", message, required_fix: "Provide business justification evidence." });
      required_fixes.push(message);
    }
  }

  if (riskLevel === "high" && evidenceInput.escalation_evidence !== true) {
    const message = "High risk case without escalation evidence.";
    findings.push({ severity: "HIGH", message });
    escalation_reasons.push(message);
  }

  let review_outcome: EvidencePackValidationOutput["review_outcome"];
  if (blocking_failures.length > 0) {
    review_outcome = "FAIL";
  } else if (escalation_reasons.length > 0) {
    review_outcome = "ESCALATE";
  } else if (required_fixes.length > 0) {
    review_outcome = "FIX";
  } else {
    review_outcome = "PASS";
  }

  const notes: string[] = [
    `Evidence pack validation for: ${evidenceInput.use_case_name}.`,
    "Evidence Pack Builder does not approve production.",
    "Evidence validation PASS does not approve production.",
    "production_approval_status is always false.",
    "No Evidence, No Institutional Recognition.",
    "Agent Action != Approved Institutional Action.",
    ...(evidenceInput.notes ?? []),
  ];

  return {
    review_outcome,
    findings,
    required_fixes,
    blocking_failures,
    escalation_reasons,
    evidence_pack: pack,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes,
  };
}
