# Agent Runtime Reference Architecture v0.1

## Document Status

Status:
REFERENCE ARCHITECTURE

Extension:
Governance Lab v0.3 — Agent Engineering Extension

Parent space:
`claude-operating-system/07-agent-engineering/`

Post-closure note:
This document is created after Governance Baseline v0.1 closure.

It does not reopen Governance Baseline v0.1.

It does not modify Governance Baseline v0.1.

It does not create a new repository.

It does not implement runtime code.

It does not create database tables.

It does not create CI checks.

It does not claim agent runtime implementation is complete.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Executive Summary

This document defines a conceptual reference architecture for a governed enterprise agent runtime.

The goal is not to implement agents.

The goal is to define the runtime components required before agents can operate as governed digital workers.

A governed agent runtime must enforce:

- identity
- ownership
- authority
- policy
- evidence
- context
- memory
- tool use
- execution limits
- validation
- escalation
- audit
- observability
- cost controls
- fail-closed behavior

The reference architecture follows the core rule:

Agents do not decide.

Agents may produce outputs, recommendations, validations, and bounded actions.

Institutional decisions require Evidence + Authority + Human Approval + Audit.

## Architecture Principle

The runtime must not be designed as:

Agent
↓
Tool
↓
Action

The runtime must be designed as:

Intent
↓
Identity
↓
Authority
↓
Policy
↓
Evidence / Context
↓
Runtime Boundary
↓
Tool Permission
↓
Execution Control
↓
Validation
↓
Audit
↓
Observability
↓
Escalation if required

## Core Runtime Stack

The governed agent runtime consists of these conceptual engines:

1. Agent Registry
2. Identity Engine
3. Ownership Engine
4. Authority Engine
5. Policy Engine
6. Context Engine
7. Evidence Engine
8. Memory Engine
9. Tool Engine
10. Execution Engine
11. Validation Engine
12. Escalation Engine
13. Audit Engine
14. Observability Engine
15. Cost Control Engine
16. Runtime Enforcement Layer

## 1. Agent Registry

Purpose:
Maintain the official registry of approved agents.

Responsibilities:
- register agent identity
- record agent type
- record agent owner
- record agent status
- record approved scope
- record runtime permissions
- record review cadence
- record deprecation or suspension status

Required fields:
- agent_id
- agent_name
- agent_type
- owner
- business_purpose
- scope
- status
- version
- approved_tools
- authority_profile
- policy_profile
- memory_profile
- audit_profile
- review_cadence

Fail-closed rule:
If an agent is not registered, it must not run in governed workflows.

## 2. Identity Engine

Purpose:
Verify what the agent is.

Responsibilities:
- resolve agent identity
- verify version
- verify owner
- verify environment
- verify allowed tenant or workspace
- prevent impersonation
- prevent unmanaged agent execution

Required checks:
- agent exists
- agent version is approved
- agent owner exists
- execution environment is allowed
- identity has not expired or been revoked

Fail-closed rule:
Unknown or unverified agent identity means stop.

## 3. Ownership Engine

Purpose:
Ensure every agent has a human or organizational owner.

Responsibilities:
- map agent to owner
- map owner to business unit
- map owner to escalation path
- define accountability
- ensure review cadence

Required checks:
- owner exists
- owner is active
- owner has authority over the agent scope
- escalation path exists

Fail-closed rule:
No owner means no governed agent operation.

## 4. Authority Engine

Purpose:
Determine what the agent is allowed to do.

Responsibilities:
- evaluate delegation limits
- enforce approval requirements
- define allowed recommendations
- define allowed executions
- block unauthorized actions
- require human approval when needed

Authority categories:
- read-only
- draft only
- recommend only
- validate only
- execute bounded action
- execute after approval
- escalate only

Forbidden authority:
- independent institutional decision approval
- independent board approval
- independent legal approval
- independent final financial approval
- unrestricted runtime permission
- automatic merge authorization

Fail-closed rule:
Missing or unclear authority means stop or escalate.

## 5. Policy Engine

Purpose:
Apply rules that constrain agent behavior.

Responsibilities:
- load applicable policies
- enforce allowed actions
- enforce forbidden actions
- enforce customer-facing claim rules
- enforce data access rules
- enforce compliance constraints
- enforce security constraints
- enforce product boundaries

Policy categories:
- enterprise policy
- product policy
- data policy
- security policy
- compliance policy
- commercial policy
- customer-facing communication policy
- runtime policy

Fail-closed rule:
Missing applicable policy means stop or escalate.

## 6. Context Engine

Purpose:
Provide task context while preventing project mixing and source-of-truth drift.

Responsibilities:
- load current project context
- load Project Control Brief
- enforce scope
- separate products and projects
- preserve approved terminology
- detect stale assumptions
- prevent context contamination

Required context:
- project name
- scope
- out-of-scope
- approved terminology
- current objective
- source-of-truth references
- governance constraints
- technical constraints
- open risks

Fail-closed rule:
If context is ambiguous or mixed, stop and require clarification.

## 7. Evidence Engine

Purpose:
Determine what evidence is available, eligible, current, and sufficient.

