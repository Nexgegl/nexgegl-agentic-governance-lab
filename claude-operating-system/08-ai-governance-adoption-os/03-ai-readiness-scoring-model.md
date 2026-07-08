# AI Readiness Scoring Model v1.0

## Document Status

Status:
SCORING SPECIFICATION

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

Triage algorithm dependency:
`02-use-case-triage-algorithm.md`

Post-closure note:
This document is created after Governance Baseline v0.1 closure.

It does not reopen Governance Baseline v0.1.

It does not modify Governance Baseline v0.1.

It does not create a new repository.

It does not implement runtime code.

It does not create database tables.

It does not create CI checks.

It does not approve production readiness.

It does not claim agent runtime implementation is complete.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Purpose

This scoring model evaluates readiness after a use case has been triaged.

It is used before eval matrix, governance gate, agent permission schema, or client offer.

It helps determine whether the use case should proceed, be fixed, be escalated, or fail closed.

It is a scoring specification, not runtime implementation.

Readiness score does not equal production approval.

Readiness score does not equal KFSA verdict.

## Operating Principle

Governance Lab v0.4 must be built as:

Governance as Algorithms

Rule:

No operational artifact, no merge.

Scoring must be reviewable, explainable, and auditable.

Scoring must identify missing controls, not hide them behind a numeric score.

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

A high readiness score does not approve an agent for production.

Agent readiness still requires eval matrix, governance gate, permission schema, authority review, and audit requirements.

## Scoring Scope

The scoring model applies only after a use case has a triage outcome from:

- NO_AI
- PROCESS_REPAIR
- AUTOMATION
- AUGMENTATION
- WORKFLOW
- AGENT
- MULTI_AGENT_SYSTEM
- GOVERNED_RUNTIME

The scoring model does not force AI.

If triage recommends NO_AI or PROCESS_REPAIR, scoring may confirm that AI should not proceed.

## Scoring Inputs

```yaml
use_case_id: string
use_case_name: string
triage_recommended_mode: NO_AI | PROCESS_REPAIR | AUTOMATION | AUGMENTATION | WORKFLOW | AGENT | MULTI_AGENT_SYSTEM | GOVERNED_RUNTIME
triage_review_outcome: PASS | FIX | FAIL | ESCALATE
business_owner: string
process_owner: string
decision_owner: string
data_owner: string
use_case_clarity_score: 0-5
process_clarity_score: 0-5
data_readiness_score: 0-5
evidence_readiness_score: 0-5
authority_clarity_score: 0-5
eval_readiness_score: 0-5
security_boundary_score: 0-5
tool_permission_score: 0-5
auditability_score: 0-5
adoption_readiness_score: 0-5
cost_control_score: 0-5
risk_level: low | medium | high
data_sensitivity: low | medium | high
external_action_required: true | false
tool_access_required: none | read_only | write | external_system
regulatory_or_legal_impact: none | low | medium | high
customer_impact: none | low | medium | high
financial_impact: none | low | medium | high
missing_controls:
  - string
```

## Scoring Outputs

```yaml
readiness_score: 0-100
readiness_band: NOT_READY | REPAIR_REQUIRED | EVAL_READY | GOVERNANCE_GATE_READY | ESCALATE
review_outcome: PASS | FIX | FAIL | ESCALATE
recommended_next_action: string
blocking_controls:
  - string
missing_controls:
  - string
required_evidence:
  - string
required_authority: string
kfsa_gate_required: true | false
kfsa_reference: external_applied_verdict_interface_only
production_approval: false
```

Review-control outcomes are PASS / FIX / FAIL / ESCALATE.

They do not replace KFSA.

They do not redefine KFSA.

KFSA remains KILL / FIX / SCALE / ALERT.

ALERT must be preserved.

production_approval must always be false in this scoring specification.

## Scoring Categories and Weights

