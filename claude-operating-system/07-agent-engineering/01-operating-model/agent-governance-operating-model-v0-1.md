# Agent Governance Operating Model v0.1

## Document Status

Status:
DRAFT OPERATING MODEL

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

It does not create CI checks.

It does not claim agent runtime implementation is complete.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Executive Summary

This operating model defines how NEXGEGL thinks about governed enterprise agents.

The purpose is not only to describe AI agents.

The purpose is to define how agents become controlled digital workers operating inside authority, policy, evidence, execution, escalation, audit, and accountability boundaries.

The operating model starts from one core principle:

Agents do not decide.

Agents may research, analyze, summarize, recommend, validate, execute bounded actions, and escalate.

Institutional decisions require evidence, authority, and audit.

## Core Definitions

### AI Agent

An AI Agent is a software actor that can reason over context, use tools, follow instructions, and produce outputs or actions within defined boundaries.

An AI Agent must not independently approve institutional decisions.

### Digital Worker

A Digital Worker is a governed AI Agent with defined identity, role, owner, authority boundary, policy boundary, tool boundary, memory boundary, escalation rules, and audit obligations.

A Digital Worker is not just a model or workflow.

A Digital Worker is an accountable operating unit.

### Multi-Agent System

A Multi-Agent System is a coordinated set of agents with defined roles, routing, escalation, dependencies, and supervisory controls.

A Multi-Agent System must not operate as an unmanaged chain of agents.

### Governed Agent Workforce

A Governed Agent Workforce is a managed digital workforce made of specialists, supervisors, validators, auditors, coordinators, and escalation agents operating under enterprise governance.

A Governed Agent Workforce must preserve:

- authority
- policy
- evidence
- audit
- accountability
- security
- cost control
- human escalation

## Non-Negotiable Principles

- Agents do not decide.
- Signal is not Decision.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- AI explains; rules decide.
- No execution without authority.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- Fail closed, never fail open.
- Missing authority means stop or escalate.
- Missing policy means stop or escalate.
- Missing evidence means stop or escalate.
- Missing auditability means stop or escalate.
- RAG is Retrieval, not Authority.
- KFSA is not collapsed.
- ALERT is preserved.
- MERGE READY remains a review recommendation only, not automatic merge authorization.

## Operating Model Overview

The Agent Governance Operating Model has seven layers:

1. Intent Layer
2. Authority Layer
3. Policy Layer
4. Evidence Layer
5. Agent Runtime Layer
6. Validation Layer
7. Audit & Accountability Layer

Each layer must be defined before an agent can be treated as a governed digital worker.

## Layer 1 — Intent Layer

Purpose:
Define why the agent exists.

Required questions:
- What business problem does the agent address?
- What process or decision does it support?
- What user or owner does it serve?
- What outcome is expected?
- What must the agent never do?

Required artifacts:
- business intent statement
- agent purpose statement
- allowed use cases
- forbidden use cases
- success criteria
- risk statement

Failure mode:
If intent is vague, the agent may expand beyond its safe scope.

Governance rule:
No agent without declared intent.

## Layer 2 — Authority Layer

Purpose:
Define what the agent is allowed to do and who authorized it.

Required questions:
- Who owns the agent?
- Who approves its deployment?
- What actions can it take?
- What actions require human approval?
- What monetary, legal, operational, or customer-facing limits apply?
- When must the agent stop?
- When must the agent escalate?

Required artifacts:
- owner record
- authority matrix
- delegation limits
- escalation triggers
- approval workflow
- emergency containment rule

Failure mode:
If authority is missing, AI may be treated as the decision-maker.

Governance rule:
No execution without authority.

## Layer 3 — Policy Layer

Purpose:
Define what rules constrain the agent.

Required questions:
- What policies apply?
- What compliance constraints apply?
- What product rules apply?
- What data access rules apply?
- What security rules apply?
- What claims are forbidden?
- What outputs require review?

Required artifacts:
- policy map
- allowed actions
- forbidden actions
- compliance constraints
- customer-facing claim rules
- data access rules
- security rules

Failure mode:
If policy is missing, the agent may execute unsafe actions.

Governance rule:
AI must operate inside policy boundaries.

## Layer 4 — Evidence Layer

Purpose:
Define what evidence the agent may use and what evidence is required before recommendation or execution.

Required questions:
- What sources are eligible?
- Who owns each source?
- How fresh is the evidence?
- Is the evidence complete?
- Are there conflicting sources?
- What evidence is required for recommendation?
- What evidence is required for execution?

Required artifacts:
- evidence map
- source eligibility rules
- source ownership record
- freshness rules
- missing evidence rules
- conflict handling rules
- evidence pack requirement

Failure mode:
If evidence is weak, the agent may produce confident but unsupported recommendations.

Governance rule:
No decision without evidence.

## Layer 5 — Agent Runtime Layer

Purpose:
Define how the agent operates during execution.

Required questions:
- What model does it use?
- What tools can it access?
- What memory can it use?
- What data can it read?
- What data can it write?
- What actions can it execute?
- What runtime limits apply?
- What cost limits apply?

