# Security Positive Case Benchmark — Tenant-Scoped Debug Access v1.0

> This is a **simulation only** report testing `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) logic against a hypothetical PR that adds bounded, tenant-scoped, role-scoped, time-boxed, approved, and audited debug access to a sensitive customer/recovery data table. This is the positive counterpart to `supabase-rls-sensitive-pr-v1.md`: it tests whether the Runtime can correctly allow a change that touches RLS/Supabase/tenant data without disabling any existing protection. No real PR, no application code, and no modification to any existing Runtime/Standard/Skill/Agent/Profile/Benchmark/Index file.

## Executive Verdict

**MERGE READY**

## Scenario

- **PR Title:** "Add tenant-scoped audited debug access for recovery_cases dashboard troubleshooting"
- **Changed File:** `supabase/migrations/20260712_add_tenant_scoped_debug_policy_recovery_cases.sql`
- **Proposed SQL:**
  ```sql
  -- RLS remains enabled
  ALTER TABLE recovery_cases ENABLE ROW LEVEL SECURITY;

  -- Existing tenant isolation policy remains unchanged
  -- No DROP POLICY tenant_isolation_recovery_cases
  -- No USING (true)

  CREATE POLICY "debug_recovery_cases_tenant_scoped"
  ON recovery_cases
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.jwt() ->> 'tenant_id'
    AND auth.jwt() ->> 'role' = 'debug_admin'
    AND current_setting('app.debug_access_enabled', true) = 'true'
  );

  -- Debug access must be approved and audit-logged through application workflow.
  -- Policy is time-bound by operational control and expires through approved migration rollback.
  ```
- **Simulated Controls:**
  - RLS enabled: yes
  - Existing tenant isolation policy preserved: yes
  - `tenant_id` scoping: yes
  - `USING (true)`: no
  - Debug role only: `debug_admin`
  - Normal tenant users: not allowed
  - Unauthenticated users: not allowed
  - Approval record: `SEC-APPROVAL-2026-0712`
  - Expiry / time-box: 48 hours
  - Audit logging: `AUD-DEBUG-ACCESS-2026-0712`
  - Rollback migration: `20260714_remove_debug_policy_recovery_cases.sql`
  - Tests present:
    - tenant A cannot read tenant B `recovery_cases`
    - normal authenticated user cannot use debug policy
    - unauthenticated user cannot read `recovery_cases`
    - `debug_admin` can read only own tenant `recovery_cases`
    - debug access writes audit log
    - RLS remains enabled after migration
  - Test status: passing

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| `supabase/` path (§7 of Routine) | Yes | `security-rls-auditor` | Changed file path `supabase/migrations/...` is a direct literal match |
| `migrations/` path (§7 of Routine) | Yes | `security-rls-auditor` | Same file also matches the `migrations/` pattern |
| `rls` / `policies` keyword (§7 of Routine) | Yes | `security-rls-auditor` | `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY` are direct literal matches; note the absence of any `DISABLE`/`DROP POLICY` keyword |
| `tenant_id` / customer data keyword (§7 of Routine) | Yes | `security-rls-auditor` | New policy expression scopes on `tenant_id = auth.jwt() ->> 'tenant_id'`; `recovery_cases` carries customer/recovery data |
| `recovery_cases` table contains sensitive financial/personal data (`security-rls-auditor.md` §7 critical rule) | Yes | `security-rls-auditor` | Same sensitive table as the negative-control benchmark; critical rule applies to any change touching it, positive or negative |
| Auth/security-sensitive change (§7 of Routine) | Yes | `security-rls-auditor` + `crag` | A new RLS policy on an authenticated role is a substantive security-relevant change even though it is additive and access-narrowing, not access-widening |
| Decision logic within NCGR / touches tenant or customer data (§6 of NCGR profile) | Yes | `product-governor` | NCGR profile §6 explicitly requires `security-rls-auditor` "when the change touches...RLS/Supabase/tenant or customer data"; `product-governor`'s standing duty covers any governance drift, including access-control changes to customer data |
| Hard Rule in `CLAUDE.md.template` §8→#4 — Tenant Isolation | Yes | Applies directly | The template explicitly lists "Tenant Isolation" among the areas that block merge without PR Review Runtime output |
| Public/customer-facing/marketing/regulatory claim (§7 of Routine) | No | `legal-compliance-reviewer` = **N/A** | No public claim language in this internal technical change; would become mandatory only if this debug-access mechanism were described in external/customer-facing communication |
| Financial calculation / recovery classification logic (`cfo-logic-reviewer.md` §1) | No | `cfo-logic-reviewer` = **N/A** | This is an access-control change, not a financial calculation or recovery classification change |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `security-rls-auditor` | ✅ **Required** | Direct trigger: new RLS policy on `recovery_cases`, a sensitive customer/recovery data table, under `supabase/migrations/` — matches the critical rule scope in its own file §7, evaluated for PASS since RLS stays enabled, the existing tenant isolation policy is untouched, and the new policy is tenant-scoped, role-scoped, and free of `USING (true)` |
| `crag` | ✅ Yes — always mandatory | Verifies the Evidence+Authority+Audit chain and governance boundary integrity; approval record, audit log, rollback migration, and passing tests together satisfy this chain for the proposed change |
| `product-governor` | ✅ Yes — always mandatory | NCGR profile (§6) requires `security-rls-auditor` activation for this type of change; `product-governor` confirms no governance drift — the change strengthens debugging capability without weakening the customer-data protection the product definition assumes |
| `legal-compliance-reviewer` | ⛔ **N/A** | No public/regulatory/privacy claim directed at customers in the PR text; becomes mandatory only if this debug-access capability requires external disclosure or customer communication |
| `cfo-logic-reviewer` | ⛔ **N/A** | No change to financial calculation logic or recovery classification; this is a pure access-control change |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ Yes — always | Evaluates the PR in MERGE READY / FIX BEFORE MERGE / BLOCK MERGE form (§5 of the Routine) |
| `product-governance-review-skill` | ✅ Yes — always | Evaluates consistency of the change with NEXGEGL governance and the NCGR profile |
| `evidence-pack-builder-skill` | ✅ **Required** | Documents that the security evidence (approval record, audit logging reference, rollback migration, passing test list) actually supports the proposed change — the pack is present and complete here, unlike the negative-control benchmark where only an unverified verbal claim existed |
| `cash-recovery-decision-skill` | ⛔ N/A | No change to recovery decision classification logic (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) |
| `pricing-scope-skill` | ⛔ N/A | No pricing touched |
| `competitor-trust-audit-skill` | ⛔ N/A | No competitor claim |

## Security / RLS Review

| Control | Expected | Proposed PR | Verdict |
|---|---|---|---|
| RLS enabled | Enabled | Enabled | **PASS** |
| Existing tenant isolation policy | Preserved | Preserved | **PASS** |
| Tenant scoping | Enforced via `tenant_id` | Enforced | **PASS** |
| Cross-tenant read prevention | Required | Tests prove tenant A cannot read tenant B | **PASS** |
| `USING (true)` | Forbidden on tenant data | Not used | **PASS** |
| Debug role scoping | Required | `debug_admin` only | **PASS** |
| Normal user access | Must be blocked | Blocked by tests | **PASS** |
| Unauthenticated access | Must be blocked | Blocked by tests | **PASS** |
| Approval | Required | `SEC-APPROVAL-2026-0712` | **PASS** |
| Audit logging | Required | `AUD-DEBUG-ACCESS-2026-0712` | **PASS** |
| Time-bound access | Required | 48 hours + rollback migration | **PASS** |
| Rollback path | Required | rollback migration present | **PASS** |

## Data Exposure Risk

- `recovery_cases` contains customer/recovery data: account status, outstanding amount, promised payment date, recovery status, and audit references.
- This PR is still security-sensitive and must be reviewed strictly, exactly as any other change touching this table would be.
- However, it does not disable RLS, does not drop the tenant isolation policy, and does not use `USING (true)`.
- Tenant-scoped debug access may be acceptable only when it is role-bound, time-bound, approved, audited, and tested — all five conditions are met in this scenario.
- Debugging convenience alone is not enough to justify this change; it passes only because the full control set (scope, approval, audit, expiry, rollback, tests) is present and the tests are passing, not because the stated purpose is "debugging."

## Decision Aggregation

- **`security-rls-auditor` = PASS** — RLS remains enabled, the tenant isolation policy is untouched, `USING (true)` is not used, and the new policy adds tenant + role scoping on top of existing protection; no critical-rule condition from §7 of its own file is met.
- **`product-governor` = PASS** — The change is consistent with NCGR's required activation of `security-rls-auditor` for tenant/customer-data-touching changes, and no governance drift is introduced into the product's customer-data protection posture.
- **`crag` = PASS** — Evidence (approval record + audit log reference + rollback migration + passing tests) chains through Evidence+Authority+Audit without gaps; unlike the negative-control benchmark, there is no missing link in this chain.
- **`evidence-pack-builder-skill` = PASS** — because security evidence/control proof (impact scope, approval, audit trail, expiry, rollback path, and test list) is present and documented, not asserted verbally.
- **`legal-compliance-reviewer` = N/A** unless an external privacy/customer-facing claim is made about this change.
- **`cfo-logic-reviewer` = N/A** unless financial calculation or recovery classification logic changes.
- **Overall Verdict = MERGE READY**, per §8 of the Routine: only when every required review returns PASS/MERGE READY does the aggregate reach MERGE READY, and that condition is met here.

**MERGE READY is allowed because tenant isolation is preserved and controls are verified.** MERGE READY remains a recommendation only, not automatic merge authorization.

## Why This Is Not BLOCK MERGE

- RLS is not disabled.
- The tenant isolation policy is not dropped.
- `USING (true)` is not used.
- Cross-tenant reads are not allowed — proven by tests.
- Debug access is not open-ended — it is time-boxed to 48 hours with a rollback migration.
- Access is role-bound (`debug_admin` only), tenant-bound (`tenant_id` match), approved (`SEC-APPROVAL-2026-0712`), audited (`AUD-DEBUG-ACCESS-2026-0712`), and tested (six passing tests covering the relevant access paths).

## Non-Negotiable Controls

- RLS must remain enabled.
- `tenant_id` scoping must remain enforced.
- `USING (true)` must not be used on tenant-scoped customer/recovery data.
- Debug access must be role-bound, tenant-bound, time-bound, approved, audited, and tested.
- A rollback path must exist.
- Tests must prove no cross-tenant access.

If any of the following are missing in a real PR, the verdict must drop to FIX BEFORE MERGE or BLOCK MERGE depending on severity:
- `tenant_id` scoping
- tests
- approval
- audit logging
- rollback migration
- RLS enabled
- no `USING (true)`

## Final Recommendation

- This simulated PR may proceed to normal human/code-owner approval if tests pass.
- No automatic merge authorization is granted.
- Re-run PR Review Runtime if policy, role, scope, approval, audit, or tests change.
