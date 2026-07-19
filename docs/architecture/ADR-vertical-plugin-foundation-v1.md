# ADR: Vertical Plugin Foundation v1

## Status

**PROPOSED — IMPLEMENTED AS CONTROLLED MVP FOUNDATION**

Not Board Approved. Not Constitutionally Locked. Not production-approved.

## Constitutional reference note (read first)

This ADR was asked to reference "KFSA Governance Architecture v1.0 — APPROVED /
LOCKED." No document with that title exists anywhere in this repository. The
closest real artifacts, and the ones this ADR actually cites, are:

- `claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md`
  — status **PASS WITH FOLLOW-UP**, not locked/approved. Defines KFSA's
  KILL/FIX/SCALE/ALERT decision-action vocabulary and forbids collapsing it,
  dropping ALERT, or silently mapping it to/from review-verdict vocabulary.
- `claude-operating-system/02-product-profiles/sdgm-kfsa/CLAUDE.sdgm-kfsa.md`
  — v1.0, documentary only, no verdict logic. Explicitly designates
  repositories like this one as the sanctioned "Experiment Repo" for
  SDGM/KFSA-*adjacent* work, while the real SDGM/KFSA kernel stays in a
  separate Core IP repo this codebase does not contain.
- This app's own existing runtime boundary language (`runtime/types.ts`,
  `lib/governance-model.ts`, `runtime/skill-loader.ts`, `runtime/planner.ts`),
  already in production in this codebase before this ADR, already enforcing:
  `ReviewOutcome = PASS | FIX | FAIL | ESCALATE`, distinct from KFSA's
  `KILL | FIX | SCALE | ALERT`; no `official_decision`/`official_verdict`/
  `KFSA verdict` generation anywhere; `production_approval_status` always
  `false`.

Everywhere this ADR or the code it describes says "constitutional
reference," it means these three artifacts, not a locked v1.0 architecture
document. This is a citation-accuracy correction, not a governance
objection — nothing in the task conflicts with anything actually locked.

## Multi-tenant skill catalog correction (read second)

An independent pre-merge review of this ADR's first implementation found
that §6/§8 below originally described plugin skills as rows in the
existing, organization-scoped `skills` table (tagged with `plugin_id`).
Because `skills.id` is a plain global text primary key, not composite with
`organization_id`, and nothing provisioned a duplicate row per installing
organization, that design meant only the one organization already present
in `skills` could ever run the plugin's skills — any other organization
that installed `ai-governance` would install successfully but see zero
skills and be unable to run any of them.

This was corrected before merge, additively (see
`supabase/migrations/20260720100004_create_global_skill_catalog.sql`
onward): plugin-owned skill declarations now live in a new, **global**
`skill_definitions` table (no `organization_id` column — this is capability
metadata, identical for every installing organization, not tenant data),
with an immutable `skill_definition_versions` history table alongside it.
Whether a specific organization's installation has a given skill enabled
remains tenant-scoped, in `plugin_skill_permissions`, exactly as before.
§6, §7, and §8 below describe the corrected model as it now stands. The
legacy `skills` table (organization-scoped, pre-existing, used by the
unrelated Governed Research Runtime skills) was left untouched, and the
pre-existing (also organization-scoped, unused-by-plugins) `skill_versions`
table was likewise left untouched rather than repurposed — see
`docs/plugins/ai-governance.md` for the full distinction between the three
tables.

## 1. Purpose

Establish the first controlled foundation for a NEXGEGL Vertical Plugin
Architecture: a way to package a bounded institutional domain capability
(skills, agents, connectors, hooks, policies, a profile schema, context
generation, evidence outputs) as a versioned, installable, tenant-scoped
unit — without ever letting that unit originate a formal governed decision.

Anthropic's `claude-for-legal` repository is used only as an architectural
reference for "vertical plugin = domain package, not a single prompt." No
legal content and no code from that repository is copied into this
codebase.

This ADR covers the foundation plus one pilot plugin: `ai-governance`.

## 2. Domain Plugin definition

