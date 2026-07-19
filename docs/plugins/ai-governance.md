# ai-governance plugin

Status: `experimental`. `production_approval_status = false` (locked).

## Skills: what's real vs. declared

| Skill | execution_status | What happens if you run it |
|---|---|---|
| AI Inventory Intake | `implemented` | Registers a new use case in a neutral, ungoverned state (`governance_status = GOVERNANCE_REVIEW_REQUIRED`), persists an evidence record, creates audit events. |
| AI Use Case Qualification | `not_implemented` | Rejected with `skill_not_implemented` before any handler runs. |
| AI Vendor Review | `not_implemented` | Same. |
| Evidence Collection | `not_implemented` | Same. |
| Governance Risk Assessment | `not_implemented` | Same. |
| Promotion Request Preparation | `not_implemented` as its own skill | The *capability* exists as a generic path (`lib/plugins/promotion-request-composer.ts`, reachable from any completed run's Run Result page), not as this specific governed skill. See below. |

This is a deliberate scope decision, not an oversight — see ADR §15. Each
`not_implemented` skill is still fully declared: real permissions, real
required-profile-fields, real evidence requirements, all inspectable via
`/plugins/ai-governance/skills`.

## Skill definitions are global, not tenant-owned

All six skills above are rows in `public.skill_definitions` — a global
platform catalog table with no `organization_id` column. This is
capability metadata ("what does this skill do, is it executable, what
does it require"), identical for every organization that installs
ai-governance; it is not tenant data. Installing the plugin for a new
organization does not clone or duplicate these six rows — it creates a
`plugin_installations` row for that organization, and the same six global
`skill_definitions` become visible and runnable through it. Whether a
specific organization has a specific skill enabled is the only genuinely
tenant-scoped piece, and it lives in `plugin_skill_permissions` (absence
of a row means enabled by default; an explicit `enabled = false` row
disables it for that organization's installation only).

This table is distinct from two other, unrelated tables that share
similar names:
- `public.skills` — pre-existing, organization-scoped, used by the
  unrelated "Governed Research Runtime" skills (institutional-research-
  planning, evidence-collection, source-quality-review, governance-risk-
  analysis, decision-packet-drafting). Untouched by the plugin
  architecture; ai-governance no longer inserts rows here.
- `public.skill_versions` — also pre-existing and organization-scoped,
  predates this plugin architecture, and is unused by it. The plugin's
  own immutable version history lives in `skill_definition_versions`
  instead.

An earlier version of this plugin's migrations stored the six skills as
organization-scoped rows in the legacy `skills` table, which meant only
the one organization already present in seed data could ever run them —
any other organization that installed the plugin saw zero skills. This
was found and fixed before merge (see the ADR's "Multi-tenant skill
catalog correction" note and
`supabase/migrations/20260720100004_create_global_skill_catalog.sql`
onward) and is covered by the `multi-org-*` cases in `npm run
test:plugin-governance`.

## Why Promotion Request Preparation isn't "the" implemented path

The pilot's one real skill (AI Inventory Intake) produces a decision
candidate. Rather than leave the Promotion Request boundary entirely
theoretical, `preparePromotionRequestFromRun()` provides a generic
"prepare a Promotion Request from any completed run's decision candidate"
path, reachable from the Run Result screen. It enforces the same
constitutional boundary (no formal decision, no KFSA code, ReviewOutcome
left `null` until a real evaluator exists) but is intentionally generic
rather than being the specific, not-yet-built
`promotion-request-preparation` skill.

## Cold Start

`POST /api/plugins/ai-governance/cold-start` (UI: `/plugins/ai-governance/cold-start`)
accepts 7 grouped sections (Organization, AI Environment, Authority, Risk,
Evidence, Escalation, Connectors) and upserts `organization_profiles` +
`domain_profiles`. It does not ask every possible institutional question —
only the fields in `plugins/ai-governance/profile.schema.json`. Output:
completeness score, missing critical fields, and a generated context
preview (never written back to the database).

## Known gap: profile schema validation

`lib/plugins/profile-schema.ts` is a hand-written mirror of
`profile.schema.json`'s required-field list — there is no JSON-Schema
validation library in this MVP, so the two files must be kept in sync by
hand. This is a real limitation, not a silent one.