| # | Category | Weight |
|---|---|---|
| 1 | Use Case Clarity | 10% |
| 2 | Process Clarity | 10% |
| 3 | Data Readiness | 12% |
| 4 | Evidence Readiness | 12% |
| 5 | Authority Clarity | 12% |
| 6 | Eval Readiness | 10% |
| 7 | Security Boundary | 10% |
| 8 | Tool Permission Control | 8% |
| 9 | Auditability | 8% |
| 10 | Adoption Readiness | 5% |
| 11 | Cost Control | 3% |

Total: 100%

### 1. Use Case Clarity — 10%

Definition:
Whether the business problem, owner, and expected outcome are clearly defined.

Scoring guide (0-5):
- 0: No use case statement, no owner
- 1-2: Vague problem statement, unclear expected outcome
- 3: Use case defined, owner named, outcome loosely defined
- 4: Use case, owner, and outcome clearly defined
- 5: Use case, owner, outcome, and success criteria clearly defined and agreed

Examples of missing controls:
- No business_owner
- No expected_outcome
- No success criteria

### 2. Process Clarity — 10%

Definition:
Whether the underlying process is understood, owned, and stable enough to support AI, automation, or workflow.

Scoring guide (0-5):
- 0: Process undefined or unowned
- 1-2: Process exists but undocumented or inconsistent
- 3: Process documented, owner exists
- 4: Process documented, owner exists, exceptions handled
- 5: Process documented, owned, stable, and measured

Examples of missing controls:
- No process_owner
- No documented process steps
- Frequent undocumented exceptions

### 3. Data Readiness — 12%

Definition:
Whether required data exists, is accessible, is of adequate quality, and is appropriately classified for sensitivity.

Scoring guide (0-5):
- 0: Data does not exist or is inaccessible
- 1-2: Data exists but quality or access is unverified
- 3: Data exists, accessible, quality acceptable
- 4: Data exists, accessible, quality verified, sensitivity classified
- 5: Data exists, accessible, quality verified, sensitivity classified, governed by a data owner

Examples of missing controls:
- No data_owner for sensitive data
- Unverified data quality
- Undocumented data sensitivity classification

### 4. Evidence Readiness — 12%

Definition:
Whether evidence exists to support recommendations or decisions produced by the use case.

Scoring guide (0-5):
- 0: No evidence available
- 1-2: Evidence exists but is unverified or fragmented
- 3: Evidence exists and is traceable
- 4: Evidence exists, traceable, and current
- 5: Evidence exists, traceable, current, and independently verifiable

Examples of missing controls:
- No evidence source list
- Stale or conflicting evidence
- No evidence ownership

### 5. Authority Clarity — 12%

Definition:
Whether decision and execution authority is defined for this use case.

Scoring guide (0-5):
- 0: No authority defined
- 1-2: Authority implied but not documented
- 3: Authority documented for recommendations
- 4: Authority documented for recommendations and decisions
- 5: Authority documented for recommendations, decisions, and execution, with escalation path

Examples of missing controls:
- No decision_owner for decision-relevant use case
- No escalation path
- No documented approval workflow

### 6. Eval Readiness — 10%

Definition:
Whether evaluation criteria and test cases exist or can be defined before production use.

Scoring guide (0-5):
- 0: No evaluation plan
- 1-2: Evaluation intended but undefined
- 3: Evaluation criteria drafted
- 4: Evaluation criteria and test cases drafted
- 5: Evaluation criteria, test cases, and grading logic ready for the eval matrix stage

Examples of missing controls:
- No test cases
- No grading criteria
- No plan for eval before production

### 7. Security Boundary — 10%

Definition:
Whether data access, tenant isolation, and security boundaries are defined for this use case.

Scoring guide (0-5):
- 0: No security boundary defined
- 1-2: Security boundary implied but undocumented
- 3: Security boundary documented
- 4: Security boundary documented and reviewed
- 5: Security boundary documented, reviewed, and enforced by existing controls

Examples of missing controls:
- No tenant isolation statement
- No data access boundary
- No security review

### 8. Tool Permission Control — 8%

Definition:
Whether tool access is scoped, permissioned, and reviewed.

Scoring guide (0-5):
- 0: No tool permission model
- 1-2: Tool access assumed, not documented
- 3: Tool access documented
- 4: Tool access documented and permissioned
- 5: Tool access documented, permissioned, and reviewed for risk level

