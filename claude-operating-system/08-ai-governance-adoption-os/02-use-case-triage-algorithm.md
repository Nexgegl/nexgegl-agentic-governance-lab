# Use Case Triage Algorithm v1.0

## Document Status

Status:
ALGORITHM SPECIFICATION

Extension:
Governance Lab v0.4 — AI Governance & Agent Adoption Operating System

Parent folder:
`claude-operating-system/08-ai-governance-adoption-os/`

Source alignment:
`00-notion-methodology-brief-v0-1.md`

Extension index:
`README.md`

Doctrine dependency:
`01-ai-governance-doctrine.md`

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

## Purpose

This is the first algorithmic triage layer for the NEXGEGL AI Governance & Agent Adoption Operating System.

It decides the correct intervention before selecting model, agent, tool, workflow, or vendor.

It operationalizes AI Governance Doctrine v1.0.

It is algorithm specification, not runtime implementation.

## Operating Principle

Governance Lab v0.4 must be built as:

Governance as Algorithms

Not governance as essays.

Rule:

No operational artifact, no merge.

This algorithm includes operational artifacts:
- input schema
- output schema
- decision factors
- decision tree
- scoring logic
- pseudocode
- fail-closed rules
- example cases
- review checklist

## External Source-of-Truth Boundaries

### KFSA Boundary

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This document does not define KFSA.

This document does not redefine KFSA.

This document does not create a competing KFSA scoring model.

This document does not create a replacement verdict system.

This document may reference KFSA only as an external applied decision-gate interface.

KFSA must always preserve:

KILL / FIX / SCALE / ALERT

ALERT must not be dropped.

KFSA must not be collapsed.

### SDGM Boundary

SDGM is not defined in this document.

SDGM is not redefined in this document.

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

AGENT / MULTI_AGENT_SYSTEM / GOVERNED_RUNTIME triage outcomes do not approve production.

Agent approval requires later readiness scoring, eval matrix, governance gate, permission schema, authority review, and audit requirements.

## Triage Outcomes

| Outcome | Meaning |
|---|---|
| NO_AI | AI is not the correct intervention; no automation, agent, or model is warranted |
| PROCESS_REPAIR | The underlying process is broken or unowned; fix the process before considering AI |
| AUTOMATION | Deterministic, rule-based automation is sufficient; no model reasoning required |
| AUGMENTATION | A human remains the decision-maker; AI assists as a thinking partner |
| WORKFLOW | A structured multi-step workflow is needed, with or without light AI assistance |
| AGENT | A single bounded agent may operate under defined authority, tools, and escalation rules |
| MULTI_AGENT_SYSTEM | Coordinated specialist agents under a supervisor pattern may be appropriate |
| GOVERNED_RUNTIME | The use case requires full governed runtime enforcement before any execution |

## Input Schema

```yaml
use_case_id: string
use_case_name: string
business_owner: string
problem_statement: string
expected_outcome: string
decision_relevance: low | medium | high
process_clarity: low | medium | high
repeatability: low | medium | high
rule_clarity: low | medium | high
data_sensitivity: low | medium | high
data_readiness: low | medium | high
evidence_availability: none | partial | sufficient
authority_clarity: missing | unclear | clear
human_approval_required: true | false
external_action_required: true | false
tool_access_required: none | read_only | write | external_system
customer_impact: none | low | medium | high
financial_impact: none | low | medium | high
regulatory_or_legal_impact: none | low | medium | high
audit_required: true | false
volume_frequency: low | medium | high
variation_complexity: low | medium | high
requires_multi_role_reasoning: true | false
requires_runtime_controls: true | false
known_process_owner: true | false
```

## Output Schema

```yaml
recommended_mode: NO_AI | PROCESS_REPAIR | AUTOMATION | AUGMENTATION | WORKFLOW | AGENT | MULTI_AGENT_SYSTEM | GOVERNED_RUNTIME
review_outcome: PASS | FIX | FAIL | ESCALATE
confidence_level: low | medium | high
primary_reason: string
risk_level: low | medium | high
missing_controls: list
required_evidence: list
required_authority: string
recommended_next_action: string
kfsa_gate_required: true | false
kfsa_reference: external_applied_verdict_interface_only
notes: string
```

Review-control outcomes are PASS / FIX / FAIL / ESCALATE.

They do not replace KFSA.

They do not redefine KFSA.

KFSA remains KILL / FIX / SCALE / ALERT.

ALERT must be preserved.

## Decision Factors