Required artifacts:
- model configuration
- tool permission list
- memory policy
- data access boundary
- write permission rules
- runtime limits
- cost limits
- containment plan

Failure mode:
If runtime boundaries are unclear, the agent may exceed its intended authority.

Governance rule:
No AI action without boundaries.

## Layer 6 — Validation Layer

Purpose:
Define how agent outputs, recommendations, and actions are checked before trust or execution.

Required questions:
- What must be validated?
- Who validates?
- What checks are automatic?
- What checks require human review?
- What confidence threshold applies?
- What happens when validation fails?

Required artifacts:
- validation checklist
- quality gates
- confidence thresholds
- human review triggers
- exception rules
- rollback or containment rules

Failure mode:
If validation is absent, bad outputs may reach execution.

Governance rule:
AI outputs require validation before trust.

## Layer 7 — Audit & Accountability Layer

Purpose:
Define how agent activity is recorded, reviewed, and accountable.

Required questions:
- What must be logged?
- Who can inspect the logs?
- What evidence was used?
- What policy was applied?
- What model and tools were used?
- Was there human approval?
- Was there escalation?
- What outcome occurred?

Required artifacts:
- audit log schema
- evidence reference record
- approval record
- escalation record
- output record
- tool-use record
- exception record
- accountability owner

Failure mode:
If audit is missing, governance cannot be proven.

Governance rule:
No governance without audit.

## Agent Identity Model

Every governed agent must define:

| Field | Required | Description |
|---|---|---|
| Agent Name | Yes | Unique name |
| Agent ID | Yes | Stable identifier |
| Agent Type | Yes | Research, Analyst, Execution, Audit, etc. |
| Owner | Yes | Human or organizational owner |
| Business Purpose | Yes | Why the agent exists |
| Scope | Yes | What it can work on |
| Authority Boundary | Yes | What it may do |
| Policy Boundary | Yes | What rules constrain it |
| Tool Boundary | Yes | What tools it may use |
| Memory Boundary | Yes | What memory it may access |
| Data Boundary | Yes | What data it may read or write |
| Escalation Trigger | Yes | When it must escalate |
| Audit Requirement | Yes | What must be recorded |
| Cost Limit | Yes | Runtime cost boundary |
| Review Cadence | Yes | How often it must be reviewed |

## Agent Authority Model

Every agent must answer:

- Who authorized this agent?
- Who owns this agent?
- What can it do independently?
- What can it recommend only?
- What requires human approval?
- What is forbidden?
- What is the maximum operational limit?
- What is the maximum financial limit?
- What is the maximum customer-facing impact?
- When does it stop?
- When does it escalate?

## Agent Policy Boundary

Every agent must define:

- allowed tasks
- forbidden tasks
- allowed tools
- forbidden tools
- allowed data
- forbidden data
- allowed outputs
- outputs requiring review
- compliance constraints
- security constraints
- customer-facing claim constraints

## Agent Evidence Boundary

Every agent must define:

- accepted evidence sources
- rejected evidence sources
- required evidence for recommendation
- required evidence for execution
- freshness requirements
- source ownership requirements
- conflict handling
- missing evidence behavior
- evidence citation requirement
- evidence pack requirement

## Agent Tool Boundary

Every agent must define:

- available tools
- tool purpose
- tool risk level
- tool permission
- tool owner
- tool input boundary
- tool output boundary
- tool audit requirement
- tool failure behavior
- tool escalation trigger

## Agent Memory Boundary

Every agent must define:

- what memory is allowed
- what memory is forbidden
- how memory is updated
- who approves memory changes
- how stale memory is detected
- how sensitive memory is protected
- how memory is audited
- when memory must be ignored

## Agent Execution Boundary

Every agent must define:

- actions it can execute
- actions it can only recommend
- actions requiring human approval
- actions requiring evidence pack
- actions requiring audit note
- actions requiring rollback plan
- actions forbidden under all conditions

## Agent Escalation Boundary

Every agent must escalate when:

- authority is missing
- policy is unclear
- evidence is missing
- sources conflict
- action has legal impact
- action has financial impact
- action has customer-facing impact
- action affects security
- action affects tenant isolation
- action affects runtime permissions
- action affects product claims
- action affects board or executive wording
- action affects recovered cash or recovery status
- action exceeds cost boundary

## Agent Audit Boundary

Every material agent action must record:

- requester
- timestamp
- agent identity
- agent version
- model used
- tools used
- input data
- context used
- evidence used
- policy applied
- output generated
- recommendation made
- decision status
- authority status
- escalation status
- human approval if required
- execution status
- audit note

## Agent Type Operating Matrix