Examples of missing controls:
- No tool permission profile
- Write or external system access without review
- No forbidden-action list

### 9. Auditability — 8%

Definition:
Whether the use case can produce a traceable record of requester, context, evidence, output, and outcome.

Scoring guide (0-5):
- 0: No audit trail possible
- 1-2: Partial audit trail
- 3: Audit trail defined for key fields
- 4: Audit trail defined and consistently produced
- 5: Audit trail defined, consistently produced, and independently reviewable

Examples of missing controls:
- No audit log schema
- No requester/timestamp capture
- No record of human approval where required

### 10. Adoption Readiness — 5%

Definition:
Whether the people and teams affected by the use case are prepared to adopt it.

Scoring guide (0-5):
- 0: No adoption plan
- 1-2: Awareness only, no training or rollout plan
- 3: Rollout plan exists
- 4: Rollout plan and training exist
- 5: Rollout plan, training, and feedback loop exist

Examples of missing controls:
- No training plan
- No communication plan
- No feedback channel

### 11. Cost Control — 3%

Definition:
Whether cost limits and monitoring exist for the use case.

Scoring guide (0-5):
- 0: No cost visibility
- 1-2: Cost visibility exists, no limits
- 3: Cost limits defined
- 4: Cost limits defined and monitored
- 5: Cost limits defined, monitored, with an emergency stop threshold

Examples of missing controls:
- No per-task or per-workflow cost limit
- No cost monitoring
- No emergency stop threshold

## Score Calculation

Each category is scored 0 to 5.

Weighted contribution = category_score / 5 * category_weight.

Total readiness score = sum of weighted contributions.

Score is rounded to the nearest integer.

```pseudo
function calculate_readiness_score(input):
    weights = {
        use_case_clarity: 10,
        process_clarity: 10,
        data_readiness: 12,
        evidence_readiness: 12,
        authority_clarity: 12,
        eval_readiness: 10,
        security_boundary: 10,
        tool_permission: 8,
        auditability: 8,
        adoption_readiness: 5,
        cost_control: 3,
    }

    validate_categories_present(input, weights.keys())
    validate_scores_in_range(input, 0, 5)

    weighted_sum = 0
    for category, weight in weights:
        category_score = input[category + "_score"]
        weighted_sum += (category_score / 5) * weight

    readiness_score = round(weighted_sum)

    missing_controls = collect_missing_controls(input)
    blocking_controls = detect_blocking_controls(input)

    readiness_band = assign_readiness_band(readiness_score, blocking_controls, input)
    review_outcome = assign_review_outcome(readiness_score, blocking_controls, input)

    return output(
        readiness_score=readiness_score,
        readiness_band=readiness_band,
        review_outcome=review_outcome,
        missing_controls=missing_controls,
        blocking_controls=blocking_controls,
        production_approval=false,
        kfsa_reference="external_applied_verdict_interface_only",
    )
```

## Readiness Bands

| Score Range | Band | Meaning | Default Review Outcome | Next Action |
|---|---|---|---|---|
| 0-39 | NOT_READY | Foundational readiness is missing | FAIL | Do not proceed; repair fundamentals |
| 40-59 | REPAIR_REQUIRED | Use case may be valid but controls are incomplete | FIX | Repair missing controls and rescore |
| 60-74 | EVAL_READY | Ready to create eval matrix and test cases | PASS | Proceed to Eval & Grader Matrix |
| 75-89 | GOVERNANCE_GATE_READY | Ready for governance gate review after eval readiness is confirmed | PASS | Proceed to governance gate only after eval |
| 90-100 | ESCALATE | High readiness and/or high impact requires executive/governance escalation before production | ESCALATE | Escalate to governance authority |

GOVERNANCE_GATE_READY does not approve production.

ESCALATE does not mean approved.

Eval is still required before governance gate.

Governance gate is still required before production.

## Blocking Controls

Blocking controls are fail-closed conditions that override the numeric score.

Required blocking controls:

