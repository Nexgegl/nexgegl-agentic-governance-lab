# Competitor Claim / Trust Audit Benchmark v1.0

> This is a **simulation only** report testing `05-routines/pr-pre-merge-review.md` (PR Review Runtime v1.0) logic against a hypothetical PR that introduces a named-competitor comparison with exclusivity, trust, and superiority claims on the ESTARED marketing site. Unlike the NCGR recovery-status benchmarks (financial classification logic), the Supabase/RLS benchmark (data access control), the Evidence Readiness benchmarks (quantified product/dashboard claims), and the Pricing/Commercial Scope benchmark (package/SLA/fair-use boundaries), this benchmark isolates **competitor and trust claim governance**: naming a competitor, exclusivity ("only") wording, and unverified trust/security/outcome superiority claims — testing whether `competitor-trust-audit-skill` activates and correctly flags an unsupported comparative claim independently of the other four domains. No real PR, no application code beyond the simulated snippet described below, and no modification to any existing Runtime/Standard/Skill/Agent/Profile/Benchmark/Index file.

## Executive Verdict

**FIX BEFORE MERGE**

## Scenario

- **PR Title:** "Add competitor comparison block to ESTARED landing page"
- **Changed File:** `apps/web/src/components/marketing/CompetitorComparisonBlock.tsx`
- **Proposed Copy:**
  > "Unlike Ebra and other collection platforms, ESTARED is the only AI-powered recovery governance platform in Saudi Arabia with verified decision governance, stronger trust controls, and safer recovery outcomes for every overdue account."
- **Evidence Provided:**
  - Competitor source list: missing
  - Competitor feature matrix: missing
  - Source dates: missing
  - Methodology: missing
  - Legal/compliance review: missing
  - Trust/security evidence: missing
  - Verification basis for "only": missing
  - Basis for "stronger trust controls": missing
  - Basis for "safer recovery outcomes": missing
  - Basis for "every overdue account": missing
  - Product-owner approval: missing
  - Marketing-owner approval: missing
  - Audit note: missing

## Runtime Trigger Analysis

| Trigger | Present? | Activated Agent / Skill | Notes |
|---|---|---|---|
| Named competitor | Yes | `competitor-trust-audit-skill` + `legal-compliance-reviewer` | "Ebra" is named directly; per the skill's own §2 ("When to Use"), any comparison of NEXGEGL/ESTARED against a named competitor in sales/positioning material triggers this skill before publication |
| Competitor comparison | Yes | `competitor-trust-audit-skill` | "Unlike Ebra and other collection platforms" is a direct comparative claim, not a neutral capability description |
| Exclusivity claim / "only" | Yes | `product-governor` + `legal-compliance-reviewer` | "the only AI-powered recovery governance platform in Saudi Arabia" is a market-exclusivity claim requiring a documented market scan, not merely an internal product description |
| Trust/security claim | Yes | `legal-compliance-reviewer` + `crag` | "verified decision governance" and "stronger trust controls" assert trust/security superiority without citing what was verified, by whom, or against what baseline |
| Safer/better outcome claim | Yes | `evidence-pack-builder-skill` + `legal-compliance-reviewer` | "safer recovery outcomes" is a comparative performance/safety claim requiring benchmark evidence, matching the pattern the Evidence Readiness benchmarks isolate for quantified claims — here applied comparatively against a competitor |
| Customer-facing marketing copy | Yes | `product-governor` + `legal-compliance-reviewer` | `CompetitorComparisonBlock.tsx` on the landing page is unambiguously public/customer-facing; unlike the internal-dashboard benchmarks, there is no classification ambiguity here |
| Missing comparison methodology | Yes | `competitor-trust-audit-skill` + `evidence-pack-builder-skill` | Per the skill's Execution Workflow (§5), every claim axis must be classified Documented / Undocumented / Not Verifiable From Available Source — no source, feature matrix, or dates are provided for any axis |
| `legal-compliance-reviewer` required (§7 of Routine — customer-facing claims, `testimonial`/`metrics`-adjacent superiority wording) | Yes | `legal-compliance-reviewer` | Public copy naming a competitor and asserting exclusivity/safety superiority is exactly the customer-facing claim category §7 requires this agent for; activation is **Required**, not advisory, because the copy is confirmed public |
| RLS/security implementation trigger (`supabase/`, `migrations/`, `rls`, `tenant_id`, database/auth) | No | `security-rls-auditor` = **N/A** | Changed file is a frontend marketing component; no database, auth, RLS, or Supabase path touched |
| NCGR recovery-status classification trigger (RECOVERED/PROMISED_TO_PAY/recovered_cash_total) | No | N/A | No recovery status classification, debtor/account state, or cash total field is touched — this is landing-page marketing copy, not a status transition |
| Pricing-scope trigger (package/price/SLA/fair-use) | No | `pricing-scope-skill` = **N/A** | No price, package tier, contract term, or SLA is introduced by this change; the claims are competitive/trust positioning, not commercial packaging |

