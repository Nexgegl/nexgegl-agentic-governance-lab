# Pricing / Commercial Scope Benchmark v1.0

> This is a **simulation only** report testing `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) logic against a hypothetical PR that introduces a commercial pricing card with unlimited-service and guaranteed-recovery language and no defined commercial boundaries. Unlike the NCGR recovery-status benchmarks (financial classification logic), the Supabase/RLS benchmark (data access control), and the Evidence Readiness benchmarks (quantified product/dashboard claims), this benchmark isolates **commercial scope governance**: pricing, package boundaries, SLA, fair-use, and contract-scope discipline — testing whether `pricing-scope-skill` activates and correctly flags an unbounded commercial offer independently of the other three domains. No real PR, no application code beyond the simulated snippet described below, and no modification to any existing Runtime/Standard/Skill/Agent/Profile/Benchmark/Index file.

## Executive Verdict

**FIX BEFORE MERGE**

## Scenario

- **PR Title:** "Add Enterprise package copy with unlimited recovery automation"
- **Changed File:** `apps/web/src/components/pricing/EnterprisePlanCard.tsx`
- **Proposed Copy:**
  > "Enterprise includes unlimited recovery automation for all overdue customers, guaranteed recovery workflows, unlimited users, unlimited dashboard access, priority support, and full AI follow-up at a fixed monthly price."
- **Commercial Details Provided:**
  - Price: SAR 9,999 / month
  - Contract term: missing
  - Included entities / tenants: missing
  - Included users: unlimited
  - Included accounts / cases: unlimited
  - Recovery workflow volume: unlimited
  - Support SLA: priority support, no response time defined
  - Implementation scope: missing
  - Integration scope: missing
  - Data migration scope: missing
  - Out-of-scope items: missing
  - Fair-use policy: missing
  - Human approval requirement: missing
  - Legal/compliance review: missing
  - Product-owner approval: missing
  - Commercial owner approval: missing
  - Audit note: missing

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Pricing/commercial package (§7 of Routine — `pricing` keyword) | Yes | `pricing-scope-skill` + `legal-compliance-reviewer` | `EnterprisePlanCard.tsx` is a commercial pricing package card with an explicit monthly price and named tier ("Enterprise") |
| Fixed monthly price with undefined scope | Yes | `pricing-scope-skill` | SAR 9,999/month is stated as a single fixed number with no accompanying scope, exclusions, or contract term — exactly the "rigid single price without justification" anti-pattern the skill's Quality Gates flag as FIX |
| Unlimited language (`unlimited recovery automation`, `unlimited users`, `unlimited dashboard access`) | Yes | `pricing-scope-skill` + `product-governor` | Three separate unlimited claims with no fair-use policy, volume cap, or tenant/entity boundary attached to any of them |
| Guaranteed recovery wording (`guaranteed recovery workflows`) | Yes | `legal-compliance-reviewer` + `crag` | Matches the ESTARED product profile's explicit forbidden pattern ("استرداد مضمون" / Guaranteed Recovery) and NCGR's Forbidden Output list; also a `guaranteed recovery` §7 keyword trigger for `legal-compliance-reviewer` |
| Customer-facing pricing card | Yes | `product-governor` + `legal-compliance-reviewer` | A pricing page component is customer-facing commercial copy by nature — no internal/ambiguous classification question exists here, unlike the dashboard-copy benchmarks |
| Missing scope (contract term, entities/tenants, implementation, integration, migration, exclusions, approvals, audit note) | Yes | `pricing-scope-skill` + `evidence-pack-builder-skill` (advisory) | Per the Missing Input Rule pattern applied to commercial scope: every boundary category pricing-scope-skill's own workflow requires (Assumptions, Delivery Phases, Cost Drivers, Out-of-Scope, Change Request Rule) is absent from the PR as written |
| `legal-compliance-reviewer` required (§7 of Routine — `pricing`, `guaranteed recovery`, `ESTARED`/customer-facing copy) | Yes | `legal-compliance-reviewer` | Both the `pricing` keyword and the `guaranteed recovery` keyword independently trigger this agent per §7 of the Routine; because the copy is confirmed customer-facing (not ambiguous, unlike the dashboard benchmarks), activation is **Required**, not advisory |
| RLS/security trigger (`supabase/`, `migrations/`, `rls`, `tenant_id`, database/auth) | No | `security-rls-auditor` = **N/A** | Changed file is a frontend pricing-card presentational component; no database, auth, RLS, or Supabase path touched |
| NCGR recovery-status classification trigger (RECOVERED/PROMISED_TO_PAY/recovered_cash_total) | No | N/A | No recovery status classification, debtor/account state, or cash total field is touched — this is commercial package copy, not a status transition |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ **Required** | Always mandatory; "guaranteed recovery workflows" is an unauthorized product promise that bypasses Evidence + Authority + Audit, and the commercial claim-to-authority/audit chain (no product-owner approval, no commercial-owner approval, no audit note) is incomplete — exactly the drift this agent exists to catch |
| `product-governor` | ✅ **Required** | Always mandatory; unlimited/guaranteed commercial packaging that is not bounded by documented product, operational, or support limits is squarely an unauthorized product promise and a Product Logic Drift risk under its standing duty |
| `legal-compliance-reviewer` | ✅ **Required** | Customer-facing commercial copy (§7 `pricing` trigger) that also contains "guaranteed recovery" (§7 `guaranteed recovery` trigger) — both the ESTARED product profile (§6, Claims Rules) and NCGR profile (§8, Forbidden Output) name "Guaranteed Recovery" as a hard-forbidden pattern, so this activation is binding, not advisory |
| `cfo-logic-reviewer` | ⚠️ **Advisory** | No DSO/aging/receivables classification logic is changed by this UI copy, but a fixed SAR 9,999/month price against unlimited, undefined volume is a margin/unit-economics exposure worth advisory notice if this package is actually offered — escalates to **Required** if a financial model or unit-economics calculation is added to support the price |
| `security-rls-auditor` | ⛔ **N/A** | No data access, authentication, RLS, or Supabase path is touched; this is a display-only pricing card |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ Yes — always | Evaluates the PR in MERGE READY / FIX BEFORE MERGE / BLOCK MERGE form (§5 of the Routine) |
| `product-governance-review-skill` | ✅ Yes — always | Evaluates consistency of the change with NEXGEGL governance, specifically the Evidence Layer, Authority Layer, and Terminology/Claim discipline axes |
| `pricing-scope-skill` | ✅ **Required** | Directly applicable per its own §2 ("When to Use"): a commercial price and package are being presented, and none of Assumptions, Delivery Phases, Cost Drivers, Out-of-Scope, or Change Request Rule accompany the fixed price — precisely the trigger condition and the FIX-level gap this skill exists to catch |
| `evidence-pack-builder-skill` | ⚠️ **Advisory** | If any implied performance/quantified claim (e.g. an implicit "reduces X" outcome bundled into "recovery automation") is retained, evidence readiness for that claim would need separate assessment; for the pricing/scope boundaries themselves, `pricing-scope-skill` is the primary tool, so this is advisory rather than independently required here |
| `executive-brief-skill` | ⛔ N/A | No management summary of this benchmark's outcome is being produced as part of this PR |
| `competitor-trust-audit-skill` | ⛔ N/A | No competitor comparison or competitor claim is present |
| `cash-recovery-decision-skill` | ⛔ N/A | No recovery decision classification logic (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) is changed |

## Commercial Scope Review

| Claim / Term | Required Boundary | Provided? | Risk | Verdict |
|---|---|---|---|---|
| unlimited recovery automation | fair-use / volume / case limits | No | open-ended delivery obligation | FIX |
| all overdue customers | eligibility/scope definition | No | overbroad promise | FIX |
| guaranteed recovery workflows | remove/qualify; no recovery guarantee | No | misleading recovery promise | FIX / escalate if public |
| unlimited users | user/entity/fair-use definition | No | cost/support exposure | FIX |
| unlimited dashboard access | access limits / roles / tenant scope | No | scope ambiguity | FIX |
| priority support | SLA / response time / channels | No | undefined support obligation | FIX |
| fixed monthly price | included scope and exclusions | No | margin and delivery risk | FIX |
| integrations | named systems and limits | No | implementation scope risk | FIX |
| data migration | volume and format boundaries | No | delivery scope risk | FIX |

## Legal / Compliance Review

- Customer-facing commercial copy on a pricing card unconditionally triggers `legal-compliance-reviewer` — this is not treated as advisory in this scenario, unlike the internal-dashboard benchmarks, because a pricing page is confirmed customer-facing by definition.
- "Guaranteed recovery" must not be used unless legally approved and objectively supportable; the safest and recommended action is removal, not rewording, since NCGR/ESTARED governance name this pattern as a hard-forbidden claim (ESTARED profile §6; NCGR profile §8), not merely a claim needing more evidence.
- "Unlimited" must not be used without fair-use terms and clear exclusions attached in the same copy block — an unlimited claim with no fair-use policy is a FIX-level defect even before considering whether it is achievable.
- The copy must not imply guaranteed financial outcomes, automatic recovery, or unlimited service obligations, consistent with the ESTARED profile's "Approved Message Direction" (§11) and "Avoid" list, which names "استرداد مضمون" (guaranteed recovery) explicitly.
- If "guaranteed recovery" remains in public/customer-facing copy after this review cycle, the verdict escalates to **BLOCK MERGE** — this benchmark's FIX BEFORE MERGE result holds only because the wording is correctable pre-merge, not because the phrase is acceptable as shipped.

## Product Governance Review

```
PRODUCT GOVERNANCE REVIEW — Enterprise Pricing Card Commercial Copy — 2026-07-15
التصنيف: Product Repo

