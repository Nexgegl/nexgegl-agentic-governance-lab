"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import {
  computeNextAction,
  getGateStatusLabel,
  getLifecycleStageLabel,
  getRiskLabel,
  getSensitivityLabel,
  getToolAccessLabel,
  type GateStatus,
  type RiskLevel,
} from "@/lib/governance-model";
import type { UseCaseRecord } from "@/repositories/use-cases-repository";

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

const STATUSES: GateStatus[] = [
  "BLOCKED",
  "REPAIR_REQUIRED",
  "GOVERNANCE_REVIEW_REQUIRED",
  "ESCALATE_REQUIRED",
  "READY_FOR_AUTHORITY_REVIEW",
];

export function AiInventoryTable({ useCases }: { useCases: UseCaseRecord[] }) {
  const [department, setDepartment] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [missingAuthorityOnly, setMissingAuthorityOnly] = useState(false);
  const [missingEvidenceOnly, setMissingEvidenceOnly] = useState(false);
  const [externalSystemOnly, setExternalSystemOnly] = useState(false);
  const [writeAccessOnly, setWriteAccessOnly] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(useCases.map((u) => u.department).filter((d): d is string => Boolean(d)))),
    [useCases],
  );

  const filtered = useMemo(() => {
    return useCases.filter((u) => {
      if (department !== "all" && u.department !== department) return false;
      if (risk !== "all" && u.risk_level !== risk) return false;
      if (status !== "all" && u.governance_status !== status) return false;
      if (missingAuthorityOnly && u.authority_status !== "missing") return false;
      if (missingEvidenceOnly && u.evidence_status !== "missing" && u.evidence_status !== "partial") return false;
      if (externalSystemOnly && u.tool_access !== "external_system") return false;
      if (writeAccessOnly && u.tool_access !== "write" && u.tool_access !== "external_system") return false;
      return true;
    });
  }, [useCases, department, risk, status, missingAuthorityOnly, missingEvidenceOnly, externalSystemOnly, writeAccessOnly]);

  return (
    <>
      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        >
          <option value="all">كل الإدارات</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        >
          <option value="all">كل مستويات الخطورة</option>
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {getRiskLabel(r).ar}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        >
          <option value="all">كل حالات الحوكمة</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {getGateStatusLabel(s).ar}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-700">
          <input type="checkbox" checked={missingAuthorityOnly} onChange={(e) => setMissingAuthorityOnly(e.target.checked)} />
          بدون سلطة معتمدة
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-700">
          <input type="checkbox" checked={missingEvidenceOnly} onChange={(e) => setMissingEvidenceOnly(e.target.checked)} />
          أدلة ناقصة
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-700">
          <input type="checkbox" checked={externalSystemOnly} onChange={(e) => setExternalSystemOnly(e.target.checked)} />
          وصول لأنظمة خارجية
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-700">
          <input type="checkbox" checked={writeAccessOnly} onChange={(e) => setWriteAccessOnly(e.target.checked)} />
          صلاحية كتابة
        </label>

        <span className="ms-auto text-xs text-navy-400">
          عرض {filtered.length} من {useCases.length} أصل ذكاء اصطناعي
        </span>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">اسم الأصل</th>
              <th className="px-4 py-3 text-start font-medium">حالة الحوكمة</th>
              <th className="px-4 py-3 text-start font-medium">حالة الأدلة</th>
              <th className="px-4 py-3 text-start font-medium">حالة السلطة</th>
              <th className="px-4 py-3 text-start font-medium">الخطورة</th>
              <th className="px-4 py-3 text-start font-medium">مرحلة دورة الحياة</th>
              <th className="px-4 py-3 text-start font-medium">الإدارة</th>
              <th className="px-4 py-3 text-start font-medium">المالك</th>
              <th className="px-4 py-3 text-start font-medium">حساسية البيانات</th>
              <th className="px-4 py-3 text-start font-medium">الوصول للأدوات</th>
              <th className="px-4 py-3 text-start font-medium">آخر تحديث</th>
              <th className="px-4 py-3 text-start font-medium">الإجراء التالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/ai-inventory/${u.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {u.name_ar}
                  </Link>
                  <p className="text-[11px] text-navy-400">{u.name}</p>
                </td>
                <td className="px-4 py-3">
                  <GateStatusBadge status={u.governance_status} />
                </td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={u.evidence_status} />
                </td>
                <td className="px-4 py-3">
                  <AuthorityBadge status={u.authority_status} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge risk={u.risk_level} />
                </td>
                <td className="px-4 py-3 text-navy-700">{getLifecycleStageLabel(u.lifecycle_stage).ar}</td>
                <td className="px-4 py-3 text-navy-700">{u.department ?? "—"}</td>
                <td className="px-4 py-3 text-navy-700">{u.owner_name ?? "—"}</td>
                <td className="px-4 py-3 text-navy-700">{getSensitivityLabel(u.data_sensitivity).ar}</td>
                <td className="px-4 py-3 text-navy-700">{getToolAccessLabel(u.tool_access).ar}</td>
                <td className="px-4 py-3 text-navy-500">{u.updated_at.slice(0, 10)}</td>
                <td className="px-4 py-3 text-navy-700">{computeNextAction({ governanceStatus: u.governance_status })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-navy-400">لا توجد أصول ذكاء اصطناعي مطابقة للفلاتر المحددة.</div>
        ) : null}
      </section>
    </>
  );
}
