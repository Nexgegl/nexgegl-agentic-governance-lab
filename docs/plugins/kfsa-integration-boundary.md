# KFSA integration boundary

## What this repository does

```
Plugin Skill → Evidence Package → Decision Candidate → Promotion Request
  → SaaS Governance Gateway → KFSA Ingress → Governed Evaluation
  → ReviewOutcome → Persist response → Display evaluation result
```

This repository implements everything up to and including creating a
`promotion_requests` row, **and** (as of KFSA Promotion Request
Integration v1 — see
`docs/plugins/kfsa-promotion-request-integration-v1.md` for the full
design) submitting an already-persisted Promotion Request to an external
KFSA Runtime Core for governed evaluation, over a server-only
authenticated HTTP client (`lib/kfsa/client.ts`), and persisting whatever
`ReviewOutcome` comes back. It stops there: this phase does not implement
formal decision issuance, does not generate a KFSA decision identifier,
does not alter KFSA constitutional semantics, and does not implement
execution authorization. The browser never calls KFSA directly — it only
ever calls this repository's own `POST /api/kfsa/promotion-requests`
route, which resolves every canonical field server-side.

Authenticated tenants have **read-only** access to all three KFSA
integration tables (`kfsa_submission_attempts`, `kfsa_evaluation_responses`,
`kfsa_external_audit_links`) — they can SELECT their own organization's
rows, but cannot INSERT, UPDATE, or DELETE any of them directly. Every
write goes through a separate, server-only service-role repository
(`repositories/kfsa-integration-admin-repository.ts`, via
`lib/supabase/admin.ts`), called only after the Governance Gateway route
has already verified ownership with the tenant's own session-scoped
client. This split — and the composite tenant-aware foreign keys added
alongside it — closed a real gap an independent pre-PR review found and
reproduced: without it, an authenticated tenant could fabricate their own
"KFSA evaluation result" by inserting directly into these tables. See
`docs/plugins/kfsa-promotion-request-integration-v1.md`'s "Server-only
write architecture" section for the full design.

## What "constitutional reference" actually points to

No document titled "KFSA Governance Architecture v1.0 — APPROVED / LOCKED"
exists in this repository. Every `constitutional_reference` field in this
plugin (manifest, policy file, migrations comments, this doc) points to
the real artifacts instead:

- `claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md`
  (status: PASS WITH FOLLOW-UP)
- `claude-operating-system/02-product-profiles/sdgm-kfsa/CLAUDE.sdgm-kfsa.md`
  (v1.0, documentary only)
- This app's own pre-existing runtime boundary language
  (`runtime/types.ts`, `lib/governance-model.ts`)

See the ADR's opening note for why.

## Vocabulary separation (enforced, not just documented)

- **ReviewOutcome**: `PASS | FIX | FAIL | ESCALATE` — `promotion_requests.review_outcome`
  has a `check` constraint limited to exactly these four values.
- **KFSA decision vocabulary**: `KILL | FIX | SCALE | ALERT` — does not
  appear as a settable value anywhere in this plugin's schema or code.
  `ReviewOutcome.FIX` and KFSA's `FIX` are different values with different
  meanings; nothing in this codebase maps one to the other automatically.
- ALERT is never dropped, reduced, or redefined — it isn't referenced by
  this plugin at all, since this plugin never touches KFSA decision
  vocabulary in the first place.

## Fields that do not exist anywhere in this plugin's schema

`official_decision`, `official_verdict`, `kfsa_verdict`, `kfsa_decision_id`,
`kfsa_decision_code`. `scripts/validate-plugins.ts` checks for their
absence on every run, and the execution boundary additionally rejects any
run whose input or output happens to contain one of these field names, as
defense-in-depth against a future skill handler accidentally introducing
one. The KFSA client boundary extends this list for the external wire
format specifically: `decision_code`, `formal_decision`,
`execution_authorization`, and `production_approval` are also rejected
outright if an external KFSA response ever contains them — see
`PROHIBITED_RESPONSE_FIELDS` in `lib/kfsa/contracts/promotion-request-v1.ts`
and `npm run test:kfsa-integration`.

## production_approval_status

Exists on `use_cases`, `plugin_definitions`, and (as `approved_for_production`)
on `models`. All three are `boolean not null default false`. No code path
in this plugin — not the intake skill, not the promotion request composer,
not the KFSA client, not the Governance Gateway route — ever sets one of
these to `true`. This integration introduces no new "approved for
production" field of its own; its own analogous invariant is
`kfsa_evaluation_responses.formal_decision_created`, which has a `check
(formal_decision_created = false)` constraint and is additionally rejected
at the response-validation layer before it would ever reach the database
if an external response ever set it to anything else.
