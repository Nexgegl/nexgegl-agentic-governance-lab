import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "../lib/supabase/client";

const ROOT = path.resolve(__dirname, "..");

interface Issue {
  check: string;
  message: string;
}

const issues: Issue[] = [];

function fail(check: string, message: string) {
  issues.push({ check, message });
}

function read(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function listFiles(dir: string, exts: string[]): string[] {
  const full = path.join(ROOT, dir);
  if (!existsSync(full)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const relPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(relPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(relPath);
    }
  }
  return out;
}

// 1. Required env var names exist -------------------------------------------

const REQUIRED_ENV_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

const envExample = read(".env.local.example");
if (envExample === null) {
  fail("env-names", ".env.local.example is missing.");
} else {
  for (const name of REQUIRED_ENV_NAMES) {
    if (!envExample.includes(name)) {
      fail("env-names", `.env.local.example does not mention ${name}.`);
    }
  }
  if (envExample.includes("SUPABASE_SERVICE_ROLE_KEY=")) {
    fail("env-names", ".env.local.example must not set a real SUPABASE_SERVICE_ROLE_KEY value.");
  }
}

const envHelper = read("lib/supabase/env.ts");
if (envHelper === null) {
  fail("env-names", "lib/supabase/env.ts is missing.");
} else {
  for (const name of REQUIRED_ENV_NAMES) {
    if (!envHelper.includes(name)) {
      fail("env-names", `lib/supabase/env.ts does not reference ${name}.`);
    }
  }
}

// 2. Browser/server clients initialize --------------------------------------
//
// The server client depends on next/headers, which only works inside a real
// Next.js request — it cannot be constructed from a standalone script, so it
// is checked structurally instead of by invocation. The browser client has
// no such dependency, so it is actually invoked with dummy credentials.

const clientSource = read("lib/supabase/client.ts");
if (clientSource === null) {
  fail("client-init", "lib/supabase/client.ts is missing.");
} else if (!clientSource.includes("createBrowserClient") || !clientSource.includes("export function createClient")) {
  fail("client-init", "lib/supabase/client.ts does not look like a browser client factory.");
} else {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://validate-supabase-placeholder.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "validate-supabase-placeholder-anon-key";
  try {
    const client = createClient();
    if (!client || typeof client.from !== "function" || typeof client.auth !== "object") {
      fail("client-init", "createClient() did not return a usable Supabase client instance.");
    }
  } catch (error) {
    fail("client-init", `createClient() threw unexpectedly: ${(error as Error).message}`);
  } finally {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
}

const serverSource = read("lib/supabase/server.ts");
if (serverSource === null) {
  fail("client-init", "lib/supabase/server.ts is missing.");
} else if (
  !serverSource.includes("createServerClient") ||
  !serverSource.includes("next/headers") ||
  !serverSource.includes("export function createServerSupabaseClient")
) {
  fail("client-init", "lib/supabase/server.ts does not look like a Server Component client factory.");
}

const middlewareHelperSource = read("lib/supabase/middleware.ts");
if (middlewareHelperSource === null) {
  fail("client-init", "lib/supabase/middleware.ts is missing.");
} else if (!middlewareHelperSource.includes("export async function updateSession")) {
  fail("client-init", "lib/supabase/middleware.ts does not export updateSession().");
}

if (!existsSync(path.join(ROOT, "middleware.ts"))) {
  fail("client-init", "Root middleware.ts is missing.");
}

// 3. No service-role key exposed to client code ------------------------------

const CLIENT_REACHABLE_DIRS = ["app", "components", "lib/supabase/client.ts"];
for (const relPath of [
  ...listFiles("app", [".ts", ".tsx"]),
  ...listFiles("components", [".ts", ".tsx"]),
  "lib/supabase/client.ts",
]) {
  const content = read(relPath);
  if (content && content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    fail("service-role-key", `${relPath} references SUPABASE_SERVICE_ROLE_KEY but must never read it.`);
  }
}
void CLIENT_REACHABLE_DIRS;

// 4. Migrations exist ---------------------------------------------------------

const migrationFiles = listFiles("supabase/migrations", [".sql"]);
if (migrationFiles.length === 0) {
  fail("migrations-exist", "No .sql files found under supabase/migrations/.");
}

// 5. RLS enabled + 6. production_approval_status defaults false -------------

const allMigrationSql = migrationFiles.map((f) => read(f) ?? "").join("\n");

for (const table of ["organizations", "profiles", "use_cases"]) {
  const pattern = new RegExp(`alter table public\\.${table} enable row level security`, "i");
  if (!pattern.test(allMigrationSql)) {
    fail("rls-enabled", `No "enable row level security" statement found for ${table}.`);
  }
}

if (!/production_approval_status\s+boolean\s+not null\s+default\s+false/i.test(allMigrationSql)) {
  fail("production-approval-default", "use_cases.production_approval_status is not declared as boolean not null default false.");
}

// 7. AI Inventory pages no longer import lib/mock-data.ts --------------------

for (const relPath of ["app/(app)/ai-inventory/page.tsx", "app/(app)/ai-inventory/[id]/page.tsx"]) {
  const content = read(relPath);
  if (content === null) {
    fail("ai-inventory-live", `${relPath} is missing.`);
  } else if (content.includes("@/lib/mock-data")) {
    fail("ai-inventory-live", `${relPath} still imports @/lib/mock-data.`);
  } else if (!content.includes("@/repositories/use-cases-repository")) {
    fail("ai-inventory-live", `${relPath} does not read from repositories/use-cases-repository.`);
  }
}

// 8. Dashboard AI Inventory KPIs no longer derive from mock useCases ---------

const dashboardSource = read("app/(app)/dashboard/page.tsx");
if (dashboardSource === null) {
  fail("dashboard-live-kpis", "app/(app)/dashboard/page.tsx is missing.");
} else {
  if (!dashboardSource.includes("computeKpis(") || !/computeKpis\(\s*realUseCases/.test(dashboardSource)) {
    fail("dashboard-live-kpis", "Dashboard's computeKpis(...) call no longer appears to be driven by live (Supabase) use cases.");
  }
  if (!dashboardSource.includes("@/repositories/use-cases-repository")) {
    fail("dashboard-live-kpis", "Dashboard does not import the use-cases repository.");
  }
}

// 9. Remaining mock-backed pages are explicitly labeled as development data -

const MOCK_BACKED_PAGES = [
  "app/(app)/access-control/page.tsx",
  "app/(app)/agents/page.tsx",
  "app/(app)/agents/[id]/page.tsx",
  "app/(app)/audit-trails/page.tsx",
  "app/(app)/compliance/page.tsx",
  "app/(app)/data-sources/page.tsx",
  "app/(app)/data-sources/[id]/page.tsx",
  "app/(app)/decision-packet/[id]/page.tsx",
  "app/(app)/evidence/page.tsx",
  "app/(app)/gate-board/page.tsx",
  "app/(app)/incidents/page.tsx",
  "app/(app)/models/page.tsx",
  "app/(app)/models/[id]/page.tsx",
  "app/(app)/oversight/page.tsx",
  "app/(app)/security/page.tsx",
];

for (const relPath of MOCK_BACKED_PAGES) {
  const content = read(relPath);
  if (content === null) {
    fail("mock-pages-labeled", `${relPath} is missing.`);
  } else if (!content.includes("DevDataNote")) {
    fail("mock-pages-labeled", `${relPath} still uses mock data but is not labeled with <DevDataNote />.`);
  }
}

if (dashboardSource && !dashboardSource.includes("DevDataNote")) {
  fail("mock-pages-labeled", "Dashboard's remaining mock-backed sections are not labeled with <DevDataNote />.");
}

// ----------------------------------------------------------------------------

console.log(`Supabase Foundation v1 validation: ${issues.length === 0 ? "OK" : "FAILED"}`);
console.log(`Issues: ${issues.length}`);
for (const issue of issues) {
  console.log(`  [${issue.check}] ${issue.message}`);
}

if (issues.length > 0) {
  process.exit(1);
}
