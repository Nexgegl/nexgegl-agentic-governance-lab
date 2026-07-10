/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not a live
 * permission enforcement system.
 *
 * Consumes the output shape produced by AI Governance Flow v1.0
 * (../ai-governance-flow-v1/), Eval & Grader Matrix v1.0
 * (../eval-grader-matrix-v1/), and Governance Gate v1.0
 * (../governance-gate-v1/), i.e. the result of running:
 *   triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
 *     -> runEvalGraderMatrix(input) -> runGovernanceGate(input)
 *
 * Agent Action != Approved Institutional Action.
 *
 * KFSA remains: KILL / FIX / SCALE / ALERT (ALERT must be preserved).
 * This module never uses KILL / SCALE / ALERT as a review outcome.
 * FIX is allowed as a review-control outcome; it is never a KFSA verdict.
 * Review-control outcomes here are PASS / FIX / FAIL / ESCALATE only.
 */

export type AgentPermissionReviewOutcome = "PASS" | "FIX" | "FAIL" | "ESCALATE";

export type AgentRiskLevel = "low" | "medium" | "high";

export type AgentAutonomyLevel = "manual" | "assisted" | "supervised" | "autonomous";

export type AgentToolPermissionLevel = "none" | "read_only" | "write" | "external_system";

export type AgentDataSensitivity = "low" | "medium" | "high";

export type KfsaReference = "external_applied_verdict_interface_only";

export interface AgentPermissionSchemaInput {
  agent_name: string;
  agent_type: "chat" | "workflow" | "code" | "data" | "customer_support" | "finance" | "operations" | "other";
  owner_user_id?: string;
  business_owner?: string;
  data_owner?: string;
  allowed_tools?: string[];
  forbidden_tools?: string[];
  read_only_tools?: string[];
  write_tools?: string[];
  external_systems?: string[];
  data_scope?: string[];
  data_sensitivity?: AgentDataSensitivity;
  autonomy_level?: AgentAutonomyLevel;
  risk_level?: AgentRiskLevel;
  authority_required?: boolean;
  evidence_required?: boolean;
  audit_required?: boolean;
  approval_required?: boolean;
  escalation_required?: boolean;
  policy_boundary_defined?: boolean;
  external_data_movement?: boolean;
  production_intended?: boolean;
  decision_relevant?: boolean;
  production_approval?: false;
  production_approval_status?: false;
  official_verdict?: never;
  official_decision?: never;
  notes?: string[];
}

export interface AgentPermissionSchemaOutput {
  agent_name: string;
  required_owner: boolean;
  required_authority: boolean;
  required_evidence: boolean;
  required_audit: boolean;
  required_approval: boolean;
  required_escalation: boolean;
  max_tool_permission_level: AgentToolPermissionLevel;
  allowed_tools: string[];
  forbidden_tools: string[];
  read_only_tools: string[];
  write_tools: string[];
  external_systems: string[];
  data_scope: string[];
  data_sensitivity: AgentDataSensitivity;
  autonomy_level: AgentAutonomyLevel;
  risk_level: AgentRiskLevel;
  policy_boundary_required: boolean;
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface AgentPermissionFinding {
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  required_fix?: string;
}

export interface AgentPermissionValidationInput {
  schema_input: AgentPermissionSchemaInput;
}

export interface AgentPermissionValidationOutput {
  review_outcome: AgentPermissionReviewOutcome;
  findings: AgentPermissionFinding[];
  required_fixes: string[];
  blocking_failures: string[];
  escalation_reasons: string[];
  production_approval_status: false;
  kfsa_reference: KfsaReference;
  notes: string[];
}

export interface AgentPermissionExample {
  name: string;
  input: AgentPermissionValidationInput;
  expected_review_outcome: AgentPermissionReviewOutcome;
  expected_production_approval_status: false;
}

export interface AgentPermissionExampleResult {
  name: string;
  expected_review_outcome: AgentPermissionReviewOutcome;
  actual_review_outcome: AgentPermissionReviewOutcome;
  expected_production_approval_status: false;
  actual_production_approval_status: false;
  pass: boolean;
}
