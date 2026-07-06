# NEXGEGL Master Standards

## Purpose

This folder contains master standards for the NEXGEGL Claude Operating System.

Master standards define governance rules, decision boundaries, source-of-truth principles, and operating constraints.

They do not implement runtime code by themselves.

They do not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

## Standards Index

| Standard | File | Type | Status | Purpose |
|---|---|---|---|---|
| Governed AI Decisioning Standard v0.1 | `GOVERNED_AI_DECISIONING_STANDARD_v0_1.md` | Master Standard | DRAFT STANDARD | Defines how NEXGEGL governs AI-generated outputs before they become institutional decisions or executable actions |
| RAG Retrieval Governance Standard v0.1 | `RAG_RETRIEVAL_GOVERNANCE_STANDARD_v0_1.md` | Master Standard | DRAFT STANDARD | Defines how NEXGEGL governs RAG, retrieval, internal knowledge context, source grounding, freshness, and evidence boundaries before AI outputs are trusted in governed workflows |
| Skill Optimization Governance Standard v0.1 | `SKILL_OPTIMIZATION_GOVERNANCE_STANDARD_v0_1.md` | Master Standard | DRAFT STANDARD | Defines how NEXGEGL improves agent skills through evidence-backed, bounded, validated changes instead of casual edits |

## Governed AI Decisioning Standard v0.1

Reference:
`GOVERNED_AI_DECISIONING_STANDARD_v0_1.md`

Core rules:
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- No AI output may move from recommendation to decision or execution without Evidence + Authority + Audit.
- RAG is retrieval/context, not decision authority.
- DataHub may support metadata, lineage, ownership, freshness, and context, but does not replace decision authority.
- SDGM governs meaning and decision legitimacy.
- KFSA governs decision/action treatment and execution governance.
- ALERT is preserved.
- KFSA is not collapsed.

## RAG Retrieval Governance Standard v0.1

Reference:
`RAG_RETRIEVAL_GOVERNANCE_STANDARD_v0_1.md`

Core rules:
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- Grounded Output is Safer, not Automatically Approved.
- No retrieved answer may become a decision or executable action without Evidence + Authority + Audit.
- Retrieval requires source eligibility, source ownership, freshness, relevance, completeness, conflict handling, and decision boundary controls.
- DataHub may support metadata, ownership, lineage, glossary, tags, freshness, dependency mapping, dataset discovery, and source context.
- DataHub does not replace decision authority, SDGM, KFSA, Evidence + Authority + Audit, legal/compliance review, board approval, human owner approval, or execution permission.
- PROMISED_TO_PAY is not RECOVERED.
- PARTIAL_EVIDENCE is not RECOVERED.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- ALERT is preserved.
- KFSA is not collapsed.

## Skill Optimization Governance Standard v0.1

Reference:
`SKILL_OPTIMIZATION_GOVERNANCE_STANDARD_v0_1.md`

Core rules:
- Skills are not edited casually.
- Skills are improved through evidence-backed, bounded, validated changes.
- No skill change without baseline.
- No material skill change without validation.
- No accepted edit without audit.
- Rejected edits become negative feedback, not accepted rules.
- Skill optimization must preserve SDGM and KFSA boundaries.
- ALERT is preserved.
- KFSA is not collapsed.

## Shared Non-Negotiable Rules

- Benchmarks and standards do not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.
- KFSA is not collapsed.
- ALERT is preserved.
- Signal is not Decision.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- Grounded Output is Safer, not Automatically Approved.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- Claude Code / CLAUDE.md is the current execution adapter, not the source of truth.
- NEXGEGL Governance Runtime remains the source of truth.

## Implementation Boundary

These standards do not implement runtime code.

These standards do not create database tables.

These standards do not implement RAG.

These standards do not create vector databases.

These standards do not create embeddings.

These standards do not create connectors.

These standards do not create CI checks.

These standards do not modify product behavior by themselves.

Runtime implementation requires:
- owner approval
- CRAG review
- relevant domain owner review
- implementation PR
- audit note
