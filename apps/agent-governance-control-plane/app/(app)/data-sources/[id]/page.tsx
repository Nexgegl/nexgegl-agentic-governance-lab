import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { EvidenceBadge } from "@/components/badges";
import { getSensitivityLabel } from "@/lib/governance-model";
import { getDataSourceTypeLabel } from "@/lib/labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDataSourceById, listLineageForDataSource } from "@/repositories/data-sources-repository";
import { getUseCaseById } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function DataSourceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const dataSource = await getDataSourceById(supabase, params.id);
  if (!dataSource) notFound();

  const lineage = await listLineageForDataSource(supabase, dataSource.id);
  const lineageWithAssets = await Promise.all(
    lineage.map(async (l) => ({
      lineage: l,
      asset: l.use_case_id ? await getUseCaseById(supabase, l.use_case_id) : null,
    })),
  );

  const sensitivity = getSensitivityLabel(dataSource.sensitivity);
  const type = getDataSourceTypeLabel(dataSource.type);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={dataSource.name_ar}
        titleEn={dataSource.name}
        subtitleAr={dataSource.owner ?? undefined}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">النوع</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{type.ar}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">الحساسية</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{sensitivity.ar}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">حالة التصنيف</p>
          <div className="mt-1">
            <EvidenceBadge status={dataSource.classification_status} />
          </div>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">آخر تصنيف</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{dataSource.last_classified ?? "—"}</p>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">تتبع تدفق البيانات (Lineage)</h2>
        {lineageWithAssets.length === 0 ? (
          <p className="text-sm text-navy-400">لا يوجد تتبع مسجل لهذا المصدر.</p>
        ) : (
          <ul className="space-y-3">
            {lineageWithAssets.map(({ lineage: l, asset }) => (
              <li key={l.id} className="rounded-lg border border-navy-100 p-3">
                <p className="text-sm text-navy-900">{l.flow_description_ar}</p>
                {asset ? (
                  <Link href={`/ai-inventory/${asset.id}`} className="mt-1 block text-xs text-navy-500 hover:text-gold-600">
                    يستخدمه: {asset.name_ar}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
