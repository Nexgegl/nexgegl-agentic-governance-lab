# AI Governance Doctrine v1.0

## Document Status

Status:
OPERATIONAL DOCTRINE

Extension:
Governance Lab v0.4 — AI Governance & Agent Adoption Operating System

Parent folder:
`claude-operating-system/08-ai-governance-adoption-os/`

Source alignment:
`00-notion-methodology-brief-v0-1.md`

Extension index:
`README.md`

Post-closure note:
This document is created after Governance Baseline v0.1 closure.

It does not reopen Governance Baseline v0.1.

It does not modify Governance Baseline v0.1.

It does not create a new repository.

It does not implement runtime code.

It does not create database tables.

It does not create CI checks.

It does not claim AI governance runtime implementation is complete.

It does not claim agent runtime implementation is complete.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Opening Doctrine Statement

NEXGEGL does not implement AI because it is possible.

NEXGEGL implements AI only when the use case is governed, measurable, secure, and decision-relevant.

## Purpose

This doctrine defines the non-negotiable operating rules for AI governance and agent adoption work inside NEXGEGL.

It converts principles into reviewable operating checks.

This document is not motivational content.

This document is not marketing content.

This document is not generic AI consulting content.

This document is not runtime implementation.

This document is an operational doctrine.

## Operating Principle

Governance Lab v0.4 must be built as:

Governance as Algorithms

Not governance as essays.

Rule:

No operational artifact, no merge.

This doctrine includes operational artifacts:
- doctrine rule table
- forbidden pattern table
- operational check table
- fail-closed logic
- review outcome logic
- example violation cases

## External Source-of-Truth Boundaries

### KFSA Boundary

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This document does not define KFSA.

This document does not redefine KFSA.

This document does not create a competing KFSA scoring model.

This document does not create a replacement verdict system.

This document may reference KFSA only as an applied decision-gate interface.

KFSA must always preserve:

KILL / FIX / SCALE / ALERT

ALERT must not be dropped.

KFSA must not be collapsed.

### SDGM Boundary

SDGM is not defined in this document.

SDGM is not redefined in this document.

SDGM may be referenced only as a governed signal-to-decision meaning and legitimacy model.

This document must not redefine:
- Signal
- Decision
- Evidence
- Authority
- Audit
- Execution

### Agent Governance Boundary

Agent Governance is not KFSA Core.

Agent Governance must not be merged into KFSA Core.

Agent/tool governance may provide:
- use case triage
- permission boundaries
- tool governance
- evidence requirements
- runtime checks
- evaluation gates
- escalation rules
- audit requirements

KFSA remains the applied verdict interface when a governed decision treatment is required.

## Doctrine Rules

| ID | Rule | Operating Meaning | Required Check |
|---|---|---|---|
| D01 | The model is not the starting point | Start with business use case, risk, process, data, and authority | Confirm use case exists before model selection |
| D02 | No AI without a clear use case | AI must solve a defined problem or decision need | Require use case statement, owner, expected outcome |
| D03 | No Agent without authority and boundaries | Agents must have defined role, owner, tool limits, data boundaries, and escalation rules | Require authority and permission profile |
| D04 | No production without eval | Any AI or agent output used operationally must pass evaluation before production use | Require eval matrix and test cases |
| D05 | No recommendation without evidence | AI recommendation must be grounded in traceable evidence | Require evidence references and confidence limits |
| D06 | No decision without authority | AI cannot approve institutional decisions | Require human or delegated decision authority |
| D07 | No scale without governance | Successful pilot does not automatically authorize scale | Require governance gate before scale |
| D08 | No open context without management | Context must be curated, bounded, and traceable | Require context boundary and source eligibility |
| D09 | No tool use without verification | Tools require permission, expected behavior, and validation | Require tool permission and output verification |
| D10 | No AI sale when no-AI is the correct answer | NEXGEGL must not force AI where automation, workflow, process repair, or no action is better | Require use case triage outcome |

## Doctrine Constraints

