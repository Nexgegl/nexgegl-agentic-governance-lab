-- Multi-tenancy and RLS for organizations, profiles, use_cases.
--
-- Design notes:
-- * current_user_organization_id() is security definer so it can read the
--   caller's own profile row without recursing through profiles' own RLS
--   policy (a standard Supabase pattern for org-scoped RLS).
-- * organization_id is never trusted from client input: the insert trigger
--   on use_cases overwrites whatever the client sent with the caller's own
--   organization_id, and update triggers reject any attempt to change
--   organization_id after the fact.
-- * production_approval_status can only be changed by the service_role
--   (i.e. server-side/admin tooling, never an ordinary signed-in user).

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- organizations --------------------------------------------------------

create policy "organizations_select_own" on public.organizations
  for select
  using (id = public.current_user_organization_id());

-- No insert/update/delete policies for ordinary users: with RLS enabled and
-- no matching policy, these actions are denied by default. Organization
-- creation is an administrative action for this v1 (service_role only).

-- profiles ---------------------------------------------------------------

create policy "profiles_select_own_org" on public.profiles
  for select
  using (organization_id = public.current_user_organization_id());

create policy "profiles_update_own" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.prevent_privileged_profile_field_change()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    if new.organization_id is distinct from old.organization_id then
      raise exception 'organization_id cannot be changed by the user';
    end if;
    if new.role is distinct from old.role then
      raise exception 'role cannot be changed by the user';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privileged_field_change
  before update on public.profiles
  for each row execute function public.prevent_privileged_profile_field_change();

-- No insert policy for profiles: provisioning a new profile (and assigning
-- its organization_id) is an administrative action for this v1, done with
-- the service role. See supabase/seed.sql for the documented placeholder
-- flow.

-- use_cases ----------------------------------------------------------------

create policy "use_cases_select_own_org" on public.use_cases
  for select
  using (organization_id = public.current_user_organization_id());

create policy "use_cases_insert_own_org" on public.use_cases
  for insert
  with check (organization_id = public.current_user_organization_id());

create policy "use_cases_update_own_org" on public.use_cases
  for update
  using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

-- No delete policy: deletes are denied by default for all non-service_role
-- callers.

create or replace function public.set_use_case_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- organization_id is never accepted from client input: it is always
  -- derived from the authenticated user's own profile.
  new.organization_id := public.current_user_organization_id();
  new.updated_at := now();
  if auth.role() <> 'service_role' then
    new.production_approval_status := false;
  end if;
  return new;
end;
$$;

create trigger use_cases_set_organization_id
  before insert on public.use_cases
  for each row execute function public.set_use_case_organization_id();

create or replace function public.guard_use_case_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if auth.role() <> 'service_role' then
    if new.organization_id is distinct from old.organization_id then
      raise exception 'organization_id cannot be changed';
    end if;
    if new.production_approval_status is distinct from old.production_approval_status then
      raise exception 'production_approval_status cannot be changed by this role';
    end if;
  end if;
  return new;
end;
$$;

create trigger use_cases_guard_update
  before update on public.use_cases
  for each row execute function public.guard_use_case_update();
