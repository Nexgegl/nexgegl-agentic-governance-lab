# NCGR Status Terminology Map v1.1

## Document Type

Terminology Map / Alignment Standard

## Executive Verdict

PASS WITH FOLLOW-UP

## Purpose

This document defines NCGR recovery-status terminology so payment verification status, recovery approval status, and final recovered status are not mixed.

It exists to prevent:
- promised payments being treated as recovered cash
- unverified payment signals being treated as recovered cash
- approval-pending recoveries being treated as final recovered cash
- partial evidence being counted in recovered_cash_total
- executive dashboards overstating recovered amounts

This document does not modify runtime files.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Non-Negotiable Rules

- PROMISED_TO_PAY is not RECOVERED.
- PENDING_VERIFIED_PAYMENT is not RECOVERED.
- PENDING_RECOVERY_APPROVAL is not RECOVERED.
- PARTIAL_EVIDENCE is not RECOVERED.
- RECOVERED requires Evidence + Authority + Audit.
- recovered_cash_total must only include finalized recovered amounts supported by settlement evidence, human approval, and audit trail.
- No pending, promised, or approval-pending status may enter recovered_cash_total.
- Executive wording must not present pending statuses as recovered.
- Any runtime implementation requires CFO review, CRAG review, owner approval, and audit note.

## Status Map

| Status | Meaning | Dashboard Wording | Executive Wording | Can enter recovered_cash_total? | Required Evidence | Authority Required? | Audit Required? |
|---|---|---|---|---:|---|---|---|
| PROMISED_TO_PAY | Customer promised to pay but no settlement evidence exists | Promised payment | Payment promised, not yet recovered | No | Promise note only; insufficient for recovery | No for promise logging; Yes before recovery | Yes for status history |
| PENDING_VERIFIED_PAYMENT | Payment signal exists but payment evidence is not fully verified | Pending payment verification | Payment signal under verification | No | Bank/accounting/payment reference incomplete or unverified | Yes before recovery | Yes |
| PENDING_RECOVERY_APPROVAL | Payment verification may be present but final recovery classification needs approval | Pending recovery approval | Verified payment pending recovery approval | No | Payment verification evidence may exist, but approval incomplete | Yes | Yes |
| PARTIAL_EVIDENCE | Some evidence exists but settlement/approval/audit chain is incomplete | Partial evidence | Recovery evidence incomplete | No | One or more required evidence items missing | Yes before recovery | Yes |
| SETTLED | Settlement evidence exists but final recovery classification may still require approval/audit depending on workflow | Settled pending classification | Settlement evidenced; recovery classification pending approval if required | Conditional only after approval/audit | Bank match + transaction reference + accounting entry + settlement confirmation | Yes before RECOVERED | Yes |
| RECOVERED | Finalized recovered status | Recovered | Recovered amount supported by evidence, approval, and audit | Yes | Settlement evidence + human approval + audit log | Yes | Yes |

## recovered_cash_total Inclusion Rule

Only `RECOVERED` may enter `recovered_cash_total`.

A status may enter `RECOVERED` only when all are present:

1. Settlement evidence
   - bank match
   - transaction reference
   - accounting entry
   - settlement confirmation

2. Authority
   - named human approver
   - approval date
   - approved scope
   - approval note

3. Audit
   - status transition log
   - actor/user id
   - timestamp
   - evidence references
   - approval reference

If any of these are missing, the amount must not enter `recovered_cash_total`.

## Status Transition Guidance

| From | To | Allowed? | Required Condition |
|---|---|---:|---|
| PROMISED_TO_PAY | RECOVERED | No direct transition | Must first obtain settlement evidence, approval, and audit |
| PROMISED_TO_PAY | PENDING_VERIFIED_PAYMENT | Yes | Payment signal or reference appears |
| PENDING_VERIFIED_PAYMENT | PENDING_RECOVERY_APPROVAL | Yes | Payment verification evidence is complete but approval remains pending |
| PENDING_VERIFIED_PAYMENT | RECOVERED | No direct transition | Approval and audit are still required |
| PENDING_RECOVERY_APPROVAL | RECOVERED | Yes | Human approval and audit log completed |
| PARTIAL_EVIDENCE | RECOVERED | No direct transition | Missing evidence/authority/audit must be completed first |
| SETTLED | RECOVERED | Conditional | Authority and audit completed |
| RECOVERED | Any pending status | Only by correction/supersession | Requires audit note and owner approval |

