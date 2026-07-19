/** Tiny deterministic test harness shared by the plugin-governance test scripts. */
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

export async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  }
}

export async function assertThrows(fn: () => Promise<unknown>, message: string): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error(`expected an error but none was thrown: ${message}`);
}

export function printSummaryAndExit(suiteName: string): never {
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`\n=== ${suiteName}: ${passed.length}/${results.length} passed ===`);
  for (const r of results) {
    console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.name}${r.error ? ` -- ${r.error}` : ""}`);
  }

  if (failed.length > 0) {
    console.error(`\n${suiteName}: ${failed.length} check(s) failed.`);
    process.exit(1);
  }
  process.exit(0);
}

export function getResults(): TestResult[] {
  return results;
}
