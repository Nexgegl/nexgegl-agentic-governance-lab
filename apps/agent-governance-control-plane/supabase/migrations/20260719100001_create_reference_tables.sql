-- Phase 2: live-data reference tables for Data Sources, Models, Vendors,
-- Agents, Incidents, Compliance, Audit Trails, Skills, and Tools.
-- Vocabulary mirrors lib/types.ts / runtime/types.ts exactly.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  category text,
  data_access_level text not null check (data_access_level in ('low', 'medium', 'high')),
  contract_status text not null check (contract_status in ('active', 'under_review', 'expired')),
  risk_tier text not null check (risk_tier in ('low', 'medium', 'high')),
  last_assessed text,
  created_at timestamptz not null default now()
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  type text not null check (type in ('structured', 'unstructured', 'document_repository', 'api_feed')),
  sensitivity text not null check (sensitivity in ('low', 'medium', 'high')),
  owner text,
  classification_status text not null check (classification_status in ('complete', 'partial', 'missing')),
  last_classified text,
  created_at timestamptz not null default now()
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  provider text not null check (provider in ('OpenAI', 'Anthropic', 'Microsoft', 'Google', 'Open-source', 'Internal')),
  version text,
  vendor_id uuid references public.vendors (id) on delete set null,
  data_residency text not null check (data_residency in ('in_country', 'regional', 'unknown')),
  evaluation_status text not null check (evaluation_status in ('complete', 'partial', 'missing')),
  last_evaluated text,
  risk_tier text not null check (risk_tier in ('low', 'medium', 'high')),
  -- Always false: this platform never claims production approval for any model.
  approved_for_production boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  use_case_id uuid references public.use_cases (id) on delete set null,
  agent_type text,
  tool_access text not null check (tool_access in ('none', 'read_only', 'write', 'external_system')),
  status text not null check (status in ('active', 'suspended', 'under_review')),
  owner_team text,
  last_permission_review text,
  created_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  use_case_id uuid references public.use_cases (id) on delete set null,
  title text not null,
  title_ar text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null check (status in ('open', 'investigating', 'resolved')),
  reported_date text,
  resolved_date text,
  summary_ar text,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  framework_name text not null,
  requirement text,
  requirement_ar text not null,
  mapped_control_ids text[] not null default '{}',
  status text not null check (status in ('complete', 'partial', 'missing')),
  owner text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  actor text not null,
  action text,
  action_ar text not null,
  use_case_id uuid references public.use_cases (id) on delete set null,
  layer text not null check (
    layer in (
      'ai_inventory', 'data_foundation', 'model_lifecycle', 'data_security_privacy',
      'access_control', 'agent_governance', 'human_oversight', 'compliance_audit'
    )
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.data_lineage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  use_case_id uuid references public.use_cases (id) on delete set null,
  flow_description text,
  flow_description_ar text not null
);

create table if not exists public.use_case_data_sources (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  use_case_id uuid not null references public.use_cases (id) on delete cascade,
  data_source_id uuid not null references public.data_sources (id) on delete cascade,
  primary key (use_case_id, data_source_id)
);

-- Skill/Tool registry (catalog display only). Preserves the existing
-- human-readable slugs from runtime/demo-skills.ts and runtime/demo-tools.ts
-- as primary keys so /skills/[id] and /tools/[id] routes keep working.
-- The governed research runtime's own execution engine keeps using its
-- internal deterministic runtime/demo-skills.ts and runtime/demo-tools.ts
-- arrays — this table is the registry/inventory view only, not the
-- execution-time source, so runtime determinism is unaffected.
create table if not exists public.skills (
  id text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  version text not null,
  description text,
  description_ar text,
  source_type text not null check (source_type in ('INTERNAL', 'OFFICIAL_VENDOR', 'COMMUNITY', 'CUSTOM_ADAPTED')),
  source_reference text,
  category text,
  trigger_conditions text[] not null default '{}',
  required_tools text[] not null default '{}',
  allowed_data_classes text[] not null default '{}',
  prohibited_data_classes text[] not null default '{}',
  required_authority boolean not null default false,
  action_type text not null check (action_type in ('READ', 'ANALYSIS', 'GENERATION', 'WRITE')),
  reversibility text not null check (reversibility in ('REVERSIBLE', 'IRREVERSIBLE', 'NOT_APPLICABLE')),
  external_system_access boolean not null default false,
  write_capability boolean not null default false,
  audit_required boolean not null default true,
  human_approval_required boolean not null default false,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  review_status text not null check (
    review_status in ('UNREVIEWED', 'UNDER_REVIEW', 'APPROVED_FOR_DEMO', 'REPAIR_REQUIRED', 'BLOCKED', 'RETIRED')
  ),
  approved_for_use boolean not null default false,
  checksum text,
  last_reviewed text,
  reviewer text,
  instructions text[] not null default '{}',
  risk_profile jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.tools (
  id text primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  description text,
  description_ar text,
  tool_type text not null check (
    tool_type in (
      'WEB_SEARCH', 'DOCUMENT_RETRIEVAL', 'INTERNAL_DATA_LOOKUP', 'CALCULATOR',
      'REPORT_GENERATOR', 'EXTERNAL_API', 'WRITE_ACTION'
    )
  ),
  system text,
  action_type text not null check (action_type in ('READ', 'ANALYSIS', 'GENERATION', 'WRITE')),
  read_write_class text not null check (read_write_class in ('READ_ONLY', 'WRITE')),
  data_classes text[] not null default '{}',
  external_access boolean not null default false,
  required_authority boolean not null default false,
  approval_mode text not null check (
    approval_mode in ('NONE', 'PRE_APPROVAL', 'PER_CALL_APPROVAL', 'HUMAN_CONFIRMATION', 'FORBIDDEN')
  ),
  reversible boolean not null default true,
  audit_required boolean not null default true,
  max_calls_per_run integer not null default 1,
  enabled boolean not null default true,
  demo_only boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.vendors enable row level security;
alter table public.data_sources enable row level security;
alter table public.models enable row level security;
alter table public.agents enable row level security;
alter table public.incidents enable row level security;
alter table public.compliance_mappings enable row level security;
alter table public.audit_events enable row level security;
alter table public.data_lineage enable row level security;
alter table public.use_case_data_sources enable row level security;
alter table public.skills enable row level security;
alter table public.tools enable row level security;

create index if not exists agents_use_case_id_idx on public.agents (use_case_id);
create index if not exists incidents_use_case_id_idx on public.incidents (use_case_id);
create index if not exists audit_events_use_case_id_idx on public.audit_events (use_case_id);
create index if not exists audit_events_timestamp_idx on public.audit_events ("timestamp" desc);
create index if not exists data_lineage_data_source_id_idx on public.data_lineage (data_source_id);
create index if not exists models_vendor_id_idx on public.models (vendor_id);
