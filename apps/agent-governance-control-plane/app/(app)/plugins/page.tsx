import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listPluginDefinitions, listInstallations } from "@/repositories/plugins-repository";
import { getOwnOrganizationProfile, getDomainProfile } from "@/repositories/institutional-profiles-repository";

export const dynamic = "force-dynamic";

export default async function PluginRegistryPage() {
  const supabase = createServerSupabaseClient();
  const [plugins, installations, organizationProfile] = await Promise.all([
    listPluginDefinitions(supabase),
    listInstallations(supabase),
    getOwnOrganizationProfile(supabase),
  ]);
  const domainProfile = await getDomainProfile(supabase, "ai_governance");
  const installationsByPluginId = new Map(installations.map((i) => [i.plugin_id, i]));

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل الإضافات المؤسسية"
        titleEn="NEXGEGL Capability Registry — Plugins"
        subtitleAr="إضافات نطاق مؤسسي كاملة، لا تُصدر أي قرار حوكمة رسمي"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div>
        <Link href="/plugins/audit" className="text-xs font-medium text-navy-500 hover:text-gold-600">
          عرض السجل الزمني لتدقيق الإضافات ←
        </Link>
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-navy-900">اكتمال الملف المؤسسي</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-navy-100 p-4">
            <p className="text-xs text-navy-400">ملف المؤسسة العام</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{organizationProfile ? "تم إنشاؤه" : "لم يُنشأ بعد"}</p>
          </div>
          <div className="rounded-lg border border-navy-100 p-4">
            <p className="text-xs text-navy-400">ملف نطاق حوكمة الذكاء الاصطناعي</p>
            <p className="mt-1 text-sm font-medium text-navy-900">
              {domainProfile ? `${domainProfile.completeness_score}% مكتمل` : "لم يُنشأ بعد"}
            </p>
          </div>
        </div>
        <Link href="/plugins/ai-governance/cold-start" className="mt-3 inline-block text-xs font-medium text-navy-500 hover:text-gold-600">
          الذهاب إلى الإعداد الأولي لحوكمة الذكاء الاصطناعي ←
        </Link>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الإضافة</th>
              <th className="px-4 py-3 text-start font-medium">النطاق</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">حالة التثبيت لمؤسستك</th>
              <th className="px-4 py-3 text-start font-medium">موافقة إنتاج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {plugins.map((p) => {
              const installation = installationsByPluginId.get(p.plugin_id);
              return (
                <tr key={p.plugin_id} className="hover:bg-navy-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/plugins/${p.plugin_id}`} className="font-medium text-navy-900 hover:text-gold-600">
                      {p.name.ar}
                    </Link>
                    <p className="text-[11px] text-navy-400">{p.plugin_id}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{p.domain}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-700">{installation ? installation.state : "غير مثبتة"}</td>
                  <td className={`px-4 py-3 font-medium ${p.production_approval_status ? "text-emerald-700" : "text-red-700"}`}>
                    {p.production_approval_status ? "معتمد للإنتاج" : "غير معتمد"}
                  </td>
                </tr>
              );
            })}
            {plugins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-navy-400">
                  لا توجد إضافات مسجلة بعد.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
