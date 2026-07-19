-- RLS for the plugin foundation. Reuses public.current_user_organization_id()
-- from 20260718090004_rls_policies.sql — no new tenant-scoping mechanism is
-- introduced. Two families of tables:
--
--   (a) Platform catalog (plugin_definitions, plugin_versions,
--       connector_definitions, plugin_connector_permissions,
--       plugin_skill_permissions): read-only for authenticated users,
--       admin/service-role managed, matching the existing posture of
--       `skills`/`tools` from Phase 2.
--   (b) Tenant-write tables (organization_profiles, domain_profiles,
--       plugin_installations, plugin_run_contexts, plugin_runs,
--       plugin_evidence_outputs, plugin_audit_events, promotion_requests):
--       organization_id is never trusted from client input — a
--       before-insert trigger overwrites it from the caller's own profile,
--       exactly the use_cases pattern from Phase 1.

alter table public.plugin_definitions enable row level security;
alter table public.plugin_versions enable row level security;
alter table public.plugin_installations enable row level security;
alter table public.organization_profiles enable row level security;
alter table public.domain_profiles enable row level security;
alter table public.connector_definitions enable row level security;
alter table public.plugin_connector_permissions enable row level security;
alter table public.skill_versions enable row level security;
alter table public.plugin_skill_permissions enable row level security;
alter table public.plugin_run_contexts enable row level security;
alter table public.plugin_runs enable row level security;
alter table public.plugin_evidence_outputs enable row level security;
alter table public.plugin_audit_events enable row level security;
alter table public.promotion_requests enable row level security;

-- (a) Platform catalog: authenticated read-only ------------------------------

create policy "plugin_definitions_select_authenticated" on public.plugin_definitions
  for select using (auth.uid() is not null);

create policy "plugin_versions_select_authenticated" on public.plugin_versions
  for select using (auth.uid() is not null);

create policy "connector_definitions_select_own_org" on public.connector_definitions
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_connector_permissions_select_own_org" on public.plugin_connector_permissions
  for select using (organization_id = public.current_user_organization_id());

create policy "skill_versions_select_own_org" on public.skill_versions
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_skill_permissions_select_own_org" on public.plugin_skill_permissions
  for select using (organization_id = public.current_user_organization_id());

-- (b) Tenant-write tables -----------------------------------------------------

-- organization_profiles: read/insert/update scoped to own org; organization_id forced.
create policy "organization_profiles_select_own_org" on public.organization_profiles
  for select using (organization_id = public.current_user_organization_id());

create policy "organization_profiles_insert_own_org" on public.organization_profiles
  for insert with check (organization_id = public.current_user_organization_id());

create policy "organization_profiles_update_own_org" on public.organization_profiles
  for update using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

create or replace function public.force_organization_id_from_caller()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only force organization_id for a real signed-in end-user request
  -- (auth.uid() is non-null). A privileged context with no JWT
  -- (migrations, `supabase db reset` seeding, admin tooling) has
  -- auth.uid() = null and may supply organization_id explicitly instead
  -- of being forced to null here. See the identical rationale on
  -- public.set_use_case_organization_id() in
  -- 20260718090004_rls_policies.sql.
  if auth.uid() is not null then
    new.organization_id := public.current_user_organization_id();
  end if;
  return new;
end;
$$;

create trigger organization_profiles_force_org_id
  before insert on public.organization_profiles
  for each row execute function public.force_organization_id_from_caller();

create or replace function public.prevent_organization_id_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger organization_profiles_lock_org_id
  before update on public.organization_profiles
  for each row execute function public.prevent_organization_id_change();

-- domain_profiles: same pattern.
create policy "domain_profiles_select_own_org" on public.domain_profiles
  for select using (organization_id = public.current_user_organization_id());

create policy "domain_profiles_insert_own_org" on public.domain_profiles
  for insert with check (organization_id = public.current_user_organization_id());

create policy "domain_profiles_update_own_org" on public.domain_profiles
  for update using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

