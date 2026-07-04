# Missing Evidence Scenario Benchmark v1.0

> This is a **simulation only** report testing `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) logic against a hypothetical PR that introduces a quantified product performance claim on an internal executive dashboard without any supporting evidence. Unlike the NCGR recovery-status benchmarks (which test financial classification logic) and the Supabase/RLS benchmarks (which test data access control), this benchmark isolates **evidence readiness for a product/marketing-style claim** — testing whether `evidence-pack-builder-skill` activates independently of both domains. No real PR, no application code beyond the simulated snippet described below, and no modification to any existing Runtime/Standard/Skill/Agent/Profile/Benchmark/Index file.

## Executive Verdict

**FIX BEFORE MERGE**

## Scenario

- **PR Title:** "Add executive dashboard claim: recovery prioritization reduces follow-up time by 40%"
- **Changed File:** `apps/web/src/components/executive-dashboard/RecoveryImpactCard.tsx`
- **Proposed Copy:**
  > "AI-powered recovery prioritization reduces follow-up time by 40% and improves management visibility across all overdue accounts."
- **Evidence Provided:**
  - No benchmark report
  - No measurement method
  - No before/after dataset
  - No sample size
  - No customer validation
  - No calculation formula
  - No source reference
  - No approval from product owner
  - No audit note

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Quantified claim (§7 of Routine — `metrics` keyword) | Yes | `legal-compliance-reviewer` (advisory) + `evidence-pack-builder-skill` | "reduces follow-up time by 40%" is a specific numeric performance metric with no cited source |
| Customer-facing or dashboard copy | Partially | `product-governor` | `RecoveryImpactCard.tsx` is an **internal executive/management dashboard** component, not confirmed customer-facing or public marketing copy; classification is ambiguous, so the more conservative path is used per §7's fail-safe rule rather than assuming N/A |
| Product claim (capability/performance) | Yes | `product-governor` + `evidence-pack-builder-skill` | The copy asserts a specific product capability outcome ("reduces follow-up time by 40%") |
| Missing evidence (§4 Missing Input Rule + Evidence Pack Builder §2) | Yes | `evidence-pack-builder-skill` | No dataset, method, sample size, baseline, calculation, source, approval, or audit note accompanies the claim |
| `legal-compliance-reviewer` if external/public/investor-facing (§7 of Routine — `metrics`) | Conditional | `legal-compliance-reviewer` | Not confirmed as external/public/investor-facing in this scenario; treated as **advisory** here, escalating to **Required** the moment this dashboard content is exposed externally, reused in investor materials, or surfaced to customers |
| RLS/security trigger (`supabase/`, `migrations/`, `rls`, `tenant_id`, database/auth) | No | `security-rls-auditor` = **N/A** | Changed file is a frontend presentational component; no database, auth, RLS, or Supabase path touched |
| NCGR recovery-status classification trigger (RECOVERED/PROMISED_TO_PAY/recovered_cash_total) | No | N/A | No recovery status classification, cash total, or debtor/account state logic is touched — this is display copy on a dashboard card, not a status transition |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ **Required** | Always mandatory; verifies the Evidence chain — a specific quantified claim entering the codebase without any Evidence+Authority+Audit backing is exactly the drift this agent exists to catch |
| `product-governor` | ✅ **Required** | Always mandatory; the claim is an unauthorized/undocumented product promise about a specific performance outcome, which falls squarely within its standing duty to flag Product Logic Drift and unauthorized product promises |
| `legal-compliance-reviewer` | ⚠️ **Required if external/public/investor-facing; advisory otherwise** | The dashboard is presented as internal/executive-facing in this scenario, so strict activation is not confirmed; however the `metrics` keyword trigger in §7 of the Routine means this agent's advisory judgment should still be recorded, and it becomes mandatory and binding the moment this becomes customer/public/investor-facing material |
| `cfo-logic-reviewer` | ⛔ **N/A** | No financial calculation, DSO, aging, receivables, or cash-impact logic is changed; "follow-up time" is an operational/UX metric, not a financial one |
| `security-rls-auditor` | ⛔ **N/A** | No data access, authentication, RLS, or Supabase path is touched; this is a display-only UI claim change |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ Yes — always | Evaluates the PR in MERGE READY / FIX BEFORE MERGE / BLOCK MERGE form (§5 of the Routine) |
| `product-governance-review-skill` | ✅ Yes — always | Evaluates consistency of the change with NEXGEGL governance, specifically the Evidence Layer and Terminology/Claim discipline axes |
| `evidence-pack-builder-skill` | ✅ **Required** | Directly applicable per its own §2 ("When to Use"): a specific claim is present and its evidentiary readiness for use is in doubt — this is precisely the trigger condition for this skill |
| `executive-brief-skill` | ⛔ N/A | No management summary of this benchmark's outcome is being produced as part of this PR |
| `pricing-scope-skill` | ⛔ N/A | No pricing or commercial package terms are touched |
| `competitor-trust-audit-skill` | ⛔ N/A | No competitor comparison or competitor claim is present |
| `cash-recovery-decision-skill` | ⛔ N/A | No recovery decision classification logic (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) is changed |

## Evidence Review

| Claim | Evidence Required | Evidence Provided | Gap | Verdict |
|---|---|---|---|---|
| "reduces follow-up time by 40%" | benchmark/dataset/method/sample/baseline/calculation | none | complete gap | **FIX** |
| "improves management visibility across all overdue accounts" | product capability evidence or scoped wording | none | partial gap | **FIX** |

## Evidence Pack Builder Simulation

```
EVIDENCE PACK — Executive Dashboard "40% follow-up time reduction" Claim — 2026-07-04

