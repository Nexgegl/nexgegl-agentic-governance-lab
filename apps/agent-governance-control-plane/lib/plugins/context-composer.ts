import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentProfile } from "@/repositories/profiles-repository";
import { getPluginDefinition, getInstallationForPlugin, getLatestPluginVersion } from "@/repositories/plugins-repository";
import { getDomainProfile, getOwnOrganizationProfile } from "@/repositories/institutional-profiles-repository";
import { listConnectorPermissionsForPlugin, listConnectors } from "@/repositories/connectors-repository";
import { createRunContextSnapshot } from "@/repositories/plugin-runs-repository";
import { createAuditEvent } from "@/repositories/plugin-runs-repository";
import { getUseCaseById } from "@/repositories/use-cases-repository";
import { isSkillEnabledForInstallation } from "@/repositories/plugin-skill-permissions-repository";
import { computeProfileCompleteness, findMissingRequiredFields, type AiGovernanceDomainProfile } from "./profile-schema";
import {
  rejectMissingOrganizationContext,
  rejectPluginDisabled,
  rejectPluginNotFound,
  rejectPluginNotInstalled,
  rejectSkillDisabledForInstallation,
  rejectSkillNotFound,
  rejectSkillNotOwnedByPlugin,
} from "./errors";

const CONSTITUTIONAL_REFERENCE = [
  "claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md",
  "claude-operating-system/02-product-profiles/sdgm-kfsa/CLAUDE.sdgm-kfsa.md",
  "apps/agent-governance-control-plane/runtime/types.ts",
  "apps/agent-governance-control-plane/lib/governance-model.ts",
];

export interface ComposedContext {
  organizationId: string;
  actor: { userId: string; role: string };
  plugin: { pluginId: string; version: string; status: string };
  installation: { id: string; state: string };
  skill: {
    skillId: string;
    version: string;
    executionStatus: "implemented" | "not_implemented";
    requiredProfileFields: string[];
    permittedConnectors: string[];
  };
  organizationProfile: Record<string, unknown> | null;
  domainProfile: AiGovernanceDomainProfile | null;
  domainProfileCompleteness: { completenessScore: number; missingCriticalFields: string[] } | null;
  missingRequiredProfileFieldsForSkill: string[];
  allowedConnectorIds: string[];
  useCase: { id: string; name_ar: string; department: string | null } | null;
  constitutionalReference: string[];
  composedAt: string;
}

/**
 * Composes an immutable, inspectable run context for one (plugin, skill)
 * invocation and persists it as a plugin_run_contexts snapshot. Enforces
 * tenant scope, rejects missing organization context, rejects disabled
 * plugins, and rejects a skill that isn't actually owned by the plugin.
 * It does NOT reject on missing profile fields — it reports them so the
 * caller (the execution boundary) can fail closed with a precise reason.
 * It never includes a connector secret (none exist on connector_definitions
 * in this MVP — see docs/plugins/plugin-security-boundary.md).
 */
export async function composeContext(
  client: SupabaseClient<Database>,
  input: { pluginId: string; skillId: string; useCaseId?: string },
): Promise<{ snapshotId: string; context: ComposedContext }> {
  const profile = await getCurrentProfile(client);
  if (!profile) rejectMissingOrganizationContext();

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) rejectMissingOrganizationContext();

  const pluginDefinition = await getPluginDefinition(client, input.pluginId);
  if (!pluginDefinition) rejectPluginNotFound(input.pluginId);
  if (pluginDefinition.status === "blocked") rejectPluginDisabled(input.pluginId, "blocked");

  const installation = await getInstallationForPlugin(client, input.pluginId);
  if (!installation) rejectPluginNotInstalled(input.pluginId);
  if (installation.state !== "installed") rejectPluginDisabled(input.pluginId, installation.state);

  const latestVersion = await getLatestPluginVersion(client, input.pluginId);

  const { data: skillRow, error: skillError } = await client.from("skills").select("*").eq("id", input.skillId).maybeSingle();
  if (skillError) throw skillError;
  if (!skillRow) rejectSkillNotFound(input.skillId);
  if (skillRow.plugin_id !== input.pluginId) rejectSkillNotOwnedByPlugin(input.skillId, input.pluginId);

  const skillEnabled = await isSkillEnabledForInstallation(client, installation.id, skillRow.id);
  if (!skillEnabled) rejectSkillDisabledForInstallation(skillRow.id);

  const domainProfileRow = await getDomainProfile(client, pluginDefinition.domain);
  const domainProfile = (domainProfileRow?.profile ?? null) as AiGovernanceDomainProfile | null;
  const domainProfileCompleteness = domainProfile ? computeProfileCompleteness(domainProfile) : null;
  const missingRequiredProfileFieldsForSkill = domainProfile
    ? findMissingRequiredFields(domainProfile, skillRow.required_profile_fields)
    : skillRow.required_profile_fields;

  const organizationProfileRow = await getOwnOrganizationProfile(client);

  const [allConnectors, connectorPermissions] = await Promise.all([
    listConnectors(client),
    listConnectorPermissionsForPlugin(client, input.pluginId),
  ]);
  const connectorsById = new Map(allConnectors.map((c) => [c.id, c]));
  const allowedConnectorIds = connectorPermissions
    .filter((p) => p.allowed)
    .map((p) => connectorsById.get(p.connector_id)?.connector_id)
    .filter((id): id is string => Boolean(id));

  const useCaseRow = input.useCaseId ? await getUseCaseById(client, input.useCaseId) : null;

  const context: ComposedContext = {
    organizationId: profile.organization_id,
    actor: { userId: user.id, role: profile.role },
    plugin: { pluginId: pluginDefinition.plugin_id, version: latestVersion?.version ?? "unknown", status: pluginDefinition.status },
    installation: { id: installation.id, state: installation.state },
    skill: {
      skillId: skillRow.id,
      version: skillRow.version,
      executionStatus: skillRow.execution_status,
      requiredProfileFields: skillRow.required_profile_fields,
      permittedConnectors: skillRow.permitted_connectors,
    },
    organizationProfile: organizationProfileRow
      ? {
          sector: organizationProfileRow.sector,
          jurisdictions: organizationProfileRow.jurisdictions,
          business_units: organizationProfileRow.business_units,
          governance_model: organizationProfileRow.governance_model,
        }
      : null,
    domainProfile,
    domainProfileCompleteness,
    missingRequiredProfileFieldsForSkill,
    allowedConnectorIds,
    useCase: useCaseRow ? { id: useCaseRow.id, name_ar: useCaseRow.name_ar, department: useCaseRow.department } : null,
    constitutionalReference: CONSTITUTIONAL_REFERENCE,
    composedAt: new Date().toISOString(),
  };

  const snapshot = await createRunContextSnapshot(client, {
    plugin_id: pluginDefinition.plugin_id,
    plugin_version: context.plugin.version,
    skill_id: skillRow.id,
    skill_version: skillRow.version,
    actor_user_id: user.id,
    context: context as unknown as Record<string, unknown>,
    constitutional_reference: CONSTITUTIONAL_REFERENCE,
  });

  await createAuditEvent(client, {
    actor: user.id,
    event_type: "plugin.context.composed",
    plugin_id: pluginDefinition.plugin_id,
    skill_id: skillRow.id,
    details: { snapshot_id: snapshot.id, use_case_id: input.useCaseId ?? null },
  });

  return { snapshotId: snapshot.id, context };
}
