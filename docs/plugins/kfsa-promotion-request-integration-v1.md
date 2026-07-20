# KFSA Promotion Request Integration v1

Status: `experimental`. This phase stops at governed evaluation. It does
**not** implement formal decision issuance, does not generate a KFSA
decision identifier, does not alter KFSA constitutional semantics, and
does not implement execution authorization. `production_approval_status`
remains `false` everywhere it already existed; this integration adds no
new "approved for production" field.

## What this integration adds

Before this, `docs/plugins/kfsa-integration-boundary.md` described a
repository that stopped at creating a `promotion_requests` row — no
external KFSA Ingress endpoint existed or was called. This integration
connects that boundary to a real, external KFSA Runtime Core over
authenticated server-to-server HTTP, for a single purpose: submit an
already-persisted Promotion Request for **governed evaluation** and
persist whatever `ReviewOutcome` comes back. Nothing about KFSA's own
constitutional semantics, decision vocabulary, or formal-decision process
changes — this repository is calling out to that process, not
reimplementing it.

```
Plugin Skill → Evidence Package → Decision Candidate → Promotion Request
  → SaaS Governance Gateway → KFSA Ingress → Governed Evaluation
  → ReviewOutcome → Persist response → Display evaluation result
```

## The browser never calls KFSA directly

The browser calls exactly one internal route:
`POST /api/kfsa/promotion-requests`, sending only
`{ promotion_request_id: string }`. Every canonical field the external
KFSA Runtime Core actually sees — `organization_id`, `source_plugin_id`,
`source_skill_id`, `source_run_id`, `evidence_ids`, `authority_context`,
etc. — is resolved server-side from the already-persisted, RLS-scoped
`promotion_requests` row and its related rows
(`lib/kfsa/promotion-submission.ts`). The route rejects outright if the
request body contains any of those fields, or any KFSA-decision field, or
`review_outcome`, or `formal_decision_created` (see the route's
`PROHIBITED_BODY_FIELDS` list). Only `lib/kfsa/client.ts` — a server-only
module (`import "server-only"`) — ever makes the outbound HTTP call, and
only from that one route.

## Server-only write architecture

An independent pre-PR review found that granting the browser's own
session-scoped Supabase client (`createServerSupabaseClient()`) INSERT
access on the three KFSA integration tables let an authenticated tenant
fabricate their own "KFSA evaluation result" directly — any
`ReviewOutcome`, any `external_promotion_request_id`, any
`response_hash` — for a Promotion Request they legitimately owned,
entirely bypassing `lib/kfsa/client.ts`, contract validation, and the
Gateway route itself. Fixed by splitting read and write authority:

- **Tenant-scoped client** (`createServerSupabaseClient()`, RLS-enforced):
  used for every ownership-verification *read* in
  `lib/kfsa/promotion-submission.ts` (steps 1-10), and for the caller's
  own SELECT access to their submission history and evaluation results.
  It has no INSERT, UPDATE, or DELETE access to any of the three tables
  at all — `20260721100003_lock_down_kfsa_tenant_writes.sql` removes
  those policies outright, leaving no policy any ordinary authenticated
  caller could ever satisfy for those operations.
- **Service-role admin client** (`lib/supabase/admin.ts`'s
  `createSupabaseAdminClient()`, bypasses RLS entirely): used only for
  the KFSA-integration *writes* themselves
  (`repositories/kfsa-integration-admin-repository.ts`), called from
  `lib/kfsa/promotion-submission.ts` only *after* every field being
  written has already been validated against the tenant-scoped client's
  own RLS-scoped data. Every admin-repository function takes its fields
  as explicit, named parameters (`organizationId`, `promotionRequestId`,
  `correlationId`, etc.) rather than a generic object spread, and never
  accepts a browser-supplied value for any of them.

