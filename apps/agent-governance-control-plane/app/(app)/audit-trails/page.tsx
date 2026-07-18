import { Topbar } from "@/components/Topbar";
import { AuditTrailsTable } from "./AuditTrailsTable";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listAuditEvents } from "@/repositories/audit-events-repository";
import { listUseCases } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function AuditTrailsPage() {
  const supabase = createServerSupabaseClient();
  const [auditEvents, useCases] = await Promise.all([listAuditEvents(supabase), listUseCases(supabase)]);
  const assetNamesById = Object.fromEntries(useCases.map((u) => [u.id, u.name_ar]));

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل التدقيق"
        titleEn="Audit Trails"
        subtitleAr={`${auditEvents.length} حدث تدقيق مسجل عبر الطبقات الثماني للحوكمة`}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <AuditTrailsTable auditEvents={auditEvents} assetNamesById={assetNamesById} />
    </div>
  );
}
