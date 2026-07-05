# Competitor Positive Case Benchmark v1.1

## Executive Verdict

MERGE READY

## Purpose

This benchmark validates the safe positive path for public competitor and trust comparison claims.

It confirms that a competitor comparison may return MERGE READY only when:
- competitor references are factual and source-backed
- sources are dated
- methodology is defined
- inclusion and exclusion criteria are stated
- claims are neutral and non-misleading
- no unsupported exclusivity claim is made
- no unsupported trust/security superiority claim is made
- no guaranteed or universal safer-outcome claim is made
- legal/compliance review is present
- audit note is present

This benchmark does not modify runtime files.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Scenario

Simulated PR Title:
"Add evidence-backed competitor comparison note to ESTARED positioning page"

Simulated changed files:
- `apps/web/content/estared/positioning.md`
- `apps/web/content/estared/positioning-ar.md`
- `docs/market/evidence/competitor-comparison-methodology-v1.md`
- `docs/legal/reviews/competitor-comparison-review-v1.md`

Simulated safe change:
Adds a neutral competitor comparison note for ESTARED.

Proposed wording:
"ESTARED focuses on recovery governance before collection execution. Based on our documented market scan dated 2026-07-05, some Saudi recovery and collection tools emphasize payment follow-up and customer communication workflows. ESTARED is positioned as a governance layer that verifies evidence, authority, audit readiness, and recovery-status classification before an amount is treated as recovered. This comparison is based only on publicly available product claims reviewed in the cited methodology and does not claim superiority, exclusivity, or guaranteed recovery outcomes."

Simulated evidence provided:
- market scan date: present
- source list: present
- methodology: present
- inclusion criteria: present
- exclusion criteria: present
- comparison dimensions: present
- claim boundaries: present
- no "only" claim: confirmed
- no "best/safest/superior" claim: confirmed
- no guaranteed outcome claim: confirmed
- legal/compliance review: present
- audit note: present

## Expected Verdict

MERGE READY

## Actual Verdict

MERGE READY

## Why Not FIX BEFORE MERGE?

This scenario is not FIX BEFORE MERGE because:
- named competitor references are factual and source-backed.
- comparison methodology is documented.
- source date is present.
- inclusion and exclusion criteria are stated.
- comparison scope is limited.
- no unsupported exclusivity claim is introduced.
- no unsupported superiority claim is introduced.
- no guaranteed or universal safer-outcome claim is introduced.
- legal/compliance review is present.
- audit note is present.

## Why Not BLOCK MERGE?

This scenario is not BLOCK MERGE because:
- it does not make false regulatory claims.
- it does not claim ESTARED is the only platform in Saudi Arabia.
- it does not claim competitors are unsafe, non-compliant, or inferior.
- it does not claim guaranteed recovery outcomes.
- it does not make defamatory or misleading competitor statements.
- it does not imply automatic legal collection or automatic recovered cash.

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Named competitor / market comparison touched | Yes | `competitor-trust-audit-skill`, `legal-compliance-reviewer` | Public comparison requires evidence and legal review |
| Trust/security positioning touched | Yes | `competitor-trust-audit-skill`, `product-governor` | Trust wording must be scoped and evidence-backed |
| Methodology provided | Yes | `competitor-trust-audit-skill`, `evidence-pack-builder-skill` | Required positive control |
| Dated sources provided | Yes | `evidence-pack-builder-skill` | Required positive control |
| Inclusion/exclusion criteria provided | Yes | `competitor-trust-audit-skill` | Required positive control |
| Unsupported exclusivity claim present | No | `competitor-trust-audit-skill` | No "only" claim introduced |
| Unsupported superiority claim present | No | `competitor-trust-audit-skill`, `legal-compliance-reviewer` | No best/safest/superior claim introduced |
| Guaranteed recovery outcome present | No | `legal-compliance-reviewer`, `cash-recovery-decision-skill` not triggered for guarantee risk | No guarantee claim introduced |
| Legal/compliance review present | Yes | `legal-compliance-reviewer` | Public competitor-facing copy reviewed |
| Audit note present | Yes | `crag`, `evidence-pack-builder-skill` | Audit trail exists |
| Pricing touched | No | `pricing-scope-skill` N/A | No pricing scope touched |
| RLS/security touched | No | `security-rls-auditor` N/A | No data access/security policy change |
| KFSA vocabulary touched | No | `crag` not for terminology | No KFSA vocabulary change |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `competitor-trust-audit-skill` | Required | Validates competitor references, comparison methodology, trust claims, and source boundaries |
| `legal-compliance-reviewer` | Required | Public competitor-facing claims require legal/compliance review |
| `product-governor` | Required | Prevents product positioning drift and unsupported superiority claims |
| `crag` | Required | Ensures evidence, authority, and audit are present for public institutional claims |
| `evidence-pack-builder-skill` | Required | Confirms dated sources, methodology, approvals, and audit evidence exist |
| `pricing-scope-skill` | N/A | No pricing/commercial scope touched |
| `security-rls-auditor` | N/A | No RLS/security policy touched |
| `cfo-logic-reviewer` | Advisory | Required only if comparison touches recovery metrics or recovered_cash_total |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `competitor-trust-audit-skill` | Required | Primary control for competitor/trust comparison |
| `evidence-pack-builder-skill` | Required | Confirms sources, dates, methodology, review, and audit note |
| `product-governance-review-skill` | Required | Ensures product positioning remains scoped |
| `claude-code-pr-review-skill` | Required | Standard PR review path |
| `cash-recovery-decision-skill` | Advisory | Required only if recovery outcomes or recovered_cash_total claims are introduced |
| `pricing-scope-skill` | N/A | No pricing scope touched |
| `board-response-skill` | N/A | No board/executive approval claim touched |
| `executive-brief-skill` | N/A | No executive-facing rollout claim touched |

