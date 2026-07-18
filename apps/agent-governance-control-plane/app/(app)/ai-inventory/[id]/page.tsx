import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { DevDataNote } from "@/components/DevDataNote";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import { ScoreValue } from "@/components/ScoreValue";
import {
  computeNextAction,
  getAuditTrailStatusLabel,
  getLifecycleStageLabel,
  getReviewOutcomeLabel,
  getSensitivityLabel,
  getToolAccessLabel,
} from "@/lib/governance-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseCaseById } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function AiInventoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const useCase = await getUseCaseById(supabase, params.id);
  if (!useCase) notFound();

  const nextAction = computeNextAction({ governanceStatus: useCase.governance_status });
  const sensitivity = getSensitivityLabel(useCase.data_sensitivity);
  const toolAccess = getToolAccessLabel(useCase.tool_access);
  const lifecycle = getLifecycleStageLabel(useCase.lifecycle_stage);
  const auditTrail = getAuditTrailStatusLabel(useCase.audit_trail_status);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={useCase.name_ar}
        titleEn={useCase.name}
        subtitleAr={useCase.department ?? undefined}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div className="flex flex-wrap items-center gap-2">
        <GateStatusBadge status={useCase.governance_status} />
        <RiskBadge risk={useCase.risk_level} />
        <EvidenceBadge status={useCase.evidence_status} />
        <AuthorityBadge status={useCase.authority_status} />
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">{lifecycle.ar}</span>
        {useCase.production_approval_status ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            معتمد للإنتاج
          </span>
        ) : (
          <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-500">
            غير معتمد للإنتاج
          </span>
        )}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-navy-900">الملخص التنفيذي</h2>
          <p className="text-sm leading-relaxed text-navy-700">{useCase.business_purpose_ar ?? "—"}</p>
          <p className="mt-1 text-xs leading-relaxed text-navy-400">{useCase.business_purpose ?? ""}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-navy-400">التصنيف</dt>
              <dd className="font-medium text-navy-900">{useCase.ai_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">درجة الجاهزية</dt>
              <dd className="font-medium text-navy-900">
                <ScoreValue value={useCase.readiness_score ?? 0} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">حساسية البيانات</dt>
              <dd className="font-medium text-navy-900">{sensitivity.ar}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">حالة سجل التدقيق</dt>
              <dd className="font-medium text-navy-900">{auditTrail.ar}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">المالك</dt>
              <dd className="font-medium text-navy-900">{useCase.owner_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">السلطة المعتمدة</dt>
              <dd className="font-medium text-navy-900">{useCase.authority ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
            <p className="text-xs leading-relaxed text-amber-800">
              هذه الطبقة ما زالت تستخدم بيانات تجريبية. ربط هذا الأصل بالوكلاء والنماذج والموردين ومصادر البيانات
              والمراجعات البشرية والحوادث وحزمة القرار الكاملة عبر الطبقات الثماني لم يُنقَل بعد إلى Supabase.
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-navy-900">حالة سلسلة الحوكمة</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-navy-500">بوابة الحوكمة</span>
                <GateStatusBadge status={useCase.governance_status} />
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">نتيجة التقييم</span>
                <span className="font-medium text-navy-900">
                  {getReviewOutcomeLabel(useCase.eval_outcome).ar} · <ScoreValue value={useCase.eval_score ?? 0} />
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">حالة صلاحيات الوكيل</span>
                <span className="font-medium text-navy-900">{toolAccess.ar}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">مرحلة دورة الحياة</span>
                <span className="font-medium text-navy-900">{lifecycle.ar}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">آخر تحديث</span>
                <span className="font-medium text-navy-900">{useCase.updated_at.slice(0, 10)}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-navy-900">الإجراء المطلوب التالي</h2>
            <p className="text-sm text-navy-700">{nextAction}</p>
          </div>

          <DevDataNote />
        </div>
      </section>
    </div>
  );
}
