# Eval & Grader Matrix Reference Implementation v1.0

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

Eval & Grader Matrix does not approve production.

## Dependency Context

| Dependency | Path |
|---|---|
| AI Governance Flow reference implementation | `../ai-governance-flow-v1/` |

Eval & Grader Matrix v1.0 evaluates a use case after it has already run through AI Governance Flow v1.0's integration path:

```text
triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)
```

`EvalMatrixInput` consumes the shape of AI Governance Flow's output (`flow_final_status`, `flow_final_review_outcome`, `gate_status`) as plain fields, so this folder does not import or modify `ai-governance-flow-v1/` or any of its own dependencies. It only documents and consumes the output contract.

This folder does not modify `ai-governance-flow-v1/`, `ai-readiness-gate-v1/`, `ai-readiness-scoring-v1/`, or `use-case-triage-v1/`.

## File Map

| File | Purpose |
|---|---|
| `types.ts` | Type definitions for the eval matrix, grading, and example results |
| `matrix.ts` | `getBaseEvalDimensions()` and `buildEvalMatrix(input)` — builds the evaluator test-case matrix |
| `grader.ts` | `gradeEvalCase(...)`, `calculateEvalScore(...)`, `deriveReviewOutcome(...)`, `runEvalGraderMatrix(input)`, and the forbidden-attempt detectors |
| `examples.ts` | Five executable examples covering pass, fix, fail, escalate, and a forbidden-input case, plus `runEvalExamples()` |
| `README.md` | This file |

Read them in this order: `types.ts` → `matrix.ts` → `grader.ts` → `examples.ts`.

## Core Functions

```text
buildEvalMatrix(input: EvalMatrixInput): EvalMatrixOutput
gradeEvalCase(testCase, status, evidence): EvalCaseGradeResult
runEvalGraderMatrix(input: EvalGraderMatrixInput): EvalGraderMatrixOutput
```

`runEvalGraderMatrix` calls `buildEvalMatrix` internally, then grades every resulting test case against the caller's observed results and evidence.

## Evaluator Dimensions

- ACCURACY
- GROUNDING
- AUTHORITY_SAFETY
- DATA_SAFETY
- ACTION_SAFETY
- AUDITABILITY
- BUSINESS_FIT
- FAILURE_HANDLING

ACCURACY, GROUNDING, AUTHORITY_SAFETY, DATA_SAFETY, AUDITABILITY, BUSINESS_FIT, and FAILURE_HANDLING are always included. ACTION_SAFETY is included only when `tool_access_required` is `write` or `external_system`, or `production_intended` is `true`, or `customer_impact`/`financial_impact` is `medium` or `high`.

## How to Run the Examples

There is no build system or package manifest in this folder by design — it is a reference implementation, not a shippable package. To exercise it locally with the repository's available TypeScript compiler:

```text
npx tsc --noEmit --strict --module commonjs --target es2020 \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/matrix.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/grader.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/examples.ts
```

To run the examples and print results:

```text
tmpdir="$(mktemp -d)"
npx tsc --module commonjs --target es2020 --outDir "$tmpdir" \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/types.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/matrix.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/grader.ts \
  claude-operating-system/08-ai-governance-adoption-os/reference-implementations/eval-grader-matrix-v1/examples.ts

node -e "const { runEvalExamples } = require(process.argv[1] + '/examples.js'); console.log(JSON.stringify(runEvalExamples(), null, 2));" "$tmpdir"

rm -rf "$tmpdir"
```

`runEvalExamples()` returns an array of per-example results with `name`, `expected_review_outcome`, `actual_review_outcome`, `expected_production_approval_status`, `actual_production_approval_status`, and `pass`.

## Boundary

Eval & Grader Matrix is a reference implementation, not production runtime, not KFSA Core, not SDGM, and not a database, API, CI, or customer deployment asset.

Eval & Grader Matrix does not approve production.

production_approval_status is always false in every output this module produces — it is hard-coded, not derived from any test case result.

Eval score does not equal production approval.

Eval score does not equal KFSA verdict.

`ReviewOutcome` = PASS / FIX / FAIL / ESCALATE.

FIX is allowed as ReviewOutcome.

KILL / SCALE / ALERT are forbidden as ReviewOutcome — the `ReviewOutcome` type excludes them entirely, and no function in this folder returns them.

KFSA is a governed decision framework maintained in its own source-of-truth repository. This implementation does not define KFSA and does not redefine KFSA.

KFSA remains external source-of-truth. Every output in this folder carries `kfsa_reference: "external_applied_verdict_interface_only"` — KFSA is referenced only as an external applied verdict interface, never invoked or reimplemented here.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT is preserved. ALERT is never used as a review outcome anywhere in this folder.

`ReviewOutcome` FIX here is a review-control outcome only; it is never treated as a KFSA FIX verdict, and this module never generates KFSA verdicts of any kind (KILL, FIX, SCALE, or ALERT).

This implementation does not generate `official_verdict` and does not generate `official_decision`. Any attempt to smuggle one through an unsafe external cast is detected and forces `review_outcome` FAIL while `production_approval_status` stays false.

This implementation does not implement runtime code beyond this reference folder, does not create database tables, does not create CI checks, and does not create customer deployment assets.
