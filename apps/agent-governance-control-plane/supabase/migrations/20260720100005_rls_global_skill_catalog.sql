-- RLS for the global skill catalog added in 20260720100004.
--
-- Same posture as plugin_definitions/plugin_versions: readable by any
-- signed-in user (this is platform capability metadata, not tenant data --
-- there is no organization_id column on either table for a policy to scope
-- by), and writable only by service_role (no insert/update/delete policy
-- exists for any other role, so RLS denies those actions by default). This
-- is what "no tenant can modify global skill-definition metadata" means at
-- the database level: it is not merely convention, it is enforced by the
-- absence of a write policy plus RLS's default-deny.

alter table public.skill_definitions enable row level security;
alter table public.skill_definition_versions enable row level security;

create policy "skill_definitions_select_authenticated" on public.skill_definitions
  for select using (auth.uid() is not null);

create policy "skill_definition_versions_select_authenticated" on public.skill_definition_versions
  for select using (auth.uid() is not null);
