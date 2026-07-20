-- RLS for the KFSA Promotion Request Integration tables. Reuses
-- public.current_user_organization_id() and
-- public.force_organization_id_from_caller(), both from
-- 20260718090004_rls_policies.sql / 20260720100002_rls_plugin_foundation.sql
-- -- no new tenant-scoping mechanism is introduced. No table here grants
-- BYPASSRLS to any application role, and no table has a DELETE policy for
-- ordinary tenants (only service_role can delete, via the existing default
-- Postgres posture of "no policy = denied").

alter table public.kfsa_submission_attempts enable row level security;
alter table public.kfsa_evaluation_responses enable row level security;
alter table public.kfsa_external_audit_links enable row level security;

-- kfsa_submission_attempts: insert + a bounded update while status is
-- still 'in_progress' (guarded by guard_kfsa_submission_attempt_update()
-- in the schema migration). No delete policy.
create policy "kfsa_submission_attempts_select_own_org" on public.kfsa_submission_attempts
  for select using (organization_id = public.current_user_organization_id());

create policy "kfsa_submission_attempts_insert_own_org" on public.kfsa_submission_attempts
  for insert with check (organization_id = public.current_user_organization_id());

create policy "kfsa_submission_attempts_update_own_org" on public.kfsa_submission_attempts
  for update using (organization_id = public.current_user_organization_id())
  with check (organization_id = public.current_user_organization_id());

create trigger kfsa_submission_attempts_force_org_id
  before insert on public.kfsa_submission_attempts
  for each row execute function public.force_organization_id_from_caller();

-- kfsa_evaluation_responses: insert-only, append-only -- no update/delete
-- policy exists for any non-service-role caller (also independently
-- blocked by prevent_kfsa_evaluation_response_mutation()).
create policy "kfsa_evaluation_responses_select_own_org" on public.kfsa_evaluation_responses
  for select using (organization_id = public.current_user_organization_id());

create policy "kfsa_evaluation_responses_insert_own_org" on public.kfsa_evaluation_responses
  for insert with check (organization_id = public.current_user_organization_id());

create trigger kfsa_evaluation_responses_force_org_id
  before insert on public.kfsa_evaluation_responses
  for each row execute function public.force_organization_id_from_caller();

-- kfsa_external_audit_links: insert-only, append-only -- same posture.
create policy "kfsa_external_audit_links_select_own_org" on public.kfsa_external_audit_links
  for select using (organization_id = public.current_user_organization_id());

create policy "kfsa_external_audit_links_insert_own_org" on public.kfsa_external_audit_links
  for insert with check (organization_id = public.current_user_organization_id());

create trigger kfsa_external_audit_links_force_org_id
  before insert on public.kfsa_external_audit_links
  for each row execute function public.force_organization_id_from_caller();