## Activated Agents

| Agent | Required? | Reason |
|---|---|---|
| `crag` | ✅ **Required** | Always mandatory; "verified decision governance" and "stronger trust controls" are unauthorized product promises asserted without Evidence + Authority + Audit behind them, and the claim-to-evidence/authority/audit chain is incomplete — exactly the drift this agent exists to catch |
| `product-governor` | ✅ **Required** | Always mandatory; an exclusivity claim ("the only... in Saudi Arabia") and an overbroad universal claim ("every overdue account") are unauthorized product promises/scope overreach falling squarely within its standing duty to flag Product Logic Drift |
| `legal-compliance-reviewer` | ✅ **Required** | Customer-facing competitor/superiority copy is legally sensitive by nature — naming a competitor and asserting unverified safety/trust superiority carries defamation, unfair-competition, and consumer-protection risk; per the ESTARED profile (§6, Claims Rules: "no fake metrics," "no invented testimonials") and its ban on unverified claims, this activation is binding |
| `security-rls-auditor` | ⛔ **N/A** | No data access, authentication, RLS, or Supabase path is touched; this is a display-only marketing component |
| `cfo-logic-reviewer` | ⛔ **N/A** | No financial calculation, DSO, aging, receivables, or cash-impact logic is changed; the claims are competitive positioning, not financial classification |

## Required Skills

| Skill | Required? | Reason |
|---|---|---|
| `claude-code-pr-review-skill` | ✅ Yes — always | Evaluates the PR in MERGE READY / FIX BEFORE MERGE / BLOCK MERGE form (§5 of the Routine) |
| `product-governance-review-skill` | ✅ Yes — always | Evaluates consistency of the change with NEXGEGL governance, specifically the Evidence Layer, Authority Layer, and Terminology/Claim discipline axes |
| `competitor-trust-audit-skill` | ✅ **Required** | Directly applicable per its own §2 ("When to Use"): NEXGEGL/ESTARED is being compared against a named competitor in positioning material, which is precisely the trigger condition this skill exists for |
| `evidence-pack-builder-skill` | ✅ **Required** | The "safer recovery outcomes" and "stronger trust controls" claims are quantifiable/verifiable performance and trust assertions with zero supporting evidence — directly applicable per the skill's own §2 ("a specific claim is present and its evidentiary readiness is in doubt") |
| `executive-brief-skill` | ⛔ N/A | No management summary of this benchmark's outcome is being produced as part of this PR |
| `pricing-scope-skill` | ⛔ N/A | No pricing or commercial package terms are touched |
| `cash-recovery-decision-skill` | ⛔ N/A | No recovery decision classification logic (COLLECT/RECONCILE/ESCALATE/HOLD/WRITE-OFF REVIEW) is changed |

## Competitor / Trust Claim Review

| Claim / Term | Evidence Required | Provided? | Risk | Verdict |
|---|---|---|---|---|
| Unlike Ebra and other collection platforms | competitor source list + fair comparison methodology | No | unsupported named competitor comparison | FIX |
| only AI-powered recovery governance platform in Saudi Arabia | market scan + date + inclusion/exclusion criteria | No | unsupported exclusivity claim | FIX |
| verified decision governance | verification source + scope | No | unsupported trust/governance claim | FIX |
| stronger trust controls | control comparison matrix + evidence | No | unsupported superiority claim | FIX |
| safer recovery outcomes | benchmark/outcome evidence | No | unsupported safety/performance claim | FIX |
| every overdue account | eligibility/scope evidence | No | overbroad universal claim | FIX |

## Evidence Pack Builder Simulation

