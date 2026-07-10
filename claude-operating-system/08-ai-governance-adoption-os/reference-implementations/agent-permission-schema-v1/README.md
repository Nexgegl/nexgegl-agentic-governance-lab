# Agent Permission Schema Reference Implementation v1.0

## Status

REFERENCE IMPLEMENTATION

This is a reference implementation only.

This is not production runtime.

This is not KFSA Core.

This is not SDGM.

This is not a database implementation.

This is not an API implementation.

This is not a CI implementation.

This is not live RLS.

This is not a live permission enforcement system.

This does not create customer deployment assets.

This does not claim production runtime implementation is complete.

Agent Permission Schema does not approve production.

## Dependency Context

| Dependency | Path |
|---|---|
| AI Governance Flow reference implementation | `../ai-governance-flow-v1/` |
| Eval & Grader Matrix reference implementation | `../eval-grader-matrix-v1/` |
| Governance Gate reference implementation | `../governance-gate-v1/` |

Agent Permission Schema v1.0 defines the permission schema and validation logic for an agent after it has already run through AI Governance Flow v1.0, Eval & Grader Matrix v1.0, and Governance Gate v1.0:

```text
triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input) -> runEvalGraderMatrix(input) -> runGovernanceGate(input)
```

This folder does not import or modify `ai-governance-flow-v1/`, `eval-grader-matrix-v1/`, or `governance-gate-v1/`. It only documents this as the intended sequence context; `AgentPermissionSchemaInput` and `AgentPermissionValidationInput` are self-contained and do not import types from the upstream stages.

This folder does not modify `governance-gate-v1/`, `eval-grader-matrix-v1/`, `ai-governance-flow-v1/`, `ai-readiness-gate-v1/`, `ai-readiness-scoring-v1/`, or `use-case-triage-v1/`.

## File Map

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for the agent permission schema, validation input/output, and example results |
| `schema.ts` | `getMaxToolPermissionLevel(input)` and `buildAgentPermissionSchema(input)` — derives required governance controls from agent tool access, autonomy, risk, and data sensitivity |
| `validate.ts` | `validateAgentPermissions(input)` — the validation decision logic, plus its supporting detectors and tool-overlap check |
| `examples.ts` | Seven executable examples covering pass, missing owner, missing authority, missing audit, missing policy boundary, escalation, and a forbidden-input case, plus `runAgentPermissionExamples()` |
| `README.md` | This file |

Read them in this order: `types.ts` → `schema.ts` → `validate.ts` → `examples.ts`.

## Core Functions

```text
buildAgentPermissionSchema(input: AgentPermissionSchemaInput): AgentPermissionSchemaOutput
validateAgentPermissions(input: AgentPermissionValidationInput): AgentPermissionValidationOutput
```

`validateAgentPermissions` calls `buildAgentPermissionSchema` internally, then validates the actual governance controls declared on the input against the schema's derived requirements.

## Permission Concepts

- `owner`
- `allowed_tools`
- `forbidden_tools`
- `read_only_tools`
- `write_tools`
- `external_system_access`
- `data_scope`
- `authority_required`
- `evidence_required`
- `audit_required`
- `autonomy_level`
- `policy_boundary`
- `approval_required`
- `escalation_required`

## How to Run the Examples

There is no build system or package manifest in this folder by design — it is a reference implementation, not a shippable package. To exercise it locally with the repository's available TypeScript compiler:

```text
npx tsc --noEmit --strict --module commonjs --target es2020 \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/schema.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/examples.ts
```

To run the examples and print results:

```text
tmpdir="$(mktemp -d)"
npx tsc --module commonjs --target es2020 --outDir "$tmpdir" \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/schema.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/validate.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/agent-permission-schema-v1/examples.ts

node -e "const { runAgentPermissionExamples } = require(process.argv[1] + '/examples.js'); console.log(JSON.stringify(runAgentPermissionExamples(), null, 2));" "$tmpdir"

rm -rf "$tmpdir"
```

`runAgentPermissionExamples()` returns an array of per-example results with `name`, `expected_review_outcome`, `actual_review_outcome`, `expected_production_approval_status`, `actual_production_approval_status`, and `pass`.

## Boundary

Agent Permission Schema is a reference implementation, not production runtime, not KFSA Core, not SDGM, not a database, API, CI, or customer deployment asset, not live RLS, and not a live permission enforcement system.

Agent Permission Schema does not approve production.

Permission validation PASS does not approve production.

production_approval_status is always false in every output this module produces — it is hard-coded, not derived from any validation result.

Agent Action != Approved Institutional Action. A permission schema describing what an agent is allowed to attempt is not, and never becomes, an approved institutional decision.

Permission schema status does not equal production approval.

Permission schema status does not equal KFSA verdict.

`ReviewOutcome` = PASS / FIX / FAIL / ESCALATE.

FIX is allowed as ReviewOutcome.

KILL / SCALE / ALERT are forbidden as ReviewOutcome — the `AgentPermissionReviewOutcome` type excludes them entirely, and no function in this folder returns them.

KFSA is a governed decision framework maintained in its own source-of-truth repository. This implementation does not define KFSA and does not redefine KFSA.

KFSA remains external source-of-truth. Every output in this folder carries `kfsa_reference: "external_applied_verdict_interface_only"` — KFSA is referenced only as an external applied verdict interface, never invoked or reimplemented here.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT is preserved. ALERT is never used as a review outcome anywhere in this folder.

`ReviewOutcome` FIX here is a review-control outcome only; it is never treated as a KFSA FIX verdict, and this module never generates KFSA verdicts of any kind (KILL, FIX, SCALE, or ALERT).

This implementation does not generate `official_verdict` and does not generate `official_decision`. Any attempt to smuggle one through an unsafe external cast is detected and forces `review_outcome` FAIL while `production_approval_status` stays false.

This implementation does not implement runtime code beyond this reference folder, does not create database tables, does not create RLS policies, does not create CI checks, does not create customer deployment assets, does not create UI files, and does not create integrations.
