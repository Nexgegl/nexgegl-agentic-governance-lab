# AI Readiness Scoring Reference Implementation v1.0

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

This does not approve production use.

## Source Specification

`claude-operating-system/08-ai-governance-adoption-os/03-ai-readiness-scoring-model.md`

This folder proves that AI Readiness Scoring Model v1.0 can run as executable TypeScript, matching the category weights, score calculation, readiness bands, blocking controls, missing-control penalties, and review-outcome logic defined in the specification.

It exists so the specification can be reviewed against working code, not only against prose.

It does not replace the specification.

It does not replace AI Governance Doctrine v1.0 or Use Case Triage Algorithm v1.0.

## File Map

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for readiness input, output, and validation issues |
| `validate.ts` | `validateAIReadinessInput(input)` — structural and enum validation of a readiness input |
| `score.ts` | `scoreAIReadiness(input)` — the scoring logic, following the specification's weights, bands, blocking controls, and review-outcome assignment |
| `examples.ts` | Five executable examples mirroring the specification's example scoring cases, plus `runExamples()` |
| `README.md` | This file |

Read them in this order: `types.ts` → `validate.ts` → `score.ts` → `examples.ts`.

## Core Function

```text
scoreAIReadiness(input: Partial<AIReadinessInput>): AIReadinessOutput
```

## Category Weights

Category weights total exactly 100:

| Category | Weight |
|---|---|
| use_case_clarity_score | 10 |
| process_clarity_score | 10 |
| data_readiness_score | 12 |
| evidence_readiness_score | 12 |
| authority_clarity_score | 12 |
| eval_readiness_score | 10 |
| security_boundary_score | 10 |
| tool_permission_score | 8 |
| auditability_score | 8 |
| adoption_readiness_score | 5 |
| cost_control_score | 3 |

`getTotalWeight()` returns 100. `score.ts` throws at module load if the weights do not sum to 100.

Weighted contribution per category: `category_score / 5 * category_weight`.

## Readiness Bands

| Score Range | Band |
|---|---|
| 0-39 | NOT_READY |
| 40-59 | REPAIR_REQUIRED |
| 60-74 | EVAL_READY |
| 75-89 | GOVERNANCE_GATE_READY |
| 90-100 | ESCALATE |

## Review-Control Outcomes

`review_outcome` is always one of:

PASS / FIX / FAIL / ESCALATE

These are review-control outcomes only.

They are never KFSA vocabulary.

## Boundary Notes

Readiness score does not equal production approval.

Readiness score does not equal KFSA verdict.

`production_approval` is always `false` in every `AIReadinessOutput` this module produces. `validate.ts` rejects any attempt to set it to `true` on an input.

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This implementation does not define KFSA.

This implementation does not redefine KFSA.

This implementation does not create a competing KFSA scoring model or a replacement verdict system.

Every `AIReadinessOutput` carries `kfsa_reference: "external_applied_verdict_interface_only"` — KFSA is referenced only as an external applied verdict interface, never invoked or reimplemented here.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT must be preserved. ALERT is never used as a `review_outcome` value in this implementation — `validate.ts` and `score.ts` explicitly reject `KILL`, `SCALE`, or `ALERT` if they appear where a `review_outcome` is expected.

SDGM is not defined or redefined here. SDGM is treated as doctrine/canon alignment only; this implementation does not call an SDGM runtime and does not create or approve an institutional decision.

Agent Governance is not KFSA Core. A high readiness score does not approve an agent for production; `AGENT`, `MULTI_AGENT_SYSTEM`, and `GOVERNED_RUNTIME` triage modes still require eval matrix, governance gate, permission schema, authority review, and audit requirements before production.

A high readiness score, `GOVERNANCE_GATE_READY`, or `ESCALATE` band does not approve production. Eval is still required before governance gate. Governance gate is still required before production.

This implementation does not implement runtime code beyond this reference folder, does not create database tables, does not create CI checks, and does not create customer deployment assets.

## Running the Examples

There is no build system or package manifest in this folder by design — it is a reference implementation, not a shippable package. To exercise it locally with the repository's available TypeScript compiler:

```text
npx tsc --noEmit --strict --module commonjs --target es2020 \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/score.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/ai-readiness-scoring-v1/examples.ts
```

`runExamples()` returns an array of per-example results with `expected_readiness_score`, `actual_readiness_score`, `expected_readiness_band`, `actual_readiness_band`, `expected_review_outcome`, `actual_review_outcome`, `expected_production_approval`, `actual_production_approval`, and `pass`.
