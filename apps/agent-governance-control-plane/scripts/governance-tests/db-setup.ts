import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const ADMIN_URL = process.env.PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
const TEST_DB_NAME = process.env.PLUGIN_GOVERNANCE_TEST_DB ?? "plugin_governance_test";

const ROOT = path.resolve(__dirname, "../..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const SEED_FILE = path.join(ROOT, "supabase/seed.sql");

function testDbUrl(): string {
  const url = new URL(ADMIN_URL);
  url.pathname = `/${TEST_DB_NAME}`;
  return url.toString();
}

/**
 * A minimal stub of the Supabase `auth` schema for local verification only:
 * `auth.users`, and `auth.uid()`/`auth.role()` reading the same
 * `request.jwt.claim.*` GUCs PostgREST sets per-request in a real project.
 * This is test-only infrastructure, never applied to any real environment.
 */
const AUTH_STUB_SQL = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

grant usage on schema public to authenticated, service_role;
grant usage on schema auth to authenticated, service_role;
grant execute on function auth.uid() to authenticated, service_role;
grant execute on function auth.role() to authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public grant all on tables to authenticated, service_role;
`;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export interface TestOrgFixtures {
  orgAId: string;
  orgBId: string;
  userAId: string;
  userAAdminId: string;
  userBId: string;
}

/**
 * Rebuilds a completely fresh, disposable database: drops/recreates it,
 * installs the auth stub, runs every migration in
 * supabase/migrations/*.sql in filename order (including the new
 * 20260720100003 corrective migration), runs supabase/seed.sql exactly as
 * `supabase db reset` would, then adds a second organization plus three
 * auth identities (two in org A, one in org B) needed for the cross-tenant
 * assertions this suite makes. Every step uses ON_ERROR_STOP-equivalent
 * behavior: any failure throws and aborts the whole run non-zero.
 */
export async function rebuildTestDatabase(): Promise<{ connectionString: string; fixtures: TestOrgFixtures }> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    await admin.query(`select pg_terminate_backend(pid) from pg_stat_activity where datname = $1`, [TEST_DB_NAME]);
    await admin.query(`drop database if exists ${TEST_DB_NAME}`);
    await admin.query(`create database ${TEST_DB_NAME}`);
  } finally {
    await admin.end();
  }

  const connectionString = testDbUrl();
  const db = new Client({ connectionString });
  await db.connect();
  try {
    await db.query(`create extension if not exists pgcrypto`);
    await db.query(AUTH_STUB_SQL);

    for (const file of migrationFiles()) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      try {
        await db.query(sql);
      } catch (error) {
        throw new Error(`Migration "${file}" failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const seedSql = readFileSync(SEED_FILE, "utf8");
    try {
      await db.query(seedSql);
    } catch (error) {
      throw new Error(`supabase/seed.sql failed against a fresh migrated database: ${error instanceof Error ? error.message : String(error)}`);
    }

    const orgAId = "00000000-0000-0000-0000-000000000001"; // matches supabase/seed.sql
    const orgBId = "00000000-0000-0000-0000-00000000b001";
    const userAId = "00000000-0000-0000-0000-0000000a0001";
    const userAAdminId = "00000000-0000-0000-0000-0000000a0002";
    const userBId = "00000000-0000-0000-0000-0000000b0001";

    await db.query(`insert into public.organizations (id, name, slug) values ($1, 'Org B (test fixture)', 'org-b-test-fixture')`, [orgBId]);

    await db.query(`insert into auth.users (id, email) values ($1, 'user-a@test.local'), ($2, 'user-a-admin@test.local'), ($3, 'user-b@test.local')`, [
      userAId,
      userAAdminId,
      userBId,
    ]);
    await db.query(`insert into public.profiles (id, organization_id, full_name, role) values ($1, $2, 'User A', 'member')`, [userAId, orgAId]);
    await db.query(`insert into public.profiles (id, organization_id, full_name, role) values ($1, $2, 'User A Admin', 'admin')`, [userAAdminId, orgAId]);
    await db.query(`insert into public.profiles (id, organization_id, full_name, role) values ($1, $2, 'User B', 'member')`, [userBId, orgBId]);

    return { connectionString, fixtures: { orgAId, orgBId, userAId, userAAdminId, userBId } };
  } finally {
    await db.end();
  }
}

export function adminConnectionString(): string {
  return ADMIN_URL;
}

export function testDatabaseName(): string {
  return TEST_DB_NAME;
}
