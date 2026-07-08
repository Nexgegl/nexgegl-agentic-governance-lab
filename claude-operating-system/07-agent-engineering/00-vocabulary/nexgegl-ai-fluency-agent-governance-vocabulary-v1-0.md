# NEXGEGL AI Fluency & Agent Governance Vocabulary v1.0

## Document Status

Status:
CONTROLLED VOCABULARY

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

It is not a final legal, compliance, or production AI usage policy.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Purpose

This vocabulary standardizes how NEXGEGL speaks about working with AI systems, Claude, ChatGPT, agents, multi-agent systems, and governed digital workers.

The purpose is to prevent AI usage from becoming random experimentation.

The purpose is to turn AI usage into governed operational practice that supports:

- decision quality
- evidence discipline
- authority boundaries
- auditability
- accountability
- secure collaboration
- responsible delegation
- agent governance

This document adapts AI Fluency concepts into NEXGEGL operating language.

## Source Basis

This vocabulary is informed by the AI Fluency terminology model that defines AI Fluency as the ability to work with AI systems effectively, efficiently, ethically, and safely.

The source model organizes AI Fluency around four competencies:

- Delegation
- Description
- Discernment
- Diligence

NEXGEGL adapts these terms into governance-aware operating language.

This document does not reproduce the source model as-is.

This document translates the model into NEXGEGL's operating environment.

## 1. AI Fluency

### Operational Term

AI Fluency

### NEXGEGL Arabic Meaning

الطلاقة التشغيلية مع الذكاء الاصطناعي

### Definition

AI Fluency is the ability of a person, team, or operating unit to use AI systems in ways that produce practical, reviewable, bounded, and accountable outcomes.

AI Fluency is not simply the ability to write prompts.

AI Fluency requires knowing:

- what to delegate
- how to describe work
- how to evaluate outputs
- how to use AI responsibly
- when to stop
- when to escalate
- when evidence is insufficient
- when human authority is required

### NEXGEGL Interpretation

Inside NEXGEGL, AI does not decide on behalf of the institution.

AI may assist with:

- analysis
- classification
- summarization
- signal detection
- drafting
- prototyping
- review support
- decision support

AI must not independently create institutional decisions.

AI-assisted work follows this governance path:

Signal
↓
Evidence
↓
Authority
↓
KFSA Verdict
↓
Decision
↓
Execution
↓
Audit

### Operating Rule

Every AI output starts as a Signal unless explicitly governed otherwise.

AI output is not institutional truth until governed.

## 2. The 4Ds

The 4Ds are:

| Competency | Meaning | NEXGEGL Governance Question |
|---|---|---|
| Delegation | What should AI do and what must humans keep? | Is this task safe to delegate? |
| Description | How should the work be described to AI? | Is the instruction clear, bounded, and specific? |
| Discernment | How should AI output be evaluated? | Is the output correct, useful, reviewable, and governable? |
| Diligence | How should AI be used responsibly? | Are confidentiality, evidence, authority, and accountability preserved? |

## 3. Delegation

### Definition

Delegation is the decision of what work should be done by a human, what work may be assisted by AI, and what work may be delegated to an agent under boundaries.

### NEXGEGL Operating Position

AI may assist.

AI may not authorize.

### Task Delegation Matrix

| Task Type | Suitable for AI? | NEXGEGL Judgment |
|---|---|---|
| Summarizing a document | Yes | Allowed |
| Extracting indicators from a file | Yes | Allowed with review |
| Drafting a presentation | Yes | Allowed |
| Competitor analysis | Yes | Allowed with source verification |
| Final financial recommendation | Not directly | Requires human review |
| KILL / FIX / SCALE / ALERT decision | No | Governed through KFSA and authority |
| Sensitive client data processing | Restricted | Requires confidentiality controls |
| Sending email on behalf of company | Restricted | Requires explicit approval |
| Legal claim drafting | Restricted | Requires legal review |
| Customer-facing guarantee | No | Forbidden without authority and evidence |
| Board approval wording | Restricted | Requires formal approval record |

