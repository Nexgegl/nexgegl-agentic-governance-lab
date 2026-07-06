# Skill Optimization Governance Standard v0.1

## Document Status

Status:
DRAFT STANDARD

Document Type:
Master Standard

Scope:
NEXGEGL agent skill improvement, benchmark-backed skill updates, validation discipline, drift prevention, and audit control.

This standard does not modify runtime files.

This standard does not modify existing skills.

This standard does not claim SkillOpt is implemented.

This standard does not claim production runtime implementation is complete.

This standard does not claim CI automation is complete.

This standard does not create marketing claims.

## Purpose

Define how NEXGEGL improves agent skills through governed, evidence-backed, bounded, and validated changes.

NEXGEGL does not treat skill files as casual notes.

NEXGEGL does not allow skill edits to grow without evidence.

NEXGEGL does not allow skill changes to bypass benchmark validation.

Skills must improve through controlled optimization cycles.

## Core Principle

Skills are not edited casually.

Skills are improved through evidence-backed, bounded, validated changes.

Every material skill change must answer:

1. What failed?
2. What evidence proves the failure?
3. What small change is proposed?
4. What benchmark or validation confirms improvement?
5. What regression risk was checked?
6. Who approved the change?
7. Where is the audit note?

## Problem

Agent skills often degrade when they are:
- written manually without validation
- generated once by a model without test evidence
- edited after failures without a stable evaluation process
- expanded with more instructions instead of better instructions
- changed without tracking rejected edits or regression risks

The result is skill drift:
- longer skill files
- conflicting instructions
- unclear triggers
- weaker outputs
- hidden regressions
- loss of source-of-truth alignment

NEXGEGL requires skills to improve through a controlled optimization discipline.

## Skill Optimization Model

NEXGEGL uses a governed skill optimization cycle:

| Phase | Name | Control Question | Required Evidence |
|---|---|---|---|
| 1 | Baseline | What does the current skill do? | Current skill version and benchmark result |
| 2 | Forward Evaluation | Where did the skill succeed or fail? | Task batch, outputs, verdicts, failure notes |
| 3 | Reflection | What pattern should be preserved or corrected? | Success/failure pattern summary |
| 4 | Bounded Edit | What is the smallest safe edit? | Add/delete/replace diff |
| 5 | Validation | Did the new skill beat or preserve the baseline? | Validation result and regression check |
| 6 | Adoption Decision | Should the edit be accepted, rejected, or escalated? | Approval, rejection reason, or escalation note |
| 7 | Audit | What changed and why? | Audit note and evidence references |

## Phase 1: Baseline

Purpose:
Establish the current skill behavior before any modification.

Required:
- skill file path
- current version or commit hash
- current behavior summary
- known benchmark coverage
- known failure cases
- known limitations

Forbidden:
- editing a skill without recording baseline behavior
- assuming a longer skill is better
- replacing a skill without evidence of improvement

## Phase 2: Forward Evaluation

Purpose:
Run the existing skill against a controlled task batch before proposing changes.

Required:
- task batch description
- expected outputs
- actual outputs
- activated agents or skills
- PASS / FIX / FAIL / BLOCK-style verdict where applicable
- failure evidence
- successful behavior evidence

Rules:
- Evaluation must include success cases and failure cases where possible.
- Evaluation should include at least one regression-sensitive case.
- Evaluation output is evidence, not automatic approval.

## Phase 3: Reflection

Purpose:
Convert observed outcomes into a precise improvement hypothesis.

Reflection must identify:
- patterns to preserve from successful runs
- patterns to correct from failed runs
- instructions causing ambiguity
- missing trigger conditions
- conflicting instructions
- unnecessary verbosity
- source-of-truth drift risk

Forbidden:
- rewriting the entire skill because one case failed
- adding broad instructions without a failure pattern
- removing safety constraints without CRAG review

## Phase 4: Bounded Edit

Purpose:
Prevent uncontrolled skill growth and instruction drift.

Allowed edit types:
- ADD: add a small missing rule or trigger
- DELETE: remove redundant or conflicting instruction
- REPLACE: replace unclear instruction with sharper wording

Required:
- small diff
- reason for each edit
- expected impact
- affected behavior
- regression risk
- owner approval where required

Textual learning-rate principle:
Skill edits must be small, bounded, and reviewable.

Large rewrites require:
- explicit owner approval
- CRAG review
- benchmark plan
- migration note
- audit note

## Phase 5: Validation

Purpose:
Accept only skill changes that improve or preserve governed behavior.

Required:
- validation benchmark or test task
- comparison against baseline
- regression check
- evidence that core rules remain preserved
- evidence that unsafe behavior is not introduced

Validation must confirm:
- no SDGM/KFSA redefinition
- no KFSA collapse
- ALERT is preserved
- MERGE READY remains recommendation only
- Evidence + Authority + Audit are preserved where applicable
- no new unsupported claims are introduced
- no runtime implementation is implied unless explicitly approved

A skill change must not be accepted only because it sounds better.

## Phase 6: Adoption Decision

Allowed outcomes:

| Outcome | Meaning | Required Action |
|---|---|---|
| ACCEPT | Edit improves or preserves benchmarked behavior | Merge recommendation with audit note |
| REJECT | Edit fails validation or creates regression | Record rejection reason |
| ESCALATE | Edit touches source-of-truth, authority, security, legal, financial, or runtime behavior | Route to CRAG and relevant domain reviewer |

Rejected edits are not wasted.

Rejected edits must become negative feedback for future skill updates.

## Phase 7: Audit

