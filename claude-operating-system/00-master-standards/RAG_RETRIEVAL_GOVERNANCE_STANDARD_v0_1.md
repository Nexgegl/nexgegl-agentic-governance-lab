# RAG Retrieval Governance Standard v0.1

## Document Status

Status:
DRAFT STANDARD

Document Type:
Master Standard

Scope:
NEXGEGL retrieval governance, RAG grounding, internal knowledge context, source quality, freshness, evidence traceability, and retrieval-to-decision boundaries.

This standard does not modify runtime files.

This standard does not implement RAG.

This standard does not create vector databases, embeddings, connectors, or retrieval pipelines.

This standard does not claim production runtime implementation is complete.

This standard does not claim CI automation is complete.

This standard does not create marketing claims.

## Purpose

Define how NEXGEGL governs retrieval-augmented generation, internal knowledge context, source grounding, and evidence use before AI outputs are trusted in governed workflows.

RAG helps retrieve context.

RAG does not create decision authority.

RAG does not approve evidence.

RAG does not permit execution.

Retrieved context must be treated as evidence input, not institutional decision.

## Core Principle

RAG is Retrieval, not Authority.

Retrieved Context is Evidence Input, not Decision.

Grounded Output is Safer, not Automatically Approved.

No retrieved answer may become a decision or executable action without Evidence + Authority + Audit.

## Problem

Organizations often assume that connecting an AI agent to internal files, CRM, ERP, databases, or knowledge bases makes its answers reliable enough for action.

This assumption is unsafe.

RAG can reduce unsupported answering, but it can also introduce governed risks:
- stale sources
- incomplete retrieval
- wrong document selection
- missing owner
- outdated customer notes
- conflicting evidence
- unapproved internal drafts
- private or restricted data exposure
- source lineage gaps
- retrieval treated as approval
- answer treated as decision

NEXGEGL requires retrieval to be governed before it affects financial, customer, legal, operational, board, or executive workflows.

## Retrieval Governance Model

NEXGEGL uses seven operational controls for governed retrieval:

| Control | Question | Required Outcome |
|---|---|---|
| 1. Source Eligibility | Is this source allowed for this workflow? | Only approved sources can be retrieved |
| 2. Source Ownership | Who owns this source? | Owner or steward is identifiable |
| 3. Freshness | Is the source current enough? | Freshness threshold is checked |
| 4. Relevance | Is the retrieved context relevant to the question? | Irrelevant retrieval is excluded or disclosed |
| 5. Completeness | Is important context missing? | Missing data is disclosed |
| 6. Conflict Handling | Do sources disagree? | Conflicts are surfaced, not hidden |
| 7. Decision Boundary | Is this retrieval being treated as a decision? | Retrieval remains Signal/Evidence input until approved |

## Control 1: Source Eligibility

Purpose:
Prevent AI agents from retrieving and using unauthorized, irrelevant, draft, restricted, or unsafe sources.

Required:
- approved source list
- source type classification
- access boundary
- sensitivity classification
- workflow relevance
- retention rule where applicable

Forbidden:
- retrieving from unapproved sources for governed decisions
- treating personal notes as approved institutional evidence
- using draft documents as final authority without disclosure
- using scraped or third-party data without reliability review
- using customer-sensitive data outside approved access boundaries

## Control 2: Source Ownership

Purpose:
Ensure every material source has an identifiable owner or steward.

Required:
- source owner
- business domain
- data steward where applicable
- update responsibility
- approval responsibility where applicable

Forbidden:
- source used in executive or financial output with no owner
- orphaned spreadsheets used as decision evidence
- unclear ownership for customer, recovery, legal, or board materials

## Control 3: Freshness

Purpose:
Prevent stale retrieval from being treated as current evidence.

Required:
- retrieval timestamp
- source last-updated timestamp where available
- freshness threshold by workflow
- stale-context warning when threshold is exceeded
- review requirement for high-impact stale sources

