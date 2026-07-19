import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPluginDefinition } from "@/repositories/plugins-repository";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PluginSkillsPage({ params }: { params: { pluginId: string } }) {
  const supabase = createServerSupabaseClient();
  const plugin = await getPluginDefinition(supabase, params.pluginId);
  if (!plugin) notFound();

  const { data: skills, error } = await supabase.from("skills").select("*").eq("plugin_id", params.pluginId).order("name");
  if (error) throw error;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={`مهارات ${plugin.name.ar}`}
        titleEn={`${plugin.name.en} — Skills`}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">المهارة</th>
              <th className="px-4 py-3 text-start font-medium">الفئة</th>
              <th className="px-4 py-3 text-start font-medium">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium">حالة التنفيذ</th>
              <th className="px-4 py-3 text-start font-medium">موافقة إنتاج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {(skills ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/plugins/${params.pluginId}/skills/${encodeURIComponent(s.id)}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {s.name_ar}
                  </Link>
                  <p className="text-[11px] text-navy-400">v{s.version}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{s.category}</td>
                <td className="px-4 py-3 text-navy-700">{s.risk_level}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.execution_status === "implemented" ? "bg-emerald-50 text-emerald-800" : "bg-navy-50 text-navy-500"
                    }`}
                  >
                    {s.execution_status === "implemented" ? "قابلة للتنفيذ" : "مُعلَنة فقط — غير قابلة للتنفيذ بعد"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-red-700">غير معتمد</td>
              </tr>
            ))}
            {(skills ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-navy-400">
                  لا توجد مهارات مسجلة بعد لهذه الإضافة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
