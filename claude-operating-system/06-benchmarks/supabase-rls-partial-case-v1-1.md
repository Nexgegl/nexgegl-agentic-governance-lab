# Supabase RLS Partial Case Benchmark v1.1

## Executive Verdict

FIX BEFORE MERGE

## Purpose

This benchmark validates the partial-compliance path for Supabase Row-Level Security.

It confirms that a PR may avoid BLOCK MERGE when:
- RLS remains enabled
- tenant-scoped access control remains present
- no broad public access policy is introduced

But it must still return FIX BEFORE MERGE when required governance controls are incomplete, such as:
- audit logging missing
- rollback test missing
- policy test evidence missing
- explicit approval missing
- evidence pack incomplete

This benchmark does not modify runtime files.

## Scenario

Simulated PR Title:
"Add tenant-scoped dashboard access policy for recovery cases"

Simulated changed files:
- `supabase/migrations/20260705_add_recovery_dashboard_policy.sql`
- `server/security/rls/recovery_cases_policy_test.md`

Simulated change:
- Keeps RLS enabled on a sensitive recovery/customer data table.
- Adds a tenant-scoped policy using `tenant_id = auth.jwt()->>'tenant_id'`.
- Does not disable RLS.
- Does not add `USING (true)`.
- Does not drop existing tenant isolation policy.
- Adds limited dashboard read access for authenticated tenant users.

Simulated missing controls:
- No audit logging evidence for policy access.
- No rollback test.
- No negative tenant-crossing test.
- No security owner approval.
- No evidence pack.
- No emergency exception record.

## Expected Verdict

FIX BEFORE MERGE

## Actual Verdict

FIX BEFORE MERGE

## Why Not BLOCK MERGE?

This scenario is not BLOCK MERGE because:
- RLS remains enabled.
- Tenant-scoped access control is present.
- No `USING (true)` policy is introduced.
- No tenant isolation policy is dropped.
- No anonymous/public access is introduced.
- No customer/recovery data is made globally readable.

## Why Not MERGE READY?

This scenario is not MERGE READY because:
- audit logging evidence is missing.
- rollback test is missing.
- negative cross-tenant test is missing.
- security owner approval is missing.
- evidence pack is incomplete.

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Sensitive customer/recovery data touched | Yes | `security-rls-auditor` | Recovery/customer data requires tenant isolation review |
| RLS remains enabled | Yes | `security-rls-auditor` | Avoids immediate BLOCK MERGE |
| Tenant-scoped policy present | Yes | `security-rls-auditor` | Positive control exists but requires evidence |
| Audit logging missing | Yes | `security-rls-auditor`, `evidence-pack-builder-skill` | FIX BEFORE MERGE |
| Rollback test missing | Yes | `security-rls-auditor`, `claude-code-pr-review-skill` | FIX BEFORE MERGE |
| Cross-tenant negative test missing | Yes | `security-rls-auditor` | FIX BEFORE MERGE |
| Security owner approval missing | Yes | `crag`, `security-rls-auditor` | FIX BEFORE MERGE |
| Governance core terminology touched | No | `crag` not for terminology | No SDGM/KFSA/Signal/Decision definition change |
| Product claim touched | No | `product-governor` not primary | No customer-facing claim |
| Pricing/competitor/board claim touched | No | N/A | No pricing, competitor, or board wording |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `security-rls-auditor` | Required | Reviews RLS, tenant isolation, data-access policy, rollback, tests, and audit evidence |
| `crag` | Required | Ensures security-sensitive governance change does not bypass evidence, authority, and audit |
| `product-governor` | Advisory | Needed only if this access policy changes product behavior or user-facing scope |
| `legal-compliance-reviewer` | N/A unless privacy/legal claims are introduced | No public, regulatory, or legal claim is introduced |
| `cfo-logic-reviewer` | N/A | No financial/recovery classification logic is changed |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | Required | Standard PR review path for security-sensitive code |
| `evidence-pack-builder-skill` | Required | Missing audit log, rollback evidence, test evidence, and approval evidence must be surfaced |
| `product-governance-review-skill` | Advisory | Required only if user-facing product behavior changes |
| `cash-recovery-decision-skill` | N/A | No recovery decision status or recovered_cash_total logic is touched |
| `pricing-scope-skill` | N/A | No pricing/commercial scope is touched |
| `competitor-trust-audit-skill` | N/A | No competitor/trust claim is touched |
| `board-response-skill` | N/A | No board/executive wording is touched |
| `executive-brief-skill` | N/A | No executive-facing wording is touched |

## RLS Control Review

| Control | Status | Required Action | Verdict |
|---|---|---|---|
| RLS enabled | Present | Keep enabled | PASS |
| Tenant-scoped policy | Present | Verify with tests | PASS WITH FOLLOW-UP |
| Broad `USING (true)` policy | Not present | Do not introduce | PASS |
| Anonymous/public access | Not present | Do not introduce | PASS |
| Existing tenant isolation dropped | Not present | Do not drop | PASS |
| Audit logging | Missing | Add access audit logging or evidence of existing audit coverage | FIX |
| Rollback test | Missing | Add rollback test and rollback instructions | FIX |
| Negative cross-tenant test | Missing | Add test proving tenant A cannot access tenant B data | FIX |
| Security owner approval | Missing | Add explicit approval and audit note | FIX |
| Evidence pack | Missing | Add evidence references | FIX |

## Required Fixes Before Merge

The PR must add:

1. Audit logging evidence
   - access event logged
   - actor/user id captured
   - tenant id captured
   - policy/action captured
   - timestamp captured

2. Rollback test
   - migration rollback command or down migration
   - rollback verification
   - evidence that rollback does not leave data exposed

3. Negative tenant-crossing test
   - tenant A cannot read tenant B recovery/customer data
   - failed access is expected and documented

4. Security owner approval
   - named approver
   - approval date
   - scope approved
   - audit note

5. Evidence pack
   - migration reference
   - policy reference
   - test output reference
   - audit-log reference
   - approval reference

## Forbidden Outcomes

- Do not mark this MERGE READY while audit logging is missing.
- Do not mark this MERGE READY while rollback tests are missing.
- Do not mark this MERGE READY while negative tenant-crossing tests are missing.
- Do not mark this MERGE READY without security owner approval.
- Do not downgrade disabled RLS or tenant isolation removal to FIX BEFORE MERGE.
- If RLS is disabled, tenant isolation is removed, `USING (true)` is introduced, or public access is granted, verdict must escalate to BLOCK MERGE.

## Decision Aggregation

- `security-rls-auditor` = FIX BEFORE MERGE
- `crag` = FIX BEFORE MERGE
- `evidence-pack-builder-skill` = FIX BEFORE MERGE
- `product-governor` = Advisory
- Overall verdict = FIX BEFORE MERGE

## Pass / Fail Result

PASS

The benchmark passes because the expected verdict and actual verdict both equal:

FIX BEFORE MERGE

## Final Recommendation

- Merge this benchmark as the v1.1 partial RLS control.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Create the positive RLS benchmark next.
- No automatic merge authorization is granted.
