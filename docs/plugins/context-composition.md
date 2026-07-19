# Context composition

`lib/plugins/context-composer.ts`'s `composeContext()` is the only place
that assembles a run context. It is called once per run, from
`lib/plugins/execution-boundary.ts`, never from the browser.

## What it combines

Organization profile, `ai-governance` domain profile, plugin installation
state, skill definition (permissions, required profile fields, permitted
connectors), the current authenticated actor and their role, allowed
connector ids for this plugin, the target use case (if any), and the
constitutional reference list. The result is one structured object, not
concatenated text.

## What it rejects outright

- No organization profile resolved for the caller.
- Plugin not found, or plugin status is `blocked`.
- Plugin not installed for this organization, or installation state isn't
  `installed`.
- Skill not found, or the skill's `plugin_id` doesn't match the requested
  plugin (a skill can't be run "as" a plugin it doesn't belong to).
- Skill explicitly disabled for this organization's installation
  (`plugin_skill_permissions.enabled = false`).

## What it reports instead of rejecting

Missing required profile fields for the specific skill being run. This
list is not itself a rejection at the composition step — the execution
boundary uses it to fail closed at the skill layer, where the exact
"missing X, Y, Z" reason is more useful than a step earlier.

## What it never includes

A connector secret (none exist on `connector_definitions` in this MVP).

## What it produces

An insert into `plugin_run_contexts` — immutable once created (a
before-update/delete trigger blocks any non-service-role mutation) — plus
a `plugin.context.composed` audit event. The route handler and the skill
handler downstream only ever read the returned snapshot, never re-query
live profile state mid-run, so a profile edit that happens while a run is
in flight cannot change that run's context after the fact.