`submitPromotionRequestForEvaluation()` therefore takes two Supabase
clients, not one — see its own doc comment in
`lib/kfsa/promotion-submission.ts`. No browser-callable
`SECURITY DEFINER` Postgres function was introduced for this; the
privilege split lives entirely in which TypeScript-level client a given
call uses, following the exact same server-only-secret pattern already
established by `lib/supabase/server.ts` (anon key, session-scoped) versus
what `lib/supabase/admin.ts` now adds (service-role key, never reachable
from a client component -- enforced by `import "server-only"` and
verified by a static scan in `npm run test:kfsa-integration`).

## Promotion Request vs. Decision

A Promotion Request is a structured, evidence-backed request for
**governed evaluation** — it is not, and never becomes, a formal decision.
What this integration adds is a way to submit that request externally and
receive back a **governance review verdict** (`ReviewOutcome`). A formal
decision is a separate, KFSA-internal artifact this repository never
creates, never reads back, and never displays. The response contract
(`lib/kfsa/contracts/promotion-request-v1.ts`) enforces this structurally:
`formal_decision_created` must be `false` in every response — the
validator throws `KfsaContractViolationError` for any other value, the
`kfsa_evaluation_responses` table has a `check (formal_decision_created =
false)` constraint, and the UI never renders a decision, decision code, or
production-approval status.

## ReviewOutcome vs. KFSA decision vocabulary

Two vocabulary families, never merged (see
`claude-operating-system/00-master-standards/KFSA_VOCABULARY_MAP_v1_1.md`):

- **ReviewOutcome** (this integration's wire contract and this plugin's
  own `promotion_requests.review_outcome`): `PASS | FIX | FAIL | ESCALATE`.
- **KFSA's own decision/action vocabulary**: `KILL | FIX | SCALE | ALERT`.
  `ReviewOutcome.FIX` and KFSA's `FIX` are different values with different
  meanings.

`validateKfsaResponse()` rejects a response that uses `KILL`, `SCALE`, or
`ALERT` as `review_outcome` outright (`invalid_review_outcome`), and the
same check constraint that limits `promotion_requests.review_outcome` to
the four ReviewOutcome values is reused verbatim on
`kfsa_evaluation_responses.review_outcome`. Nothing in this codebase maps
one vocabulary to the other automatically, and ALERT is never dropped,
reduced, or redefined — it simply isn't part of this plugin's own
vocabulary, exactly as before this integration.

## The external response is not a formal decision

Every field this integration is willing to accept from KFSA is
enumerated in `ALLOWED_RESPONSE_FIELDS`
(`lib/kfsa/contracts/promotion-request-v1.ts`):
`promotion_request_id, status, review_outcome, evidence_status,
authority_status, escalation_required, blocked_actions, audit_event_id,
formal_decision_created (always false), errors, created_at`. This is a
**strict allowlist**: a response containing *any* other top-level field
is rejected outright (`unknown_field`), not silently dropped during
reconstruction — an unrecognized, decision-shaped field name should make
noise, not disappear quietly. `decision_code`, `formal_decision`,
`official_decision`, `official_verdict`, `kfsa_verdict`,
`kfsa_decision_id`, `kfsa_decision_code`, `execution_authorization`,
`production_approval`, and the more generic `decision_id`, `decision`,
`verdict`, `formal_verdict`, `decision_number`, `authorization`, and
`approval` all get this treatment, with a specific named error for the
subset in `PROHIBITED_RESPONSE_FIELDS`. Every required identifier
(`promotion_request_id`, `status`, `review_outcome`, `evidence_status`,
`authority_status`, `audit_event_id`) must be a non-empty string bounded
to 200 characters; `created_at` must be a parseable timestamp;
`blocked_actions` and `errors` are bounded in both array length and
per-item string length. The UI displays this exact notice prominently
wherever an evaluation result is shown:

> نتيجة التقييم الحوكمي ليست قرارًا رسميًا. القرارات الرسمية تُنشأ فقط
> داخل KFSA Core بعد استكمال مسار الصلاحية والاعتماد.

## Retry and idempotency behavior

`correlation_id` (the Promotion Request's own, server-resolved
`correlation_id` — never client-supplied) is the idempotency key, sent as
both the wire request's `correlation_id` field and an
`x-idempotency-key` HTTP header.

