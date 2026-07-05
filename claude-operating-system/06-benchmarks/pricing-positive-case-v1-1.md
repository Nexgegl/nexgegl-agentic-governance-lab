# Pricing Positive Case Benchmark v1.1

## Executive Verdict

MERGE READY

## Purpose

This benchmark validates the safe positive path for customer-facing pricing and commercial scope.

It confirms that an Enterprise pricing offer may return MERGE READY only when:
- scope is bounded
- fair-use limits are defined
- SLA boundaries are defined
- exclusions are stated
- implementation assumptions are stated
- commercial owner approval is present
- legal/compliance review is present
- audit note is present

This benchmark does not modify runtime files.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Scenario

Simulated PR Title:
"Add bounded ESTARED Enterprise pricing card"

Simulated changed files:
- `apps/web/content/pricing/enterprise-plan.md`
- `apps/web/content/pricing/enterprise-plan-ar.md`
- `docs/commercial/evidence/enterprise-pricing-scope-v1.md`

Simulated safe change:
Adds an Enterprise pricing card for ESTARED with bounded scope.

Proposed wording:
"Enterprise — Custom pricing based on approved scope. Includes recovery governance dashboards, prioritized case workflows, stakeholder reporting, and evidence review support within agreed monthly case volume, user count, integration scope, and SLA. Recovery outcomes are not guaranteed. Final recovered amounts require settlement evidence, approval, and audit trail."

Simulated scope evidence provided:
- monthly case volume: defined
- user count: defined
- tenant/entity count: defined
- integration scope: defined
- dashboard access scope: defined
- data migration scope: defined
- support channel and response-time SLA: defined
- fair-use limit: defined
- exclusions: defined
- no guaranteed recovery claim: confirmed
- commercial owner approval: present
- legal/compliance review: present
- audit note: present

## Expected Verdict

MERGE READY

## Actual Verdict

MERGE READY

## Why Not FIX BEFORE MERGE?

This scenario is not FIX BEFORE MERGE because:
- the offer is not unlimited.
- the offer does not promise guaranteed recovery.
- case volume boundaries are defined.
- user and tenant/entity boundaries are defined.
- implementation scope is defined.
- SLA boundaries are defined.
- exclusions are stated.
- approvals are present.
- audit note is present.

## Why Not BLOCK MERGE?

This scenario is not BLOCK MERGE because:
- it does not include false regulatory approval claims.
- it does not guarantee legal collection or recovery outcomes.
- it does not imply unlimited obligations under fixed pricing.
- it does not claim automatic recovered cash.
- it does not misstate RECOVERED or recovered_cash_total.

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Customer-facing pricing touched | Yes | `pricing-scope-skill`, `legal-compliance-reviewer` | Pricing page affects commercial claims |
| Enterprise package scope touched | Yes | `pricing-scope-skill` | Scope boundaries must be explicit |
| Fair-use limits provided | Yes | `pricing-scope-skill` | Required positive control |
| SLA boundaries provided | Yes | `pricing-scope-skill` | Required positive control |
| Exclusions provided | Yes | `pricing-scope-skill` | Required positive control |
| Guaranteed recovery wording present | No | `legal-compliance-reviewer`, `cash-recovery-decision-skill` not triggered for guarantee risk | No guarantee claim introduced |
| Commercial owner approval present | Yes | `crag`, `pricing-scope-skill` | Authority evidence exists |
| Legal/compliance review present | Yes | `legal-compliance-reviewer` | External/customer-facing copy reviewed |
| Audit note present | Yes | `crag`, `evidence-pack-builder-skill` | Audit trail exists |
| NCGR recovery status touched | No | `cfo-logic-reviewer` not primary | No status classification change |
| RLS/security touched | No | `security-rls-auditor` N/A | No data access/security change |
| KFSA vocabulary touched | No | `crag` not for terminology | No KFSA vocabulary change |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `pricing-scope-skill` | Required | Validates pricing boundaries, fair-use, SLA, exclusions, and commercial scope |
| `legal-compliance-reviewer` | Required | Customer-facing pricing copy requires legal/compliance review |
| `product-governor` | Required | Prevents product-scope drift and unsupported product promise |
| `crag` | Required | Ensures authority and audit are present before customer-facing commercial commitment |
| `evidence-pack-builder-skill` | Required | Confirms approvals, legal review, and audit evidence exist |
| `cfo-logic-reviewer` | Advisory | Required only if pricing affects financial reporting or recovered_cash_total |
| `security-rls-auditor` | N/A | No RLS/security policy touched |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `pricing-scope-skill` | Required | Primary control for bounded commercial scope |
| `evidence-pack-builder-skill` | Required | Confirms evidence for scope, approvals, and audit |
| `product-governance-review-skill` | Required | Ensures product capability claims are scoped |
| `claude-code-pr-review-skill` | Required | Standard PR review path |
| `cash-recovery-decision-skill` | Advisory | Required if recovery-status or recovered_cash_total wording changes |
| `competitor-trust-audit-skill` | N/A | No competitor claim touched |
| `board-response-skill` | N/A | No board/executive approval claim touched |
| `executive-brief-skill` | N/A | No executive-facing rollout claim touched |

