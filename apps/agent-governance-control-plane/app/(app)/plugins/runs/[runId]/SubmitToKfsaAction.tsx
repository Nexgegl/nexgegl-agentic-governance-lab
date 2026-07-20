"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Never displays a raw server error, a KFSA decision, or a decision code
 * -- only these sanitized, pre-written Arabic messages. See the required
 * notice rendered separately in page.tsx: "نتيجة التقييم الحوكمي ليست
 * قرارًا رسميًا...".
 */
const GENERIC_ERROR_MESSAGE = "تعذّر إرسال طلب الترقية إلى KFSA. حاول مرة أخرى.";
const NETWORK_ERROR_MESSAGE = "تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.";

export function SubmitToKfsaAction({ promotionRequestId, retry }: { promotionRequestId: string; retry: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return; // belt-and-suspenders against a double-click racing the disabled attribute
    setSubmitting(true);
    setError(null);
    try {
      let response: Response;
      try {
        response = await fetch("/api/kfsa/promotion-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promotion_request_id: promotionRequestId }),
        });
      } catch {
        setError(NETWORK_ERROR_MESSAGE);
        return;
      }

      let body: Record<string, unknown>;
      try {
        body = await response.json();
      } catch {
        // A non-JSON response body (e.g. an unexpected server error page)
        // must never surface as a silent unhandled rejection -- show a
        // sanitized message instead of the raw response.
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }

      if (!response.ok) {
        setError(typeof body.message === "string" ? body.message : GENERIC_ERROR_MESSAGE);
        return;
      }

      if (body.status === "FAILED") {
        setError(`فشل الإرسال (${body.error_code}).${body.retryable ? " يمكن إعادة المحاولة." : " لا يمكن إعادة المحاولة تلقائيًا."}`);
      } else if (body.status === "IN_PROGRESS") {
        setError("طلب إرسال سابق لا يزال قيد التنفيذ. يرجى الانتظار قبل المحاولة مرة أخرى.");
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        aria-busy={submitting}
        className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-navy-900 disabled:opacity-60"
      >
        {submitting ? "جارٍ الإرسال…" : retry ? "إعادة المحاولة" : "إرسال إلى KFSA"}
      </button>
    </div>
  );
}
