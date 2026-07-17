import { Topbar } from "@/components/Topbar";
import { RiskBadge } from "@/components/badges";
import { RunStatusBadge } from "@/components/RuntimeBadges";
import { getSkillById } from "@/runtime/demo-skills";
import { getToolById } from "@/runtime/demo-tools";
import type { ExecutionRun } from "@/runtime/types";

export function ResearchRunDecisionPacket({ run }: { run: ExecutionRun }) {
  const packet = run.decisionPacket;

  return (
    <div className="space-y-6">
      <Topbar titleAr="حزمة قرار تشغيل بحث محكوم" titleEn="Governed Research Run — Decision Packet" subtitleAr={run.request.titleAr} />

      <div className="mx-auto max-w-4xl rounded-xl border border-navy-200 bg-white shadow-card">
        <div className="flex items-center justify-between rounded-t-xl bg-navy-950 px-8 py-6 text-white">
          <div>
            <p className="text-xs text-navy-300">حزمة قرار تشغيل بحث — معاينة</p>
            <h2 className="mt-1 text-xl font-semibold">{run.request.titleAr}</h2>
            <p className="text-xs text-navy-400">{run.runId}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gold-500 text-xl font-bold text-navy-950">ن</div>
        </div>

        <div className="space-y-8 px-8 py-8">
          <section className="flex flex-wrap items-center gap-2">
            <RunStatusBadge status={run.status} />
            <RiskBadge risk={run.request.riskLevel} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">طلب البحث المؤسسي</h3>
            <p className="text-sm leading-relaxed text-navy-800">{packet?.requestSummaryAr ?? run.request.researchQuestionAr}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-navy-400">الإدارة</dt>
                <dd className="font-medium text-navy-900">{run.request.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">مالك الحالة</dt>
                <dd className="font-medium text-navy-900">{run.request.owner}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">صاحب الصلاحية</dt>
                <dd className="font-medium text-navy-900">{run.request.authorityHolder || "غير محدد"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">ملخص الخطة</h3>
            <p className="text-sm leading-relaxed text-navy-800">{packet?.planSummaryAr ?? "لم تُنشأ خطة تنفيذ — رُفض الطلب في مرحلة التخطيط."}</p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="mb-2 text-xs text-navy-400">المهارات المستخدمة</p>
              {run.selectedSkills.length === 0 ? (
                <p className="text-sm text-navy-400">لا يوجد</p>
              ) : (
                <ul className="space-y-1 text-sm text-navy-800">
                  {run.selectedSkills.map((s) => (
                    <li key={s}>{getSkillById(s)?.nameAr ?? s}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="mb-2 text-xs text-navy-400">الأدوات المستخدمة</p>
              {run.selectedTools.length === 0 ? (
                <p className="text-sm text-navy-400">لا يوجد</p>
              ) : (
                <ul className="space-y-1 text-sm text-navy-800">
                  {run.selectedTools.map((t) => (
                    <li key={t}>{getToolById(t)?.nameAr ?? t}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-navy-100 p-4">
              <p className="text-xs text-navy-400">ملخص الأدلة</p>
              <p className="mt-2 text-sm text-navy-800">{packet?.evidenceSummaryAr ?? "لا توجد أدلة."}</p>
            </div>
            <div className="rounded-lg border border-navy-100 p-4">
              <p className="text-xs text-navy-400">ملخص التقييم</p>
              <p className="mt-2 text-sm text-navy-800">{packet?.evaluationSummaryAr ?? "لا يوجد تقييم."}</p>
            </div>
          </section>

          <section className="rounded-lg border border-red-100 bg-red-50/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">فجوات الحوكمة غير المحلولة</h3>
            {!packet || packet.unresolvedGapsAr.length === 0 ? (
              <p className="text-sm text-emerald-700">لا توجد فجوات غير محلولة.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                {packet.unresolvedGapsAr.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-navy-100 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">حالة المراجعة البشرية</h3>
            <p className="text-sm text-navy-800">{packet?.humanReviewSummaryAr ?? "لم تُسجَّل مراجعة بشرية بعد."}</p>
          </section>

          <section className="rounded-lg border border-gold-400 bg-gold-100/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-600">الإجراء التنفيذي الموصى به</h3>
            <p className="text-sm font-medium leading-relaxed text-navy-900">{packet?.recommendedNextActionAr}</p>
          </section>

          <section className="rounded-lg border border-navy-100 bg-navy-50 p-3">
            <p className="text-xs text-navy-500">
              مرجع سجل التنفيذ: <span className="font-mono">{packet?.executionTraceReference}</span> — راجع تبويب
              &quot;سجل التنفيذ&quot; في صفحة التشغيل للاطلاع الكامل.
            </p>
          </section>

          <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
            <p className="text-xs leading-relaxed text-navy-200">
              هذه الحزمة لا تصدر موافقة إنتاج، ولا تنشئ قرارًا رسميًا، ولا تنتج حكم KFSA. مخرجات البحث تمهيدية وتتطلب مراجعة واعتمادًا من سلطة مؤسسية مخولة.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