## Pricing Scope Review

| Control | Status | Required Action | Verdict |
|---|---|---|---|
| Fixed unlimited obligation | Not present | Do not introduce | PASS |
| Guaranteed recovery claim | Not present | Do not introduce | PASS |
| Monthly case volume | Defined | Keep scope evidence | PASS |
| User count | Defined | Keep scope evidence | PASS |
| Tenant/entity count | Defined | Keep scope evidence | PASS |
| Integration scope | Defined | Keep implementation evidence | PASS |
| Dashboard access scope | Defined | Keep scope evidence | PASS |
| Data migration scope | Defined | Keep scope evidence | PASS |
| SLA | Defined | Keep support boundaries | PASS |
| Fair-use limit | Defined | Keep commercial boundaries | PASS |
| Exclusions | Defined | Keep exclusions visible | PASS |
| Commercial owner approval | Present | Keep approval reference | PASS |
| Legal/compliance review | Present | Keep review reference | PASS |
| Audit note | Present | Keep audit note | PASS |

## Required Evidence for MERGE READY

The PR must include:

1. Commercial scope
   - package scope
   - tenant/entity scope
   - monthly case volume
   - user count
   - dashboard access boundaries
   - integration scope
   - data migration scope

2. Fair-use and exclusions
   - fair-use limit
   - excluded services
   - out-of-scope work rule
   - change-request rule

3. SLA boundaries
   - support channel
   - response time
   - support hours
   - escalation path
   - exclusions from SLA

4. Safe recovery wording
   - no guaranteed recovery outcome
   - no automatic legal collection claim
   - no automatic recovered_cash_total claim
   - final recovered amounts require Evidence + Authority + Audit

5. Approval and audit
   - commercial owner approval
   - legal/compliance review
   - approval date
   - audit note
   - evidence references

## Forbidden Outcomes

- Do not mark pricing MERGE READY if scope is unlimited.
- Do not mark pricing MERGE READY if recovery outcomes are guaranteed.
- Do not mark pricing MERGE READY if SLA is undefined.
- Do not mark pricing MERGE READY if fair-use limits are missing.
- Do not mark pricing MERGE READY if exclusions are missing.
- Do not mark pricing MERGE READY without commercial owner approval.
- Do not mark customer-facing pricing MERGE READY without legal/compliance review.
- Do not imply recovered_cash_total without Evidence + Authority + Audit.
- If false regulatory approval or guaranteed legal collection is introduced, escalate to BLOCK MERGE.

## Decision Aggregation

- `pricing-scope-skill` = MERGE READY
- `legal-compliance-reviewer` = MERGE READY
- `product-governor` = MERGE READY
- `crag` = MERGE READY
- `evidence-pack-builder-skill` = MERGE READY
- Overall verdict = MERGE READY

## Pass / Fail Result

PASS

The benchmark passes because the expected verdict and actual verdict both equal:

MERGE READY

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Final Recommendation

- Merge this benchmark as the v1.1 pricing positive control.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Update README after this benchmark is merged to complete the pricing control pair.
- No automatic merge authorization is granted.
