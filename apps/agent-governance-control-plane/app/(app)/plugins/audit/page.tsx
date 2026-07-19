import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listAuditEvents } from "@/repositories/plugin-runs-repository";

export const dynamic = "force-dynamic";

export default async function PluginAuditTimelinePage() {
  const supabase = createServerSupabaseClient();
  const events = await listAuditEvents(supabase);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="السجل الزمني لتدقيق الإضافات"
        titleEn="Plugin Audit Timeline"
        subtitleAr="سجل تراكمي فقط — لا يمكن تعديله أو حذفه"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الوقت</th>
              <th className="px-4 py-3 text-start font-medium">الجهة الفاعلة</th>
              <th className="px-4 py-3 text-start font-medium">الحدث</th>
              <th className="px-4 py-3 text-start font-medium">الإضافة</th>
              <th className="px-4 py-3 text-start font-medium">المهارة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3 text-navy-500">{e.created_at.replace("T", " ").slice(0, 19)}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-navy-700">{e.actor}</td>
                <td className="px-4 py-3 text-navy-900">{e.event_type}</td>
                <td className="px-4 py-3 text-navy-700">{e.plugin_id ?? "—"}</td>
                <td className="px-4 py-3 text-navy-700">{e.skill_id ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-navy-400">
                  لا توجد أحداث تدقيق مسجلة بعد.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
