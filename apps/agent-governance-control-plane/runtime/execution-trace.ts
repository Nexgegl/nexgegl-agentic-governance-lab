/**
 * Auditable execution trace. Deliberately contains only structured,
 * observable events — request received, plan created, skill/tool selected,
 * permission checks, tool calls, evidence created, evaluation results,
 * governance findings, retries, stops, human-review transitions. This is
 * labeled "Execution Trace", never "Chain of Thought" — it never stores
 * hidden model reasoning or private deliberation.
 */

import type { ExecutionTraceEntry, TraceStage } from "./types";

/** Deterministic timestamp: base + (sequence * 45s). No Date.now(), no randomness. */
function deterministicTimestamp(baseIso: string, sequence: number): string {
  const base = new Date(baseIso).getTime();
  return new Date(base + sequence * 45_000).toISOString();
}

/** Pure — derives the entry's sequence number from the trace array already accumulated for this run. */
export function appendTraceEntry(
  trace: ExecutionTraceEntry[],
  runId: string,
  baseIso: string,
  entry: {
    stage: TraceStage;
    actor: string;
    action: string;
    actionAr: string;
    inputReference?: string;
    outputReference?: string;
    summaryAr: string;
    status?: ExecutionTraceEntry["status"];
    policyReference?: string;
    evidenceIds?: string[];
  }
): ExecutionTraceEntry {
  const sequence = trace.length + 1;
  const traceEntry: ExecutionTraceEntry = {
    id: `trace-${runId}-${String(sequence).padStart(3, "0")}`,
    runId,
    timestamp: deterministicTimestamp(baseIso, trace.length),
    stage: entry.stage,
    actor: entry.actor,
    action: entry.action,
    actionAr: entry.actionAr,
    inputReference: entry.inputReference ?? "",
    outputReference: entry.outputReference ?? "",
    summaryAr: entry.summaryAr,
    status: entry.status ?? "OK",
    policyReference: entry.policyReference ?? "",
    evidenceIds: entry.evidenceIds ?? [],
  };
  trace.push(traceEntry);
  return traceEntry;
}