A **Domain Plugin** is a versioned, installable package that provides a
complete institutional capability for one governance domain (e.g. AI
governance, vendor risk, data protection). It bundles the skills, agent
declarations, connector permissions, hooks, and policies needed to serve
that domain, plus a profile schema describing what institutional data the
domain needs to operate safely.

A plugin is data + declared capability, not an autonomous authority. It
runs only inside the platform's existing tenant, auth, and RLS boundary and
only through the server-side execution boundary defined in this ADR.

## 3. Plugin responsibilities

A plugin may:

- Collect information (intake).
- Qualify signals (turn raw input into a structured candidate for review).
- Execute its own approved skills, scoped to its declared permissions.
- Use its own approved connectors, scoped to declared operations.
- Produce evidence outputs, persisted and attributable.
- Prepare decision candidates (structured, non-binding recommendations).
- Create Promotion Requests addressed to KFSA Ingress.

## 4. Plugin prohibited responsibilities

A plugin may never:

- Create a formal governed decision.
- Generate a KFSA decision identifier or code.
- Select KILL / FIX / SCALE / ALERT as an official decision.
- Issue execution authorization.
- Bypass KFSA.
- Redefine canonical KFSA semantics, or silently map ReviewOutcome to KFSA
  vocabulary.
- Set `production_approval_status` to `true`.
- Expose connector or service-role credentials to browser code.

These prohibitions are enforced structurally (schema constraints, server-
only execution, explicit allow-lists), not by convention alone — see
§10 Security Boundaries and §12 for how this differs from a CLAUDE.md-only
guarantee.

## 5. Profile layer relationships

```
Organization Profile (tenant identity + institutional facts)
        │
        ▼
Domain Profile (per-domain institutional facts, e.g. ai-governance)
        │
        ▼
Plugin Installation Profile (which plugin version is installed, its
        │                    permissions, its state)
        ▼
Run Context (one execution's fully-resolved, immutable context snapshot)
```

- **Organization Profile**: one row per tenant (`organization_profiles`,
  1:1 with the existing `organizations` table). Sector, jurisdictions,
  business units, governance model, risk appetite — facts that are true of
  the whole organization regardless of which plugin is running.
- **Domain Profile**: one row per (organization, domain) — e.g. the
  `ai-governance` domain profile holds AI governance owner, authority
  matrix references, prohibited AI uses, restricted data classifications,
  evidence requirements, escalation thresholds, approved connectors/models/
  deployment environments, human review requirements, applicable policies.
- **Plugin Installation Profile**: one row per (organization, plugin
  version) — which version is installed, its lifecycle state, its
  connector/skill permission grants for this tenant.
- **Run Context**: the immutable, composed snapshot for one execution,
  produced by the Context Composer (§ Phase 7) from all of the above plus
  the current actor, authority context, and target use case.

Each layer is strictly narrower and more specific than the one above it.
Nothing below the Run Context layer is allowed to invent facts not present
above it.

## 6. Entity relationships

```
Plugin ─┬─ has many ─ Skill (global `skill_definitions` catalog, tagged
        │              with plugin_id — see "Multi-tenant skill catalog
        │              correction" above; not the legacy `skills` table)
        ├─ declares  ─ Agent  (deferred in this MVP — see §15)
        ├─ has many ─ Connector permission (plugin_connector_permissions)
        ├─ has many ─ Hook       (declared in manifest; no hook runtime yet)
        ├─ has many ─ Policy     (declared in manifest; references existing
        │                         governance vocabulary, not new policy text)
        └─ produces  ─ Evidence (plugin_evidence_outputs)

Skill run ─ produces ─ Evidence Package
                      ─ produces ─ Decision Candidate (fields on the
                                    Promotion Request, not a separate table
                                    — see §15)
                      ─ may create ─ Promotion Request → KFSA Ingress
                                     (external system boundary; this repo
                                     stops at Promotion Request creation)
```

A plugin never calls KFSA directly and never receives a KFSA verdict back
into its own tables — a Promotion Request is a one-way, structured request;
whatever KFSA does with it is out of this repository's scope.

## 7. Tenant-isolation requirements