Responsibilities:
- classify evidence
- verify source eligibility
- verify source ownership
- verify freshness
- detect conflicts
- record missing evidence
- require evidence pack where needed

Evidence statuses:
- missing
- candidate
- partial
- current
- stale
- conflicting
- verified
- rejected

Fail-closed rule:
No evidence means no decision.
Insufficient evidence means do not SCALE.

## 8. Memory Engine

Purpose:
Govern what the agent can remember, retrieve, update, or ignore.

Responsibilities:
- define allowed memory
- define forbidden memory
- detect stale memory
- prevent unauthorized memory writes
- separate personal, project, product, and tenant memory
- protect sensitive memory
- record memory use

Memory categories:
- session memory
- project memory
- product memory
- policy memory
- evidence memory
- audit memory
- forbidden memory

Fail-closed rule:
Unverified or stale memory must not be treated as authority.

## 9. Tool Engine

Purpose:
Control agent access to tools.

Responsibilities:
- register tools
- classify tool risk
- enforce tool permissions
- validate tool inputs
- validate tool outputs
- log tool usage
- block forbidden tool use
- require approval for high-risk tools

Tool risk levels:
- low risk
- medium risk
- high risk
- restricted
- forbidden

High-risk tools include:
- write access tools
- email sending tools
- payment tools
- deployment tools
- database write tools
- customer communication tools
- repository modification tools
- tenant data access tools

Fail-closed rule:
No tool permission means no tool use.

## 10. Execution Engine

Purpose:
Control whether an agent may execute an action.

Responsibilities:
- classify requested action
- verify authority
- verify policy
- verify evidence
- verify approval
- verify rollback plan
- execute bounded actions only
- block unauthorized execution
- record execution result

Execution classes:
- no execution
- draft only
- recommendation only
- human-approved execution
- bounded automated execution
- emergency containment action
- forbidden action

Fail-closed rule:
No execution without authority, decision, and audit.

## 11. Validation Engine

Purpose:
Validate outputs, recommendations, and proposed actions before they are trusted or executed.

Responsibilities:
- validate factual accuracy
- validate source grounding
- validate output classification
- validate policy compliance
- validate decision boundary
- validate security impact
- validate cost impact
- validate customer-facing claims

Validation outcomes:
- pass
- fix required
- alert
- fail
- escalate

Fail-closed rule:
Failed validation blocks execution.

## 12. Escalation Engine

Purpose:
Route issues to human authority when agent boundaries are reached.

Responsibilities:
- detect escalation triggers
- identify owner or approver
- produce escalation summary
- preserve evidence
- record escalation
- prevent continued execution until resolved

Escalation triggers:
- missing authority
- missing policy
- missing evidence
- conflicting sources
- legal impact
- financial impact
- customer-facing impact
- security impact
- tenant isolation impact
- runtime permission impact
- product claim impact
- board/executive wording impact
- recovered cash or recovery status impact
- cost boundary exceeded

Fail-closed rule:
If escalation is required, execution must stop until resolved.

## 13. Audit Engine

Purpose:
Record what happened and why.

Responsibilities:
- log requester
- log timestamp
- log agent identity
- log model used
- log tools used
- log context used
- log evidence used
- log policy applied
- log output generated
- log recommendation made
- log decision status
- log authority status
- log escalation status
- log human approval if required
- log execution result
- log audit note

Fail-closed rule:
If audit cannot be recorded, governed execution must stop.

## 14. Observability Engine

Purpose:
Monitor agent runtime behavior.

Responsibilities:
- monitor requests
- monitor latency
- monitor cost
- monitor failures
- monitor escalations
- monitor tool usage
- monitor policy violations
- monitor drift
- monitor exception handling
- monitor runtime health

Observed metrics:
- request count
- token usage
- cost per task
- error rate
- escalation rate
- tool-call rate
- policy violation rate
- validation failure rate
- human approval rate
- drift incidents

Fail-closed rule:
If runtime behavior cannot be observed for high-risk actions, stop or restrict execution.

## 15. Cost Control Engine

Purpose:
Govern the cost of agent operation.

Responsibilities:
- track token usage
- track tool cost
- track model cost
- track infrastructure cost
- set cost limits
- trigger cost escalation
- prevent runaway execution

Cost controls:
- per-task limit
- per-agent limit
- per-owner limit
- per-client limit
- per-workflow limit
- emergency stop threshold

Fail-closed rule:
Cost boundary exceeded means stop or escalate.

## 16. Runtime Enforcement Layer

Purpose:
Prevent violations before they occur.

Responsibilities:
- enforce identity
- enforce authority
- enforce policy
- enforce tool permissions
- enforce memory boundaries
- enforce execution boundaries
- enforce audit requirements
- enforce escalation holds
- enforce cost limits

This layer is the difference between documenting governance and enforcing governance.

Fail-closed rule:
If enforcement cannot be applied, the runtime must not proceed with governed actions.

## Runtime Request Flow

Every governed agent request should follow this conceptual flow:

1. Request received
2. Agent identity resolved
3. Owner verified
4. Intent classified
5. Context loaded
6. Authority checked
7. Policy checked
8. Evidence checked
9. Memory checked
10. Tool permission checked
11. Action classified
12. Validation required if needed
13. Human approval required if needed
14. Execution allowed, blocked, or escalated
15. Audit recorded
16. Observability event emitted
17. Cost recorded

## Output Classification Flow

All outputs must be classified as:

- Draft
- Signal
- Analysis
- Evidence Candidate
- Recommendation
- Decision
- Audit Note

Promotion rule:

Draft may become Signal.

Signal may support Analysis.

Analysis may support Recommendation.

Recommendation may support Decision.

Decision requires Evidence + Authority + Human Approval + Audit.

Agent output alone must not become Decision.

## Runtime Verdicts

Runtime evaluation may return:

- PASS
- FIX REQUIRED
- ALERT
- FAIL
- ESCALATE
- BLOCK EXECUTION

These verdicts are runtime control outcomes.

They do not replace KFSA.

KFSA remains:

KILL / FIX / SCALE / ALERT

ALERT must not be dropped.

KFSA must not be collapsed.

## Supervisor Pattern Runtime

Preferred runtime pattern:

Supervisor Agent
↓
Runtime Enforcement Layer
↓
Specialist Agents
↓
Validation
↓
Escalation if required
↓
Audit

Specialist agents may include:

- Research Agent
- Analyst Agent
- Risk Agent
- Finance Agent
- Legal Agent
- Security Agent
- Governance Agent
- Execution Agent
- Audit Agent
- Escalation Agent

The Supervisor Agent coordinates tasks.

The Supervisor Agent does not approve institutional decisions.

The Supervisor Agent does not override authority.

The Supervisor Agent does not bypass runtime enforcement.

## Security and Tenant Isolation

Any future runtime must protect:

- identity boundaries
- tenant boundaries
- data access boundaries
- secret boundaries
- tool boundaries
- memory boundaries
- audit boundaries
- policy boundaries
- execution boundaries

Tenant isolation violations are high-severity.

Unclear tenant access must fail closed.

## Applied Examples

These examples are illustrative only.

They do not redefine NCGR, ESTARED, SDGM, KFSA, or NEXGEGL.

### Example 1 — Customer Promise to Pay

A collection-support agent identifies that a customer promised to pay.

Runtime classification:
Signal

Allowed action:
Recommend follow-up.

Forbidden action:
Count promised payment as recovered cash.

Rule:
Payment Promised is not Recovered.

recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.

### Example 2 — Retrieval Agent

A retrieval agent fetches policy context.

Runtime classification:
Evidence Candidate

Allowed action:
Support analysis.

Forbidden action:
Treat retrieved context as authority.

Rule:
RAG is Retrieval, not Authority.

Retrieved Context is Evidence Input, not Decision.

### Example 3 — Code Review Agent

A code-review agent classifies a PR as MERGE READY.

Runtime classification:
Recommendation

Allowed action:
Recommend merge.

Forbidden action:
Approve or merge automatically.

Rule:
MERGE READY remains a review recommendation only, not automatic merge authorization.

### Example 4 — Security-Sensitive Tool Use

An agent requests database write access.

Runtime classification:
High-risk execution request

Allowed action:
Escalate for authority and review.

Forbidden action:
Proceed without permission.

Rule:
No tool permission means no tool use.

## Architecture Adoption Checklist

Before agent runtime implementation, confirm:

- Agent Registry is defined.
- Identity Engine is defined.
- Ownership Engine is defined.
- Authority Engine is defined.
- Policy Engine is defined.
- Context Engine is defined.
- Evidence Engine is defined.
- Memory Engine is defined.
- Tool Engine is defined.
- Execution Engine is defined.
- Validation Engine is defined.
- Escalation Engine is defined.
- Audit Engine is defined.
- Observability Engine is defined.
- Cost Control Engine is defined.
- Runtime Enforcement Layer is defined.
- Fail-closed rules are defined.
- Human approval requirements are defined.
- Output classification is defined.
- Security and tenant isolation boundaries are defined.

## Future Documents

Future documents may include:

1. Agent Repository Standard v0.1
2. Agent Evaluation & Certification Framework v0.1
3. Agent Engineering 90-Day Roadmap v0.1
4. Agent Workforce Management Model v0.1
5. Runtime Portability Standard v0.1

Each document must be opened in a separate PR unless explicitly approved.

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create agent runtime files.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This document is reference architecture, not implemented runtime.

## Non-Negotiable Rules

- Agents do not decide.
- Signal is not Decision.
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
- Fail closed, never fail open.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- KFSA is not collapsed.
- ALERT is preserved.

## Final Position

The Agent Runtime Reference Architecture v0.1 defines the conceptual components required for a governed enterprise agent runtime.

It establishes how agent identity, authority, policy, evidence, memory, tools, execution, validation, escalation, audit, observability, and cost controls should fit together.

It does not implement the runtime.

It is a prerequisite for future agent repository standards, evaluation frameworks, runtime implementation planning, and governed digital workforce design.