- A successful evaluation is persisted at most once per
  `(organization_id, correlation_id)` — enforced by a unique constraint on
  `kfsa_evaluation_responses`, not just application logic. A second
  submission attempt against an already-evaluated Promotion Request is a
  no-op **replay**: the existing row is returned and KFSA is never called
  again.
- A **timeout** (or `unavailable`, `invalid_response`) is recorded as a
  retryable failed attempt; retrying creates a new
  `kfsa_submission_attempts` row (`attempt_number` + 1) and, on success,
  exactly one `kfsa_evaluation_responses` row still exists.
- `unauthorized`, `rejected`, `tenant_mismatch`, and `correlation_conflict`
  are recorded as **non-retryable** — see "Failure model" and "Error
  classification" below.
- `correlation_id` reuse across two *different* Promotion Requests within
  the same organization (e.g. two `promotion_requests` rows created from
  the same run) is rejected before a second external call is made
  (`lib/kfsa/errors.ts`'s `rejectCorrelationConflict`), and independently
  backstopped by the same unique constraint at the database level should
  the application-level check ever be bypassed.
- `correlation_id` reuse across two *different organizations* is not a
  conflict at all — the unique constraint is scoped by `organization_id`,
  so each organization's correlation space is independent.

## Concurrency and stale-attempt recovery

A second, independent pre-PR review finding: a genuine concurrent race on
`kfsa_submission_attempts`' unique constraint (two requests, e.g. two
browser tabs, both trying to create the same `attempt_number`) used to
throw a `KfsaClientError` from a code path nothing converted into a
structured result, producing an unhandled HTTP 500 for the losing
request. Fixed: the losing request now calls
`recoverFromLostAttemptRace()`, which returns one of exactly three
structured outcomes — never a throw:

- **replay**, if the winning request already persisted a successful
  evaluation response by the time the loser checks;
- **failed**, with the winner's own recorded `error_code`/`retryable`, if
  the winning request's attempt already reached a terminal failure;
- **in_progress**, otherwise — the winner is presumably still mid-flight.

Proven against genuine `Promise.all` concurrency on real Postgres in
`scripts/test-kfsa-integration-concurrency.ts`, not simulated.

Separately, before even attempting a new `kfsa_submission_attempts` row,
`submitPromotionRequestForEvaluation()` checks the *existing* latest
attempt for the Promotion Request:

- if it is `in_progress` and younger than `KFSA_SUBMISSION_STALE_AFTER_MS`
  (server-controlled only; default 5 minutes), the call returns
  **in_progress** immediately without creating a second attempt or a
  second external call — this is what protects a fresh in-flight
  submission from a duplicate;
- if it is `in_progress` but *older* than that threshold (e.g. the server
  process crashed mid-submission and never reached a terminal state), the
  admin repository marks it `failed` (`error_code: "unavailable"`) and a
  genuinely new attempt proceeds.

No request input ever sets a timestamp or a stale/terminal status
directly; this logic runs entirely inside
`lib/kfsa/promotion-submission.ts` using the row's own real
`submitted_at`. There is no background job or scheduled sweep — recovery
only happens reactively, the next time someone actually tries to submit
again.

## Failure model (fail closed)

| Condition | Behavior |
|---|---|
| KFSA unreachable / times out | Promotion Request is untouched; a failed `kfsa_submission_attempts` row is recorded; no evaluation response or formal decision is created; the caller sees a retryable status. |
| Malformed / prohibited-field / unrecognized-field response | Rejected before persistence; recorded as `invalid_response` with a safe error message only (never the raw response body, never `ReviewOutcome`); no evaluation response row is ever created for it. |
| Response body exceeds `KFSA_RUNTIME_MAX_RESPONSE_BYTES` | Rejected as `invalid_response` before JSON parsing is even attempted (bounded by `content-length` when present, otherwise by counting bytes while streaming) — a misbehaving or compromised endpoint cannot exhaust server memory this way. |
| Tenant mismatch reported by KFSA | Rejected, recorded as `tenant_mismatch`, a local audit event is created, and it is **not** retried automatically. |