```
EVIDENCE PACK — ESTARED Competitor Comparison Block Claims — 2026-07-15

Evidence Required:
- Named-competitor claim source list (public materials, dated screenshots,
  or first-party disclosures for "Ebra and other collection platforms")
- Fair comparison methodology (criteria used, scope of comparison, date of
  data collection)
- Market scan supporting "only AI-powered recovery governance platform in
  Saudi Arabia" (competitor set considered, inclusion/exclusion criteria,
  scan date)
- Verification source and scope for "verified decision governance"
  (what was verified, by whom, against what standard)
- Control comparison matrix supporting "stronger trust controls"
  (named controls, competitor's controls, comparison basis)
- Benchmark/outcome evidence supporting "safer recovery outcomes"
  (measurement method, dataset, baseline, calculation — same evidentiary
  bar as the Evidence Readiness benchmarks' quantified-claim requirement)
- Scope evidence for "every overdue account" (is coverage actually
  universal, or configuration/data-quality dependent?)
- Product-owner approval
- Marketing-owner approval
- Legal/compliance approval for external competitor-naming copy
- Audit note

Evidence Received:
- None of the above — no competitor source list, no methodology, no market
  scan, no verification source, no control matrix, no benchmark evidence,
  no scope evidence, no product-owner approval, no marketing-owner approval,
  no legal/compliance approval, no audit note

Evidence Gaps:
- Complete gap on every claim axis listed above — six distinct claims
  (named-competitor comparison, exclusivity, verified governance, trust
  control superiority, outcome safety superiority, universal account
  coverage) each lack any supporting evidence

Source Reliability: N/A — no evidence was received to rate

Decision Readiness: Not Ready — none of the six claims in this copy block
can be published or merged as stated; there is no verifiable basis for any
of them, and several (named competitor, "only," "every") carry legal and
reputational risk independent of the evidence gap

Audit Trail Requirement: If evidence is later produced for any retained
claim, the source list, methodology, market scan, verification basis, and
approvals must be recorded and linked from the PR/commit so the claim
remains auditable after merge; claims that cannot be evidenced must be
removed rather than shipped as unverifiable

Next Evidence Request: Request from product/marketing ownership — either a
fully documented, dated, source-backed competitor comparison and market
scan with legal sign-off, or authorization to replace the block with the
safer, evidence-neutral wording pending that evidence
```

**Decision Readiness = Not Ready.** **Verdict = FIX.**

## Legal / Compliance Review

- Customer-facing competitor and superiority claims trigger `legal-compliance-reviewer` — this is not advisory in this scenario; the copy is confirmed public landing-page content, unlike the internal-dashboard benchmarks.
- Naming Ebra or any competitor requires a careful, source-backed, factual, non-misleading comparison; an unsupported comparative claim against a named competitor carries defamation and unfair-competition exposure beyond ordinary unsupported marketing copy.
- "Only", "stronger", "safer", and "every" are high-risk wording patterns when unsupported — each is an absolute or superlative claim that a single counterexample can falsify, and each independently would need its own evidence chain even if the others were resolved.
- The claim must not imply competitor inferiority without evidence — "unlike Ebra... ESTARED is the only... with... stronger... and safer..." implies Ebra lacks governance, trust controls, and safe outcomes, none of which is documented from any source.
- The safest corrective action is removing the named competitor and using evidence-neutral positioning, consistent with the ESTARED profile's Claims Rules (§6: no fake metrics, no invented testimonials) and Approved Message Direction (§11), which model positioning around what ESTARED does and what requires human authority — not comparative superiority claims.
- If unsupported named-competitor or superiority claims remain in public copy after this review cycle, the verdict escalates to **BLOCK MERGE** — this benchmark's FIX BEFORE MERGE result holds only because the wording is correctable pre-merge, not because any of these claims are acceptable as shipped.

## Product Governance Review

