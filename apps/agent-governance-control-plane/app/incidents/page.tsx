import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { getUseCaseById, incidents } from "@/lib/mock-data";
import { getIncidentSeverityLabel, getIncidentStatusClasses, getIncidentStatusLabel } from "@/lib/labels";

export default function IncidentsPage() {
  const open = incidents.filter((i) => i.status === "open").length;
  const investigating = incidents.filter((i) => i.status === "investigating").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل الحوادث"
        titleEn="Incident Register"
        subtitleAr="حوادث الحوكمة المرصودة عبر أصول الذكاء الاصطناعي والوكلاء"
      />

      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">مفتوحة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{open}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">قيد التحقيق</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{investigating}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">تم الحل</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{resolved}</p>
        </div>
      </section>

      <section className="space-y-3">
        {incidents.map((i) => {
          const asset = getUseCaseById(i.assetId);
          return (
            <div key={i.id} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-navy-900">{i.titleAr}</h2>
                <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getIncidentStatusClasses(i.status)}`}>
                  {getIncidentStatusLabel(i.status).ar}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy-700">{i.summaryAr}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-navy-400">
                <span>الخطورة: {getIncidentSeverityLabel(i.severity).ar}</span>
                <span>تاريخ الإبلاغ: {i.reportedDate}</span>
                {i.resolvedDate ? <span>تاريخ الحل: {i.resolvedDate}</span> : null}
                {asset ? (
                  <Link href={`/ai-inventory/${asset.id}`} className="text-navy-500 hover:text-gold-600">
                    الأصل المرتبط: {asset.nameAr}
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
