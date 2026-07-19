-- Global plugin skill catalog (additive fix for the multi-tenant skill
-- provisioning gap found in PR #99 review).
--
-- Root cause being fixed: the original plugin foundation migrations
-- (20260720100001/100002) extended the existing, organization-scoped
-- `skills` table (public.skills, `id text primary key`, `organization_id`
-- required) with plugin metadata columns, and supabase/seed.sql inserted
-- the six ai-governance skill declarations as rows owned by one
-- organization. Because `skills.id` is a plain global text primary key
-- (not composite with organization_id), a second organization could never
-- have its own copy of e.g. "ai-governance.ai-inventory-intake" under the
-- same id, and nothing in the application ever provisioned per-org skill
-- rows on install. Any organization other than the seeded demo org that
-- installed the plugin therefore saw zero skills and could not run any of
-- them.
--
-- Fix: plugin-owned skill declarations are global catalog data (this is
-- capability metadata describing what the plugin *can* do, analogous to
-- plugin_definitions/plugin_versions -- it is not tenant data). Whether a
-- given organization's installation has a skill enabled is the only part
-- that is genuinely tenant-scoped, and that already has its own table:
-- plugin_skill_permissions (organization_id, plugin_installation_id,
-- skill_id, enabled). This migration adds the global catalog side;
-- 20260720100006 repoints plugin_skill_permissions and the other
-- skill_id foreign keys introduced in 20260720100001 from `skills` to
-- `skill_definitions`.
--
-- The legacy `skills` table is untouched by this migration and remains
-- exactly as it was for the pre-existing, non-plugin "Governed Research
-- Runtime" skills (institutional-research-planning, evidence-collection,
-- source-quality-review, governance-risk-analysis, decision-packet-
-- drafting) and the Skill Registry / Skill Intake pages that list them --
-- those are unrelated to the plugin architecture and out of scope here.
-- The plugin_id/execution_status/required_profile_fields/
-- permitted_connectors/escalation_conditions columns 20260720100001 added
-- to `skills` are no longer populated by the plugin architecture going
-- forward (they stay in place, unused, rather than being dropped here --
-- dropping columns from an already-pushed migration's resulting table is
-- a larger, riskier change than this fix requires).

create table if not exists public.skill_definitions (
  id text primary key,
  plugin_id text not null references public.plugin_definitions (plugin_id) on delete cascade,
  name text not null,
  name_ar text not null,
  version text not null,
  description text,
  description_ar text,
  category text,
  execution_status text not null default 'not_implemented' check (execution_status in ('implemented', 'not_implemented')),
  required_profile_fields text[] not null default '{}',
  permitted_connectors text[] not null default '{}',
  escalation_conditions text[] not null default '{}',
  risk_level text check (risk_level is null or risk_level in ('low', 'medium', 'high')),
  human_approval_required boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.skill_definitions is
  'Global, plugin-owned skill catalog -- not tenant data. No organization_id column by design: a skill''s declared capability (what it does, its execution_status, required profile fields, permitted connectors) is identical for every organization that installs the plugin. Per-organization enable/disable state lives in plugin_skill_permissions, not here.';

create index if not exists skill_definitions_plugin_id_idx on public.skill_definitions (plugin_id);

-- Immutable version history, mirroring the plugin_versions pattern.
create table if not exists public.skill_definition_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id text not null references public.skill_definitions (id) on delete cascade,
  version text not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  unique (skill_id, version)
);

comment on table public.skill_definition_versions is
  'Immutable per-version snapshots of a skill_definitions row, global like its parent table. Distinct from the pre-existing (unused, organization-scoped) public.skill_versions table, which is left untouched for legacy compatibility and is not part of the plugin architecture.';

create or replace function public.prevent_skill_definition_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'skill_definition_versions rows are immutable once created';
  end if;
  return new;
end;
$$;

create trigger skill_definition_versions_immutable
  before update or delete on public.skill_definition_versions
  for each row execute function public.prevent_skill_definition_version_mutation();

-- Safety cleanup: remove any plugin-owned rows a prior run of this branch's
-- seed.sql may have already inserted into the legacy `skills` table, now
-- that skill_definitions is the source of truth for them. A no-op if none
-- exist (the normal case, since no live project has ever run these
-- migrations).
delete from public.skills where plugin_id is not null;
