"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { runGovernedResearch } from "@/runtime/execution-engine";
import { newRunTemplates } from "@/runtime/demo-requests";
import { nextLocalRunId, saveLocalRun } from "@/runtime/local-run-store";
import type { DataSensitivity, Department, RiskLevel } from "@/lib/governance-model";
import type { GovernedResearchRequest } from "@/runtime/types";

const DEPARTMENTS: Department[] = ["Finance", "Sales", "HR", "Legal", "Operations", "Customer Service", "Executive Office"];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];
const SENSITIVITY_LEVELS: DataSensitivity[] = ["low", "medium", "high"];

/** Fixed base timestamp for interactively-created runs, offset deterministically per local run index — no Date.now(). */
const LIVE_RUN_BASE_TIMESTAMP = new Date("2026-07-17T09:00:00.000Z").getTime();

const EMPTY_FORM: Omit<GovernedResearchRequest, "id" | "submittedAt"> = {
  titleAr: "",
  researchQuestionAr: "",
  businessPurposeAr: "",
  department: "Operations",
  requester: "",
  owner: "",
  riskLevel: "medium",
  dataSensitivity: "medium",
  requiresExternalAccess: false,
  requiresWriteAction: false,
  authorityHolder: "",
  maxSteps: 12,
  maxToolCalls: 10,
};

export default function NewResearchRunPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function applyTemplate(key: string) {
    const template = newRunTemplates.find((t) => t.key === key);
    if (template) setForm(template.request);
  }

  function submit() {
    setSubmitting(true);
    const id = nextLocalRunId();
    const index = Number(id.split("-").pop()) || 1;
    const submittedAt = new Date(LIVE_RUN_BASE_TIMESTAMP + index * 60 * 60 * 1000).toISOString();
    const request: GovernedResearchRequest = { id, submittedAt, ...form };
    const result = runGovernedResearch(request);
    saveLocalRun(result);
    router.push(`/research-runs/${result.runId}`);
  }

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="تسجيل طلب بحث مؤسسي محكوم"
        titleEn="New Governed Research Request"
        subtitleAr="ينفَّذ التشغيل محليًا داخل المتصفح مباشرة عبر نفس محرك التنفيذ المحكوم — بدون خادم أو قاعدة بيانات"
      />

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <p className="mb-3 text-xs font-semibold text-navy-500">قوالب جاهزة:</p>
        <div className="flex flex-wrap gap-2">
          {newRunTemplates.map((t) => (
            <button
              key={t.key}
              onClick={() => applyTemplate(t.key)}
              className="rounded-lg border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-100"
            >
              {t.labelAr}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:grid-cols-2">
        <Field label="عنوان الطلب">
          <input className="input" value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
        </Field>
        <Field label="مقدم الطلب">
          <input className="input" value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} />
        </Field>
        <Field label="السؤال البحثي" full>
          <textarea className="input" rows={3} value={form.researchQuestionAr} onChange={(e) => setForm({ ...form, researchQuestionAr: e.target.value })} />
        </Field>
        <Field label="الغرض التجاري" full>
          <textarea className="input" rows={2} value={form.businessPurposeAr} onChange={(e) => setForm({ ...form, businessPurposeAr: e.target.value })} />
        </Field>
        <Field label="الإدارة">
          <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as Department })}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="مالك الحالة">
          <input className="input" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        </Field>
        <Field label="مستوى الخطورة">
          <select className="input" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}>
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r === "low" ? "منخفضة" : r === "medium" ? "متوسطة" : "عالية"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="حساسية البيانات">
          <select className="input" value={form.dataSensitivity} onChange={(e) => setForm({ ...form, dataSensitivity: e.target.value as DataSensitivity })}>
            {SENSITIVITY_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s === "low" ? "منخفضة" : s === "medium" ? "متوسطة" : "عالية"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="صاحب الصلاحية">
          <input className="input" value={form.authorityHolder} onChange={(e) => setForm({ ...form, authorityHolder: e.target.value })} placeholder="اتركه فارغًا إن لم يُحدَّد" />
        </Field>
        <Field label="الحد الأقصى للخطوات">
          <input type="number" min={1} className="input" value={form.maxSteps} onChange={(e) => setForm({ ...form, maxSteps: Number(e.target.value) })} />
        </Field>
        <Field label="الحد الأقصى لاستدعاءات الأدوات">
          <input type="number" min={1} className="input" value={form.maxToolCalls} onChange={(e) => setForm({ ...form, maxToolCalls: Number(e.target.value) })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.requiresExternalAccess} onChange={(e) => setForm({ ...form, requiresExternalAccess: e.target.checked })} />
          هل يتطلب الوصول لنظام خارجي؟
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.requiresWriteAction} onChange={(e) => setForm({ ...form, requiresWriteAction: e.target.checked })} />
          هل يتطلب إجراء كتابة؟
        </label>
      </section>

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-gold-400 hover:bg-navy-900 disabled:opacity-60"
        >
          {submitting ? "جارٍ التشغيل…" : "تشغيل بحث محكوم"}
        </button>
      </div>
      <p className="text-end text-xs text-navy-400">
        يُنفَّذ التشغيل محليًا داخل المتصفح، ويُحفظ في تخزين هذا المتصفح المحلي (localStorage) فقط — بدون خادم أو قاعدة بيانات.
      </p>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1 block text-xs font-medium text-navy-500">{label}</label>
      {children}
    </div>
  );
}
