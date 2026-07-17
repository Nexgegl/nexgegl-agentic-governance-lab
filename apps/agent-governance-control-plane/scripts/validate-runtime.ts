/**
 * CLI entry point for `npm run validate:runtime`. Thin wrapper only — it
 * does not change any validation logic, it just invokes the existing
 * runtime/validation.ts::runAllRuntimeValidations() and reports the result
 * with a process exit code suitable for CI.
 */

import { runAllRuntimeValidations } from "../runtime/validation";

const result = runAllRuntimeValidations();

console.log(`Governed Research Runtime validation: ${result.ok ? "OK" : "FAILED"}`);
console.log(`Issues: ${result.issues.length}`);
for (const issue of result.issues) {
  console.log(`  [${issue.check}] ${issue.message}`);
}

if (!result.ok) {
  process.exit(1);
}
