import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { computeMissingControls, computeNextAction, getToolAccessLabel } from "@/lib/governance-model";
import { getAgentStatusClasses, getAgentStatusLabel } from "@/lib/labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAgentById } from "@/repositories/agents-repository";
import { getUseCaseById } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const agent = await getAgentById(supabase, params.id);
  if (!agent) notFound();

  const asset = agent.use_case_id ? await getUseCaseById(supabase, agent.use_case_id) : null;
  const missingControls = asset
    ? computeMissingControls({
        evidenceDetail: {
          owner_evidence: asset.owner_evidence,
          authority_evidence: asset.authority_evidence,
          eval_evidence: asset.eval_evidence,
          audit_evidence: asset.audit_evidence,
          policy_boundary_evidence: asset.policy_boundary_evidence,
          approval_evidence: asset.approval_evidence,
        },
        authorityStatus: asset.authority_status,
      })
    : [];

  return (
    <div className="space-y-6">
      <Topbar
        titleAr={agent.name_ar}
        titleEn={agent.name}
        subtitleAr={agent.owner_team ?? undefined}
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">الحالة</p>
          <span
            className={`mt-2 inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getAgentStatusClasses(agent.status)}`}
          >
            {getAgentStatusLabel(agent.status).ar}
          </span>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">الوصول للأدوات</p>
          <p className="mt-2 text-sm font-semibold text-navy-900">{getToolAccessLabel(agent.tool_access).ar}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">نوع الوكيل</p>
          <p className="mt-2 text-sm font-semibold text-navy-900">{agent.agent_type ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">آخر مراجعة صلاحيات</p>
          <p className="mt-2 text-sm font-semibold text-navy-900">{agent.last_permission_review ?? "—"}</p>
        </div>
      </section>

      {asset ? (
        <section className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-navy-900">أصل الذكاء الاصطناعي المرتبط</h2>
          <Link href={`/ai-inventory/${asset.id}`} className="text-sm font-medium text-navy-900 hover:text-gold-600">
            {asset.name_ar}
          </Link>
          <p className="mt-2 text-sm text-navy-700">{computeNextAction({ governanceStatus: asset.governance_status })}</p>
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50/60 p-3">
            <p className="mb-1 text-xs font-semibold text-red-700">ضوابط ناقصة على مستوى الأصل</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-red-700">
              {missingControls.map((m) => (
                <li key={m}>{m}</li>
              ))}
              {missingControls.length === 0 ? <li>لا توجد ضوابط ناقصة</li> : null}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
