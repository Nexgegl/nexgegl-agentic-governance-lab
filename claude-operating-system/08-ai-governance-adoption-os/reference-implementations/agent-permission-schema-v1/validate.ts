/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not a live
 * permission enforcement system.
 *
 * Validates an agent permission schema built by buildAgentPermissionSchema()
 * against the actual governance controls declared on the input (owner,
 * authority, evidence, audit, approval, escalation, policy boundary). This
 * module does not create an official KFSA verdict, does not create an
 * official decision, and does not approve production.
 * production_approval_status is always false. Agent Action != Approved
 * Institutional Action.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT preserved, not collapsed).
 * This module's review outcomes are always one of PASS / FIX / FAIL /
 * ESCALATE and are never KFSA vocabulary. FIX is a valid review-control
 * outcome here; it is never treated as a KFSA verdict.
 */

import { buildAgentPermissionSchema } from "./schema";
import type {
  AgentPermissionFinding,
  AgentPermissionSchemaOutput,
  AgentPermissionValidationInput,
  AgentPermissionValidationOutput,
} from "./types";

/**
 * Detects an unsafe external payload attempting to claim production
 * approval. AgentPermissionSchemaInput only types these fields as `false`
 * at the type level, so this can only be true if the caller used an unsafe
 * cast to smuggle `true` in — either on the validation input itself or on
 * its nested schema_input.
 */
export function detectForbiddenProductionApproval(input: AgentPermissionValidationInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  const unsafeSchemaInput = input.schema_input as unknown as Record<string, unknown>;
  return (
    unsafeInput.production_approval === true ||
    unsafeInput.production_approval_status === true ||
    unsafeSchemaInput.production_approval === true ||
    unsafeSchemaInput.production_approval_status === true
  );
}

/**
 * Detects an unsafe external payload attempting to smuggle an official
 * verdict or official decision. AgentPermissionSchemaInput types these
 * fields as `never`, so this can only be true via an unsafe cast.
 */
export function detectForbiddenOfficialDecision(input: AgentPermissionValidationInput): boolean {
  const unsafeInput = input as unknown as Record<string, unknown>;
  const unsafeSchemaInput = input.schema_input as unknown as Record<string, unknown>;
  return (
    ("official_verdict" in unsafeInput && unsafeInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeInput && unsafeInput.official_decision !== undefined) ||
    ("official_verdict" in unsafeSchemaInput && unsafeSchemaInput.official_verdict !== undefined) ||
    ("official_decision" in unsafeSchemaInput && unsafeSchemaInput.official_decision !== undefined)
  );
}

/**
 * Detects a forbidden tool present in both a granted tool set (allowed,
 * read-only, or write) and the forbidden tool set.
 */
export function hasForbiddenToolOverlap(schema: AgentPermissionSchemaOutput): boolean {
  const forbidden = new Set(schema.forbidden_tools);
  const granted = [...schema.allowed_tools, ...schema.read_only_tools, ...schema.write_tools];
  return granted.some((tool) => forbidden.has(tool));
}

