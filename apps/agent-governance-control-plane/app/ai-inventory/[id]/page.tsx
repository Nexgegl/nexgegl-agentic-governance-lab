import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import { ScoreValue } from "@/components/ScoreValue";
import { agents, dataSources, getModelById, getUseCaseById, getVendorById, useCases } from "@/lib/mock-data";
import {
  computeEvidenceCompleteness,
  computeMissingControls,
  computeNextAction,
  getLifecycleStageLabel,
  getSensitivityLabel,
  getToolAccessLabel,
} from "@/lib/governance-model";

export function generateStaticParams() {
  return useCases.map((u) => ({ id: u.id }));
}

export default function AiInventoryDetailPage({ params }: { params: { id: string } }) {
  const useCase = getUseCaseById(params.id);
  if (!useCase) notFound();

  const missingControls = computeMissingControls(useCase);
  const nextAction = computeNextAction(useCase);
  const evidenceCompleteness = computeEvidenceCompleteness(useCase);
  const sensitivity = getSensitivityLabel(useCase.dataSensitivity);
  const toolAccess = getToolAccessLabel(useCase.toolAccess);
  const lifecycle = getLifecycleStageLabel(useCase.lifecycleStage);
  const linkedAgents = agents.filter((a) => useCase.agentIds.includes(a.id));
  const linkedModel = useCase.modelId ? getModelById(useCase.modelId) : undefined;
  const linkedVendor = useCase.vendorId ? getVendorById(useCase.vendorId) : undefined;
  const linkedDataSources = dataSources.filter((d) => useCase.dataSourceIds.includes(d.id));

  return (
    <div className="space-y-6">
      <Topbar titleAr={useCase.nameAr} titleEn={useCase.name} subtitleAr={useCase.department} />

      <div className="flex flex-wrap items-center gap-2">
        <GateStatusBadge status={useCase.governanceStatus} />
        <RiskBadge risk={useCase.riskLevel} />
        <EvidenceBadge status={useCase.evidenceStatus} />
        <AuthorityBadge status={useCase.authorityStatus} />
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
          {lifecycle.ar}
        </span>
        <Link
          href={`/decision-packet/${useCase.id}`}
          className="ms-auto rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-gold-400 hover:bg-navy-900"
        >
          توليد حزمة القرار ←
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-navy-900">الملخص التنفيذي</h2>
          <p className="text-sm leading-relaxed text-navy-700">{useCase.businessPurpose}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-navy-400">التصنيف</dt>
              <dd className="font-medium text-navy-900">{useCase.aiType}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">درجة الجاهزية</dt>
              <dd className="font-medium text-navy-900">
                <ScoreValue value={useCase.readinessScore} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">حساسية البيانات</dt>
              <dd className="font-medium text-navy-900">{sensitivity.ar}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">حالة سجل التدقيق</dt>
              <dd className="font-medium text-navy-900">{useCase.auditTrailStatus}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">المالك</dt>
              <dd className="font-medium text-navy-900">{useCase.owner}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">السلطة المعتمدة</dt>
              <dd className="font-medium text-navy-900">{useCase.authority}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold text-navy-500">الأنظمة المتصلة</h3>
            <div className="flex flex-wrap gap-2">
              {useCase.connectedSystems.map((s) => (
                <span key={s} className="rounded-full bg-navy-50 px-3 py-1 text-xs text-navy-700">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-navy-100 p-3">
              <p className="text-xs text-navy-400">الوكلاء المرتبطون</p>
              {linkedAgents.length === 0 ? (
                <p className="mt-1 text-xs text-navy-400">لا يوجد وكلاء مرتبطون</p>
              ) : (
                linkedAgents.map((a) => (
                  <Link key={a.id} href={`/agents/${a.id}`} className="mt-1 block text-sm text-navy-900 hover:text-gold-600">
                    {a.nameAr}
                  </Link>
                ))
              )}
            </div>
            <div className="rounded-lg border border-navy-100 p-3">
              <p className="text-xs text-navy-400">النموذج المستخدم</p>
              {linkedModel ? (
                <Link href={`/models/${linkedModel.id}`} className="mt-1 block text-sm text-navy-900 hover:text-gold-600">
                  {linkedModel.name}
                </Link>
              ) : (
                <p className="mt-1 text-xs text-navy-400">غير محدد</p>
              )}
              {linkedVendor ? (
                <p className="mt-1 text-[11px] text-navy-400">المورد: {linkedVendor.nameAr}</p>
              ) : null}
            </div>
            <div className="rounded-lg border border-navy-100 p-3">
              <p className="text-xs text-navy-400">مصادر البيانات المرتبطة</p>
              {linkedDataSources.length === 0 ? (
                <p className="mt-1 text-xs text-navy-400">لا توجد مصادر مرتبطة</p>
              ) : (
                linkedDataSources.map((d) => (
                  <Link key={d.id} href={`/data-sources/${d.id}`} className="mt-1 block text-sm text-navy-900 hover:text-gold-600">
                    {d.nameAr}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-navy-900">حالة سلسلة الحوكمة</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-navy-500">بوابة الحوكمة</span>
                <GateStatusBadge status={useCase.governanceStatus} />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">نتيجة التقييم</span>
                <span className="font-medium text-navy-900">
                  {useCase.evalOutcome} · <ScoreValue value={useCase.evalScore} />
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">حالة صلاحيات الوكيل</span>
                <span className="font-medium text-navy-900">{toolAccess.ar}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">اكتمال الأدلة</span>
                <span className="font-medium text-navy-900">{evidenceCompleteness}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">مرحلة دورة الحياة</span>
                <span className="font-medium text-navy-900">{lifecycle.ar}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/60 p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-red-800">الضوابط الناقصة</h2>
            {missingControls.length === 0 ? (
              <p className="text-sm text-emerald-700">لا توجد ضوابط ناقصة.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                {missingControls.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 rounded-lg bg-white p-3 text-sm text-navy-700">
              <span className="font-semibold text-navy-900">الإجراء المطلوب التالي: </span>
              {nextAction}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">الجدول الزمني لأحداث الحوكمة</h2>
        <ol className="space-y-4 border-s-2 border-navy-100 ps-4">
          {useCase.timeline.map((event, idx) => (
            <li key={idx} className="relative">
              <span className="absolute -start-[21px] top-1 h-2.5 w-2.5 rounded-full bg-gold-500" />
              <p className="text-sm text-navy-900">{event.event}</p>
              <p className="text-xs text-navy-400">
                {event.actor} · {event.date}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
