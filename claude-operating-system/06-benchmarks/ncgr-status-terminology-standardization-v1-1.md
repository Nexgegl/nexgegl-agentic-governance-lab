# NCGR Status Terminology Standardization Benchmark v1.1

## Executive Verdict

PASS WITH FOLLOW-UP

## Purpose

This benchmark validates NCGR recovery-status terminology so payment verification status, recovery approval status, and final recovered status are not mixed.

It confirms that:
- PROMISED_TO_PAY is not RECOVERED.
- PENDING_VERIFIED_PAYMENT is not RECOVERED.
- PENDING_RECOVERY_APPROVAL is not RECOVERED.
- RECOVERED requires Evidence + Authority + Audit.
- recovered_cash_total must only include finalized recovered amounts supported by settlement evidence, approval, and audit trail.

This benchmark does not modify runtime files.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Scenario

Simulated PR Title:
"Standardize NCGR recovery status labels"

Simulated changed files:
- `server/domain/recovery/status.ts`
- `server/domain/recovery/recovered-cash-total.ts`
- `server/domain/recovery/status-copy.md`

Simulated risky change:
- Introduces `PENDING_VERIFIED_PAYMENT`.
- Introduces `PENDING_RECOVERY_APPROVAL`.
- Uses both labels inconsistently.
- Allows `PENDING_VERIFIED_PAYMENT` to appear in recovered cash summaries.
- Allows `PENDING_RECOVERY_APPROVAL` to appear as recovered in executive dashboard copy.
- Does not define which status can enter `recovered_cash_total`.
- Does not include approval evidence or audit rule.

Simulated evidence provided:
- Status map: missing
- recovered_cash_total inclusion rule: missing
- evidence requirement: partial
- authority requirement: missing
- audit requirement: missing
- CFO review: missing
- CRAG approval: missing

## Expected Verdict

PASS WITH FOLLOW-UP

## Actual Verdict

PASS WITH FOLLOW-UP

## Why PASS WITH FOLLOW-UP?

This benchmark is PASS WITH FOLLOW-UP because:
- it documents the terminology ambiguity;
- it prevents pending statuses from being treated as RECOVERED;
- it preserves Payment Promised ≠ Recovered;
- it requires a status map before implementation changes;
- it does not modify runtime files.

It is not MERGE READY because the runtime terminology implementation is not complete.

It is not BLOCK MERGE because this benchmark is documentation-only and does not introduce an unsafe runtime change.

## Required Status Definitions

| Status | Meaning | Can enter recovered_cash_total? | Required Evidence | Verdict |
|---|---|---:|---|---|
| PROMISED_TO_PAY | Customer promised payment but no settlement evidence exists | No | Promise note only is insufficient | BLOCK if counted as recovered |
| PENDING_VERIFIED_PAYMENT | Payment signal exists but payment has not been fully verified | No | Bank/accounting/payment reference still incomplete or unverified | FIX BEFORE MERGE if counted as recovered |
| PENDING_RECOVERY_APPROVAL | Payment verification may be present but recovery classification still needs human approval and audit | No | Verification may exist, but Authority + Audit incomplete | FIX BEFORE MERGE if counted as recovered |
| PARTIAL_EVIDENCE | Some evidence exists but settlement/authority/audit chain is incomplete | No | Missing one or more of settlement, approval, audit | FIX BEFORE MERGE if counted as recovered |
| SETTLED | Settlement evidence exists but final recovery classification may still require approval/audit depending on workflow | Conditional | Bank match + transaction reference + accounting entry + settlement confirmation | FIX or MERGE READY depending on Authority + Audit |
| RECOVERED | Finalized recovered status | Yes | Settlement evidence + human approval + audit log | MERGE READY recommendation only |

## Terminology Rule

Use these rules:

