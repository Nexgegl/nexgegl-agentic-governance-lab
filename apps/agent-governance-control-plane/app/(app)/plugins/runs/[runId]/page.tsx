import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRunById, listEvidenceForRun } from "@/repositories/plugin-runs-repository";
import { getPromotionRequestByRunId } from "@/repositories/promotion-requests-repository";
import {
  listSubmissionAttemptsForPromotionRequest,
  getEvaluationResponseByPromotionRequestId,
  getExternalAuditLinkByPromotionRequestId,
} from "@/repositories/kfsa-integration-repository";
import { PromotionRequestAction } from "./PromotionRequestAction";
import { SubmitToKfsaAction } from "./SubmitToKfsaAction";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  submitted: "قيد التنفيذ",
  completed: "مكتمل",
  rejected: "مرفوض",
};

const ATTEMPT_STATUS_LABELS: Record<string, string> = {
  in_progress: "قيد الإرسال",
  succeeded: "تم التقييم",
  failed: "فشل الإرسال",
};

export default async function RunResultPage({ params }: { params: { runId: string } }) {
  const supabase = createServerSupabaseClient();
  const run = await getRunById(supabase, params.runId);
  if (!run) notFound();

  const [evidence, promotionRequest] = await Promise.all([
    listEvidenceForRun(supabase, run.id),
    getPromotionRequestByRunId(supabase, run.id),
  ]);

  const [submissionAttempts, evaluationResponse, auditLink] = promotionRequest
    ? await Promise.all([
        listSubmissionAttemptsForPromotionRequest(supabase, promotionRequest.id),
        getEvaluationResponseByPromotionRequestId(supabase, promotionRequest.id),
        getExternalAuditLinkByPromotionRequestId(supabase, promotionRequest.id),
      ])
    : [[], null, null];

  const latestAttempt = submissionAttempts[0] ?? null;
  // Always offer the action unless a result is already persisted --
  // whether a fresh in_progress attempt is still genuinely running, or an
  // old one has gone stale, is a server-side decision
  // (lib/kfsa/promotion-submission.ts's stale-attempt recovery), never a
  // client-side one. A click against a fresh in_progress attempt is a
  // safe no-op that reports IN_PROGRESS rather than submitting twice.
  const canSubmitToKfsa = !evaluationResponse;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="نتيجة التشغيل"
        titleEn="Run Result"
        subtitleAr={run.id}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            run.status === "completed" ? "bg-emerald-50 text-emerald-800" : run.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          {STATUS_LABELS[run.status]}
        </span>
        {run.rejection_reason ? <span className="text-xs text-red-600">السبب: {run.rejection_reason}</span> : null}
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">مخرجات التشغيل</h2>
        {run.output ? (
          <pre className="whitespace-pre-wrap rounded-lg bg-navy-50 p-3 text-xs text-navy-700">{JSON.stringify(run.output, null, 2)}</pre>
        ) : (
          <p className="text-sm text-navy-400">لا توجد مخرجات (تم رفض التشغيل).</p>
        )}
        <p className="mt-3 text-xs text-navy-400">
          هذه المخرجات مرشح قرار وحزمة أدلة فقط — لا تمثل قرارًا رسميًا ولا حكم KFSA ولا موافقة إنتاج.
        </p>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">مخرجات الأدلة</h2>
        {evidence.length === 0 ? (
          <p className="text-sm text-navy-400">لا توجد أدلة مسجلة لهذا التشغيل.</p>
        ) : (
          <ul className="space-y-2">
            {evidence.map((e) => (
              <li key={e.id} className="rounded-lg border border-navy-100 p-3">
                <p className="text-sm font-medium text-navy-900">{e.evidence_type}</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-navy-500">{JSON.stringify(e.payload, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">حالة طلب الترقية</h2>
        {promotionRequest ? (
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-navy-400">حالة الأدلة</dt>
              <dd className="font-medium text-navy-900">{promotionRequest.evidence_status}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">حالة الصلاحية</dt>
              <dd className="font-medium text-navy-900">{promotionRequest.authority_status}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">تصعيد مطلوب</dt>
              <dd className="font-medium text-navy-900">{promotionRequest.escalation_required ? "نعم" : "لا"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">نتيجة المراجعة (ReviewOutcome)</dt>
              <dd className="font-medium text-navy-900">{promotionRequest.review_outcome ?? "لم تُحدَّد بعد"}</dd>
            </div>
          </dl>
        ) : run.status === "completed" ? (
          <PromotionRequestAction runId={run.id} />
        ) : (
          <p className="text-sm text-navy-400">لا يمكن إعداد طلب ترقية من تشغيل غير مكتمل.</p>
        )}
      </section>

      {promotionRequest ? (
        <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">التقييم الحوكمي عبر KFSA</h2>

          <div className="mb-4 rounded-lg border border-gold-400 bg-gold-50 p-3">
            <p className="text-sm font-medium text-navy-900">
              نتيجة التقييم الحوكمي ليست قرارًا رسميًا. القرارات الرسمية تُنشأ فقط داخل KFSA Core بعد استكمال مسار الصلاحية والاعتماد.
            </p>
          </div>

          <dl className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-navy-400">حالة الإرسال</dt>
              <dd className="font-medium text-navy-900">{latestAttempt ? ATTEMPT_STATUS_LABELS[latestAttempt.status] : "لم يُرسل بعد"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">عدد المحاولات</dt>
              <dd className="font-medium text-navy-900">{submissionAttempts.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">آخر إرسال</dt>
              <dd className="font-medium text-navy-900">{latestAttempt ? new Date(latestAttempt.submitted_at).toLocaleString("ar") : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy-400">معرّف طلب الترقية الخارجي</dt>
              <dd className="font-medium text-navy-900">{evaluationResponse?.external_promotion_request_id ?? "—"}</dd>
            </div>
          </dl>

          {evaluationResponse ? (
            <dl className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-navy-400">نتيجة المراجعة (ReviewOutcome)</dt>
                <dd className="font-medium text-navy-900">{evaluationResponse.review_outcome}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">حالة الأدلة</dt>
                <dd className="font-medium text-navy-900">{evaluationResponse.evidence_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">حالة الصلاحية</dt>
                <dd className="font-medium text-navy-900">{evaluationResponse.authority_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-navy-400">تصعيد مطلوب</dt>
                <dd className="font-medium text-navy-900">{evaluationResponse.escalation_required ? "نعم" : "لا"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-navy-400">إجراءات محظورة</dt>
                <dd className="font-medium text-navy-900">{evaluationResponse.blocked_actions.length > 0 ? evaluationResponse.blocked_actions.join("، ") : "لا يوجد"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-navy-400">معرّف حدث التدقيق الخارجي</dt>
                <dd className="font-medium text-navy-900">{auditLink?.external_audit_event_id ?? "—"}</dd>
              </div>
            </dl>
          ) : latestAttempt?.status === "failed" ? (
            <p className="mb-4 text-xs text-red-600">
              فشلت آخر محاولة إرسال ({latestAttempt.error_code}). {latestAttempt.safe_error_message}
            </p>
          ) : latestAttempt?.status === "in_progress" ? (
            <p className="mb-4 text-xs text-navy-400">قد يكون هناك إرسال سابق قيد التنفيذ. يمكنك إعادة المحاولة إذا استمرت الحالة دون تغيير.</p>
          ) : null}

          {canSubmitToKfsa ? <SubmitToKfsaAction promotionRequestId={promotionRequest.id} retry={submissionAttempts.length > 0} /> : null}
        </section>
      ) : null}

      <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
        <p className="text-sm font-medium text-gold-400">القرارات الرسمية تصدر فقط عبر نواة KFSA بعد تقييم حاكم واعتماد صلاحية.</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-300">
          Formal decisions are issued only by KFSA Core after governed evaluation and authority approval.
        </p>
      </section>
    </div>
  );
}
