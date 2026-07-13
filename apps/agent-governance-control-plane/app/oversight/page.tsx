import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { getUseCaseById, humanReviews, incidents } from "@/lib/mock-data";
import { getHumanReviewDecisionLabel, getIncidentSeverityLabel, getIncidentStatusClasses, getIncidentStatusLabel } from "@/lib/labels";

export default function OversightPage() {
  const approved = humanReviews.filter((r) => r.decision === "approved_for_next_stage").length;
  const returned = humanReviews.filter((r) => r.decision === "returned_for_repair").length;
  const escalated = humanReviews.filter((r) => r.decision === "escalated").length;
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="الإشراف البشري"
        titleEn="Human Oversight"
        subtitleAr="قرارات المراجعة البشرية على أصول الذكاء الاصطناعي، وسجل الحوادث المرتبط بها"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">معتمدة للمرحلة التالية</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{approved}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">أعيدت للإصلاح</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{returned}</p>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4 shadow-card">
          <p className="text-xs text-orange-700">مُصعَّدة</p>
          <p className="mt-1 text-2xl font-semibold text-orange-800">{escalated}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">حوادث مفتوحة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{openIncidents}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <h2 className="border-b border-navy-100 px-5 py-3 text-sm font-semibold text-navy-900">سجل المراجعات البشرية</h2>
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">أصل الذكاء الاصطناعي</th>
              <th className="px-4 py-3 text-start font-medium">المراجع</th>
              <th className="px-4 py-3 text-start font-medium">القرار</th>
              <th className="px-4 py-3 text-start font-medium">الملاحظات</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ المراجعة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {humanReviews.map((r) => {
              const asset = getUseCaseById(r.assetId);
              return (
                <tr key={r.id} className="hover:bg-navy-50/60">
                  <td className="px-4 py-3">
                    {asset ? (
                      <Link href={`/ai-inventory/${asset.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                        {asset.nameAr}
                      </Link>
                    ) : (
                      r.assetId
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-700">{r.reviewer}</td>
                  <td className="px-4 py-3 text-navy-700">{getHumanReviewDecisionLabel(r.decision).ar}</td>
                  <td className="px-4 py-3 text-navy-500">{r.notesAr}</td>
                  <td className="px-4 py-3 text-navy-500">{r.reviewDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy-900">سجل الحوادث</h2>
          <Link href="/incidents" className="text-xs font-medium text-navy-500 hover:text-gold-600">
            عرض سجل الحوادث الكامل ←
          </Link>
        </div>
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الحادثة</th>
              <th className="px-4 py-3 text-start font-medium">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">تاريخ الإبلاغ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {incidents.map((i) => (
              <tr key={i.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3 font-medium text-navy-900">{i.titleAr}</td>
                <td className="px-4 py-3 text-navy-700">{getIncidentSeverityLabel(i.severity).ar}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getIncidentStatusClasses(i.status)}`}>
                    {getIncidentStatusLabel(i.status).ar}
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-500">{i.reportedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