- Two families of plugin-related tables:
  - **Tenant-owned** (`plugin_installations`, `organization_profiles`,
    `domain_profiles`, `plugin_skill_permissions`, `plugin_connector_permissions`,
    `plugin_run_contexts`, `plugin_runs`, `plugin_evidence_outputs`,
    `plugin_audit_events`, `promotion_requests`): every row carries
    `organization_id`, not-null, FK to `organizations(id)`, RLS-enabled,
    SELECT/INSERT/UPDATE policies scoped through the existing
    `current_user_organization_id()` helper (Phase 1's pattern, reused
    rather than reinvented).
  - **Global platform catalog** (`plugin_definitions`, `plugin_versions`,
    `skill_definitions`, `skill_definition_versions`): no `organization_id`
    column at all, by design — these describe what a plugin and its skills
    *are* (capability metadata), identical for every organization, not
    tenant data. RLS is still enabled on all four; the only policy is
    SELECT for any signed-in user, so no tenant-confidential data can ever
    live in these tables (there is no column to put it in), and no tenant
    can modify them (no write policy exists for any role but
    `service_role`).
- No insert/update/delete policy is granted to ordinary authenticated users
  on plugin/skill/connector definition tables — those are admin/service-role
  managed in this MVP, matching the existing posture of `organizations`,
  `skills`, and `tools`.
- The application's Supabase clients (`lib/supabase/client.ts`,
  `lib/supabase/server.ts`) already only ever use the anon key — this ADR
  adds nothing that reads `SUPABASE_SERVICE_ROLE_KEY` from any
  browser-reachable code path.

## 8. Versioning model

- `plugin_definitions`: one row per `plugin_id`, mutable metadata only
  (name, domain, owner, status, current pointer). Not tenant-owned — a
  plugin definition is platform-level, installations are tenant-level.
- `plugin_versions`: one immutable row per (`plugin_id`, `version`).
  Version rows are never updated after insert — a schema constraint plus
  application discipline enforce this (append-only in practice; see §11).
- `skill_definitions` / `skill_definition_versions`: the same
  definition/immutable-version-history pattern as
  `plugin_definitions`/`plugin_versions`, applied to individual skills.
  Both are global catalog tables (see §7) — installing the plugin for a
  new organization activates tenant-scoped permissions
  (`plugin_skill_permissions`) against these existing rows, it never
  clones or duplicates them. The pre-existing `skill_versions` table
  (organization-scoped, predates this ADR) is unrelated and untouched.
- Semantic versioning (`major.minor.patch`) is expected but not yet
  validated by a CI check in this MVP — deferred, see §15.

## 9. Installation lifecycle

States: `proposed → approved → installed → disabled | deprecated | blocked`.

- `proposed`: an org has requested installation; not yet active.
- `approved`: reviewed, not yet installed.
- `installed`: active; skills/connectors it's permitted for become callable
  for that tenant.
- `disabled`: temporarily inactive; the execution boundary rejects all runs.
- `deprecated`: superseded by a newer version; new runs rejected, existing
  evidence/audit history retained.
- `blocked`: forcibly disabled for cause (e.g. failed a trust scan); highest
  severity, same rejection behavior as `disabled` but distinguished for
  audit clarity.

`installed` (even for an `experimental`-status plugin) never implies
`production_approval_status = true` anywhere in the data model — the two
concepts are independent columns enforced independently.

## 10. Security boundaries

- Browser → SaaS server only. The browser never talks to Supabase directly
  for plugin execution — it calls the Next.js server route, which is the
  only thing holding a Supabase server client and the only thing that can
  read connector configuration.
- No connector secret ever appears in a client component, in a `NEXT_PUBLIC_*`
  variable, or in the JSON returned to the browser.
- Every run passes through: authenticate → resolve organization →
  verify installation → verify plugin status → verify skill permission →
  verify connector permission → compose context → execute → persist
  evidence/audit → return result. Any missing step fails closed (rejects),
  never proceeds with a default/assumed value.
- Formal-decision-shaped fields (`official_decision`, `official_verdict`,
  a KFSA code, `production_approval_status = true`) are rejected at the
  boundary if a caller (even an internal one) attempts to set them from a
  plugin run — see the negative tests in `scripts/validate-plugins.ts`.