| Constraint | Meaning | Fail Condition |
|---|---|---|
| Evidence constraint | Outputs must be traceable to accepted evidence | Recommendation has no evidence |
| Authority constraint | Decisions require approved authority | AI output presented as decision |
| Evaluation constraint | Production requires eval | No test cases or grader matrix |
| Security constraint | Sensitive data requires boundaries | Agent/tool has unrestricted access |
| Context constraint | Context must be scoped | Open-ended memory or unverified retrieval |
| Tool constraint | Tool use must be permissioned | Tool can act without approval |
| Audit constraint | Material actions must be logged | No traceable record |
| Commercial constraint | Selling requires operating readiness | Offer exists before internal artifacts |
| KFSA boundary constraint | KFSA must not be redefined here | Document creates KFSA scoring or replacement |
| ALERT preservation constraint | ALERT must remain part of KFSA references | KFSA appears as only KILL/FIX/SCALE |

## Forbidden Patterns

| ID | Forbidden Pattern | Why It Is Forbidden | Required Review Response |
|---|---|---|---|
| F01 | Starting with a model before defining the use case | Creates technology-first implementation risk | FIX |
| F02 | Treating AI output as institutional truth | Violates evidence and authority boundaries | FIX or FAIL |
| F03 | Treating AI recommendation as approval | Violates decision authority | FIX |
| F04 | Allowing agent tool use without permission | Creates execution and security risk | FAIL or FIX |
| F05 | Moving to production without eval | Creates uncontrolled quality and risk exposure | FAIL |
| F06 | Treating RAG as authority | Retrieval is evidence input, not authority | FIX |
| F07 | Scaling a pilot without governance gate | Creates unmanaged adoption risk | FIX |
| F08 | Removing ALERT from KFSA | Breaks required KFSA completeness | FIX |
| F09 | Redefining KFSA inside v0.4 | Conflicts with external source-of-truth boundary | FAIL |
| F10 | Merging Agent Governance into KFSA Core | Creates architecture drift | FIX or FAIL |
| F11 | Creating client offers before internal artifacts | Converts operating system into sales copy | FIX |
| F12 | Claiming runtime implementation without runtime code | Creates false production claim | FAIL |

## Operational Checks

| Check ID | Check | PASS | FIX | FAIL |
|---|---|---|---|---|
| C01 | Use case clarity | Clear owner, problem, outcome, decision relevance | Missing one element | No use case |
| C02 | Data readiness | Data source, quality, access, sensitivity known | Partial data profile | Unknown or unsafe data |
| C03 | Evidence readiness | Evidence sources traceable | Evidence partial or weak | No evidence |
| C04 | Authority readiness | Decision authority defined | Authority unclear | No authority for decision |
| C05 | Eval readiness | Eval criteria and test cases defined | Eval partial | No eval |
| C06 | Security readiness | Data and tool boundaries defined | Boundaries incomplete | Unsafe access |
| C07 | Tool readiness | Tools permissioned and verified | Partial tool controls | Tool can act uncontrolled |
| C08 | Context readiness | Context scoped and source-controlled | Context partially scoped | Open or unverified context |
| C09 | Audit readiness | Action/evidence trail defined | Audit partial | No audit trail |
| C10 | KFSA boundary readiness | KFSA referenced only as external applied verdict interface | Boundary language unclear | KFSA redefined or collapsed |
| C11 | ALERT preservation | KILL / FIX / SCALE / ALERT preserved | ALERT not emphasized | ALERT dropped |
| C12 | Commercial readiness | Internal artifacts exist before offer | Offer draft premature | Client offer before controls |

## Fail-Closed Logic

The default behavior for uncertainty is containment, not execution.

Use this logic:

