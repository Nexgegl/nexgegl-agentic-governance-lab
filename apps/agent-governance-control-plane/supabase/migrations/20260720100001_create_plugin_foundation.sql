-- Vertical Plugin Foundation v1 (ADR: docs/architecture/ADR-vertical-plugin-foundation-v1.md).
--
-- Reuses existing tables rather than duplicating them: `skills` (Phase 2)
-- gains a nullable plugin_id tag instead of a new parallel
-- skill_definitions table; agents/tools are untouched (this pilot ships no
-- agent capability — see ADR §15). New tables below cover only genuinely
-- new concepts: plugin catalog/versioning/installation, the structured
-- profile layers, connector registry + permission grants, run contexts,
-- run records, evidence outputs, audit events, and promotion requests.
--
-- None of this alters KFSA vocabulary, KFSA semantics, or any existing
-- tenant-isolation rule. production_approval_status already exists and
-- already defaults to false on use_cases (Phase 1) — nothing here changes
-- that; models.approved_for_production likewise stays untouched.

-- Plugin catalog (platform-level; not tenant-owned — installations are) ----

create table if not exists public.plugin_definitions (
  plugin_id text primary key,
  name jsonb not null,
  domain text not null,
  description jsonb,
  status text not null default 'experimental' check (status in ('experimental', 'approved', 'deprecated', 'blocked')),
  production_approval_status boolean not null default false,
  owner text,
  required_platform_version text,
  constitutional_reference text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Immutable per-version manifest snapshots. Never updated after insert —
-- enforced by application discipline plus the guard trigger below.
create table if not exists public.plugin_versions (
  id uuid primary key default gen_random_uuid(),
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  version text not null,
  manifest jsonb not null,
  created_at timestamptz not null default now(),
  unique (plugin_id, version)
);

create or replace function public.prevent_plugin_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'plugin_versions rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger plugin_versions_immutable
  before update or delete on public.plugin_versions
  for each row execute function public.prevent_plugin_version_mutation();

-- Tenant-owned plugin installations -----------------------------------------

create table if not exists public.plugin_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  plugin_version_id uuid not null references public.plugin_versions (id) on delete restrict,
  state text not null default 'proposed' check (state in ('proposed', 'approved', 'installed', 'disabled', 'deprecated', 'blocked')),
  installed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, plugin_id)
);

-- Structured profile layers --------------------------------------------------

create table if not exists public.organization_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  sector text,
  jurisdictions text[] not null default '{}',
  business_units text[] not null default '{}',
  governance_model text check (governance_model in ('centralized', 'federated', 'hybrid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (organization, domain). `profile` is validated at the
-- application layer against plugins/<domain>/profile.schema.json — see
-- lib/plugins/profile-schema.ts. Storing it as jsonb (rather than one
-- column-per-field table per domain) is a deliberate consolidation: this
-- foundation currently serves exactly one domain (ai_governance), and a
-- bespoke table per future domain would over-normalize ahead of need.
create table if not exists public.domain_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  domain text not null,
  profile jsonb not null default '{}',
  completeness_score integer not null default 0 check (completeness_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, domain)
);

-- Connector registry ----------------------------------------------------------

create table if not exists public.connector_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  connector_id text not null,
  connector_type text not null,
  status text not null default 'not_configured' check (status in ('enabled', 'disabled', 'not_configured')),
  allowed_operations text[] not null default '{}',
  denied_operations text[] not null default '{}',
  data_classifications text[] not null default '{}',
  credential_scope text,
  created_at timestamptz not null default now(),
  unique (organization_id, connector_id)
);

create table if not exists public.plugin_connector_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  connector_id uuid not null references public.connector_definitions (id) on delete cascade,
  allowed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, plugin_id, connector_id)
);

-- Skill ownership + per-installation enablement ------------------------------
-- (skills themselves already exist — see 20260719100001_create_reference_tables.sql)