```
PRODUCT GOVERNANCE REVIEW — ESTARED Competitor Comparison Block — 2026-07-15
التصنيف: Product Repo

SDGM/KFSA Separation: N/A — no SDGM/KFSA logic touched by this marketing copy
Signal vs Decision Separation: FIX — "verified decision governance" asserts an institutional-grade verification outcome as established fact with no Evidence + Authority + Audit behind it, collapsing an unverified claim into an assumed decision-grade fact
Authority Layer: FIX — no product-owner or marketing-owner approval is documented for a public competitor-naming claim
Evidence Layer: FIX — six distinct claims (named-competitor comparison, exclusivity, verified governance, trust superiority, outcome safety superiority, universal coverage) are presented with zero supporting evidence
Audit Trail: FIX — no audit note documents how/when any of these claims were validated or approved for publication
Tenant Isolation: N/A — no tenant-scoped data access is touched by this UI copy
AI Boundary: PASS — "AI-powered" is descriptive framing consistent with prior benchmarks' treatment of this phrase; it is not itself the primary defect here, though it compounds the exclusivity claim's evidentiary gap
Terminology Drift: PASS — no governance term (Signal/Decision/SDGM/KFSA) or ESTARED/NCGR naming is altered or confused

OVERALL: FIX
الإجراء المطلوب: إزالة اسم المنافس (Ebra) والادعاءات المقارنة غير المدعومة
("only"، "stronger"، "safer"، "every")، أو استكمال قائمة مصادر المنافس،
منهجية المقارنة، أدلة الثقة/الأمان، واعتمادات مالك المنتج والتسويق
والمراجعة القانونية قبل الدمج
```

- Product positioning may legitimately differentiate ESTARED/NCGR from other platforms, but competitor claims must be evidence-backed before they reach public copy.
- Trust/security claims must map to actual documented controls and a stated comparison scope — "stronger trust controls" without naming which controls or against what baseline is not verifiable positioning, it is an assertion.
- Recovery outcome claims must not be universal or guaranteed; "safer recovery outcomes for every overdue account" combines an unproven safety claim with an unproven universality claim in a single sentence.
- The underlying product direction (differentiating ESTARED on governance and trust) may be entirely valid; the issue is that this specific wording and its complete absence of supporting evidence are not ready to ship.

## Competitor Trust Audit Skill Simulation

```
COMPETITOR TRUST AUDIT — Ebra (as named in ESTARED landing page copy) — 2026-07-15

Claims: The PR does not audit Ebra's own claims from an Ebra-controlled
source — it asserts comparative claims about Ebra with no Ebra source
material provided at all. Per the skill's Missing Input Handling (§3), the
correct classification for every comparison axis is "Not Verifiable From
Available Source," because no competitor source (link, screenshot,
marketing text, deck) was supplied to audit against.

Claims Detected (within the ESTARED PR copy itself, requiring evidence
before publication):
- "Unlike Ebra and other collection platforms" (implies inferiority without
  a cited comparison source)
- "the only AI-powered recovery governance platform in Saudi Arabia"
  (exclusivity claim)
- "verified decision governance" (trust/verification claim)
- "stronger trust controls" (comparative security/trust claim)
- "safer recovery outcomes" (comparative safety/performance claim)
- "every overdue account" (universal scope claim)

Evidence Required: Competitor source list, comparison methodology, source
dates, feature/control comparison matrix, market scan for the "only" claim
with inclusion/exclusion criteria, and a documented basis for each trust/
outcome claim (per Execution Workflow §5, each claim axis must be
classified Documented / Undocumented / Not Verifiable From Available
Source)

Evidence Received: None — no competitor source, no methodology, no dates,
no comparison matrix, no market scan

Trust Risk: High — the copy asserts Ebra is inferior on governance, trust
controls, and safety without any cited source, which is the exact anti-
pattern this skill's Anti-Patterns (§8) warns against: "issuing an AVOID-
equivalent judgment about a competitor without documented red flags actually
present in a source" — here inverted, ESTARED's own copy implies a
negative judgment about Ebra with no documented basis at all

Legal/Marketing Risk: High — naming a real competitor and asserting
unverified superiority in public copy carries defamation and unfair-
competition exposure; this is compounded by the exclusivity ("only") and
universality ("every") absolute wording, each independently high-risk if
later shown false by a single counterexample

Decision Readiness: Not Ready — per the skill's Quality Gates (§7), a
FAIL-level outcome occurs when a judgment is issued "without any supporting
evidence mentioned"; this benchmark holds the result at FIX rather than
FAIL because the claim has not yet been published externally as final
copy — it is caught here, pre-merge, while still correctable

VERDICT: FIX
مبرر الحكم: لا يوجد مصدر واحد موثَّق لأي من الادعاءات المقارنة الستة؛ النشر
بصيغته الحالية يخالف قاعدة "لا اختلاق حقائق عن المنافس" وقاعدة "لا حكم
مؤسسي بلا Evidence + Authority + Audit" في آنٍ واحد.
```

