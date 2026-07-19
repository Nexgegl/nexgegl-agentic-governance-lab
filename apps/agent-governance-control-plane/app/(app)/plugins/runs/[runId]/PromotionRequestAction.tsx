"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PromotionRequestAction({ runId }: { runId: string }) {
  const router = useRouter();
  const [objective, setObjective] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/plugins/runs/${runId}/promotion-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message ?? "تعذّر إعداد طلب الترقية.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        placeholder="هدف طلب الترقية"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || !objective}
        className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-navy-900 disabled:opacity-60"
      >
        {submitting ? "جارٍ الإعداد…" : "إعداد طلب ترقية"}
      </button>
      <p className="text-[11px] text-navy-400">
        طلب الترقية مخصص لنواة KFSA للمراجعة — هو ليس قرارًا رسميًا بحد ذاته.
      </p>
    </div>
  );
}
