import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { ApprovalModeBadge } from "@/components/RuntimeBadges";
import { getReadWriteClassLabel, getToolTypeLabel } from "@/runtime/runtime-labels";
import { getSensitivityLabel } from "@/lib/governance-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getToolById } from "@/repositories/tools-repository";

export const dynamic = "force-dynamic";

export default async function ToolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const tool = await getToolById(supabase, params.id);
  if (!tool) notFound();

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={tool.name_ar}
        titleEn={tool.name}
        subtitleAr={tool.system ?? undefined}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div className="flex flex-wrap items-center gap-2">
        <ApprovalModeBadge mode={tool.approval_mode} />
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tool.enabled ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {tool.enabled ? "مفعّلة" : "غير مفعّلة"}
        </span>
        {tool.demo_only ? <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">تجريبية محليًا فقط</span> : null}
      </div>

      {tool.approval_mode === "FORBIDDEN" ? (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            هذه الأداة ممنوعة صراحةً (approvalMode = FORBIDDEN) ولا يجوز لأي مهارة أو تشغيل استدعاؤها تحت أي ظرف في هذا الإصدار.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الوصف</h2>
        <p className="text-sm leading-relaxed text-navy-700">{tool.description_ar}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-navy-400">النوع</dt>
            <dd className="font-medium text-navy-900">{getToolTypeLabel(tool.tool_type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">فئة القراءة/الكتابة</dt>
            <dd className="font-medium text-navy-900">{getReadWriteClassLabel(tool.read_write_class)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">وصول خارجي</dt>
            <dd className="font-medium text-navy-900">{tool.external_access ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">قابلية التراجع</dt>
            <dd className="font-medium text-navy-900">{tool.reversible ? "قابلة للتراجع" : "غير قابلة للتراجع"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب صلاحية مؤسسية</dt>
            <dd className="font-medium text-navy-900">{tool.required_authority ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب تدقيقًا</dt>
            <dd className="font-medium text-navy-900">{tool.audit_required ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">الحد الأقصى للاستدعاءات لكل تشغيل</dt>
            <dd className="font-medium text-navy-900">{tool.max_calls_per_run}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">فئات البيانات المسموحة</dt>
            <dd className="font-medium text-navy-900">
              {tool.data_classes.map((c) => getSensitivityLabel(c).ar).join("، ") || "لا يوجد"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
