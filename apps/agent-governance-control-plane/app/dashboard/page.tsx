import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { KpiCard } from "@/components/KpiCard";
import { GateStatusBadge, RiskBadge } from "@/components/badges";
import { useCases } from "@/lib/mock-data";
import {
  computeKpis,
  computeRiskDistribution,
  computeStatusDistribution,
  computeUrgentItems,
} from "@/lib/governance-model";

export default function DashboardPage() {
  const kpis = computeKpis(useCases);
  const statusDistribution = computeStatusDistribution(useCases);
  const riskDistribution = computeRiskDistribution(useCases);
  const urgentItems = computeUrgentItems(useCases, 5);

  const recentActivity = useCases
    .flatMap((u) => u.timeline.map((t) => ({ ...t, useCase: u })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <Topbar
        titleAr="لوحة القيادة"
        titleEn="Command Center Dashboard"
        subtitleAr="نظرة تنفيذية على وضع حوكمة الذكاء الاصطناعي عبر المؤسسة"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="إجمالي حالات الاستخدام" labelEn="Total Use Cases" value={kpis.totalUseCases} />
        <KpiCard label="الوكلاء النشطون" labelEn="Active Agents" value={kpis.activeAgents} />
        <KpiCard label="حالات عالية الخطورة" labelEn="High-Risk Use Cases" value={kpis.highRiskUseCases} tone="warning" />
        <KpiCard label="حالات محظورة" labelEn="Blocked Cases" value={kpis.blockedCases} tone="danger" />
        <KpiCard label="بدون سلطة معتمدة" labelEn="Missing Authority" value={kpis.missingAuthorityCases} tone="danger" />
        <KpiCard label="بدون أدلة كاملة" labelEn="Missing Evidence" value={kpis.missingEvidenceCases} tone="warning" />
        <KpiCard label="وكلاء أنظمة خارجية" labelEn="External-System Agents" value={kpis.externalSystemAgents} />
        <KpiCard label="وكلاء بصلاحية كتابة" labelEn="Write-Capable Agents" value={kpis.writeCapableAgents} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-navy-900">توزيع حالة الحوكمة</h2>
          <ul className="space-y-3">
            {statusDistribution.map(({ status, count }) => (
              <li key={status} className="flex items-center justify-between gap-3">
                <GateStatusBadge status={status} />
                <span className="text-sm font-semibold tabular-nums text-navy-900">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-navy-900">جدول مخاطر شامل (Risk Radar)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-navy-400">
                <th className="pb-2 text-start font-medium">مستوى الخطورة</th>
                <th className="pb-2 text-start font-medium">عدد الحالات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {riskDistribution.map(({ risk, count }) => (
                <tr key={risk}>
                  <td className="py-2.5">
                    <RiskBadge risk={risk} />
                  </td>
                  <td className="py-2.5 font-semibold tabular-nums text-navy-900">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold text-navy-900">أهم القضايا العاجلة</h2>
          <ul className="space-y-3">
            {urgentItems.length === 0 ? (
              <li className="text-sm text-navy-400">لا توجد قضايا عاجلة حاليًا.</li>
            ) : (
              urgentItems.map((u) => (
                <li key={u.id} className="border-s-2 border-red-400 ps-3">
                  <Link href={`/use-cases/${u.id}`} className="text-sm font-medium text-navy-900 hover:text-gold-600">
                    {u.nameAr}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <GateStatusBadge status={u.governanceStatus} />
                    <RiskBadge risk={u.riskLevel} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">نشاط الحوكمة الأخير</h2>
        <ul className="divide-y divide-navy-100">
          {recentActivity.map((a, idx) => (
            <li key={idx} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm text-navy-900">{a.event}</p>
                <Link href={`/use-cases/${a.useCase.id}`} className="text-xs text-navy-400 hover:text-gold-600">
                  {a.useCase.nameAr}
                </Link>
              </div>
              <div className="text-end">
                <p className="text-xs font-medium text-navy-500">{a.actor}</p>
                <p className="text-[11px] text-navy-400">{a.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
