/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not a live
 * permission enforcement system.
 *
 * Executable examples for Agent Permission Schema v1.0, running:
 *   buildAgentPermissionSchema(input) -> validateAgentPermissions(input)
 * for agents that have already passed through AI Governance Flow v1.0,
 * Eval & Grader Matrix v1.0, and Governance Gate v1.0.
 */

import { validateAgentPermissions } from "./validate";
import type {
  AgentPermissionExample,
  AgentPermissionExampleResult,
  AgentPermissionSchemaInput,
  AgentPermissionValidationInput,
} from "./types";

export const agentPermissionExamples: AgentPermissionExample[] = [
  {
    name: "Low Risk Read Only Agent Pass",
    input: {
      schema_input: {
        agent_name: "Docs Search Assistant",
        agent_type: "chat",
        owner_user_id: "user-101",
        business_owner: "Support Team Lead",
        read_only_tools: ["search_docs"],
        risk_level: "low",
        data_sensitivity: "low",
        autonomy_level: "manual",
      },
    },
    expected_review_outcome: "PASS",
    expected_production_approval_status: false,
  },
  {
    name: "Missing Owner Fail",
    input: {
      schema_input: {
        agent_name: "Unowned Agent",
        agent_type: "other",
        read_only_tools: ["search_docs"],
        risk_level: "low",
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Write Tool Without Authority Fail",
    input: {
      schema_input: {
        agent_name: "Record Updater",
        agent_type: "data",
        owner_user_id: "user-102",
        write_tools: ["update_record"],
        authority_required: false,
        approval_required: true,
        audit_required: true,
        policy_boundary_defined: true,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "External Data Movement Without Audit Fail",
    input: {
      schema_input: {
        agent_name: "CRM Sync Agent",
        agent_type: "operations",
        owner_user_id: "user-103",
        external_systems: ["salesforce"],
        external_data_movement: true,
        authority_required: true,
        approval_required: true,
        policy_boundary_defined: true,
        audit_required: false,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Autonomous Agent Without Policy Boundary Fail",
    input: {
      schema_input: {
        agent_name: "Autonomous Ops Agent",
        agent_type: "operations",
        owner_user_id: "user-104",
        autonomy_level: "autonomous",
        authority_required: true,
        approval_required: true,
        audit_required: true,
        policy_boundary_defined: false,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "High Risk Agent Requires Escalation",
    input: {
      schema_input: {
        agent_name: "High Risk Finance Agent",
        agent_type: "finance",
        owner_user_id: "user-105",
        risk_level: "high",
        authority_required: true,
        evidence_required: true,
        audit_required: true,
        approval_required: true,
        policy_boundary_defined: true,
        escalation_required: false,
      },
    },
    expected_review_outcome: "ESCALATE",
    expected_production_approval_status: false,
  },
  {
    name: "Forbidden Production Approval Attempt",
    input: {
      schema_input: {
        agent_name: "Docs Search Assistant With Forbidden Approval",
        agent_type: "chat",
        owner_user_id: "user-101",
        business_owner: "Support Team Lead",
        read_only_tools: ["search_docs"],
        risk_level: "low",
        data_sensitivity: "low",
        autonomy_level: "manual",
        // Unsafe external payload attempting to smuggle production
        // approval. AgentPermissionSchemaInput only types production_approval
        // as `false`, so this requires an unsafe cast to construct at all.
        production_approval: true,
      } as unknown as AgentPermissionSchemaInput,
    } as unknown as AgentPermissionValidationInput,
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
];

export function runAgentPermissionExamples(): AgentPermissionExampleResult[] {
  return agentPermissionExamples.map((example) => {
    const output = validateAgentPermissions(example.input);
    return {
      name: example.name,
      expected_review_outcome: example.expected_review_outcome,
      actual_review_outcome: output.review_outcome,
      expected_production_approval_status: example.expected_production_approval_status,
      actual_production_approval_status: output.production_approval_status,
      pass:
        output.review_outcome === example.expected_review_outcome &&
        output.production_approval_status === example.expected_production_approval_status,
    };
  });
}