### Rule

AI may assist.

AI may not authorize.

الذكاء الاصطناعي يساعد، لكنه لا يعتمد.

## 4. Description

### Definition

Description is the ability to explain the required work to AI clearly enough that the output is bounded, reviewable, and useful.

### NEXGEGL Prompt Structure

Every important AI task should include:

1. Role
2. Objective
3. Input
4. Boundaries
5. Process
6. Output Format
7. Governance Check

### Prompt Template

Role:

Objective:

Input:

Boundaries:

Process:

Output Format:

Governance Check:

### Governance Check Examples

The output must identify whether the result is:

- Draft
- Signal
- Analysis
- Evidence Candidate
- Recommendation
- Decision
- Audit Note

### Rule

A prompt is not good because it is long.

A prompt is good when it prevents:

- ambiguity
- scope creep
- hallucination
- governance drift
- unusable output
- unauthorized action

## 5. Discernment

### Definition

Discernment is the ability to evaluate AI output critically for accuracy, usefulness, relevance, completeness, source quality, and governance safety.

### NEXGEGL Review Questions

Every important AI output must pass these questions:

| Question | Purpose |
|---|---|
| Is the information correct? | Prevent hallucination |
| Is the source reliable? | Prevent unsupported reliance |
| Is the output executable? | Prevent theoretical output |
| Does it violate SDGM or KFSA boundaries? | Prevent architecture and governance drift |
| Does it require human approval? | Prevent over-delegation |
| Is the output classification clear? | Prevent Signal from being treated as Decision |
| Is there an audit note? | Preserve accountability |

### Rule

Do not rely on AI output when it has:

- no source
- no context
- no boundary
- no owner
- no evidence
- no audit trail
- unsupported decision language

## 6. Diligence

### Definition

Diligence is the responsible, careful, and accountable use of AI outputs, AI systems, and agents.

### NEXGEGL Meaning

Diligence requires that users must not:

- enter sensitive client data into unauthorized tools
- use AI outputs in board materials without verification
- turn AI analysis into formal decision without Evidence + Authority
- allow agents to operate outside their scope
- claim external approvals, certifications, partnerships, or regulatory status without evidence
- treat AI-generated content as verified truth

### Rule

Human accountability remains mandatory.

المساءلة تبقى على الإنسان، حتى لو ساعد AI في الإنتاج.

## 7. Human-AI Interaction Modes

### 7.1 Automation

Automation means AI executes a defined task based on clear instructions.

Examples:

- summarize a meeting
- convert a file into a table
- extract clauses from a contract
- draft an email
- clean Arabic text

Risks:

- silent errors
- omitted details
- over-simplification
- formatting that hides meaning

Control:

Human review before external use.

### 7.2 Augmentation

Augmentation means the human and AI work together as thinking partners.

Examples:

- competitor analysis
- board deck development
- pricing model review
- SaaS product design
- governance review

Risks:

- being impressed by polished output
- accepting unverified reasoning
- mistaking analysis for decision

Control:

Use AI as advisor, not authority.

### 7.3 Agency

Agency means an AI agent operates semi-independently under a defined role, rules, knowledge, tools, and behavioral boundaries.

Examples:

- repository review agent
- governance drift monitoring agent
- competitor analysis agent
- client file analysis agent
- executive report preparation agent

Risks:

- authority overreach
- unauthorized data use
- action instead of recommendation
- source-of-truth drift
- ungoverned decision production

Required elements:

| Element | Required |
|---|---|
| Role | Yes |
| Scope | Yes |
| Forbidden Actions | Yes |
| Data Boundary | Yes |
| Output Type | Yes |
| Escalation Rule | Yes |
| Audit Log | Yes |

Rule:

No agent without boundaries.

## 8. Hallucination

### Definition

Hallucination is when AI produces information that appears credible but is incorrect, unsupported, fabricated, outdated, or misapplied.

