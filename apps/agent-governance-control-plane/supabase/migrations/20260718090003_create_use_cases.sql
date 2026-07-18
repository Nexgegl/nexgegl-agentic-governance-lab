-- use_cases: the first real (non-mock) AI Inventory data. Vocabulary mirrors
-- lib/governance-model.ts's UseCase enums exactly, so existing label
-- functions and badge components can render these rows without a shim.
create table if not exists public.use_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  name_ar text not null,
  department text,
  owner_name text,
  authority text,
  ai_type text,
  business_purpose text,
  business_purpose_ar text,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  data_sensitivity text not null check (data_sensitivity in ('low', 'medium', 'high')),
  tool_access text not null check (tool_access in ('none', 'read_only', 'write', 'external_system')),
  governance_status text not null check (
    governance_status in (
      'BLOCKED',
      'REPAIR_REQUIRED',
      'GOVERNANCE_REVIEW_REQUIRED',
      'ESCALATE_REQUIRED',
      'READY_FOR_AUTHORITY_REVIEW'
    )
  ),
  eval_score numeric,
  eval_outcome text not null check (eval_outcome in ('PASS', 'FIX', 'FAIL', 'ESCALATE')),
  readiness_score numeric,
  evidence_status text not null check (evidence_status in ('complete', 'partial', 'missing')),
  authority_status text not null check (authority_status in ('confirmed', 'missing', 'escalation_required')),
  audit_trail_status text not null check (audit_trail_status in ('present', 'partial', 'missing')),
  lifecycle_stage text not null check (lifecycle_stage in ('proposed', 'pilot', 'governed_runtime', 'retired')),
  production_approval_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.use_cases enable row level security;

create index if not exists use_cases_organization_id_idx on public.use_cases (organization_id);
