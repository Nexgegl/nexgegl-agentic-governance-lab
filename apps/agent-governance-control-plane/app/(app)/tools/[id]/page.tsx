import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { ApprovalModeBadge } from "@/components/RuntimeBadges";
import { demoTools, getToolById } from "@/runtime/demo-tools";
import { getReadWriteClassLabel, getToolTypeLabel } from "@/runtime/runtime-labels";
import { getSensitivityLabel } from "@/lib/governance-model";

export function generateStaticParams() {
  return demoTools.map((t) => ({ id: t.id }));
}

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const tool = getToolById(params.id);
  if (!tool) notFound();

  return (
    <div className="space-y-6">
      <Topbar titleAr={tool.nameAr} titleEn={tool.name} subtitleAr={tool.system} />

      <div className="flex flex-wrap items-center gap-2">
        <ApprovalModeBadge mode={tool.approvalMode} />
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tool.enabled ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {tool.enabled ? "مفعّلة" : "غير مفعّلة"}
        </span>
        {tool.demoOnly ? <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">تجريبية محليًا فقط</span> : null}
      </div>

      {tool.approvalMode === "FORBIDDEN" ? (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            هذه الأداة ممنوعة صراحةً (approvalMode = FORBIDDEN) ولا يجوز لأي مهارة أو تشغيل استدعاؤها تحت أي ظرف في هذا الإصدار.
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الوصف</h2>
        <p className="text-sm leading-relaxed text-navy-700">{tool.descriptionAr}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-navy-400">النوع</dt>
            <dd className="font-medium text-navy-900">{getToolTypeLabel(tool.toolType)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">فئة القراءة/الكتابة</dt>
            <dd className="font-medium text-navy-900">{getReadWriteClassLabel(tool.readWriteClass)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">وصول خارجي</dt>
            <dd className="font-medium text-navy-900">{tool.externalAccess ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">قابلية التراجع</dt>
            <dd className="font-medium text-navy-900">{tool.reversible ? "قابلة للتراجع" : "غير قابلة للتراجع"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب صلاحية مؤسسية</dt>
            <dd className="font-medium text-navy-900">{tool.requiredAuthority ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">تتطلب تدقيقًا</dt>
            <dd className="font-medium text-navy-900">{tool.auditRequired ? "نعم" : "لا"}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">الحد الأقصى للاستدعاءات لكل تشغيل</dt>
            <dd className="font-medium text-navy-900">{tool.maxCallsPerRun}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">فئات البيانات المسموحة</dt>
            <dd className="font-medium text-navy-900">
              {tool.dataClasses.map((c) => getSensitivityLabel(c).ar).join("، ") || "لا يوجد"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