- Missing business owner
- Missing process owner
- Missing decision owner for decision-relevant use case
- Missing data owner for sensitive data
- Authority score below 3 for decision-relevant use case
- Evidence score below 3 for high decision relevance
- Eval readiness score below 2 for production-intended use
- Security boundary score below 3 for high data sensitivity
- Tool permission score below 3 for write or external system tool access
- Auditability score below 3 for external action, agent, multi-agent, or governed runtime
- Regulatory/legal impact high with authority score below 4
- Any attempt to use readiness score as production approval
- Any attempt to treat score as KFSA verdict
- Any attempt to drop ALERT from KFSA

Blocking control response:

- review_outcome = FAIL or ESCALATE depending on risk
- production_approval = false
- recommended_next_action must repair or escalate

## Readiness by Triage Mode

| Triage Mode | Scoring Behavior |
|---|---|
| NO_AI | Score may confirm no-AI; do not force AI |
| PROCESS_REPAIR | Score focuses on process clarity and ownership gaps |
| AUTOMATION | Score focuses on rules, data readiness, authority, audit |
| AUGMENTATION | Score focuses on evidence, human review, eval, authority |
| WORKFLOW | Score focuses on process, handoffs, auditability |
| AGENT | Score focuses on authority, tool permissions, eval, audit, escalation |
| MULTI_AGENT_SYSTEM | Score requires escalation; supervisor pattern and role boundaries required |
| GOVERNED_RUNTIME | Score requires escalation; runtime controls required before implementation |

## Missing Control Penalties

- Missing owner fields cap score at 59.
- Missing authority for decision-relevant use case cap score at 39.
- Missing evidence for high-decision-relevance use case cap score at 39.
- Missing audit for external action cap score at 59.
- Missing tool permission boundary for write/external tools cap score at 59.
- High regulatory/legal impact without authority cap score at 39 and ESCALATE.
- Claiming production approval from readiness score forces FAIL.
- Treating readiness score as KFSA verdict forces FAIL.

## Review Outcome Logic

Review-control outcomes are PASS / FIX / FAIL / ESCALATE only.

KILL / SCALE / ALERT must not be used as review outcomes.

FIX may appear only as a review-control outcome, not as a KFSA verdict.

Review outcomes do not approve production.

KFSA remains an external applied verdict interface only.

Assignment logic:

- PASS when score >= 60 and no blocking controls
- FIX when score is 40-59, or missing controls are repairable
- FAIL when score < 40, or blocking controls prevent progress
- ESCALATE when high regulatory/legal/financial/customer impact requires governance authority review

## Example Scoring Cases

### Example 1 — No-AI Confirmed

Input summary:
Low decision relevance, low volume, use case triaged as NO_AI.

Key scores:
use_case_clarity_score: 4, process_clarity_score: 4, data_readiness_score: 3, evidence_readiness_score: 3, authority_clarity_score: 3, eval_readiness_score: 2, security_boundary_score: 3, tool_permission_score: 3, auditability_score: 3, adoption_readiness_score: 3, cost_control_score: 3

```yaml
readiness_score: 60
readiness_band: EVAL_READY
review_outcome: PASS
recommended_next_action: "Confirm NO_AI is correct; no eval matrix required since no AI is deployed"
blocking_controls: []
production_approval: false
```

### Example 2 — Process Repair Required

Input summary:
Triage recommended PROCESS_REPAIR; process undocumented and unowned.

Key scores:
use_case_clarity_score: 3, process_clarity_score: 1, data_readiness_score: 2, evidence_readiness_score: 2, authority_clarity_score: 2, eval_readiness_score: 1, security_boundary_score: 2, tool_permission_score: 2, auditability_score: 2, adoption_readiness_score: 2, cost_control_score: 2

```yaml
readiness_score: 39
readiness_band: NOT_READY
review_outcome: FAIL
recommended_next_action: "Repair and assign ownership of the underlying process before rescoring"
blocking_controls:
  - "Missing process owner"
production_approval: false
```

### Example 3 — Automation Eval-Ready

Input summary:
Deterministic, rule-based automation with clear authority and audit; triaged AUTOMATION.