Every accepted material skill change must retain:
- changed file path
- before/after diff
- reason for change
- benchmark or validation evidence
- reviewer
- approval status
- regression check result
- audit note

## Required Review Routing

| Trigger | Required Review |
|---|---|
| Skill touches SDGM, KFSA, Signal, Decision, Authority, or Execution | CRAG |
| Skill touches NCGR recovery status or recovered_cash_total | cfo-logic-reviewer + CRAG |
| Skill touches customer-facing claims | legal-compliance-reviewer + product-governor |
| Skill touches pricing or package scope | pricing-scope-skill + legal-compliance-reviewer |
| Skill touches competitor comparison | competitor-trust-audit-skill + legal-compliance-reviewer |
| Skill touches board/executive wording | board-response-skill + executive-brief-skill |
| Skill touches RLS or tenant data access | security-rls-auditor |
| Skill changes evidence requirements | evidence-pack-builder-skill + CRAG |
| Skill changes runtime behavior or automation permission | CRAG + product-governor |

## Skill Drift Controls

A skill update must be blocked or escalated if it:
- makes the skill longer without evidence
- creates conflicting instructions
- weakens safety or governance constraints
- removes ALERT
- collapses KFSA into three options
- treats Signal as Decision
- treats AI output as authority
- treats automation as execution permission
- removes Evidence + Authority + Audit
- introduces unsupported claims
- claims production implementation is complete without runtime evidence

## Relationship to Benchmarks

Benchmarks are the validation layer for skill optimization.

A skill may be updated after:
- benchmark failure
- repeated review defect
- documented ambiguity
- source-of-truth drift risk
- missing trigger coverage
- false positive or false negative review behavior

A skill should not be updated merely because:
- a new article was read
- a model suggested a rewrite
- a prompt became longer
- a user requested stronger wording without evidence

## Relationship to Governed AI Decisioning

This standard supports Governed AI Decisioning by ensuring that skills do not allow AI outputs to bypass decision legitimacy.

Skill optimization must preserve:
- AI Output is not a Decision
- AI Recommendation is not Authority
- AI Automation is not Execution Permission
- No execution without decision
- No decision without evidence
- No governance without audit
- No AI action without boundaries

## Relationship to SDGM

This standard does not redefine SDGM.

Skill updates must not weaken:
- meaning governance
- signal-to-decision separation
- decision legitimacy
- evidence-to-decision chain
- decision object integrity

Any skill change touching SDGM language requires CRAG review.

## Relationship to KFSA

This standard does not redefine KFSA.

Skill updates must preserve:
- KILL / FIX / SCALE / ALERT
- ALERT
- decision/action treatment vocabulary
- governance-review vocabulary boundaries
- audit expectations

Any skill change that drops ALERT or collapses KFSA must be rejected.

## Relationship to NCGR / ESTARED

For NCGR / ESTARED skills:

Skill updates must preserve:
- Payment Promised is not Recovered
- PROMISED_TO_PAY is not RECOVERED
- PARTIAL_EVIDENCE is not RECOVERED
- recovered_cash_total only includes RECOVERED with Evidence + Authority + Audit
- recovery outcomes are not guaranteed
- customer-facing action requires approved workflow
- legal collection claims require authority and legal/compliance review

## Negative Feedback Memory

Rejected skill edits must be recorded as negative feedback when they fail because of:
- regression
- ambiguity
- unsupported claim
- source-of-truth drift
- missing authority
- missing evidence
- missing audit
- KFSA collapse
- ALERT removal
- unsafe automation permission

Negative feedback should inform future updates but must not become automatic rule expansion without validation.

## Minimum Skill Change Record

Every material skill update must include:

- skill file path
- change type: ADD / DELETE / REPLACE
- reason
- evidence source
- benchmark or validation reference
- expected improvement
- regression risk
- reviewer
- decision: ACCEPT / REJECT / ESCALATE
- audit note

## Forbidden Practices

- Do not rewrite skills casually.
- Do not grow skills without evidence.
- Do not accept edits without validation.
- Do not optimize only for one happy path.
- Do not remove safety constraints to improve speed.
- Do not use unverified third-party statistics as operational rules.
- Do not claim benchmark improvement without benchmark evidence.
- Do not use rejected edits as accepted rules.
- Do not bypass CRAG for source-of-truth changes.
- Do not treat MERGE READY as automatic merge authorization.
- Do not claim SkillOpt is implemented unless runtime implementation exists.

## Implementation Boundary

This standard defines governance for skill optimization.

It does not implement SkillOpt.

It does not create optimizer code.

It does not create CI checks.

It does not change existing skills by itself.

Runtime implementation requires:
- owner approval
- CRAG review
- benchmark plan
- implementation PR
- audit note

## Non-Negotiable Rules

- Skills are not edited casually.
- Skills are improved through evidence-backed, bounded, validated changes.
- No skill change without baseline.
- No material skill change without validation.
- No accepted edit without audit.
- Rejected edits become negative feedback, not accepted rules.
- Skill optimization must preserve SDGM and KFSA boundaries.
- KFSA is not collapsed.
- ALERT is preserved.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- Payment Promised is not Recovered.
- recovered_cash_total requires RECOVERED status supported by Evidence + Authority + Audit.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- Claude Code / CLAUDE.md is the current execution adapter, not the source of truth.
- NEXGEGL Governance Runtime remains the source of truth.

## Recommended Next Step

After this standard is merged:
- update the relevant standards index or README if one exists
- later create a benchmark to test skill optimization governance behavior
- later evaluate whether `04-skills/` files need optimization review records
- do not start runtime implementation until owner approval and CRAG review