### NEXGEGL Interpretation

Hallucination is not a writing issue.

Hallucination is a governance risk.

Dangerous examples:

- claiming a company is licensed without verification
- quoting competitor prices without a source
- claiming a partnership exists
- mixing Saudi regulation with foreign regulation
- creating a KPI not present in client data
- treating predicted recovery as recovered cash

### Verification Rule

Any AI output related to the following must be verified before use:

- law
- regulation
- pricing
- competitors
- government bodies
- partnerships
- financial figures
- client data
- product specifications
- security claims
- customer-facing claims
- board or executive approvals

## 9. Context Window

### Definition

Context Window is the amount of information a model can consider at one time, including conversation, instructions, and attached files.

### Risk

Large or messy context may cause:

- forgotten instructions
- project mixing
- outdated assumptions
- loss of SDGM/KFSA boundaries
- confusion between products
- reliance on stale decisions
- false continuity

### NEXGEGL Rule

Do not rely only on long conversation history for important work.

Important projects require a concise:

Project Control Brief

### Project Control Brief Minimum Fields

- product or project name
- scope
- out-of-scope items
- approved terminology
- previous decisions
- technical constraints
- governance constraints
- source-of-truth references
- open risks
- current requested action

## 10. RAG

### Definition

RAG means Retrieval Augmented Generation.

It connects AI systems with external knowledge sources to improve grounding and reduce unsupported output.

### NEXGEGL Interpretation

RAG is not a goal by itself.

RAG is a way to connect models to governed knowledge.

Potential sources:

- SDGM documents
- KFSA documents
- company policies
- client files
- official regulations
- contracts
- meeting minutes
- decision logs
- audit records

### Risk

Bad RAG creates false confidence.

If sources are outdated, unowned, conflicting, unclassified, or unaudited, AI may produce official-looking answers based on weak knowledge.

### Rule

Knowledge Governance First.

RAG is Retrieval, not Authority.

Retrieved Context is Evidence Input, not Decision.

## 11. Prompt Engineering

### Definition

Prompt Engineering is the design of instructions that guide AI systems toward useful, bounded, and reviewable outputs.

### NEXGEGL Interpretation

Prompt Engineering is not writing long prompts.

Prompt Engineering is controlled instruction design.

A good prompt prevents:

| Risk | Prompt Control |
|---|---|
| Ambiguity | Define objective |
| Scope creep | Define boundaries |
| Hallucination | Require sources or uncertainty disclosure |
| Governance drift | State SDGM/KFSA boundaries |
| Unusable output | Require decision, action, owner, impact, or audit note |

## 12. Chain-of-Thought Prompting

### Definition

Chain-of-Thought Prompting asks AI to work through a problem step by step to improve reasoning quality.

### NEXGEGL Interpretation

NEXGEGL does not require exposing hidden reasoning.

NEXGEGL requires clear operational review.

Preferred instruction:

Reason privately. Report operationally.

Use review frames such as:

1. meaning
2. evidence
3. authority
4. risk
5. proposed decision
6. next action
7. audit note

### Rule

Do not request private reasoning disclosure.

Request review structure and operational judgment.

## 13. Temperature

### Definition

Temperature controls output randomness.

Lower temperature produces more predictable and focused output.

Higher temperature allows more creative variation.

### NEXGEGL Guidance

| Work Type | Creativity Requirement |
|---|---|
| Financial analysis | Low |
| Governance review | Low |
| Legal drafting | Very low |
| Executive decision support | Very low |
| Code review | Low |
| Product ideation | Medium to high |
| Marketing copy | Medium |
| Visual concepting | High |

### Rule

The more sensitive the decision, the lower the randomness and the higher the verification requirement.

## 14. NEXGEGL AI Output Classification

Every AI output must be classified.

