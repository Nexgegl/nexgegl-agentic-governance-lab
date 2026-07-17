import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { SkillReviewStatusBadge } from "@/components/RuntimeBadges";
import { RiskBadge } from "@/components/badges";
import { demoSkills } from "@/runtime/demo-skills";
import { getSkillSourceTypeLabel } from "@/runtime/runtime-labels";

export default function SkillsPage() {
  const approved = demoSkills.filter((s) => s.approvedForUse).length;
  const underReview = demoSkills.filter((s) => s.reviewStatus === "UNDER_REVIEW").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل المهارات المحكوم"
        titleEn="Governed Skill Registry"
        subtitleAr="مهارات NEXGEGL الداخلية المعتمدة للاستخدام ضمن التشغيلات المحكومة فقط"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إجمالي المهارات</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{demoSkills.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">معتمدة للاستخدام</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{approved}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">قيد المراجعة</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{underReview}</p>
        </div>
        <Link href="/skills/intake" className="flex flex-col justify-center rounded-xl border border-navy-100 bg-navy-950 p-4 text-gold-400 shadow-card hover:bg-navy-900">
          <p className="text-sm font-semibold">فحص مهارة جديدة ←</p>
        </Link>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">المهارة</th>
              <th className="px-4 py-3 text-start font-medium">المصدر</th>
              <th className="px-4 py-3 text-start font-medium">الفئة</th>
              <th className="px-4 py-3 text-start font-medium">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium">حالة المراجعة</th>
              <th className="px-4 py-3 text-start font-medium">معتمدة للاستخدام</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {demoSkills.map((s) => (
              <tr key={s.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/skills/${s.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {s.nameAr}
                  </Link>
                  <p className="text-[11px] text-navy-400">v{s.version}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{getSkillSourceTypeLabel(s.sourceType)}</td>
                <td className="px-4 py-3 text-navy-700">{s.category}</td>
                <td className="px-4 py-3">
                  <RiskBadge risk={s.riskLevel} />
                </td>
                <td className="px-4 py-3">
                  <SkillReviewStatusBadge status={s.reviewStatus} />
                </td>
                <td className="px-4 py-3 font-medium">
                  <span className={s.approvedForUse ? "text-emerald-700" : "text-red-700"}>{s.approvedForUse ? "نعم" : "لا"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
