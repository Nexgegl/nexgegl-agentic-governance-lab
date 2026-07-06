# NEXGEGL Decision Council Skill v1.0

## Skill Status

Status:
OPERATIONAL SKILL

Scope:
Decision pressure-testing, PR review escalation, repository/tool assessment, product change review, client proposal review, architecture change review, and execution-risk review.

Post-closure note:
This skill is part of a new Governance Lab v0.2 Decision Council Extension.
It does not reopen or modify Governance Baseline v0.1.

This skill does not implement runtime code.

This skill does not create CI checks.

This skill does not grant automatic merge authorization.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Purpose

Use this skill to pressure-test important decisions before execution.

This skill is not a generic brainstorming council.

This skill exists to prevent unsupported, unauthorized, financially risky, architecturally drifting, or operationally unsafe decisions from moving into execution.

## When To Use

Use this skill before:

- accepting a new tool or external repository
- adding a new operational skill
- changing product architecture
- merging high-impact PRs
- changing NCGR / ESTARED recovery logic
- changing pricing, commercial scope, or customer-facing claims
- changing RAG, retrieval, DataHub, or source-grounding behavior
- changing runtime, Supabase, RLS, tenant isolation, or security-sensitive files
- approving client proposals
- approving board/executive wording
- approving urgent action with incomplete evidence
- deciding whether to KILL / FIX / SCALE / ALERT an initiative

## Core Rules

- No decision without evidence.
- No execution without decision.
- No governance without audit.
- No AI action without boundaries.
- Signal is not Decision.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- KFSA must always preserve KILL / FIX / SCALE / ALERT.
- ALERT must not be dropped.
- KFSA must not be collapsed into three options.

## Required Council Roles

The council must evaluate the issue through these roles:

| Role | Focus |
|---|---|
| Governance Auditor | SDGM/KFSA alignment, authority, decision legitimacy, auditability |
| CFO / Cost & Margin Reviewer | financial exposure, cost, margin, pricing, ROI, implementation burden |
| COO / Execution Risk Reviewer | operational feasibility, sequencing, dependencies, support burden |
| Product Governor | product scope, user value, roadmap fit, claim safety, customer impact |
| Technical Architecture Governor / CRAG | source-of-truth protection, architecture drift, runtime boundaries, data/security implications |
| Contrarian Failure Analyst | failure modes, hidden assumptions, downside scenarios, misuse cases |
| Evidence & Audit Trail Reviewer | available evidence, missing evidence, approval record, audit note readiness |

## Required Input

The user or calling workflow should provide:

- decision or proposal
- context
- target repository or product if applicable
- files affected if applicable
- evidence available
- constraints
- urgency level
- owner or authority holder if known
- desired action
- known risks

If inputs are missing, do not invent them.
Mark them as Evidence Missing or Authority Missing.

## Council Review Process

### 1. Frame the Decision

Identify:

- what is being decided
- whether it is information, signal, recommendation, draft decision, approved decision, or executable action
- who is affected
- what execution may happen if approved

### 2. Evidence Check

Assess:

- what evidence exists
- what evidence is missing
- whether the evidence is current
- whether source ownership is clear
- whether evidence supports the claim or decision
- whether conflicts exist

### 3. Authority Check

Assess:

- who owns the decision
- whether approval exists
- whether delegation is valid
- whether escalation is needed
- whether AI is being treated as authority

### 4. Architecture Check

Assess:

- whether the change affects source of truth
- whether SDGM/KFSA boundaries are preserved
- whether RAG is treated as retrieval only
- whether DataHub or metadata tooling is being treated as decision authority
- whether runtime boundaries are affected
- whether tenant isolation, RLS, or sensitive data access are affected

### 5. Financial / Cost Check

Assess:

- implementation cost
- support cost
- API/model cost
- hosting/infrastructure cost
- margin impact
- pricing/scope mismatch
- hidden operational cost

### 6. Execution Risk Check

Assess:

- operational readiness
- dependencies
- sequencing
- owner capacity
- rollback/containment path
- customer impact
- urgency vs evidence completeness

### 7. Contrarian Failure Review

Ask:

- How could this fail?
- What assumption is weakest?
- What could be misunderstood?
- What could create legal, financial, security, or trust risk?
- What happens if we are wrong?

### 8. KFSA Verdict

The verdict must be exactly one of:

- KILL
- FIX
- SCALE
- ALERT

Never output only three options.

Use:

