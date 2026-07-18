import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { DevDataNote } from "@/components/DevDataNote";
import { RiskBadge } from "@/components/badges";
import { useCases } from "@/lib/mock-data";
import { GATE_STATUS_ORDER, computeMissingControls, computeNextAction, getGateStatusLabel } from "@/lib/governance-model";

const COLUMN_ACCENTS: Record<string, string> = {
  BLOCKED: "border-t-red-500",
  REPAIR_REQUIRED: "border-t-amber-500",
  GOVERNANCE_REVIEW_REQUIRED: "border-t-navy-500",
  ESCALATE_REQUIRED: "border-t-orange-500",
  READY_FOR_AUTHORITY_REVIEW: "border-t-emerald-500",
};

export default function GateBoardPage() {
  return (
    <div className="space-y-6">
      <Topbar
        titleAr="لوحة بوابات الحوكمة"
        titleEn="Governance Gate Board"
        subtitleAr="حركة حالات الاستخدام عبر بوابة الحوكمة، بأسلوب لوحة كانبان"
      />

      <DevDataNote />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {GATE_STATUS_ORDER.map((status) => {
          const items = useCases.filter((u) => u.governanceStatus === status);
          const label = getGateStatusLabel(status);
          return (
            <div key={status} className={`flex flex-col rounded-xl border border-t-4 border-navy-100 bg-navy-50/60 ${COLUMN_ACCENTS[status]}`}>
              <div className="px-4 py-3">
                <h2 className="text-sm font-semibold text-navy-900">{label.ar}</h2>
                <p className="text-[11px] text-navy-400">
                  {label.en} · {items.length}
                </p>
              </div>
              <div className="flex-1 space-y-3 px-3 pb-4">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-navy-200 px-3 py-6 text-center text-xs text-navy-400">
                    لا توجد حالات
                  </p>
                ) : (
                  items.map((u) => {
                    const missing = computeMissingControls(u);
                    return (
                      <Link
                        key={u.id}
                        href={`/decision-packet/${u.id}`}
                        className="block rounded-lg border border-navy-100 bg-white p-3 shadow-card transition-shadow hover:shadow-md"
                      >
                        <p className="text-sm font-medium text-navy-900">{u.nameAr}</p>
                        <p className="text-[11px] text-navy-400">{u.department}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <RiskBadge risk={u.riskLevel} />
                          <span className="text-[11px] text-navy-400">{missing.length} ضوابط ناقصة</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[11px] text-navy-500">{computeNextAction(u)}</p>
                        <p className="mt-1 text-[11px] text-navy-400">المالك: {u.owner}</p>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
