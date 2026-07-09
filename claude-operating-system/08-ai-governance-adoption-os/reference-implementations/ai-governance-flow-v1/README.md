# AI Governance Flow Reference Implementation v1.0

## Status

REFERENCE IMPLEMENTATION

This is a reference implementation only.

This is not production runtime.

This is not KFSA Core.

This is not SDGM.

This is not a database implementation.

This is not an API implementation.

This is not a CI implementation.

This does not create customer deployment assets.

This does not claim production runtime implementation is complete.

AI Governance Flow does not approve production.

## Dependency Map

| Dependency | Path |
|---|---|
| Use Case Triage Algorithm reference implementation | `../use-case-triage-v1/` |
| AI Readiness Scoring reference implementation | `../ai-readiness-scoring-v1/` |
| AI Readiness Gate Engine reference implementation | `../ai-readiness-gate-v1/` |

This folder does not modify any of the three dependencies above. It only imports and calls their exported functions.

## Flow Diagram

```text
triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
```

Each stage's output feeds the next stage's input. The final `AIGovernanceFlowOutput` carries all three stage outputs (`triage`, `readiness`, `gate`) plus a derived `final_status` and `final_review_outcome`.

## File Map

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for the flow input, output, and example results |
| `flow.ts` | `runAIGovernanceFlow(input)` — the integration logic, plus its supporting mapping and derivation functions |
| `examples.ts` | Five executable examples covering eval-allowed, blocked, and escalate paths, plus one forbidden-input case, plus `runFlowExamples()` |
| `README.md` | This file |

Read them in this order: `types.ts` → `flow.ts` → `examples.ts`.

## Core Function

```text
runAIGovernanceFlow(input: AIGovernanceFlowInput): AIGovernanceFlowOutput
```

## Boundary Notes

AI Governance Flow does not approve production.

production_approval_status is always false in every `AIGovernanceFlowOutput` this module produces — it is hard-coded, not derived from any stage's output.

Flow output does not create a KFSA verdict.

Flow output does not create an official decision.

Readiness score does not equal production approval.

Readiness score does not equal KFSA verdict.

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This implementation does not define KFSA.

This implementation does not redefine KFSA.

Every `AIGovernanceFlowOutput` carries `kfsa_reference: "external_applied_verdict_interface_only"` — KFSA is referenced only as an external applied verdict interface, never invoked or reimplemented here.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT is preserved. ALERT is never used as a review outcome anywhere in this flow — every stage's `ReviewOutcome` type excludes it, and the flow's own `deriveFinalReviewOutcome` only ever returns PASS / FIX / FAIL / ESCALATE.

Review-control outcomes remain PASS / FIX / FAIL / ESCALATE. FIX is allowed only as a review-control outcome; it is never treated as a KFSA verdict.

Agent Governance is not KFSA Core. A `final_status` of `EVAL_ALLOWED` or `GOVERNANCE_REVIEW_REQUIRED` never approves production; production remains a separate, authorized governance process outside this reference implementation.

This implementation does not implement runtime code beyond this reference folder, does not create database tables, does not create CI checks, and does not create customer deployment assets.

## Running the Flow Examples

There is no build system or package manifest in this folder by design — it is a reference implementation, not a shippable package. To exercise it locally with the repository's available TypeScript compiler, compile this folder together with its three dependencies:

```text
npx tsc --noEmit --strict --module commonjs --target es2020 \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/triage.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/examples.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/score.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/examples.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-gate-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-gate-v1/gate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-gate-v1/examples.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-governance-flow-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-governance-flow-v1/flow.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-governance-flow-v1/examples.ts
```

`runFlowExamples()` returns an array of per-example results with `expected_final_status`, `actual_final_status`, `expected_final_review_outcome`, `actual_final_review_outcome`, `expected_gate_status`, `actual_gate_status`, `expected_production_approval_status`, `actual_production_approval_status`, and `pass`.
