# KFSA integration boundary

## What this repository does

```
Plugin Skill → Evidence Package → Decision Candidate → Promotion Request
```

This repository implements everything up to and including creating a
`promotion_requests` row. It does not call an external KFSA Ingress
endpoint — none exists in this repository or was provided as an
integration target.

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
one.

## production_approval_status

Exists on `use_cases`, `plugin_definitions`, and (as `approved_for_production`)
on `models`. All three are `boolean not null default false`. No code path
in this plugin — not the intake skill, not the promotion request composer,
not any API route — ever sets one of these to `true`.
