"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { auditEvents, getUseCaseById } from "@/lib/mock-data";
import { GOVERNANCE_LAYERS } from "@/lib/labels";
import type { GovernanceLayer } from "@/lib/types";

export default function AuditTrailsPage() {
  const [layer, setLayer] = useState<string>("all");

  const sorted = useMemo(
    () => [...auditEvents].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    []
  );

  const filtered = useMemo(
    () => (layer === "all" ? sorted : sorted.filter((e) => e.layer === (layer as GovernanceLayer))),
    [sorted, layer]
  );

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل التدقيق"
        titleEn="Audit Trails"
        subtitleAr={`${auditEvents.length} حدث تدقيق مسجل عبر الطبقات الثماني للحوكمة`}
      />

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card">
        <select
          value={layer}
          onChange={(e) => setLayer(e.target.value)}
          className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-sm text-navy-900"
        >
          <option value="all">كل الطبقات</option>
          {GOVERNANCE_LAYERS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.labelAr}
            </option>
          ))}
        </select>
        <span className="ms-auto text-xs text-navy-400">
          عرض {filtered.length} من {auditEvents.length} حدث
        </span>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الوقت</th>
              <th className="px-4 py-3 text-start font-medium">الجهة الفاعلة</th>
              <th className="px-4 py-3 text-start font-medium">الحدث</th>
              <th className="px-4 py-3 text-start font-medium">الطبقة</th>
              <th className="px-4 py-3 text-start font-medium">الأصل المرتبط</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {filtered.map((e) => {
              const layerLabel = GOVERNANCE_LAYERS.find((l) => l.key === e.layer);
              const asset = e.assetId ? getUseCaseById(e.assetId) : undefined;
              return (
                <tr key={e.id} className="hover:bg-navy-50/60">
                  <td className="px-4 py-3 text-navy-500">{e.timestamp.replace("T", " ").replace("Z", "")}</td>
                  <td className="px-4 py-3 text-navy-700">{e.actor}</td>
                  <td className="px-4 py-3 text-navy-900">{e.actionAr}</td>
                  <td className="px-4 py-3 text-navy-700">{layerLabel?.labelAr}</td>
                  <td className="px-4 py-3">
                    {asset ? (
                      <Link href={`/ai-inventory/${asset.id}`} className="text-navy-700 hover:text-gold-600">
                        {asset.nameAr}
                      </Link>
                    ) : (
                      <span className="text-navy-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
