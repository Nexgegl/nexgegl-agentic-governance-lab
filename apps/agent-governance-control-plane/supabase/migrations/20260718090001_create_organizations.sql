-- Organizations: the tenant boundary for everything else in this schema.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
