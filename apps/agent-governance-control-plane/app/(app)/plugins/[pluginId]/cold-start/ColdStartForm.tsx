"use client";

import { useState } from "react";
import type { ColdStartInput, ColdStartResult } from "@/lib/plugins/cold-start";

const EMPTY: ColdStartInput = {
  organization: { sector: "", jurisdictions: [], business_units: [], governance_model: "centralized" },
  ai_environment: { approved_models: [], approved_deployment_environments: [] },
  authority: { ai_governance_owner: "", authority_matrix_references: [] },
  risk: { risk_appetite: "medium", prohibited_ai_uses: [], restricted_data_classifications: ["high"] },
  evidence: { evidence_requirements: [] },
  escalation: { escalation_threshold_risk_level: "high", human_review_required: true },
  connectors: { approved_connector_ids: [] },
};

function toList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ColdStartForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ColdStartResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/plugins/ai-governance/cold-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.message ?? "تعذّر حفظ الملف المؤسسي.");
        return;
      }
      setResult(await response.json());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">١. المؤسسة</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
            placeholder="القطاع"
            value={form.organization.sector}
            onChange={(e) => setForm({ ...form, organization: { ...form.organization, sector: e.target.value } })}
          />
          <select
            className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
            value={form.organization.governance_model}
            onChange={(e) => setForm({ ...form, organization: { ...form.organization, governance_model: e.target.value as "centralized" | "federated" | "hybrid" } })}
          >
            <option value="centralized">مركزي</option>
            <option value="federated">اتحادي</option>
            <option value="hybrid">مختلط</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٢. بيئة الذكاء الاصطناعي</h2>
        <input
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
          placeholder="النماذج المعتمدة (مفصولة بفاصلة)"
          onChange={(e) => setForm({ ...form, ai_environment: { ...form.ai_environment, approved_models: toList(e.target.value) } })}
        />
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٣. الصلاحية المؤسسية</h2>
        <input
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
          placeholder="مالك حوكمة الذكاء الاصطناعي"
          value={form.authority.ai_governance_owner}
          onChange={(e) => setForm({ ...form, authority: { ...form.authority, ai_governance_owner: e.target.value } })}
        />
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٤. المخاطر</h2>
        <select
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
          value={form.risk.risk_appetite}
          onChange={(e) => setForm({ ...form, risk: { ...form.risk, risk_appetite: e.target.value as "low" | "medium" | "high" } })}
        >
          <option value="low">منخفضة</option>
          <option value="medium">متوسطة</option>
          <option value="high">عالية</option>
        </select>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٥. الأدلة</h2>
        <input
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
          placeholder="متطلبات الأدلة (مفصولة بفاصلة)"
          onChange={(e) => setForm({ ...form, evidence: { evidence_requirements: toList(e.target.value) } })}
        />
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٦. التصعيد</h2>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={form.escalation.human_review_required}
            onChange={(e) => setForm({ ...form, escalation: { ...form.escalation, human_review_required: e.target.checked } })}
          />
          تتطلب مراجعة بشرية دائمًا
        </label>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">٧. الموصلات</h2>
        <input
          className="w-full rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
          placeholder="معرّفات الموصلات المعتمدة (مفصولة بفاصلة)"
          onChange={(e) => setForm({ ...form, connectors: { approved_connector_ids: toList(e.target.value) } })}
        />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-medium text-gold-400 hover:bg-navy-900 disabled:opacity-60"
      >
        {submitting ? "جارٍ الحفظ…" : "حفظ الملف المؤسسي"}
      </button>

      {result ? (
        <section className="rounded-xl border-2 border-navy-900 bg-navy-950 p-5 text-white">
          <h2 className="mb-2 text-sm font-semibold text-gold-400">نتيجة الإعداد الأولي</h2>
          <p className="text-sm">درجة اكتمال الملف: {result.completenessScore}%</p>
          {result.missingCriticalFields.length > 0 ? (
            <p className="mt-1 text-xs text-amber-300">حقول حرجة ناقصة: {result.missingCriticalFields.join("، ")}</p>
          ) : (
            <p className="mt-1 text-xs text-emerald-300">لا توجد حقول حرجة ناقصة.</p>
          )}
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-navy-900 p-3 text-[11px] leading-relaxed text-navy-200">{result.contextPreview}</pre>
        </section>
      ) : null}
    </div>
  );
}
