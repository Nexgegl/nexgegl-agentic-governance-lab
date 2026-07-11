# Governance Gate Algorithm v1.0

Status:
SPECIFICATION — BACKFILLED FROM MERGED REFERENCE IMPLEMENTATION

Parent extension:
`README.md`

Parent folder:
`claude-operating-system/08-ai-governance-adoption-os/`

This document is a specification backfill. It is not a new implementation. It does not modify the reference implementation it describes. It does not approve production use.

## 1. Purpose

Governance Gate v1.0 runs after AI Governance Flow (`triageUseCase(input) -> scoreAIReadiness(input) -> runAIReadinessGate(input)`) and Eval & Grader Matrix have already produced a flow status, review outcome, and eval result. It is the chain's post-eval checkpoint: it decides whether a use case is blocked, requires repair, requires governance review, requires escalation, or is ready for authority review.

Governance Gate does not approve production. READY_FOR_AUTHORITY_REVIEW does not approve production. Reaching the most favorable gate status this algorithm can produce means only that the case may now be put in front of the appropriate human institutional authority — it never substitutes for that authority's decision.

## 2. Scope

In scope:
- Post-eval governance gate logic
- Fail-closed review
- Repair routing
- Escalation routing
- Authority-review readiness
- Production approval boundary

Out of scope:
- Production approval
- KFSA verdict creation
- Official decision creation
- Runtime enforcement
- API
- Database
- CI
- Customer deployment

## 3. Dependency Context

Governance Gate v1.0 sits after two other reference implementations in the governed chain:

| Relationship | Reference Implementation | Path |
|---|---|---|
| Upstream (consumed) | AI Governance Flow Reference Implementation v1.0 | `reference-implementations/ai-governance-flow-v1/` |
| Upstream (consumed) | Eval & Grader Matrix Reference Implementation v1.0 | `reference-implementations/eval-grader-matrix-v1/` |

`GovernanceGateInput` consumes the shape of AI Governance Flow's output (`flow_final_status`, `flow_final_review_outcome`, `readiness_gate_status`) and Eval & Grader Matrix's output (`eval_review_outcome`, `eval_score`, `eval_required_fixes`, `eval_blocking_failures`, `eval_escalation_reasons`) as plain fields — it does not import either stage's types or call their functions. Each stage documents and consumes the prior stage's output contract without importing or modifying it.

Reference implementation path:
`reference-implementations/governance-gate-v1/`

## 4. Operating Principle

No Governance Gate, No Authority Review Movement.

A use case does not move toward institutional authority review without having passed through the gate defined here. This principle governs the entire specification:

- Governance Gate PASS does not approve production.
- READY_FOR_AUTHORITY_REVIEW does not approve production.
- Governance Gate status does not equal KFSA verdict.
- Governance Gate status does not equal production approval.

## 5. Gate Statuses

### BLOCKED

Definition: The use case is fail-closed and may not proceed.

When it is produced: Any FAIL-tier condition is present — a forbidden production approval or official decision attempt, an upstream flow BLOCKED or FAIL, an eval FAIL or blocking failure, or missing required authority evidence.

What it means operationally: Nothing downstream happens until the blocking condition is resolved and the case is re-run through the chain from the appropriate stage.

What it does not mean: BLOCKED does not mean the use case is permanently rejected — it means it cannot proceed *as currently evidenced*. It also does not create any KFSA verdict or official decision; it is a review-control status only.

### REPAIR_REQUIRED

Definition: The use case has a correctable gap that must be fixed before it can proceed.

When it is produced: A FIX-tier condition is present with no FAIL or ESCALATE condition outranking it — typically a missing evidence package or an eval-stage FIX/required-fix result.

What it means operationally: The identified gap (e.g. missing evidence, an eval fix item) should be resolved and the case re-evaluated; it is not blocked outright and does not require escalation to a human authority beyond normal rework.

What it does not mean: REPAIR_REQUIRED does not mean the case failed a safety-critical check — those route to BLOCKED. It also does not approve anything; it is a routing status back toward rework.

### GOVERNANCE_REVIEW_REQUIRED

Definition: The use case has cleared all fail-closed and repair conditions but is flagged, at the upstream flow level, as requiring governance-sensitive review before proceeding further.

When it is produced: The upstream AI Governance Flow's `flow_final_status` is `GOVERNANCE_REVIEW_REQUIRED` and no FAIL, ESCALATE, or FIX condition otherwise applies.

What it means operationally: The case is otherwise clean, but the governance context flagged upstream (e.g. from the readiness scoring stage) still requires a governance-level look before institutional authority review.

What it does not mean: This status does not mean escalation is required (that is a stronger, separate status) and it does not mean the case is ready for authority review yet — it is an intermediate PASS-tier status.

### ESCALATE_REQUIRED

Definition: The use case cannot be resolved through fix-and-retry and requires human escalation.

When it is produced: The upstream flow's final status/review outcome signals escalation, or the eval stage's review outcome is ESCALATE or reports escalation reasons — and no FAIL-tier condition outranks it.

