# NEXGEGL Vertical Plugin Architecture — Foundation

See `docs/architecture/ADR-vertical-plugin-foundation-v1.md` for the full
architecture. This page is a short index.

## What a plugin is

A plugin is a domain package, not a single prompt — a versioned, installable
unit bundling skills, agent declarations, connector permissions, hooks,
policies, a profile schema, and evidence outputs for one institutional
governance domain.

## Source of truth

Structured database profiles (`organization_profiles`, `domain_profiles`,
`plugin_installations`, `skills`) are the source of truth. A CLAUDE.md-
compatible file can be generated from them for human/LLM consumption — it
is a projection, never something written back to the database, and never
authoritative if it disagrees with the structured records.

## What a plugin can never do

Skills are controlled capabilities; connectors are permissioned tools.
Task ≠ Signal ≠ Promotion Request ≠ Decision ≠ Action. A plugin can prepare
a Promotion Request; it can never create a formal decision, generate a
KFSA decision identifier, select KILL/FIX/SCALE/ALERT as an official
decision, or set `production_approval_status` to `true`. ReviewOutcome
(`PASS`/`FIX`/`FAIL`/`ESCALATE`) is a separate vocabulary from KFSA's
decision vocabulary and is never automatically mapped to it.

## The pilot: ai-governance

See `docs/plugins/ai-governance.md`.

## Documents in this set

- `docs/plugins/ai-governance.md` — the pilot plugin, what's implemented vs. declared
- `docs/plugins/plugin-security-boundary.md` — auth, secrets, connector permissions
- `docs/plugins/context-composition.md` — how a run context snapshot is built
- `docs/plugins/kfsa-integration-boundary.md` — where this repo stops relative to KFSA
