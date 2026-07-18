import { Topbar } from "@/components/Topbar";
import { DevDataNote } from "@/components/DevDataNote";
import { EvidenceBadge } from "@/components/badges";
import { privacyControls, securityControls } from "@/lib/mock-data";
import { getPrivacyCategoryLabel, getSecurityCategoryLabel } from "@/lib/labels";

export default function SecurityPage() {
  const missingSecurity = securityControls.filter((c) => c.status === "missing").length;
  const missingPrivacy = privacyControls.filter((c) => c.status === "missing").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="الأمن والخصوصية"
        titleEn="Data Security & Privacy"
        subtitleAr="ضوابط أمن البيانات وخصوصيتها المطبقة على أصول الذكاء الاصطناعي"
      />

      <DevDataNote />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">ضوابط الأمن</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{securityControls.length}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">ضوابط أمن ناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{missingSecurity}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">ضوابط الخصوصية</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{privacyControls.length}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">ضوابط خصوصية ناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{missingPrivacy}</p>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white shadow-card">
        <h2 className="border-b border-navy-100 px-5 py-3 text-sm font-semibold text-navy-900">ضوابط الأمن</h2>
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الضابط</th>
              <th className="px-4 py-3 text-start font-medium">الفئة</th>
              <th className="px-4 py-3 text-start font-medium">عدد الأصول المشمولة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {securityControls.map((c) => (
              <tr key={c.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3 font-medium text-navy-900">{c.nameAr}</td>
                <td className="px-4 py-3 text-navy-700">{getSecurityCategoryLabel(c.category).ar}</td>
                <td className="px-4 py-3 text-navy-700">{c.appliesToAssetIds.length}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white shadow-card">
        <h2 className="border-b border-navy-100 px-5 py-3 text-sm font-semibold text-navy-900">ضوابط الخصوصية</h2>
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الضابط</th>
              <th className="px-4 py-3 text-start font-medium">الفئة</th>
              <th className="px-4 py-3 text-start font-medium">عدد الأصول المشمولة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {privacyControls.map((c) => (
              <tr key={c.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3 font-medium text-navy-900">{c.nameAr}</td>
                <td className="px-4 py-3 text-navy-700">{getPrivacyCategoryLabel(c.category).ar}</td>
                <td className="px-4 py-3 text-navy-700">{c.appliesToAssetIds.length}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