alter table public.skills
  add column if not exists plugin_id text references public.plugin_definitions (plugin_id) on delete set null,
  add column if not exists execution_status text not null default 'not_implemented' check (execution_status in ('implemented', 'not_implemented')),
  add column if not exists required_profile_fields text[] not null default '{}',
  add column if not exists permitted_connectors text[] not null default '{}',
  add column if not exists escalation_conditions text[] not null default '{}';

create table if not exists public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  version text not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  unique (skill_id, version)
);

create or replace function public.prevent_skill_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'skill_versions rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger skill_versions_immutable
  before update or delete on public.skill_versions
  for each row execute function public.prevent_skill_version_mutation();

create table if not exists public.plugin_skill_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_installation_id uuid not null references public.plugin_installations (id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plugin_installation_id, skill_id)
);

-- Run contexts, runs, evidence, audit ----------------------------------------

-- Immutable context snapshots produced by the Context Composer.
create table if not exists public.plugin_run_contexts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  plugin_version text not null,
  skill_id text not null references public.skills (id) on delete cascade,
  skill_version text not null,
  actor_user_id uuid not null,
  context jsonb not null,
  constitutional_reference text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.prevent_run_context_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'plugin_run_contexts rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger plugin_run_contexts_immutable
  before update or delete on public.plugin_run_contexts
  for each row execute function public.prevent_run_context_mutation();

create table if not exists public.plugin_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  context_snapshot_id uuid not null references public.plugin_run_contexts (id) on delete restrict,
  actor_user_id uuid not null,
  use_case_id uuid references public.use_cases (id) on delete set null,
  status text not null default 'submitted' check (status in ('submitted', 'completed', 'rejected')),
  rejection_reason text,
  correlation_id text not null,
  output jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, correlation_id)
);

create table if not exists public.plugin_evidence_outputs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plugin_run_id uuid not null references public.plugin_runs (id) on delete cascade,
  use_case_id uuid references public.use_cases (id) on delete set null,
  evidence_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Append-only in practice: insert + select policies only (see RLS migration).
create table if not exists public.plugin_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor text not null,
  event_type text not null,
  plugin_id text references public.plugin_definitions (plugin_id) on delete set null,
  skill_id text references public.skills (id) on delete set null,
  plugin_run_id uuid references public.plugin_runs (id) on delete set null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Promotion Requests (the plugin -> KFSA Ingress boundary; this repo stops
-- here — it does not call an external KFSA Ingress endpoint) ----------------

create table if not exists public.promotion_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_plugin_id text not null references public.plugin_definitions (plugin_id) on delete restrict,
  source_skill_id text not null references public.skills (id) on delete restrict,
  source_run_id uuid not null references public.plugin_runs (id) on delete restrict,
  request_id text not null,
  candidate_id text not null,
  signal_ids uuid[] not null default '{}',
  evidence_ids uuid[] not null default '{}',
  authority_context jsonb not null default '{}',
  objective text not null,
  correlation_id text not null,
  context_snapshot_id uuid not null references public.plugin_run_contexts (id) on delete restrict,
  plugin_version text not null,
  skill_version text not null,
  review_outcome text check (review_outcome in ('PASS', 'FIX', 'FAIL', 'ESCALATE')),
  evidence_status text not null default 'partial' check (evidence_status in ('complete', 'partial', 'missing')),
  authority_status text not null default 'missing' check (authority_status in ('confirmed', 'missing', 'escalation_required')),
  escalation_required boolean not null default false,
  blocked_actions text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, request_id)
);

create index if not exists plugin_installations_org_idx on public.plugin_installations (organization_id);
create index if not exists domain_profiles_org_idx on public.domain_profiles (organization_id);
create index if not exists connector_definitions_org_idx on public.connector_definitions (organization_id);
create index if not exists plugin_runs_org_idx on public.plugin_runs (organization_id);
create index if not exists plugin_evidence_outputs_run_idx on public.plugin_evidence_outputs (plugin_run_id);
create index if not exists plugin_audit_events_org_idx on public.plugin_audit_events (organization_id);
create index if not exists promotion_requests_org_idx on public.promotion_requests (organization_id);
