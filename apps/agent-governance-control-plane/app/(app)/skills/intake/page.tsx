"use client";

import { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { ReviewOutcomeBadge } from "@/components/RuntimeBadges";
import { RiskBadge } from "@/components/badges";
import { reviewSkillIntake } from "@/runtime/skill-loader";
import { getSkillSourceTypeLabel } from "@/runtime/runtime-labels";
import type { DataSensitivity } from "@/lib/governance-model";
import type { SkillIntakeResult, SkillIntakeSubmission, SkillSourceType } from "@/runtime/types";

const SOURCE_TYPES: SkillSourceType[] = ["INTERNAL", "OFFICIAL_VENDOR", "COMMUNITY", "CUSTOM_ADAPTED"];
const DATA_CATEGORIES: DataSensitivity[] = ["low", "medium", "high"];

const EMPTY: SkillIntakeSubmission = {
  skillName: "",
  sourceUrl: "",
  sourceType: "COMMUNITY",
  descriptionAr: "",
  requiredTools: [],
  dataCategories: [],
  writeCapability: false,
  externalAccess: false,
  requiresAuthority: false,
  auditRequired: false,
  humanApprovalRequired: false,
  rawInstructionsAr: "",
};

export default function SkillIntakePage() {
  const [form, setForm] = useState<SkillIntakeSubmission>(EMPTY);
  const [toolsInput, setToolsInput] = useState("");
  const [result, setResult] = useState<SkillIntakeResult | null>(null);

  function toggleDataCategory(cat: DataSensitivity) {
    setForm((f) => ({
      ...f,
      dataCategories: f.dataCategories.includes(cat) ? f.dataCategories.filter((c) => c !== cat) : [...f.dataCategories, cat],
    }));
  }

  function submit() {
    const submission: SkillIntakeSubmission = {
      ...form,
      requiredTools: toolsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setResult(reviewSkillIntake(submission));
  }

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="فحص واستيراد مهارة (Skill Intake)"
        titleEn="Governed Skill Intake Review"
        subtitleAr="تسجيل يدوي لمهارة مرشحة لأغراض المراجعة — لا يجلب هذا النظام أي محتوى بعيد تلقائيًا ولا ينفذه"
      />

      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">
          إدراج المهارة لا يعني اعتمادها أو السماح بتنفيذها. لا تُستخدم أي مهارة قبل مراجعتها وتقييد أدواتها وبياناتها وصلاحياتها.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:grid-cols-2">
        <Field label="اسم المهارة">
          <input className="input" value={form.skillName} onChange={(e) => setForm({ ...form, skillName: e.target.value })} />
        </Field>
        <Field label="رابط المصدر">
          <input className="input" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://…" />
        </Field>
        <Field label="نوع المصدر">
          <select className="input" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value as SkillSourceType })}>
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {getSkillSourceTypeLabel(t)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="الأدوات المطلوبة (مفصولة بفاصلة)">
          <input className="input" value={toolsInput} onChange={(e) => setToolsInput(e.target.value)} placeholder="demo_web_search, demo_document_search" />
        </Field>
        <Field label="الوصف" full>
          <textarea className="input" rows={3} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
        </Field>
        <Field label="تعليمات المهارة (نص حر — لفحص الجودة)" full>
          <textarea className="input" rows={4} value={form.rawInstructionsAr} onChange={(e) => setForm({ ...form, rawInstructionsAr: e.target.value })} />
        </Field>
        <Field label="فئات البيانات" full>
          <div className="flex flex-wrap gap-3">
            {DATA_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm text-navy-700">
                <input type="checkbox" checked={form.dataCategories.includes(cat)} onChange={() => toggleDataCategory(cat)} />
                {cat === "low" ? "منخفضة" : cat === "medium" ? "متوسطة" : "عالية"}
              </label>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.writeCapability} onChange={(e) => setForm({ ...form, writeCapability: e.target.checked })} />
          صلاحية كتابة
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.externalAccess} onChange={(e) => setForm({ ...form, externalAccess: e.target.checked })} />
          وصول خارجي
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.requiresAuthority} onChange={(e) => setForm({ ...form, requiresAuthority: e.target.checked })} />
          تتطلب صلاحية مؤسسية
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.auditRequired} onChange={(e) => setForm({ ...form, auditRequired: e.target.checked })} />
          تتطلب تدقيقًا
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-700">
          <input type="checkbox" checked={form.humanApprovalRequired} onChange={(e) => setForm({ ...form, humanApprovalRequired: e.target.checked })} />
          تتطلب موافقة بشرية
        </label>
      </section>

      <div className="flex justify-end">
        <button onClick={submit} className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-gold-400 hover:bg-navy-900">
          فحص المهارة
        </button>
      </div>

      {result ? (
        <section className="space-y-4 rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-navy-900">نتيجة الفحص</h2>
            <ReviewOutcomeBadge outcome={result.outcome} />
            <RiskBadge risk={result.riskLevel} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold text-navy-400">النتائج</h3>
            <ul className="list-inside list-disc text-sm text-navy-700">
              {result.findingsAr.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
          {result.requiredFixesAr.length > 0 ? (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-amber-700">إصلاحات مطلوبة</h3>
              <ul className="list-inside list-disc text-sm text-amber-700">
                {result.requiredFixesAr.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h3 className="mb-1 text-xs font-semibold text-navy-400">حالة الاعتماد</h3>
            <p className={`text-sm font-semibold ${result.approvedForUse ? "text-emerald-700" : "text-red-700"}`}>
              {result.approvedForUse ? "معتمدة للاستخدام" : "غير معتمدة للاستخدام (approvedForUse = false)"}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold text-navy-400">الأدوات المسموحة</h3>
            <p className="text-sm text-navy-700">{result.allowedTools.join("، ") || "لا يوجد"}</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/60 p-3">
            <h3 className="mb-1 text-xs font-semibold text-red-700">إجراءات ممنوعة</h3>
            <ul className="list-inside list-disc text-sm text-red-700">
              {result.prohibitedActionsAr.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-navy-500">
            صلاحية مؤسسية بشرية مطلوبة: <span className="font-semibold">{result.requiredHumanAuthority ? "نعم" : "لا"}</span>
          </p>
        </section>
      ) : null}

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