What it means operationally: A named human governance reviewer must resolve the escalation reason before the case can proceed; this is not something the case's owner can simply fix and resubmit.

What it does not mean: ESCALATE_REQUIRED does not mean the case failed — escalation exists specifically for ambiguity and judgment calls that a deterministic check cannot resolve, distinct from a hard FAIL.

### READY_FOR_AUTHORITY_REVIEW

Definition: All fail-closed, repair, and escalation conditions have cleared, and the case may now be reviewed by the appropriate human institutional authority.

When it is produced: No FAIL, ESCALATE, or FIX condition applies, and the upstream flow's final status is not `GOVERNANCE_REVIEW_REQUIRED`.

What it means operationally: The case has passed every automated check this chain performs. It is handed to a human authority for the actual institutional decision.

What it does not mean: READY_FOR_AUTHORITY_REVIEW does not mean production approval, does not mean a KFSA verdict, and does not mean an official decision. It is the gate's most favorable output, and it still requires a human authority step before anything is approved.

## 6. Input Factors

Governance Gate reasons over the following conceptual input factors:

- **Flow final status** — the terminal status from AI Governance Flow (e.g. BLOCKED, EVAL_ALLOWED, GOVERNANCE_REVIEW_REQUIRED, ESCALATE_REQUIRED).
- **Flow final review outcome** — the terminal PASS/FIX/FAIL/ESCALATE outcome from AI Governance Flow.
- **Eval review outcome** — the PASS/FIX/FAIL/ESCALATE outcome from Eval & Grader Matrix.
- **Eval score** — the 0–100 eval score.
- **Eval required fixes** — the list of correctable eval gaps.
- **Eval blocking failures** — the list of eval-stage fail-closed findings.
- **Eval escalation reasons** — the list of eval-stage escalation findings.
- **Authority required** — whether confirmed decision authority is required for this case.
- **Authority present** — whether that authority has actually been confirmed and evidenced.
- **Evidence required** — whether an evidence package is required for this case.
- **Evidence present** — whether that evidence package has actually been provided.
- **Production intended** — whether the case is intended to reach production.
- **Regulated or legal-sensitive context** — whether regulatory/legal impact is medium or high.
- **External-system access** — whether the case involves external-system tool access.
- **Write/action capability** — whether the case involves write-tool or action-taking capability.
- **Risk level** — the case's overall risk classification (low/medium/high).

## 7. Gate Logic

The gate resolves to a status using strict tiered priority:

- **FAIL routes to BLOCKED.**
- **ESCALATE routes to ESCALATE_REQUIRED.**
- **FIX routes to REPAIR_REQUIRED.**
- **PASS with governance-sensitive conditions (upstream flow flagged `GOVERNANCE_REVIEW_REQUIRED`) routes to GOVERNANCE_REVIEW_REQUIRED.**
- **PASS with required authority/evidence present (and no governance-sensitive flag) routes to READY_FOR_AUTHORITY_REVIEW.**

Priority is preserved:

**FAIL > ESCALATE > FIX > PASS**

All FAIL-tier conditions are checked first; if any apply, the gate resolves to BLOCKED regardless of any other condition. Only if no FAIL-tier condition applies are ESCALATE-tier conditions checked; only if none of those apply are FIX-tier conditions checked; only if none of those apply does the gate resolve within the PASS tier (GOVERNANCE_REVIEW_REQUIRED or READY_FOR_AUTHORITY_REVIEW).

Clarifications:
- FIX here is ReviewOutcome only.
- FIX is not KFSA FIX.
- KILL / SCALE / ALERT are forbidden as ReviewOutcome.

## 8. Fail-Closed Conditions

The following conditions must produce BLOCKED (FAIL tier):

- Upstream AI Governance Flow failed or was blocked (`flow_final_status` is BLOCKED, or `flow_final_review_outcome` is FAIL).
- Eval & Grader Matrix failed (`eval_review_outcome` is FAIL, or eval blocking failures are present).
- Missing required authority — authority is required for this case but has not been confirmed and evidenced.
- Missing required evidence for a safety-critical requirement.
- Missing auditability for an action-capable use case (write or external-system capability without a retrievable audit trail).
- Unsafe external/write action — an action taken without pre-authorization or with unclear/irreversible scope.
- Attempted production approval — any attempt, safe or unsafe, to set a production approval flag through this gate.
- Attempted official decision — any attempt to smuggle an `official_verdict` or `official_decision` through this gate.
- Attempted KFSA verdict generation — any attempt to have this gate produce a KFSA verdict directly.
- Critical data safety failure — carried forward from the eval stage's DATA_SAFETY dimension.
- Critical authority safety failure — carried forward from the eval stage's AUTHORITY_SAFETY dimension.

## 9. Repair Conditions

The following conditions must produce REPAIR_REQUIRED (FIX tier), provided no FAIL-tier condition applies:

