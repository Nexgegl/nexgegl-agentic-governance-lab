/**
 * Lightweight, hand-written mirror of
 * plugins/ai-governance/profile.schema.json's `required` list and known
 * property names. This MVP does not depend on a JSON-Schema validation
 * library — the constants below must be kept in sync with the schema file
 * by hand. That is a real limitation, documented in
 * docs/plugins/ai-governance.md, not a silent gap.
 */

export const AI_GOVERNANCE_DOMAIN = "ai_governance";

export const AI_GOVERNANCE_REQUIRED_PROFILE_FIELDS = [
  "ai_governance_owner",
  "risk_appetite",
  "escalation_threshold_risk_level",
  "human_review_required",
] as const;

export const AI_GOVERNANCE_KNOWN_PROFILE_FIELDS = [
  "sector",
  "jurisdictions",
  "business_units",
  "governance_model",
  "ai_governance_owner",
  "authority_matrix_references",
  "risk_appetite",
  "prohibited_ai_uses",
  "restricted_data_classifications",
  "evidence_requirements",
  "escalation_threshold_risk_level",
  "approved_connector_ids",
  "approved_models",
  "approved_deployment_environments",
  "human_review_required",
  "applicable_internal_policies",
] as const;

export type AiGovernanceDomainProfile = Partial<Record<(typeof AI_GOVERNANCE_KNOWN_PROFILE_FIELDS)[number], unknown>>;

export interface ProfileCompletenessResult {
  completenessScore: number;
  missingCriticalFields: string[];
}

/** Critical = required by the schema. Non-critical missing fields lower the score but don't block. */
export function computeProfileCompleteness(profile: AiGovernanceDomainProfile): ProfileCompletenessResult {
  const missingCriticalFields = AI_GOVERNANCE_REQUIRED_PROFILE_FIELDS.filter((field) => isEmpty(profile[field]));

  const totalFields: number = AI_GOVERNANCE_KNOWN_PROFILE_FIELDS.length;
  const filledFields = AI_GOVERNANCE_KNOWN_PROFILE_FIELDS.filter((field) => !isEmpty(profile[field])).length;
  const completenessScore = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);

  return { completenessScore, missingCriticalFields };
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Given a skill's required_profile_fields, checks them against a resolved domain profile. Used by the execution boundary to fail closed. */
export function findMissingRequiredFields(profile: AiGovernanceDomainProfile, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => isEmpty((profile as Record<string, unknown>)[field]));
}