Evidence Required:
- Measurement method (how "follow-up time" is defined and measured)
- Before/after baseline dataset
- Sample size / population covered
- Calculation formula for the 40% figure
- Date range of measurement
- Source reference (internal study, customer pilot, or analytics export)
- Product-owner approval of the claim as stated
- Audit note documenting how/when the claim was validated

Evidence Received:
- None of the above — no benchmark report, no measurement method, no dataset,
  no sample size, no customer validation, no calculation formula, no source
  reference, no product-owner approval, no audit note

Evidence Gaps:
- Complete gap on the "40% reduction" figure — no method, baseline, sample,
  or source of any kind
- Partial gap on "improves management visibility across all overdue accounts" —
  no evidence that visibility literally spans "all" overdue accounts, and no
  scoping to configuration/data-quality dependencies

Source Reliability: N/A — no evidence was received to rate

Decision Readiness: Not Ready — the claim cannot be published or merged as
stated because there is no verifiable basis for the specific number, and the
absolute wording ("all overdue accounts") is not confirmed either

Audit Trail Requirement: If evidence is later produced, the measurement
method, dataset, calculation, and product-owner approval must be recorded
and linked from the PR/commit so the claim remains auditable after merge

Next Evidence Request: Request from the product owner — a documented
benchmark/measurement (method + baseline + sample size + calculation +
date range), or authorization to replace the claim with the safer,
unquantified wording pending that evidence
```

**Decision Readiness = Not Ready.** **Verdict = FIX.**

## Legal / Compliance Review

- This scenario's dashboard is treated as internal/executive-facing, so `legal-compliance-reviewer` is **advisory** rather than strictly binding here — but the judgment below still applies to guard against reuse of this exact copy in external contexts.
- If this copy is or becomes public/customer-facing/investor-facing material, `legal-compliance-reviewer` **is required**, not advisory.
- A quantified 40% claim without evidence must not be published in any customer-facing, investor-facing, or public context.
- The claim must either be removed, qualified with safer wording, or supported by documented measurement before it can appear anywhere outside an internal, clearly-labeled work-in-progress view.
- **If kept as an unsupported public claim, the verdict escalates to `BLOCK MERGE`** — this benchmark's FIX BEFORE MERGE result holds only because the claim is correctable and not (in this scenario) confirmed as already-published external content.

## Product Governance Review

```
PRODUCT GOVERNANCE REVIEW — Executive Dashboard Recovery Impact Claim — 2026-07-04
التصنيف: Product Repo

