"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY = {
  name: "",
  name_ar: "",
  department: "",
  owner_name: "",
  ai_type: "",
  business_purpose: "",
  business_purpose_ar: "",
  risk_level: "medium" as "low" | "medium" | "high",
  data_sensitivity: "medium" as "low" | "medium" | "high",
  tool_access: "read_only" as "none" | "read_only" | "write" | "external_system",
};

function generateCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function RunSkillForm({ pluginId, skillId }: { pluginId: string; skillId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/plugins/${pluginId}/skills/${encodeURIComponent(skillId)}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correlationId: generateCorrelationId(), input: form }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message ?? "تعذّر تشغيل المهارة.");
        return;
      }
      router.push(`/plugins/runs/${body.runId}`);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900";

  return (
    <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
      <h2 className="text-sm font-semibold text-navy-900">تشغيل: استقبال سجل الذكاء الاصطناعي</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="الاسم (Name)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={inputClass} placeholder="الاسم بالعربية" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <input className={inputClass} placeholder="الإدارة" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <input className={inputClass} placeholder="المالك" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
        <input className={inputClass} placeholder="نوع الذكاء الاصطناعي" value={form.ai_type} onChange={(e) => setForm({ ...form, ai_type: e.target.value })} />
        <select className={inputClass} value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value as typeof form.risk_level })}>
          <option value="low">خطورة منخفضة</option>
          <option value="medium">خطورة متوسطة</option>
          <option value="high">خطورة عالية</option>
        </select>
        <select
          className={inputClass}
          value={form.data_sensitivity}
          onChange={(e) => setForm({ ...form, data_sensitivity: e.target.value as typeof form.data_sensitivity })}
        >
          <option value="low">حساسية بيانات منخفضة</option>
          <option value="medium">حساسية بيانات متوسطة</option>
          <option value="high">حساسية بيانات عالية</option>
        </select>
        <select className={inputClass} value={form.tool_access} onChange={(e) => setForm({ ...form, tool_access: e.target.value as typeof form.tool_access })}>
          <option value="none">بدون وصول لأدوات</option>
          <option value="read_only">قراءة فقط</option>
          <option value="write">كتابة</option>
          <option value="external_system">نظام خارجي</option>
        </select>
      </div>
      <textarea
        className={inputClass}
        placeholder="الغرض التجاري بالعربية"
        value={form.business_purpose_ar}
        onChange={(e) => setForm({ ...form, business_purpose_ar: e.target.value })}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || !form.name || !form.name_ar}
        className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-medium text-gold-400 hover:bg-navy-900 disabled:opacity-60"
      >
        {submitting ? "جارٍ التشغيل…" : "تشغيل المهارة"}
      </button>
      <p className="text-xs text-navy-400">
        هذا التشغيل يُنتج مرشح قرار وحزمة أدلة فقط — لا يُنشئ قرارًا رسميًا ولا حكم KFSA.
      </p>
    </div>
  );
}