| Classification | Meaning | Can It Be Relied On? |
|---|---|---|
| Draft | Working draft | No |
| Signal | Initial indication | No |
| Analysis | Interpretation or reasoning | Only after review |
| Evidence Candidate | Potential supporting evidence | Requires verification |
| Recommendation | Suggested action | Requires decision owner |
| Decision | Institutional decision | Not produced by AI alone |
| Audit Note | Review or audit record | Requires traceable context |

### Golden Rule

AI output is not institutional truth until governed.

## 15. Agent Governance Rules

### 15.1 No Agent Without Scope

Every agent must define:

- objective
- allowed files
- allowed systems
- forbidden actions
- output format
- data boundary
- escalation rule
- audit log

### 15.2 Agents Do Not Decide

Agents must not issue final:

- financial decisions
- contractual decisions
- HR decisions
- legal decisions
- KILL / FIX / SCALE / ALERT decisions
- board approvals
- customer-facing guarantees

Agents may propose, classify, or escalate.

### 15.3 Do Not Merge Concepts

The following concepts must not be treated as equivalent:

| Concept | Does Not Equal |
|---|---|
| Signal | Decision |
| Evidence | Opinion |
| Verdict | Approval |
| Dashboard | Governance |
| Automation | Authority |
| RAG | Truth |
| Agent | Owner |
| MERGE READY | Automatic merge authorization |

### 15.4 No Agent Without Record

Every material agent run must record:

- who triggered it
- when it ran
- what file or system it used
- what output it produced
- how the output was classified
- whether review occurred
- who approved any resulting action

## 16. NEXGEGL Mandatory AI Use Policy — Vocabulary Draft

This section is vocabulary scaffolding.

It is not a final legal or compliance policy.

### Allowed

- summarization
- initial analysis
- research with verification
- drafting
- prototyping
- code review
- competitor comparison
- initial executive materials

### Restricted

- client data
- contracts
- pricing
- regulations
- financial decisions
- board materials
- customer-facing claims
- security-sensitive repositories
- tenant or RLS logic
- anything carrying legal, regulatory, financial, or reputational responsibility

### Forbidden

- sharing client secrets in unauthorized tools
- claiming unverified partnership
- issuing official AI-made decisions
- sending external communication without approval
- building on external code without license and security review
- copying a full repository without legal, security, and architecture review
- counting promised payment as recovered cash
- treating AI output as institutional truth without governance

## 17. Executive Judgment

### Judgment

This vocabulary is suitable for adoption as controlled operating language inside the Agent Engineering Extension.

It is educational, but not merely educational.

Its value is that it converts general AI Fluency into a governance-aware operating vocabulary for NEXGEGL.

### Main Risk

The main risk is using AI faster than the governance system can control.

This produces polished outputs that may be inaccurate, unsupported, unauthorized, or unauditable.

### Root Cause

Teams often learn prompting before they learn delegation, discernment, diligence, evidence handling, authority boundaries, and auditability.

### Recommended Decision

Adopt this as controlled vocabulary for AI Fluency and Agent Governance.

Do not treat it as final AI policy.

Use it as the language baseline for future:

1. NEXGEGL AI Agent Operating Policy
2. NEXGEGL Prompt & Agent Review Checklist
3. Agent Runtime Reference Architecture
4. Agent Evaluation & Certification Framework

### Next Best Action

Before executing any AI-assisted task, classify the interaction mode as:

- Automation
- Augmentation
- Agency

Then classify the output as:

- Draft
- Signal
- Analysis
- Evidence Candidate
- Recommendation
- Decision
- Audit Note

Never promote AI output into a Decision unless it passes:

Evidence
+
Authority
+
KFSA Verdict
+
Human Approval
+
Audit

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create agent runtime files.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This document is controlled vocabulary, not final operating policy.

## Non-Negotiable Rules

- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- Signal is not Decision.
- Agents do not decide.
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- AI output is not institutional truth until governed.
- No execution without authority.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- Human accountability remains mandatory.
- KFSA is not collapsed.
- ALERT is preserved.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
