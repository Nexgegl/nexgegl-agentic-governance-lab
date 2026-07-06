# Governed AI Decisioning Standard v0.1

## Document Status

Status:
DRAFT STANDARD

Document Type:
Master Standard

Scope:
NEXGEGL AI output governance, retrieval governance, decision legitimacy, and execution control.

This standard does not modify runtime files.

This standard does not create marketing claims.

This standard does not claim production runtime implementation is complete.

This standard does not claim CI automation is complete.

## Purpose

Define how NEXGEGL governs AI-generated outputs before they become institutional decisions or executable actions.

NEXGEGL does not treat AI output as a decision by default.

NEXGEGL does not treat AI recommendation as authority.

NEXGEGL does not treat AI automation as execution permission.

## Core Principle

AI Output is not a Decision.

AI Recommendation is not Authority.

AI Automation is not Execution Permission.

Any AI-generated output must be classified before use as one of:

1. Information
2. Signal
3. Recommendation
4. Draft decision
5. Approved decision
6. Executable action

No AI output may move from recommendation to decision or execution without Evidence + Authority + Audit.

## Problem

Most AI governance discussions focus on policies, data quality, retrieval, model safety, hallucination reduction, or guardrails.

Those controls are necessary but incomplete.

The larger institutional risk is when AI output moves directly into action without decision legitimacy.

The risk is not only that AI may hallucinate.

The larger risk is that an AI output may be treated as an approved institutional decision without:
- valid evidence
- decision owner
- authority check
- approval record
- execution boundary
- audit trail

## Governed AI Decisioning Model

NEXGEGL uses six operational layers for governed AI decisioning:

| Layer | Name | Control Question | System Role |
|---|---|---|---|
| 1 | Authority Governance | Who has the right to decide? | Prevents decisions outside authority |
| 2 | Evidence Governance | Is the evidence valid, current, and traceable? | Links outputs to approved evidence |
| 3 | Context Governance | Is the retrieved context reliable and relevant? | Governs RAG, knowledge context, and internal facts |
| 4 | Output Governance | Is the AI output safe, scoped, and validated? | Applies guardrails and validation |
| 5 | Decision Governance | Is this a signal, recommendation, or institutional decision? | Applies SDGM meaning and legitimacy controls |
| 6 | Execution Governance | Is execution permitted and auditable? | Applies KFSA verdict, action controls, and audit |

## Layer 1: Authority Governance

Purpose:
Ensure that no AI output becomes a decision without an authorized decision owner.

Required controls:
- decision owner identified
- authority level checked
- delegation boundaries checked
- approval path defined
- escalation path defined

Forbidden:
- AI approving its own recommendation
- AI bypassing human authority
- AI executing outside delegated authority
- treating system confidence as approval authority

## Layer 2: Evidence Governance

Purpose:
Ensure that every material AI output is supported by valid evidence.

Required controls:
- evidence source identified
- evidence freshness checked
- evidence owner identified where applicable
- evidence quality assessed
- evidence reference retained
- missing evidence disclosed

Forbidden:
- unsupported quantified claims
- treating promised payment as recovered cash
- treating partial evidence as final status
- using stale context without disclosure
- using unverified third-party statistics in official outputs

## Layer 3: Context Governance

Purpose:
Govern retrieval, RAG, knowledge context, internal facts, metadata, and data lineage.

RAG is a retrieval mechanism.

RAG is not decision authority.

RAG output is not automatically true, approved, or executable.

Required controls:
- retrieval source identified
- retrieval timestamp retained
- retrieval scope defined
- source reliability checked
- conflicting evidence surfaced
- missing context disclosed

Relationship to DataHub:
DataHub may support metadata, ownership, lineage, glossary, tags, source freshness, and dependency mapping.

DataHub does not replace decision authority.

DataHub does not replace SDGM.

DataHub does not replace KFSA.

## Layer 4: Output Governance

Purpose:
Validate AI-generated outputs before they are used in institutional workflows.

Required controls:
- hallucination risk check
- claim support check
- legal/compliance risk check
- customer-facing wording check
- financial misstatement risk check
- unsafe automation check
- scope and limitation disclosure

Forbidden:
- guaranteed recovery claims
- false regulatory approval claims
- unsupported competitor superiority claims
- unsupported board approval claims
- unsupported KPI improvement claims
- automatic recovered_cash_total claims

## Layer 5: Decision Governance

Purpose:
Separate signals and recommendations from institutional decisions.

SDGM governs meaning and legitimacy.

Required classifications:
- Signal
- Recommendation
- Draft decision
- Approved decision
- Rejected decision
- Escalated decision

Required controls:
- decision object created only when authorized
- decision rationale captured
- evidence references attached
- decision owner recorded
- approval record retained
- decision status auditable