Examples:
- Customer payment status requires recent evidence.
- recovered_cash_total requires settlement evidence, approval, and audit.
- Board approval requires minutes, resolution, or decision record.
- Competitor comparison requires dated source capture and methodology.

Forbidden:
- treating old customer notes as current promise to pay
- treating outdated payment references as RECOVERED
- treating stale competitor data as current market position
- using old policy documents without version disclosure

## Control 4: Relevance

Purpose:
Ensure retrieved context actually answers the user question or workflow need.

Required:
- query intent identified
- retrieved chunks matched to intent
- irrelevant sources excluded
- weak relevance disclosed
- final answer scoped to retrieved evidence

Forbidden:
- answering beyond retrieved evidence
- mixing unrelated customer accounts
- using broad context to justify specific action
- presenting retrieved text as proof when it does not support the claim

## Control 5: Completeness

Purpose:
Ensure the system discloses when retrieved evidence is incomplete.

Required:
- missing fields identified
- missing documents disclosed
- incomplete source chain noted
- partial evidence classification where applicable
- next evidence needed stated

For NCGR / ESTARED:
- payment promise alone is incomplete
- bank/accounting match without settlement confirmation, approval, and audit is incomplete
- PARTIAL_EVIDENCE is not RECOVERED
- PROMISED_TO_PAY is not RECOVERED
- recovered_cash_total must not include incomplete recovery evidence

## Control 6: Conflict Handling

Purpose:
Prevent the agent from hiding disagreement between sources.

Required:
- conflicting sources surfaced
- conflict type identified
- source priority rule applied where approved
- unresolved conflict disclosed
- escalation path defined

Forbidden:
- choosing the most convenient source without disclosure
- resolving accounting/customer/legal conflict without authority
- suppressing contradictory evidence
- treating conflict as resolved because AI confidence is high

## Control 7: Decision Boundary

Purpose:
Ensure retrieval outputs do not become institutional decisions or actions without governance.

Rules:
- Retrieved answer is not a decision.
- RAG output is not authority.
- Retrieved context is not approval.
- Source match is not execution permission.
- Grounded answer may become Signal or Recommendation only unless approved.

Any movement from retrieved output to decision or action requires:
- Evidence + Authority + Audit
- decision owner
- approval path
- execution boundary
- audit trail

## Retrieval Output Classification

| Retrieval Output | Meaning | May Trigger Action? | Required Control |
|---|---|---|---|
| Retrieved Fact | A fact found in an approved source | No | Source reference and timestamp |
| Retrieved Signal | A pattern or risk inferred from retrieved sources | No | Evidence reference and confidence boundary |
| Retrieved Recommendation | Suggested next step based on retrieved evidence | No direct action | Owner review and approval requirement |
| Evidence Candidate | Potential evidence that may support a decision | No | Validation and source-owner review |
| Approved Evidence | Evidence accepted by authorized owner | May support decision | Authority approval and audit note |
| Decision Evidence | Evidence attached to approved decision object | May support execution | Decision link and audit trail |

## Required Retrieval Metadata

Every governed retrieval event should retain where applicable:

- retrieval query
- retrieval timestamp
- source system
- source document or table
- source owner
- source last-updated timestamp
- retrieved excerpt or reference
- relevance score or relevance rationale
- freshness status
- sensitivity classification
- missing context disclosure
- conflict disclosure
- answer boundary
- audit note where material

## Relationship to DataHub

DataHub may support:
- metadata catalog
- ownership
- lineage
- glossary
- tags
- freshness
- dependency mapping
- dataset discovery
- source context

DataHub does not replace:
- decision authority
- SDGM
- KFSA
- Evidence + Authority + Audit
- legal/compliance review
- board approval
- human owner approval
- execution permission

DataHub can help identify what data is available.

DataHub does not decide what action is legitimate.

## Relationship to Governed AI Decisioning

This standard supports Governed AI Decisioning by controlling the Context Governance and Evidence Governance layers.

RAG retrieval may support:
- Information
- Signal
- Recommendation
- Evidence Candidate

