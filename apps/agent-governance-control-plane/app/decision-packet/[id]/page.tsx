import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import { ScoreValue } from "@/components/ScoreValue";
import { getUseCaseById, useCases } from "@/lib/mock-data";
import { computeDecisionPacketSummary, getSensitivityLabel, getToolAccessLabel } from "@/lib/governance-model";

export function generateStaticParams() {
  return useCases.map((u) => ({ id: u.id }));
}

export default function DecisionPacketPage({ params }: { params: { id: string } }) {
  const useCase = getUseCaseById(params.id);
  if (!useCase) notFound();

  const summary = computeDecisionPacketSummary(useCase);
  const sensitivity = getSensitivityLabel(useCase.dataSensitivity);
  const toolAccess = getToolAccessLabel(useCase.toolAccess);

  return (
    <div className="space-y-6">
      <Topbar titleAr="حزمة القرار" titleEn="Decision Packet Preview" subtitleAr={useCase.nameAr} />

      <div className="mx-auto max-w-4xl rounded-xl border border-navy-200 bg-white shadow-card">
        <div className="flex items-center justify-between rounded-t-xl bg-navy-950 px-8 py-6 text-white">
          <div>
            <p className="text-xs text-navy-300">حزمة قرار تنفيذية — معاينة</p>
            <h2 className="mt-1 text-xl font-semibold">{useCase.nameAr}</h2>
            <p className="text-xs text-navy-400">{useCase.name}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gold-500 text-xl font-bold text-navy-950">
            ن
          </div>
        </div>

        <div className="space-y-8 px-8 py-8">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">ملخص حالة الاستخدام</h3>
            <p className="text-sm leading-relaxed text-navy-800">{summary.executiveSummary}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-navy-400">الإدارة</dt>
                <dd className="font-medium text-navy-900">{useCase.department}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">المالك</dt>
                <dd className="font-medium text-navy-900">{useCase.owner}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">السلطة المطلوبة</dt>
                <dd className="font-medium text-navy-900">{useCase.authority}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">الغرض التجاري</h3>
            <p className="text-sm leading-relaxed text-navy-800">{useCase.businessPurpose}</p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="text-xs text-navy-400">تصنيف الخطورة</p>
              <div className="mt-2">
                <RiskBadge risk={useCase.riskLevel} />
              </div>
              <p className="mt-1 text-[11px] text-navy-400">حساسية البيانات: {sensitivity.ar}</p>
            </div>
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="text-xs text-navy-400">حالة الحوكمة</p>
              <div className="mt-2">
                <GateStatusBadge status={useCase.governanceStatus} />
              </div>
            </div>
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="text-xs text-navy-400">نتيجة التقييم</p>
              <p className="mt-2 text-sm font-semibold text-navy-900">
                {useCase.evalOutcome} · <ScoreValue value={useCase.evalScore} />
              </p>
            </div>
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-4">
              <p className="text-xs text-navy-400">حالة الصلاحيات</p>
              <p className="mt-2 text-sm font-semibold text-navy-900">{toolAccess.ar}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-navy-100 p-4">
              <p className="text-xs text-navy-400">حالة الأدلة</p>
              <div className="mt-2">
                <EvidenceBadge status={useCase.evidenceStatus} />
              </div>
              <p className="mt-1 text-[11px] text-navy-400">اكتمال الأدلة: {summary.evidenceCompleteness}%</p>
            </div>
            <div className="rounded-lg border border-navy-100 p-4">
              <p className="text-xs text-navy-400">حالة السلطة المعتمدة</p>
              <div className="mt-2">
                <AuthorityBadge status={useCase.authorityStatus} />
              </div>
              <p className="mt-1 text-[11px] text-navy-400">السلطة المطلوبة: {useCase.authority}</p>
            </div>
          </section>

          <section className="rounded-lg border border-red-100 bg-red-50/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">الضوابط الناقصة</h3>
            {summary.missingControls.length === 0 ? (
              <p className="text-sm text-emerald-700">لا توجد ضوابط ناقصة.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                {summary.missingControls.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-gold-400 bg-gold-100/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-600">الإجراء التنفيذي الموصى به</h3>
            <p className="text-sm font-medium leading-relaxed text-navy-900">{summary.recommendedExecutiveAction}</p>
          </section>

          <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
            <p className="text-xs leading-relaxed text-navy-200">
              هذه الحزمة لا تصدر موافقة إنتاج، ولا تنشئ قرارًا رسميًا، ولا تنتج حكم KFSA.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-navy-400">
              This packet does not approve production, does not create an official decision, and does not generate a
              KFSA verdict. It is a preliminary preview requiring an authorized institutional authority.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