## Error classification (HTTP status → `KfsaClientErrorCode`)

| HTTP status | Code | Retryable |
|---|---|---|
| 401 / 403 | `unauthorized` | no |
| 409 | `correlation_conflict` | no |
| 429 or any 5xx | `unavailable` | yes |
| any other non-2xx (400, 404, 422, ...) | `rejected` | no |
| timeout | `timeout` | yes |
| network failure | `unavailable` | yes |
| malformed / oversized / unrecognized-field response | `invalid_response` | yes |

**This mapping is this integration's own best-effort guess, never
confirmed against a live KFSA Runtime Core.** In particular, an earlier
version of this client assumed a bare `422` meant `tenant_mismatch` —
that assumption had no evidence behind it (no live system was ever
consulted) and has been removed; `422` now falls into the same generic,
non-retryable `rejected` bucket as other unclassified 4xx responses,
since those typically mean the request itself was malformed in a way
retrying will never fix without a code change. Treat every row in this
table as provisional until it is checked against a real integration
partner.

## Tenant isolation

`kfsa_submission_attempts`, `kfsa_evaluation_responses`, and
`kfsa_external_audit_links` all carry `organization_id`, have RLS enabled,
and reuse the exact same `force_organization_id_from_caller()` /
`current_user_organization_id()` mechanism as every other plugin table
(see `docs/plugins/plugin-security-boundary.md`). The Governance Gateway
route additionally re-checks that the resolved Promotion Request's
`organization_id` matches the caller's own profile before doing anything
else — the same "auth is enforced twice" posture used everywhere in this
plugin. `kfsa_evaluation_responses` and `kfsa_external_audit_links` are
fully append-only (no update/delete policy for any non-service-role
caller, plus an independent immutability trigger);
`kfsa_submission_attempts` is mutable only while `status = 'in_progress'`.

## Safe audit logging

Every step of the submission lifecycle creates a `plugin_audit_events` row
via the existing `createAuditEvent()` repository function:
`kfsa.submission_requested`, `kfsa.submission_started`,
`kfsa.submission_succeeded`, `kfsa.submission_failed`,
`kfsa.submission_retried`, `kfsa.invalid_response_rejected`,
`kfsa.tenant_mismatch_rejected`, `kfsa.correlation_conflict_rejected`.
Audit `details` are restricted to identifiers and status metadata
(`promotion_request_id`, `correlation_id`, `submission_attempt_id`,
`error_code`, `review_outcome`, `external_audit_event_id`) — never an API
key, never full `authority_context`, never raw evidence content.
`lib/kfsa/client.ts`'s own `console.*` diagnostics follow the same rule
(verified by a static scan in `npm run test:kfsa-integration`).

**Audit consistency policy:** the persisted `kfsa_evaluation_responses`
row is authoritative for the submission result by itself — it does not
depend on any audit event also having been written successfully. Every
audit write that happens *before* a result is known (`submission_requested`,
`submission_started`, and every rejection/failure event) remains
fail-closed: if it fails, the whole operation fails, since silently
losing that part of the trail would hide a real problem. The one
exception is the final `kfsa.submission_succeeded` notification, which
fires strictly *after* the evaluation response and audit link are already
durably committed — its failure is caught and logged as a warning rather
than allowed to turn an already-successful, already-persisted submission
into an apparent failure for the caller.

## Environment variables