## Misclassification Controls

| Misclassification | Required Verdict |
|---|---|
| PROMISED_TO_PAY counted as recovered | BLOCK MERGE |
| PENDING_VERIFIED_PAYMENT counted in recovered_cash_total | FIX BEFORE MERGE |
| PENDING_RECOVERY_APPROVAL counted in recovered_cash_total | FIX BEFORE MERGE |
| PARTIAL_EVIDENCE counted in recovered_cash_total | FIX BEFORE MERGE |
| SETTLED counted without approval/audit | FIX BEFORE MERGE |
| RECOVERED counted with Evidence + Authority + Audit | MERGE READY recommendation only |

## Required Runtime Review Before Implementation

Any runtime PR implementing or changing NCGR recovery statuses must include:

- changed files list
- before/after status definitions
- status transition map
- recovered_cash_total inclusion rule
- evidence requirement per status
- authority requirement per status
- audit requirement per status
- dashboard wording per status
- executive wording per status
- downgrade/escalation rule
- CFO review
- CRAG review
- product-governor review
- owner approval
- audit note

## Required Agent Activation

When a PR changes NCGR recovery statuses:

- `cfo-logic-reviewer` must activate.
- `crag` must activate.
- `product-governor` must activate.
- `evidence-pack-builder-skill` must activate.
- `cash-recovery-decision-skill` must activate.
- `executive-brief-skill` activates if executive dashboard or executive wording is changed.
- `board-response-skill` activates if board-facing wording is changed.
- `legal-compliance-reviewer` activates if wording is customer-facing, investor-facing, regulatory, or public.
- `security-rls-auditor` activates only if RLS, tenant isolation, security, or data access is touched.

## Forbidden Changes

- Do not count PROMISED_TO_PAY as RECOVERED.
- Do not count PENDING_VERIFIED_PAYMENT in recovered_cash_total.
- Do not count PENDING_RECOVERY_APPROVAL in recovered_cash_total.
- Do not count PARTIAL_EVIDENCE in recovered_cash_total.
- Do not count SETTLED in recovered_cash_total without approval and audit.
- Do not display PENDING_VERIFIED_PAYMENT as RECOVERED.
- Do not display PENDING_RECOVERY_APPROVAL as RECOVERED.
- Do not display promised cash as recovered cash.
- Do not mark ambiguous status terminology as MERGE READY.
- Do not alter runtime recovery classification without CFO review, CRAG review, evidence rules, and audit note.

## Benchmark Links

Primary benchmark:
`claude-operating-system/06-benchmarks/ncgr-status-terminology-standardization-v1-1.md`

Supporting benchmarks:
- `claude-operating-system/06-benchmarks/ncgr-payment-promised-vs-recovered-v1.md`
- `claude-operating-system/06-benchmarks/ncgr-partial-evidence-case-v1.md`
- `claude-operating-system/06-benchmarks/ncgr-recovered-evidence-positive-v1.md`

Expected benchmark verdict:
PASS WITH FOLLOW-UP

## Current Status

This map resolves the v1.1 NCGR terminology-alignment step by defining safe scope and inclusion rules for recovery statuses.

Remaining follow-up:
- Update README after this file is merged.
- Later evaluate whether NCGR product profile or runtime implementation files need a small cross-reference to this map.
- Do not modify runtime files until CFO review, CRAG review, and owner approval are completed.

## Final Recommendation

- Merge this terminology map as a v1.1 NCGR alignment standard.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Use this map as the reference for future NCGR recovery-status changes.
- No automatic merge authorization is granted.
