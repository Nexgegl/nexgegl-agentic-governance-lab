import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentProfile } from "@/repositories/profiles-repository";
import { getOwnOrganizationProfile, upsertOwnOrganizationProfile, upsertDomainProfile } from "@/repositories/institutional-profiles-repository";
import { createAuditEvent } from "@/repositories/plugin-runs-repository";
import { computeProfileCompleteness, AI_GOVERNANCE_DOMAIN, type AiGovernanceDomainProfile } from "./profile-schema";
import { PluginBoundaryError } from "./errors";

/**
 * The Cold Start onboarding input, grouped into the 7 sections requested:
 * Organization, AI Environment, Authority, Risk, Evidence, Escalation,
 * Connectors. This intentionally does not ask every possible institutional
 * question — see docs/plugins/ai-governance.md.
 */
export interface ColdStartInput {
  organization: {
    sector?: string;
    jurisdictions?: string[];
    business_units?: string[];
    governance_model?: "centralized" | "federated" | "hybrid";
  };
  ai_environment: {
    approved_models?: string[];
    approved_deployment_environments?: string[];
  };
  authority: {
    ai_governance_owner?: string;
    authority_matrix_references?: string[];
  };
  risk: {
    risk_appetite?: "low" | "medium" | "high";
    prohibited_ai_uses?: string[];
    restricted_data_classifications?: ("low" | "medium" | "high")[];
  };
  evidence: {
    evidence_requirements?: string[];
  };
  escalation: {
    escalation_threshold_risk_level?: "low" | "medium" | "high";
    human_review_required?: boolean;
  };
  connectors: {
    approved_connector_ids?: string[];
  };
}

export interface ColdStartResult {
  organizationProfileId: string;
  domainProfileId: string;
  completenessScore: number;
  missingCriticalFields: string[];
  contextPreview: string;
}

export async function submitColdStart(client: SupabaseClient<Database>, input: ColdStartInput): Promise<ColdStartResult> {
  const profile = await getCurrentProfile(client);
  if (!profile) {
    throw new PluginBoundaryError("missing_organization_context", "No organization profile is associated with this signed-in user.");
  }

  const orgProfile = await upsertOwnOrganizationProfile(client, {
    sector: input.organization.sector ?? null,
    jurisdictions: input.organization.jurisdictions ?? [],
    business_units: input.organization.business_units ?? [],
    governance_model: input.organization.governance_model ?? null,
  });

  const domainProfileData: AiGovernanceDomainProfile = {
    sector: input.organization.sector,
    jurisdictions: input.organization.jurisdictions,
    business_units: input.organization.business_units,
    governance_model: input.organization.governance_model,
    approved_models: input.ai_environment.approved_models,
    approved_deployment_environments: input.ai_environment.approved_deployment_environments,
    ai_governance_owner: input.authority.ai_governance_owner,
    authority_matrix_references: input.authority.authority_matrix_references,
    risk_appetite: input.risk.risk_appetite,
    prohibited_ai_uses: input.risk.prohibited_ai_uses,
    restricted_data_classifications: input.risk.restricted_data_classifications,
    evidence_requirements: input.evidence.evidence_requirements,
    escalation_threshold_risk_level: input.escalation.escalation_threshold_risk_level,
    human_review_required: input.escalation.human_review_required,
    approved_connector_ids: input.connectors.approved_connector_ids,
  };

  const { completenessScore, missingCriticalFields } = computeProfileCompleteness(domainProfileData);

  const domainProfile = await upsertDomainProfile(client, AI_GOVERNANCE_DOMAIN, domainProfileData as unknown as Record<string, unknown>, completenessScore);

  await createAuditEvent(client, {
    actor: profile.id,
    event_type: "plugin.cold_start.submitted",
    plugin_id: "ai-governance",
    details: { completeness_score: completenessScore, missing_critical_fields: missingCriticalFields },
  });

  const contextPreview = renderContextPreview({
    aiGovernanceOwner: domainProfileData.ai_governance_owner as string | undefined,
    riskAppetite: domainProfileData.risk_appetite as string | undefined,
    escalationThreshold: domainProfileData.escalation_threshold_risk_level as string | undefined,
    humanReviewRequired: domainProfileData.human_review_required as boolean | undefined,
    sector: domainProfileData.sector as string | undefined,
  });

  return {
    organizationProfileId: orgProfile.id,
    domainProfileId: domainProfile.id,
    completenessScore,
    missingCriticalFields,
    contextPreview,
  };
}

/**
 * Renders the CLAUDE.md-compatible projection described in ADR §12 — a
 * generated read-only artifact, never written back to the database.
 */
function renderContextPreview(fields: {
  aiGovernanceOwner?: string;
  riskAppetite?: string;
  escalationThreshold?: string;
  humanReviewRequired?: boolean;
  sector?: string;
}): string {
  return [
    "# AI Governance Context Projection (generated — not the source of truth)",
    "",
    `- Sector: ${fields.sector ?? "—"}`,
    `- AI governance owner: ${fields.aiGovernanceOwner ?? "—"}`,
    `- Risk appetite: ${fields.riskAppetite ?? "—"}`,
    `- Escalation threshold: ${fields.escalationThreshold ?? "—"}`,
    `- Human review required: ${fields.humanReviewRequired ? "yes" : "no"}`,
    "",
    "production_approval_status: false (locked)",
    "",
    "Formal decisions are issued only by KFSA Core after governed evaluation and authority approval.",
  ].join("\n");
}
