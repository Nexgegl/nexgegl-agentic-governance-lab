import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import { ScoreValue } from "@/components/ScoreValue";
import {
  agents,
  auditEvents,
  complianceMappings,
  dataSources,
  getUseCaseById,
  humanReviews,
  incidents,
  models,
  privacyControls,
  securityControls,
  useCases,
  vendors,
} from "@/lib/mock-data";
import { computeDecisionPacketSummary, getReviewOutcomeLabel, getSensitivityLabel, getToolAccessLabel } from "@/lib/governance-model";
import { computeDecisionPacketLayers, type LayerSeverity } from "@/lib/governance-engine";
import { GOVERNANCE_LAYERS } from "@/lib/labels";
import { getRunById, runs } from "@/runtime/run-store";
import { ResearchRunDecisionPacket } from "@/components/ResearchRunDecisionPacket";

export function generateStaticParams() {
  return [...useCases.map((u) => ({ id: u.id })), ...runs.map((r) => ({ id: r.runId }))];
}

const SEVERITY_CLASSES: Record<LayerSeverity, string> = {
  ok: "border-emerald-200 bg-emerald-50/60",
  warning: "border-amber-200 bg-amber-50/60",
  critical: "border-red-200 bg-red-50/60",
};

const SEVERITY_DOT_CLASSES: Record<LayerSeverity, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

export default function DecisionPacketPage({ params }: { params: { id: string } }) {
  const run = getRunById(params.id);
  if (run) return <ResearchRunDecisionPacket run={run} />;

  const useCase = getUseCaseById(params.id);
  if (!useCase) notFound();

  const summary = computeDecisionPacketSummary(useCase);
  const sensitivity = getSensitivityLabel(useCase.dataSensitivity);
  const toolAccess = getToolAccessLabel(useCase.toolAccess);
  const layers = computeDecisionPacketLayers(useCase, {
    agents,
    models,
    vendors,
    dataSources,
    securityControls,
    privacyControls,
    humanReviews,
    incidents,
    complianceMappings,
    auditEvents,
  });

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
            <p className="text-sm leading-relaxed text-navy-800">{useCase.businessPurposeAr}</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-400">{useCase.businessPurpose}</p>
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
                {getReviewOutcomeLabel(useCase.evalOutcome).ar} · <ScoreValue value={useCase.evalScore} />
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

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">تغطية الطبقات الثماني للحوكمة</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {layers.map((layer) => {
                const meta = GOVERNANCE_LAYERS.find((l) => l.key === layer.layer)!;
                return (
                  <div key={layer.layer} className={`rounded-lg border p-3 ${SEVERITY_CLASSES[layer.severity]}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT_CLASSES[layer.severity]}`} />
                      <p className="text-xs font-semibold text-navy-900">{meta.labelAr}</p>
                      <p className="text-[10px] text-navy-400">{meta.labelEn}</p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-navy-700">{layer.findingAr}</p>
                    <p className="mt-1 text-[11px] font-medium text-navy-600">
                      الفجوة: {layer.missingControlAr}
                    </p>
                    {layer.nextActionAr ? (
                      <p className="mt-1 text-[11px] text-navy-500">الإجراء التالي: {layer.nextActionAr}</p>
                    ) : null}
                    <dl className="mt-2 space-y-0.5 border-t border-navy-100 pt-2">
                      {layer.details.map((d) => (
                        <div key={d.labelAr} className="flex items-start justify-between gap-2 text-[11px]">
                          <dt className="text-navy-400">{d.labelAr}</dt>
                          <dd className="text-end text-navy-700">{d.valueAr}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
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
