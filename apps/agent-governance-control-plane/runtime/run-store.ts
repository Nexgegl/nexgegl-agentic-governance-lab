/**
 * In-memory run store seeded with deterministic demo runs. Frontend-only
 * demo storage — no database, no persistence across server restarts. Every
 * run below is produced by the same runGovernedResearch() pipeline a live
 * submission from /research-runs/new would go through.
 */

import { runGovernedResearch } from "./execution-engine";
import { demoRequests } from "./demo-requests";
import type { ExecutionRun } from "./types";

export const runs: ExecutionRun[] = demoRequests.map((request) => runGovernedResearch(request));

export function listRuns(): ExecutionRun[] {
  return runs;
}

export function getRunById(runId: string): ExecutionRun | undefined {
  return runs.find((r) => r.runId === runId);
}
