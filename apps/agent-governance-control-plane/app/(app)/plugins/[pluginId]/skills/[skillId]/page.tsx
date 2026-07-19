import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPluginDefinition } from "@/repositories/plugins-repository";
import { getSkillDefinition } from "@/repositories/skill-definitions-repository";
import { RunSkillForm } from "./RunSkillForm";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({ params }: { params: { pluginId: string; skillId: string } }) {
  const supabase = createServerSupabaseClient();
  const skillId = decodeURIComponent(params.skillId);
  const [plugin, skill] = await Promise.all([getPluginDefinition(supabase, params.pluginId), getSkillDefinition(supabase, skillId)]);
  if (!plugin || !skill || skill.plugin_id !== params.pluginId) notFound();

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
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            skill.execution_status === "implemented" ? "bg-emerald-50 text-emerald-800" : "bg-navy-50 text-navy-500"
          }`}
        >
          {skill.execution_status === "implemented" ? "قابلة للتنفيذ" : "مُعلَنة فقط — غير قابلة للتنفيذ بعد"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            plugin.production_approval_status ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          موافقة إنتاج: {plugin.production_approval_status ? "معتمد للإنتاج" : "غير معتمد"}
        </span>
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الغرض</h2>
        <p className="text-sm leading-relaxed text-navy-700">{skill.description_ar}</p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-navy-400">حقول الملف المطلوبة</dt>
            <dd className="font-medium text-navy-900">{skill.required_profile_fields.join("، ") || "لا يوجد"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">الموصلات المسموحة</dt>
            <dd className="font-medium text-navy-900">{skill.permitted_connectors.join("، ") || "لا يوجد"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">شروط التصعيد</dt>
            <dd className="font-medium text-navy-900">{skill.escalation_conditions.join("؛ ") || "لا يوجد"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب موافقة بشرية</dt>
            <dd className="font-medium text-navy-900">{skill.human_approval_required ? "نعم" : "لا"}</dd>
          </div>
        </dl>
      </section>

      {skill.execution_status === "implemented" ? (
        <RunSkillForm pluginId={params.pluginId} skillId={skill.id} />
      ) : (
        <section className="rounded-xl border border-dashed border-navy-200 bg-navy-50/60 p-5">
          <p className="text-sm text-navy-600">
            هذه المهارة مُعلَنة (الصلاحيات وحقول الملف المطلوبة موثقة أعلاه) ولكن لا يوجد لها منفّذ تنفيذ في هذا الإصدار التجريبي. أي محاولة تشغيل تُرفض بسبب محدد وليس بخطأ غامض.
          </p>
        </section>
      )}
    </div>
  );
}
