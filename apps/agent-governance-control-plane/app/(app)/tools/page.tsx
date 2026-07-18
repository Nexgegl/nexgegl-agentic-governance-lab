import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { ApprovalModeBadge } from "@/components/RuntimeBadges";
import { getToolTypeLabel } from "@/runtime/runtime-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listTools } from "@/repositories/tools-repository";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const supabase = createServerSupabaseClient();
  const tools = await listTools(supabase);

  const enabled = tools.filter((t) => t.enabled).length;
  const forbidden = tools.filter((t) => t.approval_mode === "FORBIDDEN").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل الأدوات المحكوم"
        titleEn="Governed Tool Registry"
        subtitleAr="أدوات تجريبية محلية حتمية فقط — بدون استدعاءات ويب حقيقية أو مفاتيح API أو تكاملات حية"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">إجمالي الأدوات</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{tools.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">مفعّلة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{enabled}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">ممنوعة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{forbidden}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الأداة</th>
              <th className="px-4 py-3 text-start font-medium">النوع</th>
              <th className="px-4 py-3 text-start font-medium">وضع الموافقة</th>
              <th className="px-4 py-3 text-start font-medium">وصول خارجي</th>
              <th className="px-4 py-3 text-start font-medium">الحد الأقصى للاستدعاءات</th>
              <th className="px-4 py-3 text-start font-medium">مفعّلة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {tools.map((t) => (
              <tr key={t.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/tools/${t.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {t.name_ar}
                  </Link>
                  <p className="text-[11px] text-navy-400">{t.id}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{getToolTypeLabel(t.tool_type)}</td>
                <td className="px-4 py-3">
                  <ApprovalModeBadge mode={t.approval_mode} />
                </td>
                <td className="px-4 py-3 text-navy-700">{t.external_access ? "نعم" : "لا"}</td>
                <td className="px-4 py-3 text-navy-700">{t.max_calls_per_run}</td>
                <td className="px-4 py-3 font-medium">
                  <span className={t.enabled ? "text-emerald-700" : "text-red-700"}>{t.enabled ? "نعم" : "لا"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tools.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-navy-400">لا توجد أدوات مسجلة بعد لمؤسستك.</div>
        ) : null}
      </section>
    </div>
  );
}