| Agent Type | Purpose | Allowed Actions | Forbidden Actions | Required Evidence | Escalation Trigger | Audit Requirement |
|---|---|---|---|---|---|---|
| Research Agent | Collect information | Search, summarize, cite | Decide, execute, approve | Source list, citations | Missing or conflicting sources | Search sources and summary |
| Analyst Agent | Analyze data or evidence | Interpret, compare, model | Approve decision or action | Dataset, assumptions, method | Weak data or unsupported conclusion | Inputs, assumptions, output |
| Risk Agent | Identify risks | Flag, score, explain | Override authority | Risk evidence and assumptions | Severe or unowned risk | Risk basis and recommendation |
| Finance Agent | Review cost and margin | Estimate, compare, warn | Approve spend independently | Cost assumptions, pricing, margin data | Financial exposure or missing assumptions | Cost model and assumptions |
| Legal Agent | Review legal exposure | Flag risk, require review | Provide final legal approval | Contract, policy, legal source | Legal uncertainty or customer-facing claim | Legal basis and escalation |
| Security Agent | Review security posture | Flag access and control issues | Approve unsafe access | Access map, control evidence | Data access, tenant, or secret risk | Control evidence and findings |
| Governance Agent | Check governance boundaries | Validate authority, evidence, audit | Replace decision owner | Decision context, authority map, evidence | Missing authority/evidence/audit | Governance finding |
| Execution Agent | Execute bounded actions | Execute approved actions | Execute without authority | Approved decision, authority, rollback plan | Missing approval or failed execution | Execution log and result |
| Audit Agent | Review auditability | Inspect logs and evidence | Modify audit record improperly | Audit trail and evidence refs | Missing or altered audit trail | Audit finding |
| Escalation Agent | Route to humans | Escalate, notify, summarize | Decide on behalf of human | Trigger evidence, context, owner | Any mandatory escalation trigger | Escalation record |

## Supervisor Pattern Operating Model

Preferred multi-agent pattern:

Supervisor Agent

├── Research Agent
├── Analyst Agent
├── Risk Agent
├── Finance Agent
├── Legal Agent
├── Security Agent
├── Governance Agent
├── Execution Agent
└── Audit Agent

The Supervisor Agent coordinates work.

The Supervisor Agent routes tasks.

The Supervisor Agent checks completion.

The Supervisor Agent requests escalation.

The Supervisor Agent does not replace human authority.

The Supervisor Agent does not independently approve institutional decisions.

## Fail-Closed Rules

An agent system must fail closed when:

| Missing Element | Required Behavior |
|---|---|
| Missing authority | Stop or escalate |
| Missing policy | Stop or escalate |
| Missing evidence | Stop or escalate |
| Missing auditability | Stop |
| Missing owner | Stop |
| Conflicting sources | Escalate |
| Unclear customer-facing claim | Escalate |
| Security boundary unclear | Stop |
| Tenant boundary unclear | Stop |
| Cost boundary exceeded | Stop or escalate |
| Runtime permission unclear | Stop |
| Human approval required but absent | Stop |

## Decision Boundary

Agents may produce:

- information
- signals
- analysis
- recommendations
- draft actions
- validation findings
- escalation summaries
- audit notes

Agents must not independently produce:

- approved institutional decisions
- board approvals
- legal approvals
- final financial approvals
- customer-facing guarantees
- recovered cash recognition
- unrestricted runtime permissions
- production deployment approval
- automatic merge authorization

## Applied Examples

These examples are illustrative only.

They do not redefine NCGR, ESTARED, SDGM, KFSA, or NEXGEGL.

### Example 1 — Recovery Status

A collections agent may identify that a customer promised to pay.

The agent may recommend follow-up.

The agent must not count the promise as recovered cash.

Payment Promised is not Recovered.

recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.

### Example 2 — RAG Retrieval

A retrieval agent may fetch policy context.

The retrieved context may support analysis.

The retrieved context is not authority.

RAG is Retrieval, not Authority.

### Example 3 — PR Review

A code-review agent may identify that a PR is MERGE READY.

MERGE READY is a review recommendation only.

It is not automatic merge authorization.

### Example 4 — Board Wording

An executive-writing agent may draft board language.

It must not claim board approval unless there is a formal approval record.

## Operating Model Adoption Checklist

Before an agent is treated as governed, confirm:

- business intent is defined
- owner is defined
- authority boundary is defined
- policy boundary is defined
- evidence boundary is defined
- tool boundary is defined
- memory boundary is defined
- execution boundary is defined
- escalation boundary is defined
- audit boundary is defined
- cost boundary is defined
- security boundary is defined
- validation process is defined
- fail-closed rules are defined
- human approval points are defined

## Future Documents

Future documents may include:

1. Agent Runtime Reference Architecture v0.1
2. Agent Repository Standard v0.1
3. Agent Evaluation & Certification Framework v0.1
4. Agent Engineering 90-Day Roadmap v0.1
5. Agent Workforce Management Model v0.1

Each document must be opened in a separate PR unless explicitly approved.

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create agent runtime files.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

## Final Position

The Agent Governance Operating Model v0.1 establishes the minimum governance model for treating agents as governed digital workers.

The model defines identity, authority, policy, evidence, runtime, validation, escalation, audit, and accountability boundaries.

The model is a prerequisite for future runtime architecture, repository standards, evaluation frameworks, and governed agent workforce design.
