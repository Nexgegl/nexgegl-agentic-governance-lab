/**
 * Bounded loop control. Every governed run is deterministic and bounded —
 * there is no free-running autonomous loop. This module enforces step and
 * tool-call ceilings, detects repeated tool-call / evidence patterns and
 * no-progress runs, and yields a single StopReason the execution engine
 * must honor.
 *
 * costBudget / timeBudget are included as typed placeholders only — this
 * demo runtime does not meter real cost or wall-clock time.
 */

import type { LoopControlState, StopReason } from "./types";

export const DEFAULT_RETRY_LIMIT = 2;
const NO_PROGRESS_STEP_THRESHOLD = 3;

export function createLoopControlState(maxSteps: number, maxToolCalls: number, retryLimit = DEFAULT_RETRY_LIMIT): LoopControlState {
  return {
    stepsTaken: 0,
    toolCallsMade: 0,
    maxSteps,
    maxToolCalls,
    retries: 0,
    retryLimit,
    toolCallSignatures: [],
    evidenceSignatures: [],
    lastProgressStep: 0,
    stopReason: null,
  };
}

export interface LoopCheckContext {
  toolCallSignature?: string;
  evidenceSignature?: string;
  progressed: boolean;
  policyBlocked?: boolean;
  humanInterruptionRequested?: boolean;
}

export interface LoopCheckResult {
  state: LoopControlState;
  stop: StopReason | null;
}

/** Pure — returns a new state plus a stop reason if a bound was hit. Call after every step/tool call. */
export function advanceLoopControl(state: LoopControlState, ctx: LoopCheckContext): LoopCheckResult {
  const next: LoopControlState = { ...state, toolCallSignatures: [...state.toolCallSignatures], evidenceSignatures: [...state.evidenceSignatures] };
  next.stepsTaken += 1;

  if (ctx.toolCallSignature) {
    next.toolCallsMade += 1;
  }

  if (ctx.humanInterruptionRequested) {
    next.stopReason = "HUMAN_REVIEW_REQUIRED";
    return { state: next, stop: next.stopReason };
  }

  if (ctx.policyBlocked) {
    next.stopReason = "POLICY_BLOCK";
    return { state: next, stop: next.stopReason };
  }

  if (ctx.toolCallSignature) {
    if (next.toolCallSignatures.includes(ctx.toolCallSignature)) {
      next.stopReason = "LOOP_DETECTED";
      return { state: next, stop: next.stopReason };
    }
    next.toolCallSignatures.push(ctx.toolCallSignature);
  }

  if (ctx.evidenceSignature) {
    if (next.evidenceSignatures.includes(ctx.evidenceSignature)) {
      next.stopReason = "LOOP_DETECTED";
      return { state: next, stop: next.stopReason };
    }
    next.evidenceSignatures.push(ctx.evidenceSignature);
  }

  if (ctx.progressed) {
    next.lastProgressStep = next.stepsTaken;
  } else if (next.stepsTaken - next.lastProgressStep >= NO_PROGRESS_STEP_THRESHOLD) {
    next.stopReason = "NO_PROGRESS";
    return { state: next, stop: next.stopReason };
  }

  if (next.toolCallsMade >= next.maxToolCalls) {
    next.stopReason = "MAX_TOOL_CALLS_REACHED";
    return { state: next, stop: next.stopReason };
  }

  if (next.stepsTaken >= next.maxSteps) {
    next.stopReason = "MAX_STEPS_REACHED";
    return { state: next, stop: next.stopReason };
  }

  return { state: next, stop: null };
}

export function recordRetry(state: LoopControlState): { state: LoopControlState; retryLimitExceeded: boolean } {
  const next = { ...state, retries: state.retries + 1 };
  return { state: next, retryLimitExceeded: next.retries > next.retryLimit };
}
