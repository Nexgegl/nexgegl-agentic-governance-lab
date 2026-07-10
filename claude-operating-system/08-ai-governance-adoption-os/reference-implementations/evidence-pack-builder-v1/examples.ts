/**
 * Reference implementation only.
 * Not production runtime. Not KFSA Core. Not SDGM. Not live RLS. Not live
 * evidence enforcement. Not a document management system.
 *
 * Executable examples for Evidence Pack Builder v1.0, running:
 *   buildEvidencePack(input) -> validateEvidencePack(input)
 * for use cases/agents that have already passed through AI Governance Flow
 * v1.0, Eval & Grader Matrix v1.0, Governance Gate v1.0, and Agent
 * Permission Schema v1.0.
 */

import { validateEvidencePack } from "./validate";
import type { EvidencePackExample, EvidencePackExampleResult, EvidencePackInput, EvidencePackValidationInput } from "./types";

export const evidencePackExamples: EvidencePackExample[] = [
  {
    name: "Complete Low Risk Evidence Pass",
    input: {
      evidence_input: {
        use_case_name: "Docs search assistant",
        owner_evidence: true,
        risk_level: "low",
        data_sensitivity: "low",
      },
    },
    expected_review_outcome: "PASS",
    expected_production_approval_status: false,
  },
  {
    name: "Missing Owner Evidence Fail",
    input: {
      evidence_input: {
        use_case_name: "Unowned use case",
        owner_evidence: false,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Write Tools Missing Authority Evidence Fail",
    input: {
      evidence_input: {
        use_case_name: "Record updater",
        owner_evidence: true,
        has_write_tools: true,
        authority_evidence: false,
        audit_evidence: true,
        policy_boundary_evidence: true,
        approval_evidence: true,
        tool_permission_evidence: true,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "External Data Movement Missing Audit Evidence Fail",
    input: {
      evidence_input: {
        use_case_name: "CRM sync agent",
        owner_evidence: true,
        external_data_movement: true,
        has_external_system_access: true,
        authority_evidence: true,
        external_system_evidence: true,
        policy_boundary_evidence: true,
        approval_evidence: true,
        tool_permission_evidence: true,
        audit_evidence: false,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Autonomous Agent Missing Policy Boundary Evidence Fail",
    input: {
      evidence_input: {
        use_case_name: "Autonomous ops agent",
        owner_evidence: true,
        autonomy_level: "autonomous",
        authority_evidence: true,
        audit_evidence: true,
        approval_evidence: true,
        policy_boundary_evidence: false,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Missing Eval Evidence Fix",
    input: {
      evidence_input: {
        use_case_name: "Invoice extraction",
        owner_evidence: true,
        eval_required: true,
        eval_evidence: false,
        risk_level: "medium",
      },
    },
    expected_review_outcome: "FIX",
    expected_production_approval_status: false,
  },
  {
    name: "High Risk Missing Escalation Evidence Escalate",
    input: {
      evidence_input: {
        use_case_name: "High risk finance case",
        owner_evidence: true,
        risk_level: "high",
        escalation_evidence: false,
        authority_evidence: true,
        audit_evidence: true,
        policy_boundary_evidence: true,
        approval_evidence: true,
        tool_permission_evidence: true,
      },
    },
    expected_review_outcome: "ESCALATE",
    expected_production_approval_status: false,
  },
  {
    name: "Production Intended Missing Business Justification Evidence Fail",
    input: {
      evidence_input: {
        use_case_name: "Production intended case",
        owner_evidence: true,
        production_intended: true,
        business_justification_evidence: false,
        authority_evidence: true,
        approval_evidence: true,
      },
    },
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
  {
    name: "Forbidden Production Approval Attempt",
    input: {
      evidence_input: {
        use_case_name: "Docs search assistant with forbidden approval",
        owner_evidence: true,
        risk_level: "low",
        data_sensitivity: "low",
        // Unsafe external payload attempting to smuggle production
        // approval. EvidencePackInput only types production_approval as
        // `false`, so this requires an unsafe cast to construct at all.
        production_approval: true,
      } as unknown as EvidencePackInput,
    } as unknown as EvidencePackValidationInput,
    expected_review_outcome: "FAIL",
    expected_production_approval_status: false,
  },
];

export function runEvidencePackExamples(): EvidencePackExampleResult[] {
  return evidencePackExamples.map((example) => {
    const output = validateEvidencePack(example.input);
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
