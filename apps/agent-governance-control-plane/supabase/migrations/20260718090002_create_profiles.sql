-- Profiles: one row per auth.users identity, scoping that user to an organization.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
