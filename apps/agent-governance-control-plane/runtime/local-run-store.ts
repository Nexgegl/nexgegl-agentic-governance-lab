"use client";

/**
 * Browser-only localStorage persistence for interactively-submitted
 * research runs. This is NOT a backend and NOT a database — it is a thin,
 * client-side convenience layer so a run submitted from /research-runs/new
 * survives a page refresh. The seeded demo runs in run-store.ts are never
 * written here and always remain available regardless of localStorage
 * state. IDs are deterministic (run-local-1, run-local-2, …) based on the
 * count of runs already persisted — no randomness, no timestamps in the ID.
 */

import type { ExecutionRun } from "./types";

const STORAGE_KEY = "nexgegl-governed-research-runs-v1";

export function loadLocalRuns(): ExecutionRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExecutionRun[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalRun(run: ExecutionRun): void {
  if (typeof window === "undefined") return;
  const existing = loadLocalRuns().filter((r) => r.runId !== run.runId);
  const next = [...existing, run];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getLocalRunById(runId: string): ExecutionRun | undefined {
  return loadLocalRuns().find((r) => r.runId === runId);
}

/** Deterministic next ID for a locally-submitted run — count-based, not random. */
export function nextLocalRunId(): string {
  return `run-local-${loadLocalRuns().length + 1}`;
}

/** Clears only locally-persisted runs. Seeded demo runs are unaffected — they are never stored here. */
export function resetLocalRuns(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
