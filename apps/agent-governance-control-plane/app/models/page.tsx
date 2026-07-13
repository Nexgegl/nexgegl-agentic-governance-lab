import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { EvidenceBadge, RiskBadge } from "@/components/badges";
import { models } from "@/lib/mock-data";
import { getDataResidencyLabel, getModelProviderLabel } from "@/lib/labels";

export default function ModelsPage() {
  const unreviewed = models.filter((m) => m.evaluationStatus === "missing").length;
  const highRisk = models.filter((m) => m.riskTier === "high").length;
  const unknownResidency = models.filter((m) => m.dataResidency === "unknown").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل النماذج"
        titleEn="Model Registry"
        subtitleAr="دورة حياة النماذج المستخدمة عبر أصول الذكاء الاصطناعي، بدون أي موافقة إنتاج"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إجمالي النماذج</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{models.length}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">غير مُقيّمة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{unreviewed}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">مخاطرة عالية</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{highRisk}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إقامة بيانات غير محددة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{unknownResidency}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">النموذج</th>
              <th className="px-4 py-3 text-start font-medium">المزود</th>
              <th className="px-4 py-3 text-start font-medium">الإصدار</th>
              <th className="px-4 py-3 text-start font-medium">إقامة البيانات</th>
              <th className="px-4 py-3 text-start font-medium">حالة التقييم</th>
              <th className="px-4 py-3 text-start font-medium">درجة المخاطرة</th>
              <th className="px-4 py-3 text-start font-medium">عدد الأصول المستخدمة</th>
              <th className="px-4 py-3 text-start font-medium">موافقة إنتاج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {models.map((m) => (
              <tr key={m.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/models/${m.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {m.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy-700">{getModelProviderLabel(m.provider)}</td>
                <td className="px-4 py-3 text-navy-700">{m.version}</td>
                <td className="px-4 py-3 text-navy-700">{getDataResidencyLabel(m.dataResidency).ar}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={m.evaluationStatus} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge risk={m.riskTier} />
                </td>
                <td className="px-4 py-3 text-navy-700">{m.usedByAssetIds.length}</td>
                <td className="px-4 py-3 text-red-700 font-medium">غير معتمد</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
