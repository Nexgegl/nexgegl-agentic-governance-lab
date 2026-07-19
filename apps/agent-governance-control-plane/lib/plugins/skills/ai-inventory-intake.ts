import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createUseCase } from "@/repositories/use-cases-repository";
import type { ComposedContext } from "../context-composer";

const PROHIBITED_INPUT_FIELDS = ["governance_status", "production_approval_status", "official_decision", "kfsa_verdict", "eval_score", "eval_outcome"];

export interface AiInventoryIntakeInput {
  name: string;
  name_ar: string;
  department?: string;
  owner_name?: string;
  ai_type?: string;
  business_purpose?: string;
  business_purpose_ar?: string;
  risk_level: "low" | "medium" | "high";
  data_sensitivity: "low" | "medium" | "high";
  tool_access: "none" | "read_only" | "write" | "external_system";
  [key: string]: unknown;
}

export interface SkillRunResult {
  status: "completed" | "rejected";
  rejectionReason?: string;
  output?: Record<string, unknown>;
  evidence?: { evidenceType: string; payload: Record<string, unknown> }[];
}

/**
 * The only skill with a real execution handler in this MVP. Fails closed:
 * rejects prohibited input fields, rejects if the composed context flags
 * missing required profile fields, and never sets governance/eval/
 * production fields itself — those come from createUseCase's fixed,
 * neutral defaults.
 */
export async function runAiInventoryIntake(
  client: SupabaseClient<Database>,
  context: ComposedContext,
  input: AiInventoryIntakeInput,
): Promise<SkillRunResult> {
  for (const field of PROHIBITED_INPUT_FIELDS) {
    if (field in input) {
      return { status: "rejected", rejectionReason: `prohibited_input_field:${field}` };
    }
  }

  if (context.missingRequiredProfileFieldsForSkill.length > 0) {
    return {
      status: "rejected",
      rejectionReason: `missing_required_profile_fields:${context.missingRequiredProfileFieldsForSkill.join(",")}`,
    };
  }

  if (!input.name || !input.name_ar || !input.risk_level || !input.data_sensitivity || !input.tool_access) {
    return { status: "rejected", rejectionReason: "missing_required_input_field" };
  }

  const useCase = await createUseCase(client, {
    name: input.name,
    name_ar: input.name_ar,
    department: input.department ?? null,
    owner_name: input.owner_name ?? null,
    ai_type: input.ai_type ?? null,
    business_purpose: input.business_purpose ?? null,
    business_purpose_ar: input.business_purpose_ar ?? null,
    risk_level: input.risk_level,
    data_sensitivity: input.data_sensitivity,
    tool_access: input.tool_access,
  });

  const decisionCandidate = {
    candidate_id: useCase.id,
    use_case_id: useCase.id,
    risk_level: useCase.risk_level,
    recommended_next_step: "ai_governance_owner_review",
  };

  return {
    status: "completed",
    output: { use_case_id: useCase.id, decision_candidate: decisionCandidate },
    evidence: [
      {
        evidenceType: "ai_inventory_intake_record",
        payload: { use_case_id: useCase.id, submitted_fields: input },
      },
    ],
  };
}