- A correctable eval gap (eval-stage FIX outcome or non-empty required-fixes list).
- Missing non-critical evidence — an evidence package is required but not yet provided, and the gap is not itself a fail-closed condition.
- Incomplete documentation supporting an otherwise-passing case.
- Missing non-critical test coverage flagged by the eval stage as a FIX rather than a FAIL.
- A policy boundary that requires clarification but does not itself rise to an escalation-worthy ambiguity.

## 10. Escalation Conditions

The following conditions must produce ESCALATE_REQUIRED, provided no FAIL-tier condition applies:

- A high-risk issue that remains unresolved and cannot be closed through evidence alone.
- Regulated or legal-sensitive uncertainty — regulatory/legal impact is medium or high and the outcome is ambiguous rather than clearly passing or failing.
- External-system action ambiguity — uncertainty about the scope or reversibility of an external-system action.
- An unclear authority owner — no single named authority can be identified for a decision-relevant case.
- An unresolved safety failure that requires human governance judgment rather than a deterministic fix.
- A conflict between the eval result and business pressure to proceed — this is treated as an escalation, never as grounds to override the eval result.

## 11. Authority Review Readiness

READY_FOR_AUTHORITY_REVIEW means the use case may be reviewed by the proper institutional authority.

It does not mean production approval.
It does not mean KFSA verdict.
It does not mean official decision.

Minimum conditions for READY_FOR_AUTHORITY_REVIEW:

- Upstream flow is not blocked.
- Eval passed.
- Required authority is present.
- Required evidence is present.
- No blocking failures.
- No unresolved escalation reasons.
- production_approval_status remains false.

## 12. Output Contract

Conceptually, a governance gate run produces:

- **gate_status** — BLOCKED / REPAIR_REQUIRED / GOVERNANCE_REVIEW_REQUIRED / ESCALATE_REQUIRED / READY_FOR_AUTHORITY_REVIEW.
- **final_review_outcome** — PASS / FIX / FAIL / ESCALATE, derived per Section 7's priority order.
- **findings** — the specific reasons the gate resolved to its status.
- **required_fixes** — the correctable gaps identified for a REPAIR_REQUIRED case.
- **blocking_failures** — the fail-closed reasons identified for a BLOCKED case.
- **escalation_reasons** — the reasons identified for an ESCALATE_REQUIRED case.
- **authority_review_required** — whether human institutional authority review is the case's next step.
- **production_approval_status** — always `false`.
- **kfsa_reference** — always `external_applied_verdict_interface_only`.
- **notes** — supporting context, including the governance boundary statements that apply to every output.

## 13. Examples

**Example A — Flow blocked routes to BLOCKED.** Upstream AI Governance Flow's `flow_final_status` is BLOCKED (e.g. the readiness gate blocked the case on a missing control). Governance Gate resolves this as a FAIL-tier condition regardless of eval results. Result: BLOCKED.

**Example B — Eval failed routes to BLOCKED.** The upstream flow passed, but Eval & Grader Matrix returned `eval_review_outcome` FAIL with blocking failures (e.g. an AUTHORITY_SAFETY test case failed). Result: BLOCKED.

**Example C — Eval fix required routes to REPAIR_REQUIRED.** The upstream flow passed and eval returned FIX with a non-empty required-fixes list (e.g. missing non-critical evidence on a GROUNDING test case), with no FAIL or ESCALATE condition present. Result: REPAIR_REQUIRED.

**Example D — High-risk issue routes to ESCALATE_REQUIRED.** The upstream flow and eval stage both otherwise pass, but the eval stage reported an escalation reason (e.g. a regulatory/legal-sensitivity concern on an AUTHORITY_SAFETY test case), and no FAIL-tier condition applies. Result: ESCALATE_REQUIRED.

**Example E — Eval passed with authority/evidence present routes to READY_FOR_AUTHORITY_REVIEW.** The upstream flow passed (not flagged GOVERNANCE_REVIEW_REQUIRED), eval passed with no fixes or escalations, and required authority and evidence are both confirmed present. Result: READY_FOR_AUTHORITY_REVIEW — the case may now go to the appropriate human institutional authority, with production_approval_status still false.

## 14. Governance Boundaries

- Not production runtime.
- Not KFSA Core.
- Not SDGM.
- Not API.
- Not database.
- Not CI.
- Not customer deployment.
- Does not approve production.
- READY_FOR_AUTHORITY_REVIEW does not approve production.
- production_approval_status remains false.
- Does not generate official_decision.
- Does not generate official_verdict.
- Does not generate KFSA verdict.
- KFSA remains external source-of-truth.
- KFSA remains KILL / FIX / SCALE / ALERT.
- ALERT is preserved.

## 15. Alignment With Reference Implementation

This specification is backfilled to align with:
`reference-implementations/governance-gate-v1/`

It describes, at the specification level, the behavior already implemented and merged in that folder (`types.ts`, `gate.ts`, `examples.ts`, `README.md`). Do not change the reference implementation in this PR. Where this document and the reference implementation could ever be read as disagreeing, the reference implementation's executable behavior is the source of truth for what is actually built; this document exists to give that behavior a durable, non-code specification.
