# KFSA Vocabulary Map v1.1

## Document Type

Terminology Map / Alignment Standard

## Executive Verdict

PASS WITH FOLLOW-UP

## Purpose

This document maps KFSA-related vocabulary usage across the NEXGEGL Claude Operating System.

It exists to prevent silent terminology drift, silent collapse of KFSA vocabulary, and accidental removal of ALERT.

This document does not redefine KFSA.

## Non-Negotiable Rules

- KFSA must not be reduced or collapsed.
- ALERT must not be dropped.
- Accept / Reject / Escalation must not be declared the only KFSA vocabulary without scope.
- KILL / FIX / SCALE / ALERT must not be declared the universal definition of KFSA without scope.
- Benchmarks, agents, skills, and product profiles must not silently redefine governance-core terms.
- Any future master-standard terminology change requires CRAG review.

## Current Terminology Families

### 1. Governance Review Verdict Vocabulary

Vocabulary:
- Accept
- Reject
- Escalation

Safe scope:
Used for governance-review outcomes, compliance disposition, and review routing.

Meaning:
- Accept = review outcome can proceed under stated constraints.
- Reject = review outcome cannot proceed.
- Escalation = review outcome requires higher authority, additional evidence, or formal review.

Not allowed:
- Must not be used to remove or replace KILL / FIX / SCALE / ALERT where decision/action vocabulary is required.
- Must not be declared as the only KFSA vocabulary.

### 2. Decision / Action Vocabulary

Vocabulary:
- KILL
- FIX
- SCALE
- ALERT

Safe scope:
Used for decision/action recommendations, product decision cards, operational treatment options, and NEXGEGL governance usage where action routing is required.

Meaning:
- KILL = stop, reject, or retire the unsafe/inefficient/invalid option.
- FIX = correct, repair, constrain, or remediate before proceeding.
- SCALE = expand, approve for growth, or proceed under validated conditions.
- ALERT = flag, warn, escalate attention, or hold for risk visibility without forcing immediate kill/fix/scale.

Not allowed:
- Must not drop ALERT.
- Must not reduce this vocabulary to KILL / FIX / SCALE only.
- Must not be used to redefine KFSA universally unless scoped to decision/action vocabulary.

## Vocabulary Relationship

Accept / Reject / Escalation and KILL / FIX / SCALE / ALERT are related but not identical.

Accept / Reject / Escalation is a governance-review verdict family.

KILL / FIX / SCALE / ALERT is a decision/action treatment family.

KFSA may reference or interact with both families depending on context, but neither family may silently erase the other.

## Safe Mapping Guidance

| Governance Review Verdict | Possible Decision / Action Treatment | Notes |
|---|---|---|
| Accept | SCALE | Only when evidence, authority, and audit support proceeding |
| Accept with constraints | FIX or SCALE | Depends on whether constraints must be resolved before proceeding |
| Reject | KILL | When the item cannot proceed safely or validly |
| Escalation | ALERT | When risk visibility, higher authority, or additional evidence is required |
| Escalation with fixable gap | FIX + ALERT | When remediation is needed and risk visibility must remain |
| Escalation with severe risk | KILL + ALERT | When immediate stop plus alerting is required |

Important:
This table is guidance only. It does not create an automatic conversion rule.

## Required Evidence Before Terminology Changes

Any PR changing KFSA-related vocabulary must include:

- list of changed files
- before/after terminology diff
- affected vocabulary family
- reason for change
- scope of change
- ALERT preservation note
- CRAG approval
- product-governor review if product-facing terminology is affected
- audit note

## Forbidden Changes

- Replacing all KILL / FIX / SCALE / ALERT references with Accept / Reject / Escalation.
- Removing ALERT from any decision/action vocabulary set.
- Reducing KILL / FIX / SCALE / ALERT to three outcomes.
- Declaring Accept / Reject / Escalation as the only KFSA vocabulary.
- Declaring KILL / FIX / SCALE / ALERT as the universal definition of KFSA without context.
- Editing master standards to change KFSA vocabulary without CRAG approval.
- Introducing hidden automatic mapping from one vocabulary family to the other.

## Required Runtime Behavior

When a PR touches KFSA vocabulary:

- `crag` must activate.
- `product-governor` must activate if product/profile/user-facing language is touched.
- `evidence-pack-builder-skill` should activate if terminology evidence is incomplete.
- `legal-compliance-reviewer` activates only if legal, public, regulatory, competitor, or external claims are introduced.
- `security-rls-auditor` activates only if RLS, tenant isolation, security, or data access is touched.
- `cfo-logic-reviewer` activates only if financial, recovery, or cash classification logic is touched.

## Benchmark Link

Primary benchmark:
`claude-operating-system/06-benchmarks/kfsa-verdict-vocabulary-alignment-v1-1.md`

Expected benchmark verdict:
PASS WITH FOLLOW-UP

## Current Status

This map resolves the first v1.1 terminology-alignment step by defining safe scope for both vocabulary families.

Remaining follow-up:
- Update README after this file is merged.
- Add a benchmark/index entry for this vocabulary map.
- Later, evaluate whether master standards need a small cross-reference to this map.
- Do not modify master standards until CRAG approves a specific change.

## Final Recommendation

- Merge this terminology map as a v1.1 alignment standard.
- Do not modify existing master standards in this PR.
- Do not update README in this PR.
- Use this map as the reference for future KFSA vocabulary changes.
- No automatic merge authorization is granted.