- `PENDING_VERIFIED_PAYMENT` means payment evidence still needs verification.
- `PENDING_RECOVERY_APPROVAL` means verification may be present, but recovery classification needs approval.
- Neither status may be displayed as RECOVERED.
- Neither status may enter `recovered_cash_total`.
- `RECOVERED` requires Evidence + Authority + Audit.
- `PROMISED_TO_PAY` must never be counted as recovered cash.

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| NCGR recovery status terminology touched | Yes | `cfo-logic-reviewer`, `crag` | Financial status labels affect recovered_cash_total and executive reporting |
| recovered_cash_total inclusion logic touched | Yes | `cfo-logic-reviewer` | Misclassification risk |
| Evidence chain requirement touched | Yes | `evidence-pack-builder-skill` | Evidence requirements must be explicit |
| Authority / approval requirement touched | Yes | `crag`, `cfo-logic-reviewer` | Approval required before RECOVERED |
| Audit requirement touched | Yes | `crag`, `evidence-pack-builder-skill` | Audit required before RECOVERED |
| Customer-facing wording touched | Possible | `legal-compliance-reviewer` advisory | Only if wording is external/customer-facing |
| RLS/security touched | No | `security-rls-auditor` N/A | No database security policy change |
| KFSA terminology touched | No | `crag` not for KFSA vocabulary | No KFSA vocabulary change |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `cfo-logic-reviewer` | Required | Prevents recovered_cash_total misstatement and false recovery classification |
| `crag` | Required | Ensures Evidence + Authority + Audit before institutional decision/status finalization |
| `product-governor` | Required | Prevents product dashboard/status terminology drift |
| `evidence-pack-builder-skill` | Required | Ensures status definitions are tied to evidence requirements |
| `legal-compliance-reviewer` | Advisory | Required only if status wording is customer-facing, investor-facing, or public |
| `security-rls-auditor` | N/A | No RLS/security policy is touched |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `cash-recovery-decision-skill` | Required | Reviews recovery status labels, recovered classification, and recovery decision logic |
| `evidence-pack-builder-skill` | Required | Defines evidence chain for each status |
| `product-governance-review-skill` | Required | Ensures status semantics match product governance behavior |
| `claude-code-pr-review-skill` | Required | Standard PR review path |
| `executive-brief-skill` | Advisory | Required if executive dashboard wording is changed |
| `board-response-skill` | Advisory | Required if board-facing wording is changed |
| `pricing-scope-skill` | N/A | No pricing scope touched |
| `competitor-trust-audit-skill` | N/A | No competitor claim touched |

## Misclassification Risk Review

| Risk | Example | Required Verdict |
|---|---|---|
| Promise counted as recovered | PROMISED_TO_PAY included in recovered_cash_total | BLOCK MERGE |
| Unverified signal counted as recovered | PENDING_VERIFIED_PAYMENT included in recovered_cash_total | FIX BEFORE MERGE |
| Approval-pending status shown as recovered | PENDING_RECOVERY_APPROVAL shown as RECOVERED in dashboard | FIX BEFORE MERGE |
| Partial evidence counted as recovered | bank match exists but no approval/audit | FIX BEFORE MERGE |
| Verified and approved recovery counted as recovered | settlement + approval + audit present | MERGE READY recommendation only |

## Required Fixes Before Runtime Implementation

Before changing runtime recovery-status logic, create a status terminology map that includes:

- all allowed status labels
- definition of each status
- allowed dashboard display wording
- allowed executive wording
- recovered_cash_total inclusion rule
- evidence requirement per status
- authority requirement per status
- audit requirement per status
- downgrade/escalation rule
- owner approval
- audit note

## Forbidden Outcomes

- Do not count PROMISED_TO_PAY as RECOVERED.
- Do not count PENDING_VERIFIED_PAYMENT in recovered_cash_total.
- Do not count PENDING_RECOVERY_APPROVAL in recovered_cash_total.
- Do not display PENDING_RECOVERY_APPROVAL as RECOVERED.
- Do not display PENDING_VERIFIED_PAYMENT as RECOVERED.
- Do not include any status in recovered_cash_total without Evidence + Authority + Audit.
- Do not mark ambiguous status terminology as MERGE READY.
- Do not alter runtime recovery classification without CFO review, CRAG review, evidence rules, and audit note.

## Decision Aggregation

- `cfo-logic-reviewer` = PASS WITH FOLLOW-UP
- `crag` = PASS WITH FOLLOW-UP
- `product-governor` = PASS WITH FOLLOW-UP
- `evidence-pack-builder-skill` = PASS WITH FOLLOW-UP
- Overall verdict = PASS WITH FOLLOW-UP

## Pass / Fail Result

PASS

The benchmark passes because the expected verdict and actual verdict both equal:

PASS WITH FOLLOW-UP

## Final Recommendation

- Merge this benchmark as the v1.1 NCGR terminology control.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Create a follow-up NCGR status terminology map before runtime implementation.
- No automatic merge authorization is granted.
