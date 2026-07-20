-- KFSA Promotion Request Integration v1 (docs/plugins/kfsa-promotion-request-integration-v1.md).
--
-- Additive only: three new tables covering the external-submission side of
-- an existing, unmodified `public.promotion_requests` row. Nothing here
-- alters promotion_requests, KFSA vocabulary, or KFSA decision semantics.
-- No formal decision table is created anywhere in this migration.
--
--   kfsa_submission_attempts   -- one row per attempt to submit a given
--                                  Promotion Request to KFSA Runtime Core
--                                  (mutable while in flight, then locked).
--   kfsa_evaluation_responses  -- the validated, persisted result of a
--                                  *successful* submission. Append-only,
--                                  immutable, at most one row per
--                                  (organization_id, correlation_id) ever.
--   kfsa_external_audit_links  -- a pointer to the audit_event_id KFSA
--                                  itself returned. Append-only, immutable.
--
-- Idempotency design (see docs/plugins/kfsa-promotion-request-integration-v1.md
-- "Idempotency and retries"): correlation_id may repeat across several
-- attempt rows for the same Promotion Request (that is what a retry is),
-- so unique(organization_id, correlation_id) cannot live on
-- kfsa_submission_attempts without breaking retries. It lives on
-- kfsa_evaluation_responses instead, where it means what it needs to mean:
-- at most one successful evaluation is ever persisted for a given
-- correlation_id, and a second response row reusing that correlation_id
-- for a *different* Promotion Request is rejected by the database itself,
-- not only by application logic. correlation_id is therefore denormalized
-- onto kfsa_evaluation_responses (copied from its submission_attempt at
-- insert time) specifically so this constraint can exist.

create table if not exists public.kfsa_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  promotion_request_id uuid not null references public.promotion_requests (id) on delete restrict,
  correlation_id text not null,
  attempt_number integer not null default 1 check (attempt_number >= 1),
  status text not null default 'in_progress' check (status in ('in_progress', 'succeeded', 'failed')),
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  request_contract_version text not null default 'v1',
  error_code text check (
    error_code is null or error_code in ('unavailable', 'timeout', 'unauthorized', 'invalid_response', 'rejected', 'tenant_mismatch', 'correlation_conflict')
  ),
  safe_error_message text,
  unique (organization_id, promotion_request_id, correlation_id, attempt_number)
);

create table if not exists public.kfsa_evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  promotion_request_id uuid not null references public.promotion_requests (id) on delete restrict,
  submission_attempt_id uuid not null references public.kfsa_submission_attempts (id) on delete restrict,
  correlation_id text not null,
  external_promotion_request_id text not null,
  review_outcome text not null check (review_outcome in ('PASS', 'FIX', 'FAIL', 'ESCALATE')),
  evidence_status text not null,
  authority_status text not null,
  escalation_required boolean not null default false,
  blocked_actions text[] not null default '{}',
  formal_decision_created boolean not null default false check (formal_decision_created = false),
  response_contract_version text not null default 'v1',
  received_at timestamptz not null default now(),
  response_hash text not null,
  unique (organization_id, correlation_id)
);

create table if not exists public.kfsa_external_audit_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  promotion_request_id uuid not null references public.promotion_requests (id) on delete restrict,
  external_audit_event_id text not null,
  submission_attempt_id uuid not null references public.kfsa_submission_attempts (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (organization_id, submission_attempt_id)
);

-- kfsa_submission_attempts: mutable only while in flight. Once a row's
-- status leaves 'in_progress' it is locked, matching plugin_runs'
-- guard_plugin_run_update() pattern in 20260720100002_rls_plugin_foundation.sql.
create or replace function public.guard_kfsa_submission_attempt_update()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed';
  end if;
  if new.promotion_request_id is distinct from old.promotion_request_id then
    raise exception 'promotion_request_id cannot be changed';
  end if;
  if new.correlation_id is distinct from old.correlation_id then
    raise exception 'correlation_id cannot be changed';
  end if;
  if new.attempt_number is distinct from old.attempt_number then
    raise exception 'attempt_number cannot be changed';
  end if;
  if old.status <> 'in_progress' then
    raise exception 'a completed kfsa_submission_attempts row cannot be modified';
  end if;
  return new;
end;
$$;

create trigger kfsa_submission_attempts_guard_update
  before update on public.kfsa_submission_attempts
  for each row execute function public.guard_kfsa_submission_attempt_update();

-- kfsa_evaluation_responses: fully immutable once inserted (this is the
-- persisted evaluation result -- see docs/plugins/kfsa-promotion-request-integration-v1.md
-- "Failure model": a response row is never updated, only ever inserted once
-- per correlation_id).
create or replace function public.prevent_kfsa_evaluation_response_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'kfsa_evaluation_responses rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger kfsa_evaluation_responses_immutable
  before update or delete on public.kfsa_evaluation_responses
  for each row execute function public.prevent_kfsa_evaluation_response_mutation();

-- kfsa_external_audit_links: fully immutable once inserted.
create or replace function public.prevent_kfsa_audit_link_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'kfsa_external_audit_links rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger kfsa_external_audit_links_immutable
  before update or delete on public.kfsa_external_audit_links
  for each row execute function public.prevent_kfsa_audit_link_mutation();

create index if not exists kfsa_submission_attempts_org_idx on public.kfsa_submission_attempts (organization_id);
create index if not exists kfsa_submission_attempts_pr_idx on public.kfsa_submission_attempts (promotion_request_id);
create index if not exists kfsa_submission_attempts_correlation_idx on public.kfsa_submission_attempts (organization_id, correlation_id);
create index if not exists kfsa_evaluation_responses_org_idx on public.kfsa_evaluation_responses (organization_id);
create index if not exists kfsa_evaluation_responses_pr_idx on public.kfsa_evaluation_responses (promotion_request_id);
create index if not exists kfsa_external_audit_links_org_idx on public.kfsa_external_audit_links (organization_id);
create index if not exists kfsa_external_audit_links_pr_idx on public.kfsa_external_audit_links (promotion_request_id);