| Factor | Triage Relevance |
|---|---|
| Use case clarity | Determines whether triage can proceed at all |
| Process clarity | Determines whether PROCESS_REPAIR is required before any AI path |
| Repeatability | Determines eligibility for AUTOMATION |
| Rule clarity | Determines whether deterministic rules can replace model reasoning |
| Data sensitivity | Determines required data boundaries and readiness gates |
| Evidence availability | Determines whether a recommendation can be grounded |
| Authority clarity | Determines whether decision or execution paths are permitted |
| Tool access requirement | Determines AGENT eligibility and audit requirements |
| Human approval need | Determines AUGMENTATION vs. autonomous paths |
| Customer impact | Raises risk level and escalation likelihood |
| Financial impact | Raises risk level and escalation likelihood |
| Legal/regulatory impact | Determines mandatory escalation |
| Audit requirement | Determines whether AGENT or GOVERNED_RUNTIME paths can proceed |
| Variation complexity | Determines AUTOMATION vs. AUGMENTATION vs. WORKFLOW |
| Multi-role reasoning | Determines MULTI_AGENT_SYSTEM eligibility |
| Runtime controls | Determines GOVERNED_RUNTIME eligibility |

## Fail-Closed Conditions

```text
Missing use_case_name => FAIL
Missing problem_statement => FAIL
Missing expected_outcome => FAIL
Missing business_owner => FAIL
known_process_owner false => FIX
authority missing with non-low decision relevance => FAIL
high data sensitivity with low data readiness => FAIL
external action with unclear authority => FAIL
write or external system tool access without audit => FAIL
high regulatory/legal impact without clear authority => ESCALATE
no evidence with high decision relevance => FAIL
runtime controls required without audit => FAIL
```

Fail-closed does not recommend production, scale, or autonomous execution.

FAIL is not resolved by re-prompting the model.

FAIL is resolved by supplying the missing use case, evidence, authority, readiness, or audit control.

## Decision Tree

### Step 1 — Validate Minimum Use Case

```yaml
condition: use_case_name, problem_statement, expected_outcome, or business_owner missing
recommended_mode: NO_AI
review_outcome: FAIL
primary_reason: minimum use case fields are incomplete
recommended_next_action: supply missing use case fields before re-triage
kfsa_gate_required: false
```

### Step 2 — Check Process Readiness

```yaml
condition: process_clarity is low OR known_process_owner is false
recommended_mode: PROCESS_REPAIR
review_outcome: FIX
primary_reason: underlying process is unclear or unowned
recommended_next_action: repair and assign ownership of the process before considering AI
kfsa_gate_required: false
```

### Step 3 — Check Whether AI Is Needed

```yaml
condition: volume_frequency is low AND decision_relevance is low
recommended_mode: NO_AI
review_outcome: PASS
primary_reason: use case volume and decision relevance do not justify AI investment
recommended_next_action: handle manually or defer
kfsa_gate_required: false
```

### Step 4 — Check for Deterministic Automation

```yaml
condition: repeatability is high AND rule_clarity is high AND variation_complexity is low
recommended_mode: AUTOMATION
review_outcome: PASS
primary_reason: task is deterministic and rule-based
recommended_next_action: implement rule-based automation; no model reasoning required
kfsa_gate_required: false
```

### Step 5 — Check for Workflow

```yaml
condition: task spans multiple steps or systems without meeting AUTOMATION or AUGMENTATION conditions
recommended_mode: WORKFLOW
review_outcome: FIX
primary_reason: task requires a structured multi-step workflow definition
recommended_next_action: define workflow steps, owners, and handoffs before re-triage
kfsa_gate_required: false
```

### Step 6 — Check for Human Augmentation

```yaml
condition: human_approval_required is true AND variation_complexity is medium or high
recommended_mode: AUGMENTATION
review_outcome: PASS
primary_reason: human remains decision-maker with AI assisting on variable work
recommended_next_action: deploy AI as thinking partner with mandatory human review
kfsa_gate_required: false
```

### Step 7 — Check for Agent Eligibility

```yaml
condition: tool_access_required is write or external_system
recommended_mode: AGENT
review_outcome: FAIL if audit_required is false, otherwise FIX
primary_reason: agent requires bounded tool access under authority and audit controls
recommended_next_action: define agent authority profile, tool permissions, and audit requirements before proceeding
kfsa_gate_required: true
```

### Step 8 — Check for Multi-Agent System

```yaml
condition: requires_multi_role_reasoning is true
recommended_mode: MULTI_AGENT_SYSTEM
review_outcome: ESCALATE
primary_reason: task requires coordinated specialist roles under a supervisor pattern
recommended_next_action: escalate for multi-agent architecture and governance review
kfsa_gate_required: true
```

### Step 9 — Check for Governed Runtime

