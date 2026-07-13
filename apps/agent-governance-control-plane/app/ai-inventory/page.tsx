"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { AuthorityBadge, EvidenceBadge, GateStatusBadge, RiskBadge } from "@/components/badges";
import { useCases } from "@/lib/mock-data";
import {
  computeNextAction,
  getLifecycleStageLabel,
  getToolAccessLabel,
  type Department,
  type GateStatus,
  type RiskLevel,
} from "@/lib/governance-model";

const DEPARTMENTS: Department[] = [
  "Finance",
  "Sales",
  "HR",
  "Legal",
  "Operations",
  "Customer Service",
  "Executive Office",
];

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

const STATUSES: GateStatus[] = [
  "BLOCKED",
  "REPAIR_REQUIRED",
  "GOVERNANCE_REVIEW_REQUIRED",
  "ESCALATE_REQUIRED",
  "READY_FOR_AUTHORITY_REVIEW",
];

export default function AiInventoryPage() {
  const [department, setDepartment] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [missingAuthorityOnly, setMissingAuthorityOnly] = useState(false);
  const [missingEvidenceOnly, setMissingEvidenceOnly] = useState(false);
  const [externalSystemOnly, setExternalSystemOnly] = useState(false);
  const [writeAccessOnly, setWriteAccessOnly] = useState(false);

  const filtered = useMemo(() => {
    return useCases.filter((u) => {
      if (department !== "all" && u.department !== department) return false;
      if (risk !== "all" && u.riskLevel !== risk) return false;
      if (status !== "all" && u.governanceStatus !== status) return false;
      if (missingAuthorityOnly && u.authorityStatus !== "missing") return false;
      if (missingEvidenceOnly && u.evidenceStatus !== "missing" && u.evidenceStatus !== "partial") return false;
      if (externalSystemOnly && u.toolAccess !== "external_system") return false;
      if (writeAccessOnly && u.toolAccess !== "write" && u.toolAccess !== "external_system") return false;
      return true;
    });
  }, [department, risk, status, missingAuthorityOnly, missingEvidenceOnly, externalSystemOnly, writeAccessOnly]);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل الذكاء الاصطناعي والملكية"
        titleEn="AI Inventory & Ownership"
        subtitleAr="جميع أصول الذكاء الاصطناعي والوكلاء عبر المؤسسة، مع مالكها وصلاحيتها ومرحلة دورة حياتها"
      />

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        >
          <option value="all">كل الإدارات</option>
          {DEPARTMENTS.map((d) => (
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
              {r}
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
              {s}
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
              <th className="px-4 py-3 text-start font-medium">آخر مراجعة</th>
              <th className="px-4 py-3 text-start font-medium">الإجراء التالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/ai-inventory/${u.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {u.nameAr}
                  </Link>
                  <p className="text-[11px] text-navy-400">{u.name}</p>
                </td>
                <td className="px-4 py-3">
                  <GateStatusBadge status={u.governanceStatus} />
                </td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={u.evidenceStatus} />
                </td>
                <td className="px-4 py-3">
                  <AuthorityBadge status={u.authorityStatus} />
                </td>
                <td className="px-4 py-3">
                  <RiskBadge risk={u.riskLevel} />
                </td>
                <td className="px-4 py-3 text-navy-700">{getLifecycleStageLabel(u.lifecycleStage).ar}</td>
                <td className="px-4 py-3 text-navy-700">{u.department}</td>
                <td className="px-4 py-3 text-navy-700">{u.owner}</td>
                <td className="px-4 py-3 text-navy-700">{u.dataSensitivity}</td>
                <td className="px-4 py-3 text-navy-700">{getToolAccessLabel(u.toolAccess).ar}</td>
                <td className="px-4 py-3 text-navy-500">{u.lastReviewed}</td>
                <td className="px-4 py-3 text-navy-700">{computeNextAction(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-navy-400">لا توجد أصول ذكاء اصطناعي مطابقة للفلاتر المحددة.</div>
        ) : null}
      </section>
    </div>
  );
}
