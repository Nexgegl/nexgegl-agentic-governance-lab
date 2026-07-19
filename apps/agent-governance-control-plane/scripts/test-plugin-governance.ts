/**
 * npm run test:plugin-governance
 *
 * Runs both halves of the reproducible plugin-governance test suite and
 * exits non-zero if either fails. This replaces "trust the last manual
 * live-Postgres session" with a command anyone can re-run:
 *
 *   - Part A (scripts/test-plugin-governance-db.ts): rebuilds a disposable
 *     local Postgres database from scratch (drop, recreate, run every
 *     migration, run supabase/seed.sql) and exercises RLS, immutability
 *     triggers, unique/check constraints, and the organization_id trigger
 *     fix directly against real Postgres. Requires a reachable Postgres
 *     superuser connection -- see PLUGIN_GOVERNANCE_ADMIN_DATABASE_URL.
 *   - Part B (scripts/test-plugin-governance-boundary.ts): calls the real
 *     lib/plugins/* functions (composeContext, runSkill) against a fake,
 *     in-memory Supabase client -- no network or database dependency.
 *     Needs NODE_OPTIONS=--conditions=react-server so the `server-only`
 *     guard in those modules resolves to its no-op export instead of
 *     throwing (the same condition Next.js uses when bundling Server
 *     Components) -- this script sets it on the child process itself, so
 *     `npm run test:plugin-governance` does not require the caller to set
 *     it manually.
 *
 * Neither part is a substitute for the other: Part A is the only one that
 * proves real Postgres enforces these rules; Part B is the only one that
 * proves the actual TypeScript boundary code (not a reimplementation of it)
 * rejects prohibited input/output and disabled/undeclared capabilities.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

function runScript(relativePath: string, extraEnv: Record<string, string> = {}): number {
  const result = spawnSync(process.execPath, [require.resolve("tsx/cli"), path.join(__dirname, relativePath)], {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    console.error(result.error);
    return 1;
  }
  return result.status ?? 1;
}

console.log("Running Part B (application-boundary tests, no database)...");
const boundaryExit = runScript("test-plugin-governance-boundary.ts", { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --conditions=react-server`.trim() });

console.log("\nRunning Part A (live-database tests)...");
const dbExit = runScript("test-plugin-governance-db.ts");

if (boundaryExit !== 0 || dbExit !== 0) {
  console.error(`\ntest:plugin-governance FAILED (Part A exit=${dbExit}, Part B exit=${boundaryExit})`);
  process.exit(1);
}

console.log("\ntest:plugin-governance: all checks passed (Part A + Part B).");
process.exit(0);
