# Plugin security boundary

## Browser → SaaS server only

The browser never talks to Supabase directly for plugin execution. All
plugin routes are Next.js server route handlers
(`app/api/plugins/**/route.ts`) using `createServerSupabaseClient()` — the
same anon-key-plus-session-cookie client used everywhere else in this app.
No plugin code ever imports or reads `SUPABASE_SERVICE_ROLE_KEY`; this is
checked by `npm run validate:plugins`.

**One narrow, deliberate exception:** `lib/supabase/admin.ts` and
`repositories/kfsa-integration-admin-repository.ts` (added for the KFSA
Promotion Request Integration, see
`docs/plugins/kfsa-promotion-request-integration-v1.md`) do read
`SUPABASE_SERVICE_ROLE_KEY`, server-only (`import "server-only"`), used
only by `POST /api/kfsa/promotion-requests` for the three KFSA
integration tables' writes — never for browser authentication, and never
to skip an ownership check the route itself is responsible for doing
first with the ordinary tenant-scoped client. No other route or plugin
code reads this key; `npm run test:kfsa-integration` statically confirms
it is never imported from `app/` or `components/` code and never appears
in the built client bundle.

## Auth is enforced twice

1. The existing root `middleware.ts` redirects any unauthenticated request
   — including API routes — to `/login` before it reaches a route handler.
2. Every route handler also checks `auth.getUser()` itself and returns 401
   if absent, as defense-in-depth in case the middleware matcher ever
   changes.

## Connectors never carry secrets to the browser

`connector_definitions` has no column for a credential value — only
`credential_scope` (a descriptive string like
`server_only_anon_key_rls_scoped`). The two placeholder connectors
(document repository, HTTP API) are `not_configured` and have no real
credentials to leak in the first place.

## Fail-closed, not fail-open

Every step in `lib/plugins/context-composer.ts` and
`lib/plugins/execution-boundary.ts` throws a named `PluginBoundaryError`
(missing organization context, plugin not installed, plugin disabled,
skill not owned by plugin, skill disabled for this installation, skill not
implemented, connector not permitted, prohibited field) rather than
silently proceeding with a default. A route handler catches
`PluginBoundaryError` and returns HTTP 403 with the specific reason — never
a generic success.

## Tenant isolation

Every *tenant-owned* plugin table (`plugin_installations`,
`plugin_skill_permissions`, `plugin_run_contexts`, `plugin_runs`,
`plugin_evidence_outputs`, `plugin_audit_events`, `promotion_requests`,
`organization_profiles`, `domain_profiles`) has `organization_id`, RLS
enabled, and a `before insert` trigger that overwrites `organization_id`
from the caller's own profile whenever the caller is a real signed-in user
(`auth.uid() is not null`) — a client can never set another organization's
id on an insert. The global platform catalog tables
(`plugin_definitions`, `plugin_versions`, `skill_definitions`,
`skill_definition_versions`) have no `organization_id` column at all by
design — see `docs/plugins/ai-governance.md` for why plugin-owned skills
are global, not per-tenant. This was verified live against a real local
Postgres instance during development (see `npm run test:plugin-governance`
Part A), not only by static review: a second organization's user saw zero
rows across `use_cases`, `plugin_installations`, and `plugin_runs`, saw
the same six global `skill_definitions` rows org A sees, and an explicit
attempt to insert a row tagged with another organization's id was
silently corrected to the caller's own organization by the trigger.

## A real bug this pass found and fixed

The organization-id-forcing trigger pattern (introduced in an earlier
Supabase Foundation pass, reused here for the new plugin tables) originally
overwrote `organization_id` unconditionally, including when there is no
authenticated session at all (e.g. a seed script run via `supabase db
reset`, which connects directly, not through PostgREST/GoTrue — so
`auth.uid()` is `null`). That forced `organization_id` to `null` and broke
every seed insert with a NOT NULL violation — confirmed by actually running
every migration and the seed script against a live local Postgres. Fixed
in both the pre-existing `set_use_case_organization_id()` and this pass's
`force_organization_id_from_caller()`: the override now only applies when
`auth.uid() is not null` (a real end-user session); a privileged/seed
context may supply `organization_id` explicitly.
