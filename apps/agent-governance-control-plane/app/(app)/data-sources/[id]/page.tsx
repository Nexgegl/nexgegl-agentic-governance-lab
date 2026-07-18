import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { DevDataNote } from "@/components/DevDataNote";
import { EvidenceBadge } from "@/components/badges";
import { dataLineage, dataSources, getUseCaseById } from "@/lib/mock-data";
import { getSensitivityLabel } from "@/lib/governance-model";
import { getDataSourceTypeLabel } from "@/lib/labels";

export function generateStaticParams() {
  return dataSources.map((d) => ({ id: d.id }));
}

export default function DataSourceDetailPage({ params }: { params: { id: string } }) {
  const dataSource = dataSources.find((d) => d.id === params.id);
  if (!dataSource) notFound();

  const lineage = dataLineage.filter((l) => l.dataSourceId === dataSource.id);
  const sensitivity = getSensitivityLabel(dataSource.sensitivity);
  const type = getDataSourceTypeLabel(dataSource.type);

  return (
    <div className="space-y-6">
      <Topbar titleAr={dataSource.nameAr} titleEn={dataSource.name} subtitleAr={dataSource.owner} />

      <DevDataNote />

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
            <EvidenceBadge status={dataSource.classificationStatus} />
          </div>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">آخر تصنيف</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{dataSource.lastClassified}</p>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">تتبع تدفق البيانات (Lineage)</h2>
        {lineage.length === 0 ? (
          <p className="text-sm text-navy-400">لا يوجد تتبع مسجل لهذا المصدر.</p>
        ) : (
          <ul className="space-y-3">
            {lineage.map((l) => {
              const asset = getUseCaseById(l.assetId);
              return (
                <li key={l.id} className="rounded-lg border border-navy-100 p-3">
                  <p className="text-sm text-navy-900">{l.flowDescriptionAr}</p>
                  {asset ? (
                    <Link href={`/decision-packet/${asset.id}`} className="mt-1 block text-xs text-navy-500 hover:text-gold-600">
                      يستخدمه: {asset.nameAr}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