Key scores:
use_case_clarity_score: 5, process_clarity_score: 5, data_readiness_score: 4, evidence_readiness_score: 4, authority_clarity_score: 4, eval_readiness_score: 3, security_boundary_score: 4, tool_permission_score: 4, auditability_score: 4, adoption_readiness_score: 3, cost_control_score: 4

```yaml
readiness_score: 82
readiness_band: GOVERNANCE_GATE_READY
review_outcome: PASS
recommended_next_action: "Proceed to Eval & Grader Matrix; governance gate only after eval is complete"
blocking_controls: []
production_approval: false
```

### Example 4 — Agent Not Ready Due to Tool Permission/Audit Gap

Input summary:
Agent proposed with write tool access; audit and tool permission controls incomplete.

Key scores:
use_case_clarity_score: 4, process_clarity_score: 3, data_readiness_score: 3, evidence_readiness_score: 3, authority_clarity_score: 3, eval_readiness_score: 2, security_boundary_score: 2, tool_permission_score: 2, auditability_score: 1, adoption_readiness_score: 2, cost_control_score: 2

```yaml
readiness_score: 51
readiness_band: REPAIR_REQUIRED
review_outcome: FIX
recommended_next_action: "Define tool permission profile and audit requirements before granting write access; rescore"
blocking_controls:
  - "Tool permission score below 3 for write tool access"
  - "Auditability score below 3 for agent use case"
production_approval: false
```

### Example 5 — Multi-Agent / Governed Runtime Escalation

Input summary:
Triage recommended MULTI_AGENT_SYSTEM with high customer and financial impact.

Key scores:
use_case_clarity_score: 4, process_clarity_score: 4, data_readiness_score: 4, evidence_readiness_score: 3, authority_clarity_score: 3, eval_readiness_score: 3, security_boundary_score: 4, tool_permission_score: 3, auditability_score: 4, adoption_readiness_score: 3, cost_control_score: 3

```yaml
readiness_score: 79
readiness_band: GOVERNANCE_GATE_READY
review_outcome: ESCALATE
recommended_next_action: "Escalate to governance authority; multi-agent supervisor pattern and role boundaries required before proceeding"
blocking_controls: []
production_approval: false
```

## Review Checklist

| Check | Required |
|---|---|
| Triage outcome exists | Yes |
| Owner fields are present | Yes |
| Scoring categories are complete | Yes |
| Weights sum to 100 | Yes |
| Blocking controls assessed | Yes |
| Missing controls listed | Yes |
| Score not treated as production approval | Yes |
| Score not treated as KFSA verdict | Yes |
| ALERT preserved | Yes |
| Next action mapped | Yes |
| Implementation boundary included | Yes |

## Implementation Boundary

This document does not implement runtime code.

This document does not create database tables.

This document does not create CI checks.

This document does not create reference implementation.

This document does not create eval matrix.

This document does not create governance gate algorithm.

This document does not create agent permission schema.

This document does not create customer deployment assets.

This document does not replace human authority.

This document does not approve production use.

This document does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This document is a scoring specification.

It is not runtime implementation.

## Non-Negotiable Rules

- Readiness score does not equal production approval.
- Readiness score does not equal KFSA verdict.
- Scoring Model is not KFSA.
- KFSA is not defined here.
- KFSA is not redefined here.
- KFSA is not collapsed.
- ALERT is preserved.
- SDGM is not redefined here.
- Agent Governance is not KFSA Core.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- No production without eval.
- No decision without authority.
- No recommendation without evidence.
- No execution without authority.
- No governance without audit.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- No operational artifact, no merge.

## Immediate Next Step

After this scoring specification is merged, create:

`04-eval-and-grader-matrix.md`

Do not skip directly to governance gates, schemas, or commercial offers.

## Final Position

AI Readiness Scoring Model v1.0 determines readiness for the next governance artifact, not production approval.

It translates doctrine and triage output into weighted scoring, missing-control detection, and next-action mapping.

It prevents premature production claims, unsupported AI adoption, and score-as-verdict misuse.
