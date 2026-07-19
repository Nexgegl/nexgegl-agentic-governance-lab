import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRunById, listEvidenceForRun } from "@/repositories/plugin-runs-repository";
import { getPromotionRequestByRunId } from "@/repositories/promotion-requests-repository";
import { PromotionRequestAction } from "./PromotionRequestAction";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  submitted: "قيد التنفيذ",
  completed: "مكتمل",
  rejected: "مرفوض",
};

export default async function RunResultPage({ params }: { params: { runId: string } }) {
  const supabase = createServerSupabaseClient();
  const run = await getRunById(supabase, params.runId);
  if (!run) notFound();

  const [evidence, promotionRequest] = await Promise.all([
    listEvidenceForRun(supabase, run.id),
    getPromotionRequestByRunId(supabase, run.id),
  ]);

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

      <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
        <p className="text-sm font-medium text-gold-400">القرارات الرسمية تصدر فقط عبر نواة KFSA بعد تقييم حاكم واعتماد صلاحية.</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-300">
          Formal decisions are issued only by KFSA Core after governed evaluation and authority approval.
        </p>
      </section>
    </div>
  );
}
