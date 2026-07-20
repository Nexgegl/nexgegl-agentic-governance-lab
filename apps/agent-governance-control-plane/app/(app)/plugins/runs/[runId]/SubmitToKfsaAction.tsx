"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitToKfsaAction({ promotionRequestId, retry }: { promotionRequestId: string; retry: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/kfsa/promotion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promotion_request_id: promotionRequestId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message ?? "تعذّر إرسال طلب الترقية إلى KFSA.");
        return;
      }
      if (body.status === "FAILED") {
        setError(`فشل الإرسال (${body.error_code}).${body.retryable ? " يمكن إعادة المحاولة." : " لا يمكن إعادة المحاولة تلقائيًا."}`);
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
        className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-navy-900 disabled:opacity-60"
      >
        {submitting ? "جارٍ الإرسال…" : retry ? "إعادة المحاولة" : "إرسال إلى KFSA"}
      </button>
    </div>
  );
}