## Competitor Claim Review

| Control | Status | Required Action | Verdict |
|---|---|---|---|
| Named competitor reference | Present | Keep factual and source-backed | PASS |
| Market scan date | Present | Keep date visible | PASS |
| Source list | Present | Keep source references | PASS |
| Methodology | Present | Keep methodology reference | PASS |
| Inclusion criteria | Present | Keep criteria visible | PASS |
| Exclusion criteria | Present | Keep criteria visible | PASS |
| Comparison dimensions | Defined | Keep scoped to documented dimensions | PASS |
| Exclusivity claim | Not present | Do not introduce "only" claim | PASS |
| Superiority claim | Not present | Do not introduce best/safest/superior claim | PASS |
| Guaranteed recovery claim | Not present | Do not introduce guarantee | PASS |
| Legal/compliance review | Present | Keep review reference | PASS |
| Audit note | Present | Keep audit note | PASS |

## Required Evidence for MERGE READY

The PR must include:

1. Comparison evidence
   - market scan date
   - source list
   - captured public claims
   - comparison dimensions
   - methodology reference

2. Methodology boundaries
   - inclusion criteria
   - exclusion criteria
   - date range
   - what was compared
   - what was not compared

3. Safe claim boundaries
   - no unsupported "only" claim
   - no unsupported superiority claim
   - no competitor disparagement
   - no guaranteed recovery outcome
   - no automatic legal collection claim
   - no automatic recovered_cash_total claim

4. Approval and audit
   - legal/compliance review
   - product owner approval
   - approval date
   - audit note
   - evidence references

## Forbidden Outcomes

- Do not mark competitor comparison MERGE READY if methodology is missing.
- Do not mark competitor comparison MERGE READY if dated sources are missing.
- Do not mark competitor comparison MERGE READY if inclusion/exclusion criteria are missing.
- Do not mark competitor comparison MERGE READY if legal/compliance review is missing.
- Do not claim ESTARED is the only platform unless independently verified and legally approved.
- Do not claim ESTARED is safer, superior, more trusted, or more compliant without approved evidence.
- Do not make defamatory or misleading claims about competitors.
- Do not claim guaranteed recovery outcomes.
- Do not imply recovered_cash_total without Evidence + Authority + Audit.
- If false regulatory approval or guaranteed legal collection is introduced, escalate to BLOCK MERGE.

## Decision Aggregation

- `competitor-trust-audit-skill` = MERGE READY
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

- Merge this benchmark as the v1.1 competitor positive control.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Update README after this benchmark is merged to complete the competitor/trust control pair.
- No automatic merge authorization is granted.
