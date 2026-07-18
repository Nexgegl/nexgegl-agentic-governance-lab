-- Phase 2 RLS: every new table is read-only reference/catalog data for
-- ordinary signed-in users in this phase (no insert/update UI exists for
-- any of them yet) — scoped strictly to the caller's own organization via
-- the existing current_user_organization_id() helper. No insert/update/
-- delete policies are added, so those actions stay denied by default for
-- every role except service_role, matching the organizations table's own
-- posture from Phase 1.

create policy "vendors_select_own_org" on public.vendors
  for select using (organization_id = public.current_user_organization_id());

create policy "data_sources_select_own_org" on public.data_sources
  for select using (organization_id = public.current_user_organization_id());

create policy "models_select_own_org" on public.models
  for select using (organization_id = public.current_user_organization_id());

create policy "agents_select_own_org" on public.agents
  for select using (organization_id = public.current_user_organization_id());

create policy "incidents_select_own_org" on public.incidents
  for select using (organization_id = public.current_user_organization_id());

create policy "compliance_mappings_select_own_org" on public.compliance_mappings
  for select using (organization_id = public.current_user_organization_id());

create policy "audit_events_select_own_org" on public.audit_events
  for select using (organization_id = public.current_user_organization_id());

create policy "data_lineage_select_own_org" on public.data_lineage
  for select using (organization_id = public.current_user_organization_id());

create policy "use_case_data_sources_select_own_org" on public.use_case_data_sources
  for select using (organization_id = public.current_user_organization_id());

create policy "skills_select_own_org" on public.skills
  for select using (organization_id = public.current_user_organization_id());

create policy "tools_select_own_org" on public.tools
  for select using (organization_id = public.current_user_organization_id());
