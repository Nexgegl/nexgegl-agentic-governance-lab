import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPluginDefinition, getInstallationForPlugin, getLatestPluginVersion } from "@/repositories/plugins-repository";
import { listConnectors, listConnectorPermissionsForPlugin } from "@/repositories/connectors-repository";
import { InstallToggle } from "./InstallToggle";

export const dynamic = "force-dynamic";

export default async function PluginDetailPage({ params }: { params: { pluginId: string } }) {
  const supabase = createServerSupabaseClient();
  const plugin = await getPluginDefinition(supabase, params.pluginId);
  if (!plugin) notFound();

  const [installation, version, connectors, connectorPermissions] = await Promise.all([
    getInstallationForPlugin(supabase, params.pluginId),
    getLatestPluginVersion(supabase, params.pluginId),
    listConnectors(supabase),
    listConnectorPermissionsForPlugin(supabase, params.pluginId),
  ]);
  const connectorsById = new Map(connectors.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={plugin.name.ar}
        titleEn={plugin.name.en}
        subtitleAr={`الإصدار ${version?.version ?? "—"}`}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {plugin.status}
        </span>
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
          حالة التثبيت: {installation ? installation.state : "غير مثبتة"}
        </span>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">موافقة إنتاج: غير معتمد</span>
        <div className="ms-auto">
          <InstallToggle pluginId={plugin.plugin_id} installed={installation?.state === "installed"} />
        </div>
      </div>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-navy-900">الوصف</h2>
        <p className="text-sm leading-relaxed text-navy-700">{plugin.description?.ar}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">الموصلات المسموحة</h2>
          {connectorPermissions.filter((p) => p.allowed).length === 0 ? (
            <p className="text-sm text-navy-400">لا توجد صلاحيات موصل ممنوحة بعد.</p>
          ) : (
            <ul className="space-y-1 text-sm text-navy-700">
              {connectorPermissions
                .filter((p) => p.allowed)
                .map((p) => (
                  <li key={p.id}>{connectorsById.get(p.connector_id)?.connector_id ?? p.connector_id}</li>
                ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">المرجع الدستوري</h2>
          <ul className="space-y-1 text-xs text-navy-500">
            {plugin.constitutional_reference.map((ref) => (
              <li key={ref} className="font-mono">
                {ref}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Link href={`/plugins/${plugin.plugin_id}/skills`} className="inline-block text-sm font-medium text-navy-900 hover:text-gold-600">
        عرض مهارات الإضافة ←
      </Link>

      <section className="rounded-lg border-2 border-navy-900 bg-navy-950 p-5 text-white">
        <p className="text-sm font-medium text-gold-400">القرارات الرسمية تصدر فقط عبر نواة KFSA بعد تقييم حاكم واعتماد صلاحية.</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-300">
          Formal decisions are issued only by KFSA Core after governed evaluation and authority approval.
        </p>
      </section>
    </div>
  );
}