SDGM/KFSA Separation: N/A — no SDGM/KFSA logic touched by this pricing/packaging copy
Signal vs Decision Separation: FIX — "guaranteed recovery workflows" collapses a recovery recommendation into an implied guaranteed outcome, which is exactly the Signal-is-not-Decision boundary this axis exists to protect
Authority Layer: FIX — no product-owner or commercial-owner approval is documented for a commercial package with unlimited scope
Evidence Layer: N/A for this axis's numeric-claim sense — no quantified performance figure is asserted here (that is Evidence Positive/Negative benchmark territory); the relevant gap is commercial scope evidence, tracked under Commercial Scope Review above
Audit Trail: FIX — no audit note documents how/when this package's scope and price were approved
Tenant Isolation: N/A — no tenant-scoped data access is touched by this UI copy
AI Boundary: FIX — "full AI follow-up" combined with "guaranteed recovery workflows" and no stated human-approval boundary risks implying AI-driven action without human authority, contrary to NCGR's Authority requirements
Terminology Drift: PASS — no governance term (Signal/Decision/SDGM/KFSA) or ESTARED/NCGR naming is altered or confused

OVERALL: FIX
الإجراء المطلوب: إزالة/إعادة صياغة "unlimited" و"guaranteed recovery"، وإضافة نطاق تجاري محدد (مدة العقد، الكيانات المشمولة، حدود الاستخدام العادل، SLA، نطاق التنفيذ/التكامل/الترحيل، الاستثناءات) واعتمادات مالك المنتج والتسعير قبل الدمج
```

- Product packaging must match actual delivery capability — an "unlimited" claim with no fair-use policy is a packaging promise the product/operations side cannot verify is deliverable.
- Commercial claims must be bounded by product, operational, support, and implementation limits before they reach a pricing card.
- A fixed price cannot carry undefined unlimited obligations without creating open-ended delivery and support risk.
- The underlying product direction (an Enterprise tier with recovery automation, dashboard access, and priority support) may be entirely valid; the issue is that the specific wording and missing commercial boundaries are not yet ready to ship as stated.

## Pricing Scope Skill Simulation

```
PRICING SCOPE — Enterprise Plan Card — 2026-07-15

