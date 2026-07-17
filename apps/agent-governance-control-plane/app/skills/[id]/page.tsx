import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { SkillReviewStatusBadge } from "@/components/RuntimeBadges";
import { RiskBadge } from "@/components/badges";
import { demoSkills, getSkillById } from "@/runtime/demo-skills";
import { getSkillActionTypeLabel, getSkillReversibilityLabel, getSkillSourceTypeLabel } from "@/runtime/runtime-labels";

export function generateStaticParams() {
  return demoSkills.map((s) => ({ id: s.id }));
}

export default function SkillDetailPage({ params }: { params: { id: string } }) {
  const skill = getSkillById(params.id);
  if (!skill) notFound();

  return (
    <div className="space-y-6">
      <Topbar titleAr={skill.nameAr} titleEn={skill.name} subtitleAr={`v${skill.version}`} />

      <div className="flex flex-wrap items-center gap-2">
        <SkillReviewStatusBadge status={skill.reviewStatus} />
        <RiskBadge risk={skill.riskLevel} />
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">{getSkillSourceTypeLabel(skill.sourceType)}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${skill.approvedForUse ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {skill.approvedForUse ? "معتمدة للاستخدام" : "غير معتمدة للاستخدام"}
        </span>
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الوصف</h2>
        <p className="text-sm leading-relaxed text-navy-700">{skill.descriptionAr}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-navy-400">الفئة</dt>
            <dd className="font-medium text-navy-900">{skill.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">نوع الإجراء</dt>
            <dd className="font-medium text-navy-900">{getSkillActionTypeLabel(skill.actionType)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">قابلية التراجع</dt>
            <dd className="font-medium text-navy-900">{getSkillReversibilityLabel(skill.reversibility)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">آخر مراجعة</dt>
            <dd className="font-medium text-navy-900">{skill.lastReviewed} · {skill.reviewer}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب صلاحية مؤسسية</dt>
            <dd className="font-medium text-navy-900">{skill.requiredAuthority ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب موافقة بشرية</dt>
            <dd className="font-medium text-navy-900">{skill.humanApprovalRequired ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">صلاحية كتابة</dt>
            <dd className="font-medium text-navy-900">{skill.writeCapability ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">وصول لأنظمة خارجية</dt>
            <dd className="font-medium text-navy-900">{skill.externalSystemAccess ? "نعم" : "لا"}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <p className="text-xs text-navy-400">بصمة النسخة (checksum)</p>
          <p className="font-mono text-xs text-navy-600">{skill.checksum}</p>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">الأدوات المطلوبة</h2>
        <div className="flex flex-wrap gap-2">
          {skill.requiredTools.length === 0 ? (
            <span className="text-sm text-navy-400">لا توجد أدوات مطلوبة</span>
          ) : (
            skill.requiredTools.map((t) => (
              <span key={t} className="rounded-full bg-navy-50 px-3 py-1 text-xs text-navy-700">
                {t}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">تعليمات المهارة</h2>
        <ol className="list-inside list-decimal space-y-1 text-sm text-navy-700">
          {skill.instructions.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
