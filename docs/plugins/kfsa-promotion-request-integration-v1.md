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
enumerated in `KfsaPromotionResponseV1`
(`lib/kfsa/contracts/promotion-request-v1.ts`):
`promotion_request_id, status, review_outcome, evidence_status,
authority_status, escalation_required, blocked_actions, audit_event_id,
formal_decision_created (always false), errors, created_at`. A response
containing `decision_code`, `formal_decision`, `official_decision`,
`official_verdict`, `kfsa_verdict`, `kfsa_decision_id`,
`kfsa_decision_code`, `execution_authorization`, or `production_approval`
is rejected before any of it is read, let alone persisted — see
`PROHIBITED_RESPONSE_FIELDS`. The UI displays this exact notice
prominently wherever an evaluation result is shown:

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
- A **timeout** (or `unavailable`, `invalid_response`, or a generic
  non-2xx `rejected`) is recorded as a retryable failed attempt; retrying
  creates a new `kfsa_submission_attempts` row (`attempt_number` + 1) and,
  on success, exactly one `kfsa_evaluation_responses` row still exists.
- `unauthorized`, `tenant_mismatch`, and `correlation_conflict` are
  recorded as **non-retryable** — see "Failure model" below.
- `correlation_id` reuse across two *different* Promotion Requests within
  the same organization (e.g. two `promotion_requests` rows created from
  the same run) is rejected before a second external call is made
  (`lib/kfsa/errors.ts`'s `rejectCorrelationConflict`), and independently
  backstopped by the same unique constraint at the database level should
  the application-level check ever be bypassed.
- `correlation_id` reuse across two *different organizations* is not a
  conflict at all — the unique constraint is scoped by `organization_id`,
  so each organization's correlation space is independent.
- A genuine concurrent race (two requests reaching the insert at the same
  instant) is handled by catching the resulting unique-constraint
  violation (Postgres `23505`) and re-fetching the row the other request
  just inserted, rather than erroring or creating a duplicate.

## Failure model (fail closed)

| Condition | Behavior |
|---|---|
| KFSA unreachable / times out | Promotion Request is untouched; a failed `kfsa_submission_attempts` row is recorded; no evaluation response or formal decision is created; the caller sees a retryable status. |
| Malformed / prohibited-field response | Rejected before persistence; recorded as `invalid_response` with a safe error message only (never the raw response body, never `ReviewOutcome`); no evaluation response row is ever created for it. |
| Tenant mismatch reported by KFSA | Rejected, recorded as `tenant_mismatch`, a local audit event is created, and it is **not** retried automatically. |

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

## Environment variables

Server-only, never `NEXT_PUBLIC_`-prefixed, never imported by any file
under `app/` or `components/` (checked by `scripts/validate-plugins.ts`'s
existing secret-exposure scan plus this integration's own tests):

- `KFSA_RUNTIME_BASE_URL` — base URL of the external KFSA Runtime Core.
- `KFSA_RUNTIME_API_KEY` — server-to-server bearer credential.
- `KFSA_RUNTIME_TIMEOUT_MS` — optional, defaults to `15000`.

See `.env.local.example` for placeholders.

## Local dev setup

1. `supabase db reset` (or run every migration + `supabase/seed.sql`
   manually) — the two additive migrations
   `20260721100001_create_kfsa_integration.sql` and
   `20260721100002_rls_kfsa_integration.sql` create the three new tables.
2. Set `KFSA_RUNTIME_BASE_URL` / `KFSA_RUNTIME_API_KEY` in `.env.local`
   pointed at a real (or your own test) KFSA Runtime Core. There is no
   mock fallback in application code — with no configuration, submission
   fails closed with a `KfsaConfigError` rather than silently succeeding.
3. `npm run test:kfsa-integration` runs the full suite against a
   disposable local Postgres instance and an isolated in-process mock
   HTTP server (see below) — it does not require a real KFSA Runtime Core
   to be reachable.

## Known limitations

- This repository has never been pointed at a real, live KFSA Runtime
  Core. All response-handling behavior is verified against an isolated
  mock HTTP server built for these tests
  (`scripts/kfsa-tests/mock-server.ts`), not a live integration partner.
  **This is not a claim of production readiness.**
- Genuine concurrent-request races (two requests reaching the same insert
  at the same physical instant) are proven safe only at the real-Postgres
  level (`scripts/test-kfsa-integration-db.ts`); the fake-Supabase-client
  end-to-end tests (`scripts/test-kfsa-integration-e2e.ts`) can only prove
  the *sequential* idempotent-replay behavior, since that in-memory stand-in
  has no transactions or unique constraints of its own.
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
