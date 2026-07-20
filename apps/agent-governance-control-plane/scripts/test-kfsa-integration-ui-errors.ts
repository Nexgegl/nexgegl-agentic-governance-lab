/**
 * Part F of `npm run test:kfsa-integration`: proves the KFSA submission UI
 * (app/(app)/plugins/runs/[runId]/SubmitToKfsaAction.tsx) never renders a
 * raw server-supplied message, only a predefined Arabic string from
 * lib/kfsa/ui-error-messages.ts.
 *
 * This is a plain Node script (no jsdom/testing-library -- this repository
 * has no React-rendering test infrastructure and adding one is out of
 * scope for this fix). Rather than mounting the component, it:
 *   (a) tests resolveKfsaErrorMessage() directly, including with
 *       adversarial input (the exact raw English strings
 *       lib/kfsa/errors.ts and route.ts actually produce, SQL-error-shaped
 *       text, a stack-trace fragment, non-string values) and asserts the
 *       output is always a member of the closed
 *       ALL_KFSA_UI_ERROR_MESSAGES set and never contains the input as a
 *       substring;
 *   (b) statically scans the real SubmitToKfsaAction.tsx source to confirm
 *       it was actually wired to use the mapper (never reads body.message,
 *       imports and calls resolveKfsaErrorMessage for both the non-2xx and
 *       the FAILED-status branches).
 *
 * Covers:
 *   - every named server error/error_code resolves to its specific
 *     predefined Arabic message
 *   - every KfsaSubmissionBoundaryError/PluginBoundaryError reason not
 *     explicitly named (by design) resolves to the safe default message
 *   - arbitrary/adversarial input (raw exception text, SQL fragments, a
 *     stack trace, non-string values, an empty string) never leaks into
 *     the returned message
 *   - the real component file no longer reads body.message anywhere
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  resolveKfsaErrorMessage,
  ALL_KFSA_UI_ERROR_MESSAGES,
  DEFAULT_KFSA_ERROR_MESSAGE,
} from "@/lib/kfsa/ui-error-messages";
import { test, assert, assertEqual, printSummaryAndExit } from "./governance-tests/harness";

const NAMED_CODES: Record<string, string> = {
  unauthenticated: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  invalid_json: "تعذر معالجة الطلب. تحقق من البيانات وحاول مرة أخرى.",
  missing_promotion_request_id: "تعذر معالجة الطلب. تحقق من البيانات وحاول مرة أخرى.",
  client_authored_field: "تعذر معالجة الطلب. تحقق من البيانات وحاول مرة أخرى.",
  promotion_request_not_found: "تعذر العثور على طلب الترقية أو لا تملك صلاحية الوصول إليه.",
  correlation_conflict: "تعارض الطلب مع محاولة سابقة. راجع حالة الإرسال قبل المحاولة مجددًا.",
  timeout: "انتهت مهلة الاتصال بنواة KFSA. يمكنك إعادة المحاولة.",
  unavailable: "خدمة KFSA غير متاحة حاليًا. حاول لاحقًا.",
  unauthorized: "تعذر توثيق الاتصال بخدمة KFSA.",
  invalid_response: "استلم النظام استجابة غير صالحة من خدمة KFSA.",
};

// Every KfsaSubmissionBoundaryError/PluginBoundaryError reason and
// KfsaClientErrorCode value that is *not* one of the 10 named codes above
// -- these are deliberately left unmapped and must fall through to the
// safe default, not to some other leaked value.
const DELIBERATELY_UNMAPPED_REASONS = [
  "source_plugin_not_installed",
  "source_skill_invalid",
  "source_run_not_completed",
  "context_snapshot_missing",
  "evidence_mismatch",
  "missing_organization_context",
  "rejected",
  "tenant_mismatch",
];

// The actual raw English message strings lib/kfsa/errors.ts and route.ts
// produce -- if a future regression accidentally fed body.message (instead
// of body.error) into resolveKfsaErrorMessage, these are exactly the
// strings that would leak. None of them are valid map keys, so all must
// resolve to the default message with zero substring leakage.
const RAW_SERVER_MESSAGE_SAMPLES = [
  'No Promotion Request exists with id "pr-123" for this organization.',
  'Promotion Request\'s source skill "ai-governance.foo" is not a valid, enabled skill for this installation.',
  "Request body must be valid JSON.",
  'Field "organization_id" is prohibited; it is always resolved server-side.',
  "Sign in required.",
];

// Adversarial / defensive-in-depth inputs unrelated to this integration's
// own error vocabulary -- a stack-trace fragment, SQL-error-shaped text,
// prototype-pollution-shaped keys, and non-string values.
const ADVERSARIAL_INPUTS: unknown[] = [
  "TypeError: Cannot read properties of undefined (reading 'organization_id') at /app/lib/kfsa/promotion-submission.ts:167:9",
  'duplicate key value violates unique constraint "kfsa_submission_attempts_pkey"',
  "__proto__",
  "constructor",
  "",
  "   ",
  "UNAUTHENTICATED", // wrong case must not match
  " unauthenticated", // leading whitespace must not match
  "unauthenticated ", // trailing whitespace must not match
  null,
  undefined,
  42,
  true,
  { toString: () => "unauthenticated" },
  ["unauthenticated"],
];

async function run() {
  for (const [code, expected] of Object.entries(NAMED_CODES)) {
    await test(`ui-errors: known code "${code}" resolves to its specific predefined Arabic message`, () => {
      assertEqual(resolveKfsaErrorMessage(code), expected, `resolveKfsaErrorMessage("${code}")`);
      assert(ALL_KFSA_UI_ERROR_MESSAGES.includes(expected), `"${code}"'s message must be a member of the closed ALL_KFSA_UI_ERROR_MESSAGES set`);
    });
  }

  for (const reason of DELIBERATELY_UNMAPPED_REASONS) {
    await test(`ui-errors: unmapped-by-design reason "${reason}" resolves to the safe default message, not something else`, () => {
      assertEqual(resolveKfsaErrorMessage(reason), DEFAULT_KFSA_ERROR_MESSAGE, `resolveKfsaErrorMessage("${reason}")`);
    });
  }

  for (const rawMessage of RAW_SERVER_MESSAGE_SAMPLES) {
    await test(`ui-errors: a raw server message string ("${rawMessage.slice(0, 40)}...") never leaks into the rendered output`, () => {
      const resolved = resolveKfsaErrorMessage(rawMessage);
      assertEqual(resolved, DEFAULT_KFSA_ERROR_MESSAGE, "an unrecognized raw message must resolve to the default message");
      assert(!resolved.includes(rawMessage), "the resolved message must never contain the raw input as a substring");
    });
  }

  for (const input of ADVERSARIAL_INPUTS) {
    await test(`ui-errors: adversarial input ${JSON.stringify(input)} resolves only to a member of the closed message set`, () => {
      const resolved = resolveKfsaErrorMessage(input);
      assert(ALL_KFSA_UI_ERROR_MESSAGES.includes(resolved), `resolveKfsaErrorMessage(${JSON.stringify(input)}) returned a string outside the closed set: "${resolved}"`);
      if (typeof input === "string" && input.length > 3 && !Object.prototype.hasOwnProperty.call(NAMED_CODES, input)) {
        assert(!resolved.includes(input), `the resolved message must never contain adversarial input "${input}" as a substring`);
      }
    });
  }

  await test("ui-errors: SubmitToKfsaAction.tsx never reads body.message and is wired to the sanitized mapper", () => {
    const source = readFileSync(path.resolve(__dirname, "../app/(app)/plugins/runs/[runId]/SubmitToKfsaAction.tsx"), "utf8");
    assert(!source.includes("body.message"), "SubmitToKfsaAction.tsx must never read body.message from the server response");
    assert(source.includes("resolveKfsaErrorMessage(body.error)"), "the !response.ok branch must resolve its message via resolveKfsaErrorMessage(body.error)");
    assert(source.includes("resolveKfsaErrorMessage(body.error_code)"), "the FAILED-status branch must resolve its message via resolveKfsaErrorMessage(body.error_code)");
    assert(source.includes('from "@/lib/kfsa/ui-error-messages"'), "the component must import the sanitized mapper from lib/kfsa/ui-error-messages");
  });

  printSummaryAndExit("Part F: KFSA submission UI error-sanitization tests");
}

run().catch((error) => {
  console.error("Part F test runner crashed:", error);
  process.exit(1);
});