Server-only, never `NEXT_PUBLIC_`-prefixed, never imported by any file
under `app/` or `components/` (checked by `scripts/validate-plugins.ts`'s
existing secret-exposure scan plus this integration's own tests):

- `KFSA_RUNTIME_BASE_URL` — base URL of the external KFSA Runtime Core.
- `KFSA_RUNTIME_API_KEY` — server-to-server bearer credential.
- `KFSA_RUNTIME_TIMEOUT_MS` — optional, defaults to `15000`.
- `KFSA_RUNTIME_MAX_RESPONSE_BYTES` — optional, defaults to `1000000` (1 MB). Bounds how much of an external response body `lib/kfsa/client.ts` will read before rejecting it as `invalid_response`.
- `KFSA_SUBMISSION_STALE_AFTER_MS` — optional, defaults to `300000` (5 minutes). How long an `in_progress` `kfsa_submission_attempts` row is trusted to still be genuinely in flight before the server-only repository may mark it stale and allow a new attempt. Read only by `lib/kfsa/promotion-submission.ts` — never derived from any request.
- `SUPABASE_SERVICE_ROLE_KEY` — required for `lib/supabase/admin.ts`'s service-role client, which the Governance Gateway route uses only for the KFSA-integration writes themselves. Not listed in `.env.local.example` (same policy as documented there for every other consumer of this key): never commit it, never read it from any file reachable from a browser request.

See `.env.local.example` for the rest.

## Local dev setup

1. `supabase db reset` (or run every migration + `supabase/seed.sql`
   manually) — the additive migrations `20260721100001_create_kfsa_integration.sql`,
   `20260721100002_rls_kfsa_integration.sql`, and
   `20260721100003_lock_down_kfsa_tenant_writes.sql` create the three
   tables and lock ordinary-tenant writes down to SELECT-only.
2. Set `KFSA_RUNTIME_BASE_URL` / `KFSA_RUNTIME_API_KEY` in `.env.local`
   pointed at a real (or your own test) KFSA Runtime Core. There is no
   mock fallback in application code — with no configuration, submission
   fails closed with a `KfsaConfigError` rather than silently succeeding.
3. `npm run test:kfsa-integration` runs the full suite against a
   disposable local Postgres instance and an isolated in-process mock
   HTTP server (see below) — it does not require a real KFSA Runtime Core
   to be reachable.

## Known limitations

- **This repository has never been pointed at a real, live KFSA Runtime
  Core.** All response-handling behavior — including every row of the
  "Error classification" table above — is verified against an isolated
  mock HTTP server built for these tests
  (`scripts/kfsa-tests/mock-server.ts`), not a live integration partner.
  Mock-server success is not evidence of live compatibility: endpoint
  existence, request/response field compatibility, the `x-kfsa-api-version`
  header convention, the bearer-auth format, and whether KFSA actually
  honors `x-idempotency-key` at all remain unverified. **This is not a
  claim of production readiness.**
- Genuine concurrent-request races on `kfsa_submission_attempts` *are* now
  proven safe against the real, composed `submitPromotionRequestForEvaluation()`
  flow under genuine `Promise.all` concurrency on real Postgres
  (`scripts/test-kfsa-integration-concurrency.ts`), not merely at the
  raw-SQL layer or via fault injection. The fake-Supabase-client
  end-to-end tests (`scripts/test-kfsa-integration-e2e.ts`) separately
  prove the *sequential* idempotent-replay behavior, since that in-memory
  stand-in has no transactions or unique constraints of its own to race
  against.
- `response_hash` is a SHA-256 digest of the validated (not raw) response
  JSON — a raw, unvalidated response body is never persisted at all, by
  design (see "Failure model" above), so there is nothing to hash on the
  malformed-response path beyond the safe error message already recorded.
- The Gateway route re-verifies plugin/skill/run/snapshot/evidence
  ownership on every submission (steps 1-10) rather than trusting the
  Promotion Request row's own already-validated state; this is
  intentional defense-in-depth, not a sign the underlying data is
  untrusted, but it does mean a submission does slightly more work than
  the strict minimum.
- The composite tenant-aware foreign keys
  (`20260721100003_lock_down_kfsa_tenant_writes.sql`) prevent a row from
  referencing another organization's Promotion Request or Submission
  Attempt at the database level, but they do not — and cannot — prevent
  the service-role admin repository itself from being called with the
  wrong `organizationId`; correctness there depends entirely on
  `lib/kfsa/promotion-submission.ts` always deriving it from the
  already-verified `promotionRequest.organization_id`, never from request
  input. This is checked by `bypass-*`/`tenant-fk-*` in
  `scripts/test-kfsa-integration-db.ts`, not enforced by a mechanism
  independent of that code being correct.
