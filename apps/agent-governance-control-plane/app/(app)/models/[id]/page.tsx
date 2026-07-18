import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { EvidenceBadge, RiskBadge } from "@/components/badges";
import { getDataResidencyLabel, getModelProviderLabel } from "@/lib/labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getModelById } from "@/repositories/models-repository";
import { listUseCasesByModelId } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function ModelDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const model = await getModelById(supabase, params.id);
  if (!model) notFound();

  const usedByAssets = await listUseCasesByModelId(supabase, model.id);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={model.name}
        titleEn={`${getModelProviderLabel(model.provider)} · ${model.version ?? ""}`}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">حالة التقييم</p>
          <div className="mt-2">
            <EvidenceBadge status={model.evaluation_status} />
          </div>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">درجة المخاطرة</p>
          <div className="mt-2">
            <RiskBadge risk={model.risk_tier} />
          </div>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إقامة البيانات</p>
          <p className="mt-2 text-sm font-semibold text-navy-900">{getDataResidencyLabel(model.data_residency).ar}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">آخر تقييم</p>
          <p className="mt-2 text-sm font-semibold text-navy-900">{model.last_evaluated ?? "—"}</p>
        </div>
      </section>

      <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
        <p className="text-sm font-medium text-gold-400">هذا النموذج غير معتمد للإنتاج.</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-300">
          سجل النماذج لا يصدر موافقة إنتاج لأي نموذج. حالة الاعتماد أعلاه تمهيدية دائمًا.
        </p>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">أصول الذكاء الاصطناعي المستخدمة لهذا النموذج</h2>
        {usedByAssets.length === 0 ? (
          <p className="text-sm text-navy-400">لا يستخدم هذا النموذج أي أصل حاليًا.</p>
        ) : (
          <ul className="space-y-2">
            {usedByAssets.map((asset) => (
              <li key={asset.id}>
                <Link href={`/ai-inventory/${asset.id}`} className="text-sm font-medium text-navy-900 hover:text-gold-600">
                  {asset.name_ar}
                </Link>
                <span className="ms-2 text-xs text-navy-400">{asset.department}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