**Decision Readiness = Not Ready.** **Verdict = FIX.**

## Decision Aggregation

- **`competitor-trust-audit-skill` = FIX** — Every comparison axis is classified "Not Verifiable From Available Source" per the skill's own Missing Input Handling, and the copy issues an implied negative judgment about a named competitor with zero documented red flags or evidence, matching this skill's FIX-level (not FAIL-level) gate because the gap is correctable pre-publication rather than a claim already shipped as an unverifiable, unretractable judgment.
- **`evidence-pack-builder-skill` = FIX** — Evidence Required and Evidence Received are fully separated per its own operating rules, and the gap is total across all six claims; Decision Readiness is Not Ready, which is FIX-level because the gap is correctable (remove or evidence each claim), not a case of the pack being falsely presented as complete.
- **`product-governor` = FIX** — Unauthorized/undocumented product promises (exclusivity, trust superiority, universal safety) are present without approval; this is correctable drift (remove or evidence the claims, add approvals) rather than a brand-name change or product-scope violation, so it is FIX rather than FAIL.
- **`crag` = FIX** — The claim-to-evidence/authority/audit chain is incomplete across every claim in the block: assertions are stated as established fact without Evidence, without product-owner/marketing-owner Authority, and without an Audit note. This is a correctable inconsistency, not a redefinition of a governing term, so it is FIX rather than FAIL.
- **`legal-compliance-reviewer` = FIX, with escalation risk to BLOCK if unsupported competitor/superiority claims remain** — Named-competitor comparison plus exclusivity, trust-superiority, and universal-safety wording in confirmed public copy is exactly the pattern this agent's Quality Gates classify as needing evidence or more conservative wording at minimum, and FAIL-level (escalating the routine's aggregate result toward BLOCK MERGE) if shipped externally unsupported.
- **`security-rls-auditor` = N/A** — no data access/auth/RLS path touched.
- **`cfo-logic-reviewer` = N/A** — no financial calculation logic touched.
- **`pricing-scope-skill` = N/A** — no price, package, or SLA term is introduced by this change.
- **Overall Verdict = FIX BEFORE MERGE**, per §8 of the Routine: no agent issued FAIL/BLOCK MERGE, but multiple required reviews (`competitor-trust-audit-skill`, `evidence-pack-builder-skill`, `product-governor`, `crag`, `legal-compliance-reviewer`) issued FIX, which sets the aggregate floor at FIX BEFORE MERGE; §8 also independently sets a floor of at least FIX BEFORE MERGE whenever a §7 legal-sensitive trigger (customer-facing competitor/superiority claims) is present without a completed `legal-compliance-reviewer` sign-off.

**MERGE READY is not allowed because competitor, trust, exclusivity, and outcome claims lack evidence, methodology, approvals, and audit trail.**

**BLOCK MERGE is not required if named competitor and unsupported superiority/exclusivity wording are removed or properly supported before merge.**

## Correct Required Fixes

Before merge, either:

**Option A — Add evidence and approvals:**
- competitor source list
- comparison methodology
- source dates
- feature/control comparison matrix
- market scan for "only" claim
- inclusion/exclusion criteria
- trust/security control evidence
- recovery outcome benchmark evidence
- product-owner approval
- marketing-owner approval
- legal/compliance approval
- audit note
- evidence_refs

**Option B — Use safer wording:**

> "ESTARED helps organizations structure recovery workflows with evidence, authority, and audit controls before action is taken."

**Forbidden wording unless fully supported and approved:**
- unlike Ebra
- better than competitors
- only AI-powered recovery governance platform
- stronger trust controls
- safer recovery outcomes
- every overdue account
- guaranteed recovery
- competitors lack governance

## Final Recommendation

- Do not merge as written.
- Remove named competitor and superiority/exclusivity wording or provide full evidence and approvals.
- Use safer positioning until competitor/trust evidence is approved.
- Re-run PR Review Runtime after fixes.
- No automatic merge authorization is granted.