RAG retrieval may not independently create:
- Approved decision
- Executable action
- recovered_cash_total
- board approval
- legal collection authority
- guaranteed outcome

## Relationship to Skill Optimization Governance

Skills that use retrieval must be optimized only through validated changes.

A retrieval skill update must preserve:
- source eligibility
- freshness checks
- missing evidence disclosure
- conflict handling
- decision boundary
- Evidence + Authority + Audit
- ALERT preservation
- KFSA boundaries

No retrieval skill may be updated merely to answer faster if it weakens source quality or governance.

## Relationship to SDGM

SDGM governs:
- meaning of retrieved signals
- interpretation of evidence
- separation between information, signal, recommendation, decision, and action
- decision legitimacy

This standard does not redefine SDGM.

This standard operationalizes retrieval controls before SDGM classification and decision legitimacy review.

## Relationship to KFSA

KFSA governs:
- decision/action treatment
- KILL / FIX / SCALE / ALERT
- execution boundaries
- audit expectations

This standard does not redefine KFSA.

This standard preserves ALERT.

This standard does not collapse KFSA.

Retrieved context may inform KFSA treatment.

Retrieved context does not replace KFSA governance.

## Relationship to NCGR / ESTARED

For NCGR / ESTARED, RAG may retrieve:
- customer notes
- payment promises
- invoices
- payment references
- bank/accounting entries
- settlement confirmations
- dispute notes
- approval records
- audit trail references

RAG may not independently:
- classify PROMISED_TO_PAY as RECOVERED
- classify PARTIAL_EVIDENCE as RECOVERED
- add promised amounts to recovered_cash_total
- approve recovery status
- guarantee recovery outcomes
- trigger legal collection
- send customer-facing recovery action without approved workflow

RECOVERED requires:
- settlement evidence
- authority approval
- audit trail

Payment Promised is not Recovered.

## Required Review Routing

| Trigger | Required Review |
|---|---|
| Retrieval affects customer-facing claim | legal-compliance-reviewer + product-governor |
| Retrieval affects pricing/package scope | pricing-scope-skill + legal-compliance-reviewer |
| Retrieval affects competitor comparison | competitor-trust-audit-skill + legal-compliance-reviewer |
| Retrieval affects board/executive wording | board-response-skill + executive-brief-skill |
| Retrieval affects recovery status or recovered_cash_total | cfo-logic-reviewer + CRAG |
| Retrieval touches RLS or tenant data access | security-rls-auditor |
| Retrieval changes decision/action treatment | CRAG + product-governor |
| Retrieval has missing or conflicting evidence | evidence-pack-builder-skill + relevant domain owner |
| Retrieval uses stale high-impact source | CRAG + domain owner |

## Forbidden Claims and Behaviors

The following are prohibited:
- claiming RAG eliminates hallucination
- claiming RAG output is automatically correct
- claiming retrieved context is approved evidence without owner approval
- treating RAG output as decision authority
- treating retrieved source match as execution permission
- hiding stale context
- hiding missing context
- hiding conflicting evidence
- using unapproved sources for governed workflows
- using retrieved payment promise as recovered cash
- using retrieved competitor snippets as superiority evidence without methodology
- using retrieved board notes as approval without minutes/resolution
- using customer data outside approved access boundaries
- bypassing RLS or tenant isolation for retrieval

## Implementation Boundary

This standard defines governance for RAG and retrieval.

It does not implement retrieval.

It does not create vector databases.

It does not create embeddings.

It does not create connectors.

It does not create CI checks.

It does not change product behavior by itself.

Runtime implementation requires:
- owner approval
- CRAG review
- security review where data access is affected
- relevant domain owner review
- implementation PR
- audit note

## Non-Negotiable Rules

- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- Grounded Output is Safer, not Automatically Approved.
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
- update the master standards index
- later create a benchmark to test retrieval governance behavior
- later evaluate whether retrieval-related skills need cross-references
- do not start runtime implementation until owner approval, CRAG review, and security review where applicable
