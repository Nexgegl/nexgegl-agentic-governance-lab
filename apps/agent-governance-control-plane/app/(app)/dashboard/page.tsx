import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { KpiCard } from "@/components/KpiCard";
import { GateStatusBadge, RiskBadge } from "@/components/badges";
import { humanReviews, privacyControls, securityControls } from "@/lib/mock-data";
import {
  computeKpis,
  computeRiskDistribution,
  computeStatusDistribution,
  computeUrgentItems,
} from "@/lib/governance-model";
import { computeAgentGovernancePosture, computeLayerReadiness } from "@/lib/governance-engine";
import { GOVERNANCE_LAYERS } from "@/lib/labels";
import { RunStatusBadge } from "@/components/RuntimeBadges";
import { runs } from "@/runtime/run-store";
import { demoSkills } from "@/runtime/demo-skills";
import { demoTools } from "@/runtime/demo-tools";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUseCases } from "@/repositories/use-cases-repository";
import { listAgents } from "@/repositories/agents-repository";
import { listDataSources } from "@/repositories/data-sources-repository";
import { listModels } from "@/repositories/models-repository";
import { listComplianceMappings } from "@/repositories/compliance-mappings-repository";
import { listRecentAuditEvents } from "@/repositories/audit-events-repository";

export const dynamic = "force-dynamic";

