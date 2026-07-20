/**
 * Boundary-violation errors for the Governance Gateway route
 * (POST /api/kfsa/promotion-requests). These cover the ownership/
 * verification steps (1-10 in docs/plugins/kfsa-promotion-request-integration-v1.md)
 * -- i.e. "this request should never reach the external KFSA client at
 * all." They are a distinct family from KfsaClientError (external call
 * failed) and KfsaContractViolationError (external response was
 * malformed), mirroring the existing PluginBoundaryError pattern in
 * lib/plugins/errors.ts.
 */
export class KfsaSubmissionBoundaryError extends Error {
  constructor(
    public readonly reason: string,
    message: string,
  ) {
    super(message);
    this.name = "KfsaSubmissionBoundaryError";
  }
}

export function rejectPromotionRequestNotFound(id: string): never {
  throw new KfsaSubmissionBoundaryError("promotion_request_not_found", `No Promotion Request exists with id "${id}" for this organization.`);
}

export function rejectSourcePluginNotInstalled(pluginId: string): never {
  throw new KfsaSubmissionBoundaryError("source_plugin_not_installed", `Promotion Request's source plugin "${pluginId}" is not installed for this organization.`);
}

export function rejectSourceSkillInvalid(skillId: string): never {
  throw new KfsaSubmissionBoundaryError("source_skill_invalid", `Promotion Request's source skill "${skillId}" is not a valid, enabled skill for this installation.`);
}

export function rejectSourceRunNotCompleted(runId: string): never {
  throw new KfsaSubmissionBoundaryError("source_run_not_completed", `Promotion Request's source run "${runId}" is not completed.`);
}

export function rejectContextSnapshotMissing(snapshotId: string): never {
  throw new KfsaSubmissionBoundaryError("context_snapshot_missing", `Promotion Request's context snapshot "${snapshotId}" could not be resolved for this organization.`);
}

export function rejectEvidenceMismatch(): never {
  throw new KfsaSubmissionBoundaryError("evidence_mismatch", "One or more of this Promotion Request's evidence_ids do not resolve to evidence owned by this organization.");
}

export function rejectClientAuthoredField(field: string): never {
  throw new KfsaSubmissionBoundaryError("client_authored_field", `Field "${field}" is prohibited from the browser's submission request; it is always resolved server-side.`);
}

export function rejectCorrelationConflict(correlationId: string): never {
  throw new KfsaSubmissionBoundaryError(
    "correlation_conflict",
    `correlation_id "${correlationId}" is already associated with a different Promotion Request in this organization.`,
  );
}
