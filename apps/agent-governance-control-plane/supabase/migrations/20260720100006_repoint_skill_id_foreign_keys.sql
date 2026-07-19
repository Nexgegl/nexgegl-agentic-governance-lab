-- Repoints every plugin-facing skill_id/source_skill_id foreign key
-- introduced in 20260720100001 from the legacy, organization-scoped
-- `skills` table to the new global `skill_definitions` table
-- (20260720100004). Additive: adds new constraints in place of the old
-- ones via alter table, does not edit any historical migration file.
--
-- Not repointed: public.skill_versions.skill_id, which still references
-- `skills`. That table is unused by the plugin architecture (see
-- 20260720100004's comment) and is left exactly as it was.
--
-- Safe to run against an empty table (the only real-world case, since no
-- live project has ever applied these migrations): dropping and
-- re-adding a foreign key constraint with zero existing rows never
-- fails a validation scan.

alter table public.plugin_skill_permissions
  drop constraint if exists plugin_skill_permissions_skill_id_fkey,
  add constraint plugin_skill_permissions_skill_id_fkey
    foreign key (skill_id) references public.skill_definitions (id) on delete cascade;

alter table public.plugin_run_contexts
  drop constraint if exists plugin_run_contexts_skill_id_fkey,
  add constraint plugin_run_contexts_skill_id_fkey
    foreign key (skill_id) references public.skill_definitions (id) on delete cascade;

alter table public.plugin_runs
  drop constraint if exists plugin_runs_skill_id_fkey,
  add constraint plugin_runs_skill_id_fkey
    foreign key (skill_id) references public.skill_definitions (id) on delete cascade;

alter table public.plugin_audit_events
  drop constraint if exists plugin_audit_events_skill_id_fkey,
  add constraint plugin_audit_events_skill_id_fkey
    foreign key (skill_id) references public.skill_definitions (id) on delete set null;

alter table public.promotion_requests
  drop constraint if exists promotion_requests_source_skill_id_fkey,
  add constraint promotion_requests_source_skill_id_fkey
    foreign key (source_skill_id) references public.skill_definitions (id) on delete restrict;