- KILL when the decision should stop because risk, authority violation, or evidence failure is severe.
- FIX when the decision may proceed only after defined corrections.
- SCALE when evidence, authority, audit, architecture, cost, and execution readiness are sufficient.
- ALERT when urgent attention or containment is required, especially when evidence is incomplete but risk is active.

Rules:
- If evidence is insufficient, verdict must be ALERT or FIX, not SCALE.
- If architecture or authority boundaries are violated, verdict must be FIX or KILL.
- If action is urgent but evidence is incomplete, use ALERT with containment action.
- If customer, legal, financial, board, or recovery-status claims are unsupported, do not use SCALE.
- If recovered_cash_total is affected without Evidence + Authority + Audit, use BLOCK-level reasoning and choose KILL or FIX depending on reversibility.
- If RLS or tenant isolation is weakened, choose KILL unless a fully evidenced safe path exists.

## Required Output Format

Return the decision council output in this format:

### Executive Judgment

Clear one-paragraph judgment.

### Main Risk

The most important risk.

### Root Cause

Why the risk exists.

### Evidence Available

List available evidence.

### Evidence Missing

List missing evidence.

### Authority / Delegation Concerns

State whether authority is clear, missing, or insufficient.

### Architecture Drift Risk

State whether source-of-truth, SDGM, KFSA, runtime, RAG, DataHub, security, RLS, or tenant isolation boundaries are at risk.

### Financial / Cost Risk

State cost, margin, ROI, pricing, or operating burden risks.

### Execution Risk

State sequencing, capacity, dependency, customer, rollout, support, and rollback risks.

### Contrarian Failure Scenario

State the most likely failure scenario.

### KFSA Verdict

Must be exactly one:
KILL / FIX / SCALE / ALERT

Do not omit ALERT.

### Recommended Decision

State the recommended decision.

### Next Best Action

Give one immediate action.

### Audit Note

State what should be recorded for audit.

## Routing Rules

Escalate or require specialist review when:

| Trigger | Required Review |
|---|---|
| SDGM, KFSA, Signal, Decision, Authority, or Execution affected | CRAG |
| NCGR recovery status or recovered_cash_total affected | CFO Logic Reviewer + CRAG |
| Customer-facing claim affected | Legal Compliance Reviewer + Product Governor |
| Pricing or package scope affected | Pricing Scope Skill + Legal Compliance Reviewer |
| Competitor comparison affected | Competitor Trust Audit Skill + Legal Compliance Reviewer |
| Board/executive wording affected | Board Response Skill + Executive Brief Skill |
| RLS or tenant data access affected | Security/RLS Auditor |
| Missing evidence | Evidence Pack Builder Skill |
| Runtime implementation or automation permission affected | CRAG + Product Governor |

## Forbidden Behavior

This skill must not:

- brainstorm without verdict
- provide SCALE without evidence
- treat AI output as decision
- treat RAG as authority
- treat SkillOpt as implemented
- treat DataHub as decision authority
- treat MERGE READY as automatic merge authorization
- collapse KFSA into three options
- omit ALERT
- approve customer-facing claims without evidence
- approve pricing scope without boundaries
- approve competitor claims without methodology
- approve board approval wording without minutes or resolution
- approve recovered_cash_total without Evidence + Authority + Audit
- approve runtime or CI completion without implementation evidence

## Example Verdict Guidance

| Situation | Likely Verdict |
|---|---|
| Strong idea but missing evidence | ALERT or FIX |
| Good proposal with bounded scope and evidence | SCALE |
| Legal/regulatory claim without evidence | FIX or KILL |
| RLS or tenant isolation weakened | KILL |
| Runtime implementation claimed without implementation | FIX |
| Urgent operational issue with incomplete facts | ALERT |
| Architecture violates source-of-truth | FIX or KILL |
| Pricing unlimited or recovery guaranteed | FIX |
| Competitor superiority claim unsupported | FIX |
| Board approval claim without minutes | FIX |
| Payment promised counted as recovered | KILL or FIX |

## Implementation Boundary

This skill is an operational review skill.

It does not implement runtime code.

It does not create database tables.

It does not create CI checks.

It does not execute actions.

It does not approve merges.

It does not replace human authority.

## Non-Negotiable Rules

- No decision without evidence.
- No execution without decision.
- No governance without audit.
- No AI action without boundaries.
- Signal is not Decision.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- KFSA is not collapsed.
- ALERT is preserved.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- Claude Code / CLAUDE.md is the current execution adapter, not the source of truth.
- NEXGEGL Governance Runtime remains the source of truth.