create trigger domain_profiles_force_org_id
  before insert on public.domain_profiles
  for each row execute function public.force_organization_id_from_caller();

create trigger domain_profiles_lock_org_id
  before update on public.domain_profiles
  for each row execute function public.prevent_organization_id_change();

-- plugin_installations: same pattern; state transitions allowed, org locked.
create policy "plugin_installations_select_own_org" on public.plugin_installations
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_installations_insert_own_org" on public.plugin_installations
  for insert with check (organization_id = public.current_user_organization_id());

create policy "plugin_installations_update_own_org" on public.plugin_installations
  for update using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

create trigger plugin_installations_force_org_id
  before insert on public.plugin_installations
  for each row execute function public.force_organization_id_from_caller();

create trigger plugin_installations_lock_org_id
  before update on public.plugin_installations
  for each row execute function public.prevent_organization_id_change();

-- plugin_run_contexts: insert-only (immutability trigger already blocks
-- update/delete for non-service-role in the schema migration).
create policy "plugin_run_contexts_select_own_org" on public.plugin_run_contexts
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_run_contexts_insert_own_org" on public.plugin_run_contexts
  for insert with check (organization_id = public.current_user_organization_id());

create trigger plugin_run_contexts_force_org_id
  before insert on public.plugin_run_contexts
  for each row execute function public.force_organization_id_from_caller();

-- plugin_runs: insert + a bounded status update (submitted -> completed|rejected).
create policy "plugin_runs_select_own_org" on public.plugin_runs
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_runs_insert_own_org" on public.plugin_runs
  for insert with check (organization_id = public.current_user_organization_id());

create policy "plugin_runs_update_own_org" on public.plugin_runs
  for update using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

create trigger plugin_runs_force_org_id
  before insert on public.plugin_runs
  for each row execute function public.force_organization_id_from_caller();

create or replace function public.guard_plugin_run_update()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed';
  end if;
  if new.correlation_id is distinct from old.correlation_id then
    raise exception 'correlation_id cannot be changed';
  end if;
  if new.context_snapshot_id is distinct from old.context_snapshot_id then
    raise exception 'context_snapshot_id cannot be changed';
  end if;
  if old.status = 'completed' or old.status = 'rejected' then
    raise exception 'a completed or rejected run cannot be modified';
  end if;
  return new;
end;
$$;

create trigger plugin_runs_guard_update
  before update on public.plugin_runs
  for each row execute function public.guard_plugin_run_update();

-- plugin_evidence_outputs: insert-only, append-only.
create policy "plugin_evidence_outputs_select_own_org" on public.plugin_evidence_outputs
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_evidence_outputs_insert_own_org" on public.plugin_evidence_outputs
  for insert with check (organization_id = public.current_user_organization_id());

create trigger plugin_evidence_outputs_force_org_id
  before insert on public.plugin_evidence_outputs
  for each row execute function public.force_organization_id_from_caller();

-- plugin_audit_events: insert-only, append-only — no update/delete policy
-- exists for any non-service-role caller, so those actions are denied by
-- default.
create policy "plugin_audit_events_select_own_org" on public.plugin_audit_events
  for select using (organization_id = public.current_user_organization_id());

create policy "plugin_audit_events_insert_own_org" on public.plugin_audit_events
  for insert with check (organization_id = public.current_user_organization_id());

create trigger plugin_audit_events_force_org_id
  before insert on public.plugin_audit_events
  for each row execute function public.force_organization_id_from_caller();

-- promotion_requests: insert-only in this MVP (no KFSA response path exists
-- yet to update it against).
create policy "promotion_requests_select_own_org" on public.promotion_requests
  for select using (organization_id = public.current_user_organization_id());

create policy "promotion_requests_insert_own_org" on public.promotion_requests
  for insert with check (organization_id = public.current_user_organization_id());

create trigger promotion_requests_force_org_id
  before insert on public.promotion_requests
  for each row execute function public.force_organization_id_from_caller();