## 11. Audit requirements

- `plugin_audit_events` is append-only in practice: the table has insert
  and select policies only; no update/delete policy exists for any
  non-service-role caller.
- Every state-changing action in this MVP (installation state change,
  context composition, skill run, promotion request creation) writes one
  audit event with actor, organization, plugin/skill/version references,
  and a timestamp.
- Audit events are tenant-scoped like everything else — no cross-tenant
  visibility.

## 12. Why CLAUDE.md alone is not the SSOT

A single CLAUDE.md file is unstructured prose: it cannot be queried,
versioned per tenant, validated against a schema, joined against
permissions, or used to enforce "this skill requires this profile field."
It also cannot express per-tenant state (which plugin version is installed,
whether a connector is enabled for this org) without becoming an
ever-growing, unauditable text blob.

In this architecture, structured database profiles (`organization_profiles`,
`domain_profiles`, `plugin_installations`) are the source of truth. A
CLAUDE.md-compatible artifact can be *generated* from that structured data
for a given tenant (see Phase 4's Cold Start output) — it is a read-only
projection for human/LLM consumption, never something written back into
the database, and never authoritative if it disagrees with the structured
records.

## 13. How structured profiles generate runtime context

The Context Composer (server-side only) reads the four profile layers in
§5, plus the current actor's authority and the target use case, and
assembls one immutable, inspectable JSON structure — never uncontrolled
string concatenation. It rejects composition outright if organization
context, plugin installation, or skill permission is missing, disabled, or
unapproved. The result is persisted as a `plugin_run_contexts` row and
referenced by its own id from then on — later steps read the snapshot, not
the live profile state, so a mid-run profile edit cannot silently change
the context of a run already in progress.

## 14. Rollback strategy

- Disabling a plugin installation (`disabled`/`blocked`) is immediate and
  reversible — it does not delete history, only blocks new runs.
  This is the primary rollback lever, in preference to migration rollback.
- Migrations in this ADR are additive only (new tables, one additive
  `ALTER TABLE` — no destructive changes to existing tables). Reverting
  is a `DROP TABLE IF EXISTS` set for the new tables only, safe to apply
  without touching `organizations`, `profiles`, `use_cases`, `skills`, or
  `tools`.
- No data migration touches existing rows in `skills`/`tools`/`use_cases`
  beyond adding nullable/defaulted columns where genuinely needed.

## 15. Explicit out-of-scope items (deferred, not silently dropped)

- **Agent definitions**: the `ai-governance` pilot ships skills only, no
  agent capability, so `agent_definitions` is deferred rather than created
  unused. Documented here so it isn't mistaken for an oversight.
- **Full hook runtime**: hooks are declarable in the manifest (for future
  lifecycle events) but no hook execution engine exists yet.
- **5 of 6 pilot skills are declared, not executable** in this MVP: only
  "AI Inventory Intake" is wired end-to-end (context composer → execution
  API → evidence → audit). The other five (Qualification, Vendor Review,
  Evidence Collection, Governance Risk Assessment, Promotion Request
  Preparation) exist as real `skill_definitions` rows with real
  permission/evidence declarations and `execution_status =
  "not_implemented"` at the execution layer — not placeholder files, but
  honestly not runnable yet. See `docs/plugins/ai-governance.md`.
- **Marketplace UI**: no discovery/search/rating UI; Phase 11's "Capability
  Registry" is a registry data model plus an inspection UI only.
- **Real trust scans**: `hidden_instruction_scan_status`,
  `prompt_injection_scan_status`, `connector_risk_status` are modeled with
  a `not_implemented` value and are never marked `passed` without a real
  check existing — there is no real scanner in this MVP.
- **CI enforcement of semver / migration validation**: not wired to a CI
  pipeline in this change; the validation script is run manually via npm
  script, matching the existing `validate:runtime`/`validate:supabase`
  pattern.
- **KFSA Ingress integration itself**: this repo creates and persists
  Promotion Requests; it does not implement or call an actual external
  KFSA Ingress endpoint, since none exists in this repository or was
  provided as a target.
