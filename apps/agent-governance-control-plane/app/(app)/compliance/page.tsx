import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { DevDataNote } from "@/components/DevDataNote";
import { EvidenceBadge } from "@/components/badges";
import { complianceMappings } from "@/lib/mock-data";

export default function CompliancePage() {
  const complete = complianceMappings.filter((c) => c.status === "complete").length;
  const partial = complianceMappings.filter((c) => c.status === "partial").length;
  const missing = complianceMappings.filter((c) => c.status === "missing").length;
  const frameworks = Array.from(new Set(complianceMappings.map((c) => c.frameworkName)));

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="الامتثال والتدقيق"
        titleEn="Compliance & Audit"
        subtitleAr="ربط متطلبات الحوكمة الداخلية بالضوابط المطبقة، دون أي ادعاء باعتماد أو شهادة رسمية"
      />

      <DevDataNote />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">الأطر المرجعية</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{frameworks.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">مكتملة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{complete}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">جزئية</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{partial}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">ناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{missing}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-900">خريطة متطلبات الامتثال</h2>
          <Link href="/audit-trails" className="text-xs font-medium text-navy-500 hover:text-gold-600">
            عرض سجل التدقيق الكامل ←
          </Link>
        </div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الإطار المرجعي</th>
              <th className="px-4 py-3 text-start font-medium">المتطلب</th>
              <th className="px-4 py-3 text-start font-medium">عدد الضوابط المرتبطة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {complianceMappings.map((c) => (
              <tr key={c.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3 text-navy-700">{c.frameworkName}</td>
                <td className="px-4 py-3 text-navy-900">{c.requirementAr}</td>
                <td className="px-4 py-3 text-navy-700">{c.mappedControlIds.length}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
        <p className="text-sm text-navy-200">
          هذه الخريطة توضح مواءمة داخلية بين متطلبات الحوكمة والضوابط المطبقة، ولا تمثل شهادة امتثال رسمية ولا اعتمادًا من أي جهة تنظيمية.
        </p>
      </section>
    </div>
  );
}