```yaml
condition: requires_runtime_controls is true
recommended_mode: GOVERNED_RUNTIME
review_outcome: ESCALATE
primary_reason: use case requires full governed runtime enforcement before execution
recommended_next_action: escalate to governance gate algorithm and runtime reference architecture review
kfsa_gate_required: true
```

## Scoring Logic

This algorithm uses directional scoring only.

This is not the AI Readiness Scoring Model.

The official readiness score will be defined later in `03-ai-readiness-scoring-model.md`.

| Dimension | Directional Signal |
|---|---|
| Process clarity | Higher clarity increases eligibility for AUTOMATION or WORKFLOW |
| Repeatability | Higher repeatability increases eligibility for AUTOMATION |
| Rule clarity | Higher clarity reduces need for model reasoning |
| Data readiness | Lower readiness increases likelihood of FAIL or ESCALATE |
| Evidence availability | Lower availability increases likelihood of FAIL |
| Authority clarity | Lower clarity increases likelihood of FAIL or ESCALATE |
| Audit readiness | Lower readiness increases likelihood of FAIL for AGENT paths |
| Variation complexity | Higher complexity shifts triage toward AUGMENTATION or WORKFLOW |
| Business impact | Higher impact increases likelihood of ESCALATE |

Directional scoring does not approve production.

Directional scoring does not replace the AI Readiness Scoring Model.

Directional scoring does not replace KFSA.

## Pseudocode

```pseudo
function triage_use_case(input):
    if missing(input.use_case_name, input.problem_statement,
               input.expected_outcome, input.business_owner):
        return output(mode=NO_AI, review=FAIL,
                      reason="minimum use case fields incomplete")

    if input.process_clarity == low or input.known_process_owner == false:
        return output(mode=PROCESS_REPAIR, review=FIX,
                      reason="process unclear or unowned")

    if input.authority_clarity == missing and input.decision_relevance != low:
        return output(mode=NO_AI, review=FAIL,
                      reason="authority missing for decision-relevant use case")

    if input.data_sensitivity == high and input.data_readiness == low:
        return output(mode=NO_AI, review=FAIL,
                      reason="high sensitivity data without adequate readiness")

    if input.external_action_required == true and input.authority_clarity != clear:
        return output(mode=NO_AI, review=FAIL,
                      reason="external action requested without clear authority")

    if input.requires_runtime_controls == true:
        return output(mode=GOVERNED_RUNTIME, review=ESCALATE,
                      reason="runtime enforcement controls required",
                      kfsa_gate_required=true)

    if input.requires_multi_role_reasoning == true:
        return output(mode=MULTI_AGENT_SYSTEM, review=ESCALATE,
                      reason="coordinated multi-role reasoning required",
                      kfsa_gate_required=true)

    if input.tool_access_required in (write, external_system):
        if input.audit_required == false:
            return output(mode=AGENT, review=FAIL,
                          reason="write or external tool access without audit",
                          kfsa_gate_required=true)
        else:
            return output(mode=AGENT, review=FIX,
                          reason="agent authority and permission profile required",
                          kfsa_gate_required=true)

    if input.repeatability == high and input.rule_clarity == high and input.variation_complexity == low:
        return output(mode=AUTOMATION, review=PASS,
                      reason="deterministic, repeatable, rule-based task")

    if input.human_approval_required == true and input.variation_complexity in (medium, high):
        return output(mode=AUGMENTATION, review=PASS,
                      reason="human remains decision-maker on variable work")

    if input.volume_frequency == low and input.decision_relevance == low:
        return output(mode=NO_AI, review=PASS,
                      reason="volume and decision relevance do not justify AI investment")

    return output(mode=WORKFLOW, review=FIX,
                  reason="default to structured workflow definition")
```

## Example Cases

### Example 1 — Low-Value Manual Request

```yaml
input:
  use_case_name: "Ad hoc formatting request"
  business_owner: "Ops Team Lead"
  problem_statement: "Occasional request to reformat a small internal note"
  expected_outcome: "Reformatted note"
  decision_relevance: low
  volume_frequency: low
  known_process_owner: true
```

```yaml
output:
  recommended_mode: NO_AI
  review_outcome: PASS
  primary_reason: "volume and decision relevance do not justify AI investment"
  recommended_next_action: "handle manually"
  kfsa_gate_required: false
```

### Example 2 — Clear Rules and High Repeatability

```yaml
input:
  use_case_name: "Invoice field extraction"
  business_owner: "Finance Ops Manager"
  problem_statement: "Repetitive extraction of fixed fields from standard invoices"
  expected_outcome: "Structured invoice data"
  repeatability: high
  rule_clarity: high
  variation_complexity: low
  known_process_owner: true
```

