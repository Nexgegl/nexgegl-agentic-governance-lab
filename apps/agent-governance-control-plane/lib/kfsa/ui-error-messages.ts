/**
 * Closed, predefined Arabic vocabulary for every error the KFSA submission
 * UI (SubmitToKfsaAction.tsx) may ever display. This is intentionally a
 * plain, framework-independent module (no "use client", no
 * "server-only" -- it is imported by a client component and contains no
 * secret or server-only value) so its mapping logic can be exercised
 * directly by scripts/test-kfsa-integration-ui-errors.ts without any
 * browser/DOM test infrastructure.
 *
 * resolveKfsaErrorMessage() never echoes its input, or any substring of
 * it, into its return value -- an unrecognized code (any string not an
 * exact key below, or a non-string value) always resolves to
 * DEFAULT_KFSA_ERROR_MESSAGE. This closes the gap where the UI used to
 * render a server response's raw `message` field (English, describing
 * internal validation reasoning) directly to the user.
 */

/** Fallback for any error/error_code the map below does not name explicitly. */
export const DEFAULT_KFSA_ERROR_MESSAGE = "تعذر إكمال الإرسال. حاول مرة أخرى أو راجع مسؤول النظام.";

/**
 * Keyed by the `error` field the Governance Gateway route
 * (app/api/kfsa/promotion-requests/route.ts) returns for a non-2xx
 * response, or the `error_code` field (a KfsaClientErrorCode from
 * lib/kfsa/client.ts) it returns alongside `status: "FAILED"`. Any
 * reason/code not listed here -- including every other
 * KfsaSubmissionBoundaryError/PluginBoundaryError reason
 * (lib/kfsa/errors.ts, lib/plugins/errors.ts) and the rarely-emitted
 * KfsaClientErrorCode values "rejected"/"tenant_mismatch" -- is deliberately
 * left unmapped and falls through to DEFAULT_KFSA_ERROR_MESSAGE, which is
 * itself already a safe, sanitized message.
 */
const KFSA_ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
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
});

/**
 * The exact, closed set of strings resolveKfsaErrorMessage can ever return.
 * Tests use this to assert every rendered message is a member of this set,
 * never an arbitrary server-supplied string.
 */
export const ALL_KFSA_UI_ERROR_MESSAGES: readonly string[] = Object.freeze(
  Array.from(new Set([...Object.values(KFSA_ERROR_MESSAGES), DEFAULT_KFSA_ERROR_MESSAGE])),
);

/**
 * Maps a server-supplied error/error_code identifier to a predefined
 * Arabic message. `code` is untrusted input from a JSON HTTP response
 * body -- only an exact string match against a KFSA_ERROR_MESSAGES key
 * selects a specific message; everything else (wrong type, empty string,
 * unrecognized identifier, or a raw exception/message string) resolves to
 * DEFAULT_KFSA_ERROR_MESSAGE.
 */
export function resolveKfsaErrorMessage(code: unknown): string {
  if (typeof code === "string" && Object.prototype.hasOwnProperty.call(KFSA_ERROR_MESSAGES, code)) {
    return KFSA_ERROR_MESSAGES[code];
  }
  return DEFAULT_KFSA_ERROR_MESSAGE;
}

export const KFSA_RETRYABLE_SUFFIX = " يمكن إعادة المحاولة.";
export const KFSA_NON_RETRYABLE_SUFFIX = " لا يمكن إعادة المحاولة تلقائيًا.";