export function validateAgentPermissions(input: AgentPermissionValidationInput): AgentPermissionValidationOutput {
  const schema = buildAgentPermissionSchema(input.schema_input);

  const findings: AgentPermissionFinding[] = [];
  const required_fixes: string[] = [];
  const blocking_failures: string[] = [];
  const escalation_reasons: string[] = [];

  const forbiddenProductionApproval = detectForbiddenProductionApproval(input);
  const forbiddenOfficialDecision = detectForbiddenOfficialDecision(input);

  if (forbiddenProductionApproval) {
    const message = "Forbidden production approval attempt detected in agent permission input. Ignored and blocked.";
    findings.push({ severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  if (forbiddenOfficialDecision) {
    const message =
      "Forbidden official_verdict/official_decision attempt detected in agent permission input. Ignored and blocked.";
    findings.push({ severity: "CRITICAL", message });
    blocking_failures.push(message);
  }

  // Control-presence flags: whether the actual control was explicitly
  // declared present on the input, independent of whether schema.ts derived
  // that control as required.
  const ownerPresent = Boolean(input.schema_input.owner_user_id || input.schema_input.business_owner);
  const authorityPresent = input.schema_input.authority_required === true;
  const evidencePresent = input.schema_input.evidence_required === true;
  const auditPresent = input.schema_input.audit_required === true;
  const approvalPresent = input.schema_input.approval_required === true;
  const policyBoundaryPresent = input.schema_input.policy_boundary_defined === true;
  const escalationPresent = input.schema_input.escalation_required === true;

  if (!ownerPresent) {
    const message = "Missing owner. An agent must have a business_owner or owner_user_id.";
    findings.push({ severity: "CRITICAL", message, required_fix: "Assign a business_owner or owner_user_id." });
    blocking_failures.push(message);
  }

  if (schema.write_tools.length > 0 && !authorityPresent) {
    const message = "Missing authority for write tools.";
    findings.push({ severity: "HIGH", message, required_fix: "Confirm authority for write tool access." });
    blocking_failures.push(message);
  }

  if (schema.external_systems.length > 0 && !authorityPresent) {
    const message = "Missing authority for external-system access.";
    findings.push({ severity: "HIGH", message, required_fix: "Confirm authority for external-system access." });
    blocking_failures.push(message);
  }

  if (schema.autonomy_level === "autonomous" && !policyBoundaryPresent) {
    const message = "Autonomous action without policy boundary.";
    findings.push({
      severity: "CRITICAL",
      message,
      required_fix: "Define a policy boundary before granting autonomous action.",
    });
    blocking_failures.push(message);
  }

  if (input.schema_input.external_data_movement === true && !auditPresent) {
    const message = "External data movement without audit requirement.";
    findings.push({ severity: "HIGH", message, required_fix: "Enable audit requirement for external data movement." });
    blocking_failures.push(message);
  }

  if (schema.data_sensitivity === "high" && !evidencePresent) {
    const message = "Sensitive data access without evidence requirement.";
    findings.push({ severity: "HIGH", message, required_fix: "Enable evidence requirement for sensitive data access." });
    blocking_failures.push(message);
  }

  if (schema.write_tools.length > 0 && !approvalPresent) {
    const message = "Write tools without approval requirement.";
    findings.push({ severity: "HIGH", message, required_fix: "Enable approval requirement for write tool access." });
    blocking_failures.push(message);
  }

  if (hasForbiddenToolOverlap(schema)) {
    const message = "Forbidden tools present in allowed/read-only/write tools.";
    findings.push({ severity: "CRITICAL", message, required_fix: "Remove forbidden tools from granted tool sets." });
    blocking_failures.push(message);
  }

  if (schema.risk_level === "high" && !escalationPresent) {
    const message = "High risk agent without escalation requirement.";
    findings.push({ severity: "HIGH", message });
    escalation_reasons.push(message);
  }

  if (schema.risk_level === "medium" && !evidencePresent) {
    const message = "Missing evidence requirement for medium-risk agent.";
    findings.push({ severity: "MEDIUM", message, required_fix: "Enable evidence requirement for this agent." });
    required_fixes.push(message);
  }

  let review_outcome: AgentPermissionValidationOutput["review_outcome"];
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
    `Agent permission validation for: ${input.schema_input.agent_name}.`,
    "Agent Permission Schema does not approve production.",
    "Permission validation PASS does not approve production.",
    "production_approval_status is always false.",
    "Agent Action != Approved Institutional Action.",
    ...(input.schema_input.notes ?? []),
  ];

  return {
    review_outcome,
    findings,
    required_fixes,
    blocking_failures,
    escalation_reasons,
    production_approval_status: false,
    kfsa_reference: "external_applied_verdict_interface_only",
    notes,
  };
}