Scope: Enterprise tier commercial package as drafted in EnterprisePlanCard.tsx —
recovery automation, dashboard access, and support, offered at a fixed
SAR 9,999/month price. No Client Discovery output or equivalent documented
scope was supplied as an input to this pricing.

Assumptions:
- None documented — the copy presents "unlimited" categories (users,
  dashboard access, recovery automation volume) as if they required no
  assumption, which the skill's own Operating Rules (§4) treat as invalid:
  any cost driver of unconfirmed size must be recorded as Margin Risk, not
  omitted

Delivery Phases:
- Not defined — no implementation, integration, or data migration phase is
  described despite being named as commercial inclusions

Cost Drivers:
- Unbounded user count (unlimited users)
- Unbounded recovery workflow / automation volume (unlimited recovery
  automation)
- Undefined support SLA response time (priority support)
- Undefined implementation, integration, and data migration effort

Price Range: SAR 9,999/month stated as a single fixed number — per §7
Quality Gates, a rigid single price without justification when cost drivers
are unconfirmed is a FIX-level defect, not a PASS-level one

Margin Risk: High — every major cost driver (user count, workflow volume,
support responsiveness, implementation/integration/migration effort) is
"unlimited" or undefined against a fixed monthly price, which is the exact
anti-pattern named in the skill's Anti-Patterns (§8): "a single fixed price
without a scope/fair-use boundary when cost drivers are unconfirmed"

