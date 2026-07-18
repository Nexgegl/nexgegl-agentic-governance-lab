-- Phase 2: extend use_cases with the evidence-detail sub-object, the
-- per-column permissions matrix, and links into the new models/vendors
-- reference tables — all previously mock-only (lib/mock-data.ts UseCase).

alter table public.use_cases
  add column if not exists owner_evidence boolean not null default false,
  add column if not exists authority_evidence boolean not null default false,
  add column if not exists eval_evidence boolean not null default false,
  add column if not exists audit_evidence boolean not null default false,
  add column if not exists policy_boundary_evidence boolean not null default false,
  add column if not exists approval_evidence boolean not null default false,
  -- Record<PermissionColumn, PermissionCellStatus> — see lib/governance-model.ts.
  add column if not exists permissions jsonb not null default '{}',
  add column if not exists model_id uuid references public.models (id) on delete set null,
  add column if not exists vendor_id uuid references public.vendors (id) on delete set null;

create index if not exists use_cases_model_id_idx on public.use_cases (model_id);
create index if not exists use_cases_vendor_id_idx on public.use_cases (vendor_id);