```yaml
output:
  recommended_mode: AUTOMATION
  review_outcome: PASS
  primary_reason: "deterministic, repeatable, rule-based task"
  recommended_next_action: "implement rule-based automation"
  kfsa_gate_required: false
```

### Example 3 — Drafting Assistant

```yaml
input:
  use_case_name: "Executive summary drafting"
  business_owner: "Strategy Director"
  problem_statement: "Draft first-pass executive summaries from source reports"
  expected_outcome: "Draft summary for human review"
  human_approval_required: true
  variation_complexity: medium
  known_process_owner: true
```

```yaml
output:
  recommended_mode: AUGMENTATION
  review_outcome: PASS
  primary_reason: "human remains decision-maker on variable work"
  recommended_next_action: "deploy AI as thinking partner with mandatory human review"
  kfsa_gate_required: false
```

### Example 4 — Agent With Write Tool Missing Audit

```yaml
input:
  use_case_name: "Automated record updater"
  business_owner: "Data Ops Lead"
  problem_statement: "Agent proposed to write directly to production database"
  expected_outcome: "Updated records"
  tool_access_required: write
  audit_required: false
  known_process_owner: true
```

```yaml
output:
  recommended_mode: AGENT
  review_outcome: FAIL
  primary_reason: "write tool access without audit"
  recommended_next_action: "define audit requirements before granting write access"
  kfsa_gate_required: true
```

### Example 5 — Multi-Agent Review Loop

```yaml
input:
  use_case_name: "Cross-functional deal review"
  business_owner: "Revenue Operations Director"
  problem_statement: "Coordinated legal, finance, and risk review of a deal package"
  expected_outcome: "Consolidated review recommendation"
  requires_multi_role_reasoning: true
  known_process_owner: true
```

```yaml
output:
  recommended_mode: MULTI_AGENT_SYSTEM
  review_outcome: ESCALATE
  primary_reason: "coordinated multi-role reasoning required"
  recommended_next_action: "escalate for multi-agent architecture and governance review"
  kfsa_gate_required: true
```

### Example 6 — Governed Runtime Candidate

```yaml
input:
  use_case_name: "Autonomous client-facing collections agent"
  business_owner: "Collections Director"
  problem_statement: "Agent proposed to autonomously negotiate and execute payment plans"
  expected_outcome: "Executed payment plan actions"
  requires_runtime_controls: true
  known_process_owner: true
```

```yaml
output:
  recommended_mode: GOVERNED_RUNTIME
  review_outcome: ESCALATE
  primary_reason: "runtime enforcement controls required before any execution"
  recommended_next_action: "escalate to governance gate algorithm and runtime reference architecture review"
  kfsa_gate_required: true
```

## Review Checklist

| Check | Required |
|---|---|
| Owner exists | Yes |
| Problem statement clear | Yes |
| Expected outcome clear | Yes |
| Process clarity assessed | Yes |
| Data sensitivity assessed | Yes |
| Authority clarity assessed | Yes |
| Evidence availability assessed | Yes |
| Tool access classified | Yes |
| Audit need assessed | Yes |
| Algorithm allows NO_AI | Yes |
| Algorithm allows PROCESS_REPAIR | Yes |
| Avoids forcing AI | Yes |
| Avoids redefining KFSA | Yes |
| Preserves ALERT | Yes |
| Avoids claiming runtime implementation | Yes |

## P1 Backlog

Index Use Case Triage Algorithm v1.0 in `README.md` after this specification is reviewed and merged.

Do not update README in this PR.

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create the AI readiness scoring model.

This document does not create eval matrices.

This document does not create governance gate algorithms.

This document does not create agent permission schemas.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not approve production use.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This document is algorithm specification, not runtime implementation.

## Non-Negotiable Rules

- The model is not the starting point.
- No AI without a clear use case.
- No Agent without authority and boundaries.
- No production without eval.
- No recommendation without evidence.
- No decision without authority.
- No scale without governance.
- No open context without management.
- No tool use without verification.
- No AI sale when no-AI is the correct answer.
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
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- No operational artifact, no merge.

## Immediate Next Step

After this algorithm specification is merged, index it in README.md.

Then create `03-ai-readiness-scoring-model.md`.

Do not skip directly to eval matrices, governance gates, schemas, or commercial offers.

## Final Position

Use Case Triage Algorithm v1.0 is the first algorithmic operating artifact in Governance Lab v0.4.

It determines the correct intervention mode before model, agent, workflow, or vendor selection.

It prevents technology-first AI adoption and ensures that no-AI, process repair, automation, augmentation, workflow, agent, multi-agent, and governed runtime paths are all considered before proceeding.