SDGM/KFSA Separation: PASS — no SDGM/KFSA logic touched by this display copy
Signal vs Decision Separation: PASS — no signal is being converted into a decision here
Authority Layer: N/A — no institutional action is being authorized by this change
Evidence Layer: FIX — a specific numeric claim is presented with no supporting evidence
Audit Trail: FIX — no audit note exists for how/when this claim was validated
Tenant Isolation: N/A — no tenant-scoped data access is touched
AI Boundary: PASS — "AI-powered" is descriptive framing, not a decision-flow claim, but it compounds the evidence gap since it, too, is asserted without support
Terminology Drift: PASS — no governance term (Signal/Decision/SDGM/KFSA) or ESTARED/NCGR naming is affected

OVERALL: FIX
الإجراء المطلوب: Remove or qualify the unsupported 40% figure; add documented
measurement evidence and product-owner approval before the claim can stand as
written
```

- Product claims must be evidence-backed before they are surfaced anywhere a decision-maker, customer, or investor might rely on them.
- Specific numeric impact claims (e.g., "40%") require measurement discipline — a method, baseline, sample, and source — not just plausibility.
- The underlying product direction (dashboards helping prioritize recovery follow-up) may be entirely valid; the issue is that the specific wording of this claim is not yet ready to ship as stated.

## Decision Aggregation

- **`evidence-pack-builder-skill` = FIX** — Evidence Required and Evidence Received are fully separated per its own operating rules, and the gap is total for the 40% figure and partial for the "all overdue accounts" claim; Decision Readiness is Not Ready, which is a FIX-level (not FAIL-level) outcome because the gap is correctable, not a case of the pack falsely being presented as complete.
- **`product-governor` = FIX** — An unauthorized/undocumented product promise about a specific quantified outcome is present; this is a correctable drift (remove the number or add evidence), not a brand-name change or product-scope violation, so it does not rise to FAIL.
- **`crag` = FIX** — The claim-to-evidence chain is incomplete: a claim is stated as if it were established fact, without Evidence+Authority+Audit behind it. This is a correctable inconsistency, not a redefinition of a governing term or an attempt to bypass the Evidence/Authority/Audit chain by force, so it is FIX rather than FAIL.
- **`legal-compliance-reviewer` = Advisory FIX here; escalates to Required/FIX-or-FAIL if this copy is or becomes external/public/investor-facing** — Undocumented quantified claims are exactly the pattern this agent's Quality Gates classify as FIX (needs evidence/more conservative wording) at minimum, and FAIL (fabricated metric published as fact) if it ships externally unsupported.
- **`security-rls-auditor` = N/A** — no data access/auth/RLS path touched.
- **`cfo-logic-reviewer` = N/A** — no financial calculation logic touched.
- **Overall Verdict = FIX BEFORE MERGE**, per §8 of the Routine: no agent issued FAIL/BLOCK MERGE, but at least one required review (`evidence-pack-builder-skill`, `product-governor`, `crag`) issued FIX, which sets the aggregate floor at FIX BEFORE MERGE.

**MERGE READY is not allowed because the claim-to-evidence chain is incomplete.**

**BLOCK MERGE is not required if the unsupported claim is removed or evidence is added before merge.**

## Correct Required Fixes

Before merge, either:

**Option A — Add evidence:**
- measurement method
- before/after baseline
- dataset
- sample size
- calculation formula
- date range
- owner approval
- audit note
- evidence_refs

**Option B — Use safer wording:**

> "Recovery prioritization helps teams focus follow-up efforts and improve visibility across overdue accounts, subject to customer data quality and configured workflows."

## Final Recommendation

- Do not merge as written.
- Remove the unsupported 40% claim or add documented evidence.
- Use safer wording until benchmark evidence exists.
- Re-run PR Review Runtime after fixes.
- No automatic merge authorization is granted.
