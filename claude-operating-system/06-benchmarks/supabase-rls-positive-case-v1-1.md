# Supabase RLS Positive Case Benchmark v1.1

## Executive Verdict

MERGE READY

## Purpose

This benchmark validates the fully compliant positive path for Supabase Row-Level Security.

It confirms that a security-sensitive PR touching customer/recovery data may return MERGE READY only when:
- RLS remains enabled
- tenant-scoped access control is present
- no broad public access policy is introduced
- audit logging evidence is present
- rollback test is present
- negative cross-tenant test is present
- security owner approval is present
- evidence pack is complete

This benchmark does not modify runtime files.

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Scenario

Simulated PR Title:
"Add audited tenant-scoped dashboard access policy for recovery cases"

Simulated changed files:
- `supabase/migrations/20260705_add_recovery_dashboard_policy.sql`
- `supabase/migrations/20260705_add_recovery_dashboard_policy_down.sql`
- `server/security/rls/recovery_cases_policy_test.md`
- `server/security/audit/recovery_cases_access_audit_test.md`
- `docs/security/evidence/recovery_cases_rls_policy_evidence.md`

Simulated change:
- Keeps RLS enabled on a sensitive recovery/customer data table.
- Adds a tenant-scoped policy using `tenant_id = auth.jwt()->>'tenant_id'`.
- Does not disable RLS.
- Does not add `USING (true)`.
- Does not drop existing tenant isolation policy.
- Adds limited dashboard read access for authenticated tenant users.
- Adds audit logging evidence for policy access.
- Adds rollback test and rollback instructions.
- Adds negative cross-tenant test.
- Adds explicit security owner approval.
- Adds complete evidence pack.

Simulated evidence provided:
- RLS enabled verification: present
- tenant-scoped policy verification: present
- audit logging test: present
- rollback test: present
- negative tenant-crossing test: present
- security owner approval: present
- evidence pack: present
- audit note: present

## Expected Verdict

MERGE READY

## Actual Verdict

MERGE READY

## Why Not BLOCK MERGE?

This scenario is not BLOCK MERGE because:
- RLS remains enabled.
- Tenant-scoped access control is present.
- No `USING (true)` policy is introduced.
- No tenant isolation policy is dropped.
- No anonymous/public access is introduced.
- No customer/recovery data is made globally readable.

## Why Not FIX BEFORE MERGE?

This scenario is not FIX BEFORE MERGE because:
- audit logging evidence is present.
- rollback test is present.
- negative cross-tenant test is present.
- security owner approval is present.
- evidence pack is complete.
- no unresolved security governance gap remains in the simulated PR.

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Sensitive customer/recovery data touched | Yes | `security-rls-auditor` | Recovery/customer data requires tenant isolation review |
| RLS remains enabled | Yes | `security-rls-auditor` | Required positive condition |
| Tenant-scoped policy present | Yes | `security-rls-auditor` | Required positive condition |
| Audit logging present | Yes | `security-rls-auditor`, `evidence-pack-builder-skill` | Access logging evidence exists |
| Rollback test present | Yes | `security-rls-auditor`, `claude-code-pr-review-skill` | Rollback test and instructions exist |
| Cross-tenant negative test present | Yes | `security-rls-auditor` | Tenant A cannot access tenant B data |
| Security owner approval present | Yes | `crag`, `security-rls-auditor` | Authority evidence exists |
| Evidence pack complete | Yes | `evidence-pack-builder-skill` | Evidence references are present |
| Governance core terminology touched | No | `crag` not for terminology | No SDGM/KFSA/Signal/Decision definition change |
| Product claim touched | No | `product-governor` not primary | No customer-facing claim |
| Pricing/competitor/board claim touched | No | N/A | No pricing, competitor, or board wording |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `security-rls-auditor` | Required | Reviews RLS, tenant isolation, data-access policy, rollback, tests, and audit evidence |
| `crag` | Required | Ensures security-sensitive governance change includes evidence, authority, and audit |
| `product-governor` | Advisory | Needed only if this access policy changes product behavior or user-facing scope |
| `legal-compliance-reviewer` | N/A unless privacy/legal claims are introduced | No public, regulatory, or legal claim is introduced |
| `cfo-logic-reviewer` | N/A | No financial/recovery classification logic is changed |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | Required | Standard PR review path for security-sensitive code |
| `evidence-pack-builder-skill` | Required | Confirms audit log, rollback evidence, test evidence, and approval evidence are complete |
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
| Tenant-scoped policy | Present | Verify with tests | PASS |
| Broad `USING (true)` policy | Not present | Do not introduce | PASS |
| Anonymous/public access | Not present | Do not introduce | PASS |
| Existing tenant isolation dropped | Not present | Do not drop | PASS |
| Audit logging | Present | Keep evidence reference | PASS |
| Rollback test | Present | Keep rollback evidence | PASS |
| Negative cross-tenant test | Present | Keep test output evidence | PASS |
| Security owner approval | Present | Keep approval and audit note | PASS |
| Evidence pack | Present | Keep evidence refs complete | PASS |

## Required Evidence for MERGE READY

The PR must include:

1. RLS and tenant-scope evidence
   - RLS enabled verification
   - tenant-scoped policy reference
   - confirmation no broad `USING (true)` policy exists
   - confirmation no anonymous/public access exists

2. Audit logging evidence
   - access event logged
   - actor/user id captured
   - tenant id captured
   - policy/action captured
   - timestamp captured

3. Rollback test
   - migration rollback command or down migration
   - rollback verification
   - evidence that rollback does not leave data exposed

4. Negative tenant-crossing test
   - tenant A cannot read tenant B recovery/customer data
   - failed access is expected and documented

5. Security owner approval
   - named approver
   - approval date
   - scope approved
   - audit note

6. Evidence pack
   - migration reference
   - policy reference
   - test output reference
   - audit-log reference
   - approval reference

## Forbidden Outcomes

- Do not mark this MERGE READY if audit logging is missing.
- Do not mark this MERGE READY if rollback tests are missing.
- Do not mark this MERGE READY if negative tenant-crossing tests are missing.
- Do not mark this MERGE READY without security owner approval.
- Do not mark this MERGE READY if evidence pack is incomplete.
- Do not downgrade disabled RLS or tenant isolation removal to FIX BEFORE MERGE.
- If RLS is disabled, tenant isolation is removed, `USING (true)` is introduced, or public access is granted, verdict must escalate to BLOCK MERGE.
- If RLS remains enabled but audit/rollback/test/approval evidence is incomplete, verdict must downgrade to FIX BEFORE MERGE.

## Decision Aggregation

- `security-rls-auditor` = MERGE READY
- `crag` = MERGE READY
- `evidence-pack-builder-skill` = MERGE READY
- `product-governor` = Advisory
- Overall verdict = MERGE READY

## Pass / Fail Result

PASS

The benchmark passes because the expected verdict and actual verdict both equal:

MERGE READY

MERGE READY remains a review recommendation only, not automatic merge authorization.

## Final Recommendation

- Merge this benchmark as the v1.1 positive RLS control.
- Do not modify runtime files in this PR.
- Do not update README in this PR.
- Update README after this benchmark is merged to complete the RLS control triad.
- No automatic merge authorization is granted.
