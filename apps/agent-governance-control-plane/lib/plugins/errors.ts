/**
 * Errors thrown by the plugin foundation's server-side boundary
 * (Context Composer, execution boundary). Each one maps to a specific,
 * named rejection reason rather than a generic 500 — see
 * docs/plugins/plugin-security-boundary.md.
 */
export class PluginBoundaryError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "PluginBoundaryError";
  }
}

export function rejectMissingOrganizationContext(): never {
  throw new PluginBoundaryError("missing_organization_context", "No organization profile is associated with this signed-in user.");
}

export function rejectPluginNotFound(pluginId: string): never {
  throw new PluginBoundaryError("plugin_not_found", `No plugin definition exists for plugin_id "${pluginId}".`);
}

export function rejectPluginNotInstalled(pluginId: string): never {
  throw new PluginBoundaryError("plugin_not_installed", `Plugin "${pluginId}" is not installed for this organization.`);
}

export function rejectPluginDisabled(pluginId: string, state: string): never {
  throw new PluginBoundaryError("plugin_disabled", `Plugin "${pluginId}" installation is "${state}" and cannot run.`);
}

export function rejectSkillNotFound(skillId: string): never {
  throw new PluginBoundaryError("skill_not_found", `No skill exists with id "${skillId}".`);
}

export function rejectSkillNotOwnedByPlugin(skillId: string, pluginId: string): never {
  throw new PluginBoundaryError("skill_not_owned_by_plugin", `Skill "${skillId}" does not belong to plugin "${pluginId}".`);
}

export function rejectSkillDisabledForInstallation(skillId: string): never {
  throw new PluginBoundaryError("skill_disabled_for_installation", `Skill "${skillId}" is disabled for this organization's installation.`);
}

export function rejectSkillNotImplemented(skillId: string): never {
  throw new PluginBoundaryError(
    "skill_not_implemented",
    `Skill "${skillId}" is declared but has no execution handler in this MVP. See its skill definition's execution_status.`,
  );
}

export function rejectConnectorNotPermitted(connectorId: string, pluginId: string): never {
  throw new PluginBoundaryError("connector_not_permitted", `Connector "${connectorId}" is not permitted for plugin "${pluginId}" in this organization.`);
}

export function rejectUndeclaredConnector(connectorId: string, skillId: string): never {
  throw new PluginBoundaryError("undeclared_connector", `Connector "${connectorId}" is not declared in skill "${skillId}"'s permitted_connectors.`);
}

export function rejectProhibitedField(field: string): never {
  throw new PluginBoundaryError("prohibited_field", `Field "${field}" is prohibited from any plugin run input or output.`);
}
