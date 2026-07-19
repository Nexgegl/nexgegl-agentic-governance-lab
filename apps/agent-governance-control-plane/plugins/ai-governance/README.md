# ai-governance plugin

**Status: `experimental`. Not production-approved.** See
`docs/architecture/ADR-vertical-plugin-foundation-v1.md` for the full
architecture this plugin is the pilot for.

## What this is

A domain plugin providing institutional AI governance capability: AI
inventory intake, use-case qualification, vendor review, evidence
collection, governance risk assessment, and promotion-request preparation.

Only **AI Inventory Intake** is wired end-to-end in this MVP (context
composition → server-side execution → evidence persistence → audit). The
other five skills are fully declared (permissions, required profile
fields, evidence requirements) but return a structured `not_implemented`
rejection if called — see each file under `skills/`.

## What this is not

- Not an autonomous execution engine. Every run is a single server-side
  request, explicitly triggered, explicitly permission-checked.
- Not a source of formal decisions. This plugin can prepare a Promotion
  Request; it cannot create a decision, a KFSA verdict, or set
  `production_approval_status` to `true`.
- Not a copy of any external repository's code or content. Anthropic's
  `claude-for-legal` repository was used only as an architectural
  reference for "plugin = domain package."

## Layout

```
plugin.manifest.json   — capability declaration, permissions, prohibited list
profile.schema.json    — JSON Schema for this domain's institutional profile
skills/                — 6 skill definitions (1 implemented, 5 declared)
connectors/             — 3 connector definitions (1 real: Supabase internal
                          read-only; 2 placeholders, not configured)
policies/               — prohibited-capabilities policy (enforced in code,
                          not just declared here)
hooks/, agents/         — deferred; see each directory's README
templates/              — CLAUDE.md-compatible context projection template
```

## Where the runtime code lives

The plugin's *data* (manifest, skill/connector declarations) lives here.
The plugin's *execution code* lives alongside the rest of the app's
server-side code, not inside this directory, so it can share the existing
Supabase clients, repositories, and auth boundary rather than duplicating
them:

- `lib/plugins/context-composer.ts` — Context Composer
- `repositories/plugins-repository.ts`, `repositories/plugin-runs-repository.ts`,
  etc. — data access
- `app/api/plugins/[pluginId]/skills/[skillId]/runs/route.ts` — execution
  boundary
- `app/(app)/plugins/...` — UI

See `docs/plugins/ai-governance.md` for the full walkthrough.