Out-of-Scope: Not stated — no exclusions accompany "unlimited" claims

Change Request Rule: Not stated — with no defined scope, there is no
baseline against which a future scope-expansion request could even be
evaluated

Recommended Offer Structure: Deferred — cannot responsibly recommend a
one-time, phased, or subscription structure until scope, fair-use limits,
and cost drivers are defined

ملاحظة: هذا النطاق غير جاهز للاعتماد أو الإرسال كعرض نهائي؛ يتطلب استكمال
الافتراضات، دوافع التكلفة، حدود الاستخدام العادل، والاستثناءات، ثم اعتماد
جهة التسعير المخوَّلة.
```

**Decision Readiness = Not Ready.** **Verdict = FIX.**

## Decision Aggregation

- **`pricing-scope-skill` = FIX** — A fixed price is presented with multiple unconfirmed/unlimited cost drivers and no Assumptions, Out-of-Scope, or Change Request Rule; per §7 Quality Gates this is a FIX-level defect (rigid price without justification, unconfirmed cost drivers, missing Change Request Rule), not a FAIL, because the gap is correctable by adding the missing scope elements rather than the pack being falsely presented as complete.
- **`product-governor` = FIX** — Unauthorized/undocumented product promises ("unlimited," "guaranteed recovery") are present without approval; this is correctable drift (rewrite wording, add approvals) rather than a brand-name change, so it is FIX rather than FAIL.
- **`crag` = FIX** — The commercial claim-to-authority/audit chain is incomplete: a guaranteed/unlimited commercial promise is stated without product-owner approval, commercial-owner approval, or an audit note behind it. This is a correctable inconsistency (add authority and audit, or remove the promise), not a redefinition of a governing term, so it is FIX rather than FAIL.
- **`legal-compliance-reviewer` = FIX, with escalation risk to BLOCK if guaranteed recovery remains** — "Guaranteed recovery" and unqualified "unlimited" claims in confirmed customer-facing copy are exactly the pattern this agent's Quality Gates classify as requiring more conservative wording at minimum; per its own Quality Gates (§9), an uncorrected guaranteed-recovery claim shipped externally is FAIL-level, which is why this benchmark's overall verdict states the BLOCK MERGE escalation condition explicitly rather than treating it as already resolved.
- **`evidence-pack-builder-skill` = Advisory** — no independent quantified performance claim is being evaluated here beyond the commercial scope itself; would become FIX-level in its own right only if a specific performance number were added to the package copy.
- **`security-rls-auditor` = N/A** — no data access/auth/RLS path touched.
- **`cfo-logic-reviewer` = Advisory** — no financial classification logic changed, but the unit-economics exposure of unlimited scope at a fixed price is worth flagging before this package is actually sold.
- **Overall Verdict = FIX BEFORE MERGE**, per §8 of the Routine: no agent issued FAIL/BLOCK MERGE, but multiple required reviews (`pricing-scope-skill`, `product-governor`, `crag`, `legal-compliance-reviewer`) issued FIX, which sets the aggregate floor at FIX BEFORE MERGE; §8 also independently sets a floor of at least FIX BEFORE MERGE whenever a §7 legal-sensitive trigger (here, `pricing` and `guaranteed recovery`) is present without a completed `legal-compliance-reviewer` sign-off.

**MERGE READY is not allowed because commercial scope and claim boundaries are incomplete.**

**BLOCK MERGE is not required if unsafe wording is removed and commercial boundaries are added before merge.**

## Why This Is Not MERGE READY

- No contract term, included entities/tenants, user limits, or fair-use policy is documented for any of the three "unlimited" claims.
- No SLA response time or support channels are defined for "priority support."
- No implementation, integration, data migration, or out-of-scope/exclusions section exists for a package being sold at a fixed monthly price.
- No product-owner approval, commercial-owner approval, or audit note supports the package as drafted.
- "Guaranteed recovery workflows" directly contradicts both the ESTARED and NCGR profiles' forbidden-claim lists, which on its own prevents a PASS from `product-governor`, `crag`, and `legal-compliance-reviewer`.

## Why This Is Not BLOCK MERGE

- The defects here are additive/correctable: adding scope boundaries, fair-use terms, SLA definitions, and approvals resolves the `pricing-scope-skill`, `product-governor`, and `crag` findings without needing to reject the underlying Enterprise-tier product concept.
- No SAMA, banking, payment, or legal-enforcement approval claim is made.
- No RLS/security or financial-recognition logic is touched.
- The "guaranteed recovery" phrase, while forbidden, has not (in this scenario) been confirmed as already-published external content — it is caught here, pre-merge, while still correctable; **this is the one condition that must hold for FIX BEFORE MERGE to remain the verdict** — if it is left in place and shipped, the verdict escalates to BLOCK MERGE per the Legal/Compliance Review above.

## Correct Required Fixes

Before merge, either:

**Option A — Add commercial boundaries:**
- contract term
- included entities/tenants
- user limits or fair-use policy
- case/account volume limits or fair-use policy
- support SLA and channels
- implementation scope
- integration scope
- data migration scope
- exclusions/out-of-scope items
- human approval requirement for recovery actions
- product-owner approval
- commercial-owner approval
- legal/compliance approval for external copy
- audit note
- evidence_refs

**Option B — Use safer wording:**

> "Enterprise includes configurable recovery workflow support, executive dashboard access, and priority support within an agreed scope, fair-use limits, and approved implementation plan."

**Forbidden wording:**
- guaranteed recovery
- unlimited recovery automation
- all overdue customers
- unlimited users without fair-use policy
- full AI follow-up without human authority boundaries

## Final Recommendation

- Do not merge as written.
- Remove guaranteed/unlimited wording or add clear commercial boundaries and approvals.
- Use safer wording until pricing scope is approved.
- Re-run PR Review Runtime after fixes.
- No automatic merge authorization is granted.
