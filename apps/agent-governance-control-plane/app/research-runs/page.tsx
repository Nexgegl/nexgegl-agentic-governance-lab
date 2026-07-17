"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { RunStatusBadge } from "@/components/RuntimeBadges";
import { RiskBadge } from "@/components/badges";
import { runs as demoRuns } from "@/runtime/run-store";
import { loadLocalRuns, resetLocalRuns } from "@/runtime/local-run-store";
import { getStopReasonLabel } from "@/runtime/runtime-labels";
import type { ExecutionRun } from "@/runtime/types";

export default function ResearchRunsPage() {
  const [localRuns, setLocalRuns] = useState<ExecutionRun[]>([]);

  useEffect(() => {
    setLocalRuns(loadLocalRuns());
  }, []);

  const runs = [...demoRuns, ...localRuns];
  const blocked = runs.filter((r) => r.status === "BLOCKED").length;
  const escalated = runs.filter((r) => r.status === "ESCALATE_REQUIRED").length;
  const ready = runs.filter((r) => r.status === "READY_FOR_AUTHORITY_REVIEW").length;
  const failed = runs.filter((r) => r.status === "FAILED").length;

  function handleReset() {
    resetLocalRuns();
    setLocalRuns([]);
  }

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="تشغيلات البحث المحكوم"
        titleEn="Governed Research Runs"
        subtitleAr="أول تنفيذ محكوم للوكلاء عبر مخطط: تخطيط → مهارات → أدوات → أدلة → تقييم → بوابة حوكمة → مراجعة بشرية"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إجمالي التشغيلات</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{runs.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">جاهزة لمراجعة السلطة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{ready}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 shadow-card">
          <p className="text-xs text-orange-700">مُصعَّدة</p>
          <p className="mt-1 text-2xl font-semibold text-orange-800">{escalated}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">محظورة / فاشلة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{blocked + failed}</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-navy-400">
          {localRuns.length > 0
            ? `يتضمن ${localRuns.length} تشغيلًا محفوظًا محليًا في هذا المتصفح (localStorage) بالإضافة إلى التشغيلات التجريبية الثابتة.`
            : "التشغيلات المعروضة حاليًا هي التشغيلات التجريبية الثابتة فقط."}
        </p>
        <div className="flex gap-2">
          {localRuns.length > 0 ? (
            <button
              onClick={handleReset}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              إعادة تعيين التشغيلات المحلية
            </button>
          ) : null}
          <Link href="/research-runs/new" className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-navy-900">
            تسجيل طلب بحث جديد ←
          </Link>
        </div>
      </div>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الطلب</th>
              <th className="px-4 py-3 text-start font-medium">مقدم الطلب</th>
              <th className="px-4 py-3 text-start font-medium">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium">حالة التشغيل</th>
              <th className="px-4 py-3 text-start font-medium">الأدلة</th>
              <th className="px-4 py-3 text-start font-medium">سبب الإيقاف</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ التقديم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {runs.map((r) => (
              <tr key={r.runId} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/research-runs/${r.runId}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {r.request.titleAr}
                  </Link>
                  <p className="text-[11px] text-navy-400">{r.runId}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{r.requester}</td>
                <td className="px-4 py-3">
                  <RiskBadge risk={r.request.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <RunStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-navy-700">{r.evidence.length}</td>
                <td className="px-4 py-3 text-navy-500">{r.stopReason ? getStopReasonLabel(r.stopReason) : "—"}</td>
                <td className="px-4 py-3 text-navy-500">{r.submittedAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
