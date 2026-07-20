/**
 * npm run test:kfsa-integration
 *
 * Runs all six parts of the KFSA Promotion Request Integration test suite
 * and exits non-zero if any fails, mirroring test:plugin-governance's
 * structure:
 *
 *   - Part A (test-kfsa-integration-db.ts): real, disposable local
 *     Postgres -- the only place RLS/tenant-isolation/direct-write-bypass/
 *     referential-integrity claims for the three KFSA tables are proven.
 *   - Part B (test-kfsa-integration-boundary.ts): the real
 *     submitPromotionRequestForEvaluation ownership/verification logic
 *     against a fake in-memory Supabase client -- no network, no database.
 *   - Part C (test-kfsa-integration-client.ts): the real lib/kfsa/client.ts
 *     against an isolated mock HTTP server standing in for the external
 *     KFSA Runtime Core -- no real network call.
 *   - Part D (test-kfsa-integration-e2e.ts): the full composed flow (fake
 *     Supabase client + the same mock HTTP server) for success/timeout/
 *     retry/replay/correlation-conflict behavior.
 *   - Part E (test-kfsa-integration-concurrency.ts): the full composed
 *     flow against *real* Postgres with genuine Promise.all concurrency --
 *     the only place H-2 (a concurrent attempt-creation race) is proven
 *     fixed against the real code path, not simulated.
 *   - Part F (test-kfsa-integration-ui-errors.ts): proves the KFSA
 *     submission UI never renders a raw server message, only a predefined
 *     Arabic string.
 *
 * Parts B, C, D, E, and F import modules guarded by `import "server-only"`,
 * so each runs with NODE_OPTIONS=--conditions=react-server on its own
 * child process, exactly like test:plugin-governance's Part B.
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

const REACT_SERVER_ENV = { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --conditions=react-server`.trim() };

console.log("Running Part A (live-database tests)...");
const dbExit = runScript("test-kfsa-integration-db.ts", { PLUGIN_GOVERNANCE_TEST_DB: process.env.KFSA_INTEGRATION_TEST_DB ?? "kfsa_integration_test" });

console.log("\nRunning Part B (application-boundary tests, no database)...");
const boundaryExit = runScript("test-kfsa-integration-boundary.ts", REACT_SERVER_ENV);

console.log("\nRunning Part C (external KFSA client tests, mock HTTP server)...");
const clientExit = runScript("test-kfsa-integration-client.ts", REACT_SERVER_ENV);

console.log("\nRunning Part D (end-to-end tests, fake Supabase client + mock HTTP server)...");
const e2eExit = runScript("test-kfsa-integration-e2e.ts", REACT_SERVER_ENV);

console.log("\nRunning Part E (real-concurrency tests, real Postgres + mock HTTP server)...");
const concurrencyExit = runScript("test-kfsa-integration-concurrency.ts", { ...REACT_SERVER_ENV, PLUGIN_GOVERNANCE_TEST_DB: process.env.KFSA_INTEGRATION_CONCURRENCY_TEST_DB ?? "kfsa_integration_concurrency_test" });

console.log("\nRunning Part F (UI error-sanitization tests, no database, no network)...");
const uiErrorsExit = runScript("test-kfsa-integration-ui-errors.ts", REACT_SERVER_ENV);

if (dbExit !== 0 || boundaryExit !== 0 || clientExit !== 0 || e2eExit !== 0 || concurrencyExit !== 0 || uiErrorsExit !== 0) {
  console.error(
    `\ntest:kfsa-integration FAILED (Part A exit=${dbExit}, Part B exit=${boundaryExit}, Part C exit=${clientExit}, Part D exit=${e2eExit}, Part E exit=${concurrencyExit}, Part F exit=${uiErrorsExit})`,
  );
  process.exit(1);
}

console.log("\ntest:kfsa-integration: all checks passed (Part A + Part B + Part C + Part D + Part E + Part F).");
process.exit(0);
