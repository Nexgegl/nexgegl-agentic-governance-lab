-- Corrective migration: do not overwrite organization_id when there is no
-- authenticated caller.
--
-- Security rationale
-- -------------------
-- public.set_use_case_organization_id() (see 20260718090004_rls_policies.sql)
-- unconditionally overwrote new.organization_id with
-- public.current_user_organization_id(). That helper reads
-- `select organization_id from public.profiles where id = auth.uid()`, and
-- auth.uid() is only non-null for an actual signed-in request that reached
-- Postgres through PostgREST/GoTrue with a user JWT (the normal
-- browser -> Next.js server -> Supabase path used by every plugin route
-- handler in this app). A privileged context that connects directly and has
-- no JWT at all -- `supabase db reset` running supabase/seed.sql, a plain
-- psql session, future admin tooling -- has auth.uid() = null, so the
-- unconditional assignment forced organization_id to null on every insert
-- and violated the not-null constraint on use_cases.organization_id.
--
-- This does not weaken tenant isolation: every real end-user request still
-- has organization_id forced from the caller's own profile, exactly as
-- before. It only stops forcing a value when there is no authenticated user
-- to derive one from -- the same condition already relied upon by
-- public.force_organization_id_from_caller() introduced in
-- 20260720100002_rls_plugin_foundation.sql for the new plugin tables.
--
-- Why this is a new migration instead of an edit to 20260718090004
-- -----------------------------------------------------------------
-- 20260718090004_rls_policies.sql was committed (3ade954) and pushed to
-- origin/feature/supabase-foundation-v1 before this corrective pass. A
-- migration file that has already reached a shared branch may already have
-- been applied against a real database by Supabase CLI's timestamp-keyed
-- migration history (`supabase_migrations.schema_migrations`); editing that
-- file's contents in place would not re-run against any environment that
-- already recorded that timestamp as applied, silently leaving the bug in
-- place there. The safe, additive fix is a new migration with its own
-- timestamp that replaces the function body going forward.
--
-- create or replace function is idempotent: re-running this migration (or
-- applying it after a fresh `supabase db reset`, where 20260718090004 has
-- already run with its original, reverted body) always converges on the
-- same corrected function definition.

create or replace function public.set_use_case_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- organization_id is never accepted from client input for a real
  -- end-user request: it is always derived from the authenticated user's
  -- own profile. auth.uid() is only non-null for an actual signed-in
  -- request (browser -> server -> Supabase with the user's session); a
  -- privileged context with no JWT (migrations, `supabase db reset`
  -- seeding, admin tooling) has auth.uid() = null, so it may supply
  -- organization_id explicitly instead of being forced to null here.
  if auth.uid() is not null then
    new.organization_id := public.current_user_organization_id();
  end if;
  new.updated_at := now();
  if auth.role() <> 'service_role' then
    new.production_approval_status := false;
  end if;
  return new;
end;
$$;

-- The existing trigger (use_cases_set_organization_id, created in
-- 20260718090004_rls_policies.sql) already references this function by
-- name, so replacing the function body is sufficient -- the trigger itself
-- does not need to be dropped or recreated.