const MOCK_LAYERS = new Set(["data_security_privacy", "human_oversight"]);

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const [realUseCases, liveAgents, liveDataSources, liveModels, liveComplianceMappings, recentAuditEvents] =
    await Promise.all([
      listUseCases(supabase),
      listAgents(supabase),
      listDataSources(supabase),
      listModels(supabase),
      listComplianceMappings(supabase),
      listRecentAuditEvents(supabase, 6),
    ]);

  const useCasesById = new Map(realUseCases.map((u) => [u.id, u]));

  const totalRuns = runs.length;
  const activeRuns = runs.filter((r) => !["BLOCKED", "FAILED", "READY_FOR_AUTHORITY_REVIEW", "COMPLETED_WITHOUT_DECISION"].includes(r.status)).length;
  const blockedRuns = runs.filter((r) => r.status === "BLOCKED").length;
  const escalatedRuns = runs.filter((r) => r.status === "ESCALATE_REQUIRED").length;
  const readyRuns = runs.filter((r) => r.status === "READY_FOR_AUTHORITY_REVIEW").length;
  const skillsApproved = demoSkills.filter((s) => s.approvedForUse).length;
  const skillsUnderReview = demoSkills.filter((s) => s.reviewStatus === "UNDER_REVIEW").length;
  const toolsEnabled = demoTools.filter((t) => t.enabled).length;
  const evidenceAwaitingReview = runs.flatMap((r) => r.evidence).filter((e) => e.reviewerStatus === "UNREVIEWED").length;
  const loopDetections = runs.filter((r) => r.stopReason === "LOOP_DETECTED").length;
  const recentRuns = [...runs].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)).slice(0, 5);

  const kpis = computeKpis(
    realUseCases.map((u) => ({
      toolAccess: u.tool_access,
      riskLevel: u.risk_level,
      governanceStatus: u.governance_status,
      authorityStatus: u.authority_status,
      evidenceStatus: u.evidence_status,
    })),
  );
  const agentPosture = computeAgentGovernancePosture(liveAgents.map((a) => ({ status: a.status })));
  const statusDistribution = computeStatusDistribution(realUseCases.map((u) => ({ governanceStatus: u.governance_status })));
  const riskDistribution = computeRiskDistribution(realUseCases.map((u) => ({ riskLevel: u.risk_level })));
  const urgentItems = computeUrgentItems(
    realUseCases.map((u) => ({ ...u, governanceStatus: u.governance_status, riskLevel: u.risk_level })),
    5,
  );
  const layerCoverage = computeLayerReadiness({
    useCases: realUseCases.map((u) => ({
      evidenceStatus: u.evidence_status,
      evidenceDetail: { policy_boundary_evidence: u.policy_boundary_evidence },
    })),
    dataSources: liveDataSources.map((d) => ({ classificationStatus: d.classification_status })),
    models: liveModels.map((m) => ({ evaluationStatus: m.evaluation_status, riskTier: m.risk_tier })),
    securityControls,
    privacyControls,
    agents: liveAgents.map((a) => ({ status: a.status })),
    humanReviews,
    complianceMappings: liveComplianceMappings.map((c) => ({ status: c.status })),
  });

  return (
    <div className="space-y-8">
      <Topbar
        titleAr="لوحة القيادة"
        titleEn="Command Center Dashboard"
        subtitleAr="نظرة تنفيذية على وضع حوكمة الذكاء الاصطناعي عبر المؤسسة"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-navy-900">تغطية الطبقات الثماني للحوكمة</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {GOVERNANCE_LAYERS.map((l) => {
            const coverage = layerCoverage.find((c) => c.layer === l.key);
            const percent = coverage?.readinessPercent ?? 0;
            const tone = percent >= 70 ? "text-emerald-700" : percent >= 40 ? "text-amber-700" : "text-red-700";
            const isMock = MOCK_LAYERS.has(l.key);
            return (
              <Link
                key={l.key}
                href={l.href}
                className="rounded-lg border border-navy-100 p-3 transition-shadow hover:shadow-md"
              >
                <p className="text-xs text-navy-500">{l.labelAr}</p>
                <p className="text-[10px] text-navy-400">
                  {l.labelEn}
                  {isMock ? " · بيانات تجريبية" : null}
                </p>
                <p className={`mt-2 text-xl font-semibold tabular-nums ${tone}`}>{percent}%</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900">وقت التشغيل المحكوم — أول تنفيذ محكوم للوكلاء</h2>
          <Link href="/research-runs" className="text-xs font-medium text-navy-500 hover:text-gold-600">
            عرض جميع التشغيلات ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <KpiCard label="إجمالي تشغيلات البحث" labelEn="Total Research Runs" value={totalRuns} />
          <KpiCard label="تشغيلات نشطة" labelEn="Active Runs" value={activeRuns} />
          <KpiCard label="تشغيلات محظورة" labelEn="Blocked Runs" value={blockedRuns} tone="danger" />
          <KpiCard label="تشغيلات مُصعَّدة" labelEn="Escalated Runs" value={escalatedRuns} tone="warning" />
          <KpiCard label="جاهزة لمراجعة السلطة" labelEn="Authority-Review-Ready Runs" value={readyRuns} tone="success" />
          <KpiCard label="مهارات معتمدة" labelEn="Skills Approved" value={skillsApproved} />
          <KpiCard label="مهارات قيد المراجعة" labelEn="Skills Under Review" value={skillsUnderReview} tone="warning" />
          <KpiCard label="أدوات مفعّلة" labelEn="Tools Enabled" value={toolsEnabled} />
          <KpiCard label="أدلة بانتظار المراجعة" labelEn="Evidence Awaiting Review" value={evidenceAwaitingReview} tone="warning" />
          <KpiCard label="حالات اكتشاف حلقة تكرار" labelEn="Loop Detections" value={loopDetections} tone="danger" />
        </div>

        <div className="mt-5 border-t border-navy-100 pt-4">
          <h3 className="mb-3 text-xs font-semibold text-navy-500">أحدث تشغيلات البحث المحكوم</h3>
          <ul className="divide-y divide-navy-100">
            {recentRuns.map((r) => (
              <li key={r.runId} className="flex items-center justify-between gap-4 py-2.5">
                <Link href={`/research-runs/${r.runId}`} className="text-sm font-medium text-navy-900 hover:text-gold-600">
                  {r.request.titleAr}
                </Link>
                <div className="flex items-center gap-2">
                  <RunStatusBadge status={r.status} />
                  <span className="text-[11px] text-navy-400">{r.submittedAt.slice(0, 10)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-900">أصول الذكاء الاصطناعي</h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            بيانات حقيقية · Live — Supabase
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="إجمالي حالات الاستخدام" labelEn="Total Use Cases" value={kpis.totalUseCases} />
          <KpiCard label="الوكلاء النشطون" labelEn="Active Agents" value={agentPosture.activeAgents} />
          <KpiCard label="حالات عالية الخطورة" labelEn="High-Risk Use Cases" value={kpis.highRiskUseCases} tone="warning" />
          <KpiCard label="حالات محظورة" labelEn="Blocked Cases" value={kpis.blockedCases} tone="danger" />
          <KpiCard label="بدون سلطة معتمدة" labelEn="Missing Authority" value={kpis.missingAuthorityCases} tone="danger" />
          <KpiCard label="بدون أدلة كاملة" labelEn="Missing Evidence" value={kpis.missingEvidenceCases} tone="warning" />
          <KpiCard label="وكلاء أنظمة خارجية" labelEn="External-System Agents" value={kpis.externalSystemAgents} />
          <KpiCard label="وكلاء بصلاحية كتابة" labelEn="Write-Capable Agents" value={kpis.writeCapableAgents} />
        </div>
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
                  <Link href={`/ai-inventory/${u.id}`} className="text-sm font-medium text-navy-900 hover:text-gold-600">
                    {u.name_ar}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <GateStatusBadge status={u.governance_status} />
                    <RiskBadge risk={u.risk_level} />
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
          {recentAuditEvents.map((a) => {
            const asset = a.use_case_id ? useCasesById.get(a.use_case_id) : undefined;
            return (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-navy-900">{a.action_ar}</p>
                  {asset ? (
                    <Link href={`/ai-inventory/${asset.id}`} className="text-xs text-navy-400 hover:text-gold-600">
                      {asset.name_ar}
                    </Link>
                  ) : null}
                </div>
                <div className="text-end">
                  <p className="text-xs font-medium text-navy-500">{a.actor}</p>
                  <p className="text-[11px] text-navy-400">{a.timestamp.slice(0, 10)}</p>
                </div>
              </li>
            );
          })}
          {recentAuditEvents.length === 0 ? (
            <li className="py-6 text-center text-sm text-navy-400">لا توجد أحداث حوكمة مسجلة بعد.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