Rules:
- Signal is not Decision.
- Recommendation is not Decision.
- Draft decision is not Approved decision.
- Approved decision requires Evidence + Authority + Audit.

## Layer 6: Execution Governance

Purpose:
Ensure that no action is executed without a legitimate decision and audit trail.

KFSA governs decision/action treatment and verdict handling.

Required controls:
- executable action mapped to approved decision
- action boundary defined
- action owner identified
- execution permission checked
- rollback or mitigation path defined where applicable
- audit trail retained

KFSA preservation:
- KILL / FIX / SCALE / ALERT must remain preserved where applicable.
- ALERT must not be dropped.
- KFSA must not be collapsed into three options.
- Governance-review vocabulary must not silently erase decision/action treatment vocabulary.

Rules:
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.

## AI Output Classification

| Classification | Description | May Trigger Action? | Required Control |
|---|---|---|---|
| Information | General answer or retrieved fact | No | Source disclosure where material |
| Signal | Potential issue, opportunity, risk, or pattern | No | Evidence reference and confidence boundary |
| Recommendation | Suggested path or option | No direct action | Evidence + rationale + owner review |
| Draft decision | Proposed institutional decision | No execution | Authority review and approval workflow |
| Approved decision | Authorized institutional commitment | Yes, if execution controls pass | Evidence + Authority + Audit |
| Executable action | Operational action resulting from approved decision | Yes | Approved decision link + action boundary + audit |

## Relationship to SDGM

SDGM governs:
- meaning
- signal interpretation
- decision legitimacy
- separation between signal, recommendation, decision, and action
- evidence-to-decision chain

This standard does not redefine SDGM.

This standard operationalizes where SDGM must be applied in AI-enabled workflows.

## Relationship to KFSA

KFSA governs:
- decision/action treatment
- KILL / FIX / SCALE / ALERT handling
- action boundaries
- execution governance
- audit expectations

This standard does not redefine KFSA.

This standard preserves ALERT.

This standard does not collapse KFSA.

## Relationship to NCGR / ESTARED

For NCGR / ESTARED:

AI may identify:
- overdue customers
- promised payments
- payment references
- missing evidence
- high-risk accounts
- recovery workflow priorities
- status inconsistencies

AI may not independently:
- classify promised payment as RECOVERED
- add promised amounts to recovered_cash_total
- approve recovery status
- guarantee recovery outcomes
- trigger legal collection without authority
- execute customer-facing action outside approved workflow

RECOVERED requires:
- settlement evidence
- authority approval
- audit trail

Payment Promised is not Recovered.

## Required Evidence Standard

Any governed AI output that affects financial, customer, legal, operational, board, or executive workflows must retain:

- source reference
- retrieval timestamp where applicable
- evidence owner where applicable
- confidence boundary
- missing data disclosure
- approval requirement
- audit note

## Forbidden Claims and Behaviors

The following are prohibited without approved evidence, authority, legal/compliance review where applicable, and audit:

- AI has approved the decision
- AI has recovered cash
- payment promised is recovered
- recovery is guaranteed
- regulatory approval is obtained without evidence
- ESTARED is the only platform without verified market evidence
- ESTARED is safer, superior, or more trusted without approved methodology
- board approval exists without minutes or resolution
- KPI improvement exists without baseline, method, owner, and evidence
- AI may execute directly because confidence is high

## Minimum Review Routing

| Trigger | Required Review |
|---|---|
| Customer-facing claim | legal-compliance-reviewer + product-governor |
| Pricing or package scope | pricing-scope-skill + legal-compliance-reviewer |
| Competitor comparison | competitor-trust-audit-skill + legal-compliance-reviewer |
| Board/executive wording | board-response-skill + executive-brief-skill |
| Recovery status or recovered_cash_total | cfo-logic-reviewer + CRAG |
| RLS or tenant data access | security-rls-auditor |
| Decision/action treatment | CRAG + product-governor |
| Missing evidence | evidence-pack-builder-skill |

## Implementation Boundary

This standard is a governance standard.

It does not implement runtime code.

It does not create database tables.

It does not create CI checks.

It does not change product behavior by itself.

Runtime implementation requires:
- product owner approval
- CRAG review
- relevant domain owner review
- implementation PR
- audit note

## Non-Negotiable Rules

- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- Signal is not Decision.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- KFSA is not collapsed.
- ALERT is preserved.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- Claude Code / CLAUDE.md is the current execution adapter, not the source of truth.
- NEXGEGL Governance Runtime remains the source of truth.

## Recommended Next Step

After this standard is merged:
- update the relevant standards index or README if one exists
- later create a benchmark to test governed AI decisioning behavior
- later evaluate whether product profiles need cross-references
- do not start runtime implementation until owner approval and CRAG review
