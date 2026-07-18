import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { SkillReviewStatusBadge } from "@/components/RuntimeBadges";
import { RiskBadge } from "@/components/badges";
import { getSkillActionTypeLabel, getSkillReversibilityLabel, getSkillSourceTypeLabel } from "@/runtime/runtime-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSkillById } from "@/repositories/skills-repository";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const skill = await getSkillById(supabase, params.id);
  if (!skill) notFound();

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={skill.name_ar}
        titleEn={skill.name}
        subtitleAr={`v${skill.version}`}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div className="flex flex-wrap items-center gap-2">
        <SkillReviewStatusBadge status={skill.review_status} />
        <RiskBadge risk={skill.risk_level} />
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">{getSkillSourceTypeLabel(skill.source_type)}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${skill.approved_for_use ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {skill.approved_for_use ? "معتمدة للاستخدام" : "غير معتمدة للاستخدام"}
        </span>
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الوصف</h2>
        <p className="text-sm leading-relaxed text-navy-700">{skill.description_ar}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-navy-400">الفئة</dt>
            <dd className="font-medium text-navy-900">{skill.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">نوع الإجراء</dt>
            <dd className="font-medium text-navy-900">{getSkillActionTypeLabel(skill.action_type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">قابلية التراجع</dt>
            <dd className="font-medium text-navy-900">{getSkillReversibilityLabel(skill.reversibility)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">آخر مراجعة</dt>
            <dd className="font-medium text-navy-900">{skill.last_reviewed} · {skill.reviewer}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب صلاحية مؤسسية</dt>
            <dd className="font-medium text-navy-900">{skill.required_authority ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب موافقة بشرية</dt>
            <dd className="font-medium text-navy-900">{skill.human_approval_required ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">صلاحية كتابة</dt>
            <dd className="font-medium text-navy-900">{skill.write_capability ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">وصول لأنظمة خارجية</dt>
            <dd className="font-medium text-navy-900">{skill.external_system_access ? "نعم" : "لا"}</dd>
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
          {skill.required_tools.length === 0 ? (
            <span className="text-sm text-navy-400">لا توجد أدوات مطلوبة</span>
          ) : (
            skill.required_tools.map((t) => (
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