```text
IF use_case_missing THEN FAIL

IF evidence_missing AND decision_relevance_high THEN FAIL

IF authority_missing AND decision_or_execution_requested THEN FAIL

IF eval_missing AND production_requested THEN FAIL

IF sensitive_data_present AND security_boundary_missing THEN FAIL

IF tool_use_requested AND permission_missing THEN FAIL

IF agent_action_requested AND owner_missing THEN FAIL

IF context_source_unverified AND output_used_for_decision THEN FAIL

IF KFSA_redefined_here THEN FAIL

IF ALERT_dropped_from_KFSA_reference THEN FAIL

IF runtime_claimed_without_runtime_code THEN FAIL

IF commercial_offer_created_before_internal_artifacts THEN FIX

ELSE continue_to_review
```

Fail-closed rule:

If any FAIL condition is true, execution stops.

FAIL is not resolved by re-prompting the model.

FAIL is resolved by supplying the missing use case, evidence, authority, eval, boundary, or permission.

## Review Outcomes

Every doctrine review must resolve to one of the following review-control outcomes:

| Outcome | Meaning | Allowed Next Action |
|---|---|---|
| PASS | All applicable doctrine checks pass | Proceed to next build-sequence step |
| FIX | One or more checks require correction | Correct and re-review before proceeding |
| FAIL | A forbidden pattern or fail-closed condition is confirmed | Stop; do not proceed until root cause is resolved |
| ESCALATE | Missing authority, evidence, ownership, or boundary clarity prevents a doctrine ruling | Route to human decision-maker |

These are review-control outcomes.

They do not replace KFSA.

They do not redefine KFSA.

They must not be treated as institutional decision verdicts.

KFSA remains the external applied verdict interface when a governed decision treatment is required.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT must be preserved.

## Example Violation Cases

These examples are illustrative only.

They do not redefine NCGR, ESTARED, SDGM, KFSA, or NEXGEGL.

### Case 1 — Model-First Proposal

A team proposes adopting an agent framework before defining the business use case.

Doctrine rule triggered:
D01, F01

Outcome:
FIX — require use case statement, owner, and expected outcome before proceeding.

### Case 2 — Unverified Agent Tool Access

An agent is granted database write access without a permission profile or owner sign-off.

Doctrine rule triggered:
D03, D09, F04

Outcome:
FAIL — tool access must be revoked until permission and audit requirements are defined.

### Case 3 — Production Push Without Eval

A team wants to move a drafting assistant into production without a grader matrix or test cases.

Doctrine rule triggered:
D04, F05

Outcome:
FAIL — production use is blocked until eval readiness (C05) passes.

### Case 4 — Retrieval Treated as Authority

A retrieval-augmented agent's fetched policy text is cited as if it were an approved institutional decision.

Doctrine rule triggered:
F06

Outcome:
FIX — reclassify retrieved content as Evidence Candidate; require Authority and Decision steps before reliance.

### Case 5 — Premature Commercial Offer

A commercial AI governance offer is drafted before the use case triage algorithm, scoring model, and gate algorithm exist.

Doctrine rule triggered:
D10, F11, C12

Outcome:
FIX — pause offer drafting until the approved build sequence reaches that step.

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create the use case triage algorithm.

This document does not create scoring models.

This document does not create eval matrices.

This document does not create governance gate algorithms.

This document does not create agent permission schemas.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This document is operational doctrine, not final runtime implementation.

## Non-Negotiable Rules

- KFSA is not defined here.
- KFSA is not redefined here.
- KFSA is not collapsed.
- ALERT is preserved.
- SDGM is not redefined here.
- Agent Governance is not KFSA Core.
- Agent/tool governance must fail closed.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- No execution without authority.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- No production without eval.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- No operational artifact, no merge.

## Immediate Next Step

After this doctrine is merged, create:

`02-use-case-triage-algorithm.md`

Do not skip directly to scoring models, gates, schemas, or commercial offers.

## Final Position

The AI Governance Doctrine v1.0 converts NEXGEGL's AI governance principles into reviewable operating rules, forbidden patterns, checks, fail-closed logic, and review outcomes.

It does not implement runtime enforcement.

It is the doctrine layer that the use case triage algorithm, readiness scoring model, eval matrix, governance gate algorithm, and agent permission schema must build on without redefining KFSA, SDGM, or Agent Governance boundaries.
