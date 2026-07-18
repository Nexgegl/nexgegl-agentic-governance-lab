import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { EvidenceBadge } from "@/components/badges";
import { computeEvidenceCompleteness } from "@/lib/governance-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUseCases } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

function EvidenceCheck({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-emerald-600" aria-label="present">
      ✓
    </span>
  ) : (
    <span className="text-red-600" aria-label="missing">
      ✕
    </span>
  );
}

export default async function EvidencePage() {
  const supabase = createServerSupabaseClient();
  const useCases = await listUseCases(supabase);

  const overallCompleteness =
    useCases.length === 0
      ? 0
      : Math.round(
          useCases.reduce(
            (sum, u) =>
              sum +
              computeEvidenceCompleteness({
                evidenceDetail: {
                  owner_evidence: u.owner_evidence,
                  authority_evidence: u.authority_evidence,
                  eval_evidence: u.eval_evidence,
                  audit_evidence: u.audit_evidence,
                  policy_boundary_evidence: u.policy_boundary_evidence,
                  approval_evidence: u.approval_evidence,
                },
              }),
            0,
          ) / useCases.length,
        );

  const missingCounts = {
    owner: useCases.filter((u) => !u.owner_evidence).length,
    authority: useCases.filter((u) => !u.authority_evidence).length,
    audit: useCases.filter((u) => !u.audit_evidence).length,
    eval: useCases.filter((u) => !u.eval_evidence).length,
    policyBoundary: useCases.filter((u) => !u.policy_boundary_evidence).length,
    approval: useCases.filter((u) => !u.approval_evidence).length,
  };

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="غرفة الأدلة"
        titleEn="Evidence Room"
        subtitleAr="اكتمال الأدلة الحاكمة عبر جميع حالات الاستخدام"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-navy-100 bg-navy-950 p-4 text-white shadow-card">
          <p className="text-xs text-navy-300">درجة اكتمال الأدلة</p>
          <p className="mt-1 text-2xl font-semibold text-gold-400">{overallCompleteness}%</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">أدلة المالك الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.owner}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">أدلة السلطة الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.authority}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">أدلة التدقيق الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.audit}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">أدلة التقييم الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.eval}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">حدود السياسة الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.policyBoundary}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">أدلة الموافقة الناقصة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{missingCounts.approval}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">حالة الاستخدام</th>
              <th className="px-3 py-3 text-center font-medium">دليل المالك</th>
              <th className="px-3 py-3 text-center font-medium">دليل السلطة</th>
              <th className="px-3 py-3 text-center font-medium">دليل التقييم</th>
              <th className="px-3 py-3 text-center font-medium">دليل التدقيق</th>
              <th className="px-3 py-3 text-center font-medium">حدود السياسة</th>
              <th className="px-3 py-3 text-center font-medium">دليل الموافقة</th>
              <th className="px-4 py-3 text-start font-medium">الحالة الإجمالية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {useCases.map((u) => (
              <tr key={u.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/ai-inventory/${u.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {u.name_ar}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.owner_evidence} />
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.authority_evidence} />
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.eval_evidence} />
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.audit_evidence} />
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.policy_boundary_evidence} />
                </td>
                <td className="px-3 py-3 text-center">
                  <EvidenceCheck ok={u.approval_evidence} />
                </td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={u.evidence_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {useCases.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-navy-400">لا توجد حالات استخدام مسجلة بعد لمؤسستك.</div>
        ) : null}
      </section>
    </div>
  );
}
