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
