import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { EvidenceBadge } from "@/components/badges";
import { getSensitivityLabel } from "@/lib/governance-model";
import { getDataSourceTypeLabel } from "@/lib/labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listDataSources, listUseCaseIdsForDataSources } from "@/repositories/data-sources-repository";

export const dynamic = "force-dynamic";

export default async function DataSourcesPage() {
  const supabase = createServerSupabaseClient();
  const [dataSources, usageCounts] = await Promise.all([
    listDataSources(supabase),
    listUseCaseIdsForDataSources(supabase),
  ]);

  const missingClassification = dataSources.filter((d) => d.classification_status === "missing").length;
  const partialClassification = dataSources.filter((d) => d.classification_status === "partial").length;
  const highSensitivity = dataSources.filter((d) => d.sensitivity === "high").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="مصادر البيانات"
        titleEn="Data Sources"
        subtitleAr="الأساس البياني الذي تعتمد عليه أصول الذكاء الاصطناعي عبر المؤسسة"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إجمالي مصادر البيانات</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{dataSources.length}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">حساسية عالية</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{highSensitivity}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">تصنيف جزئي</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{partialClassification}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">تصنيف ناقص</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{missingClassification}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">مصدر البيانات</th>
              <th className="px-4 py-3 text-start font-medium">النوع</th>
              <th className="px-4 py-3 text-start font-medium">الحساسية</th>
              <th className="px-4 py-3 text-start font-medium">المالك</th>
              <th className="px-4 py-3 text-start font-medium">عدد الأصول المستخدمة</th>
              <th className="px-4 py-3 text-start font-medium">حالة التصنيف</th>
              <th className="px-4 py-3 text-start font-medium">آخر تصنيف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {dataSources.map((d) => (
              <tr key={d.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/data-sources/${d.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {d.name_ar}
                  </Link>
                  <p className="text-[11px] text-navy-400">{d.name}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{getDataSourceTypeLabel(d.type).ar}</td>
                <td className="px-4 py-3 text-navy-700">{getSensitivityLabel(d.sensitivity).ar}</td>
                <td className="px-4 py-3 text-navy-700">{d.owner ?? "—"}</td>
                <td className="px-4 py-3 text-navy-700">{usageCounts[d.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={d.classification_status} />
                </td>
                <td className="px-4 py-3 text-navy-500">{d.last_classified ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dataSources.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-navy-400">لا توجد مصادر بيانات مسجلة بعد لمؤسستك.</div>
        ) : null}
      </section>
    </div>
  );
}
