# Use Case Triage Reference Implementation v1.0

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

## Purpose

This folder proves that Use Case Triage Algorithm v1.0 can run as executable TypeScript, matching the decision order, input/output schema, and fail-closed rules defined in the algorithm specification:

`claude-operating-system/08-ai-governance-adoption-os/02-use-case-triage-algorithm.md`

It exists so the algorithm specification can be reviewed against working code, not only against prose.

It does not replace the algorithm specification.

It does not replace AI Governance Doctrine v1.0.

## How to Read the Files

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for triage input, output, and validation issues |
| `validate.ts` | `validateTriageInput(input)` — structural and enum validation of a triage input |
| `triage.ts` | `triageUseCase(input)` — the decision logic, following the specification's decision order |
| `examples.ts` | Six executable examples mirroring the specification's example cases, plus `runExamples()` |
| `README.md` | This file |

Read them in this order: `types.ts` → `validate.ts` → `triage.ts` → `examples.ts`.

## Supported Modes

`recommended_mode` is always one of:

- `NO_AI`
- `PROCESS_REPAIR`
- `AUTOMATION`
- `AUGMENTATION`
- `WORKFLOW`
- `AGENT`
- `MULTI_AGENT_SYSTEM`
- `GOVERNED_RUNTIME`

## Supported Review Outcomes

`review_outcome` is always one of:

- `PASS`
- `FIX`
- `FAIL`
- `ESCALATE`

These are review-control outcomes only.

They are never KFSA vocabulary.

## Boundary Notes

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This implementation does not define KFSA.

This implementation does not redefine KFSA.

This implementation does not create a competing KFSA scoring model or a replacement verdict system.

Every `TriageOutput` carries `kfsa_reference: "external_applied_verdict_interface_only"` — KFSA is referenced only as an external applied verdict interface, never invoked or reimplemented here.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT must be preserved. ALERT is never used as a `review_outcome` value in this implementation — `validate.ts` explicitly rejects `KILL`, `SCALE`, or `ALERT` if they appear where a `review_outcome` is expected.

SDGM is not defined or redefined here. SDGM is treated as doctrine/canon alignment only; this implementation does not call an SDGM runtime and does not create or approve an institutional decision.

Agent Governance is not KFSA Core. `AGENT`, `MULTI_AGENT_SYSTEM`, and `GOVERNED_RUNTIME` outcomes never approve production; they only recommend escalation, review, or further governance-gate work.

This implementation does not implement runtime code beyond this reference folder, does not create database tables, does not create CI checks, and does not create customer deployment assets.

## Running the Examples

There is no build system or package manifest in this folder by design — it is a reference implementation, not a shippable package. To exercise it locally with the repository's available TypeScript compiler:

```text
npx tsc --noEmit --strict \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/triage.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/use-case-triage-v1/examples.ts
```

`runExamples()` returns an array of per-example results with `expected_recommended_mode`, `expected_review_outcome`, `actual_recommended_mode`, `actual_review_outcome`, and `pass`.
