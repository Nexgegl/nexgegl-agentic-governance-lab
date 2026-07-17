import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { agents } from "@/lib/mock-data";
import { getToolAccessLabel } from "@/lib/governance-model";
import { getAgentStatusClasses, getAgentStatusLabel } from "@/lib/labels";

export default function AgentsPage() {
  const active = agents.filter((a) => a.status === "active").length;
  const underReview = agents.filter((a) => a.status === "under_review").length;
  const suspended = agents.filter((a) => a.status === "suspended").length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="حوكمة الوكلاء"
        titleEn="Agent Governance"
        subtitleAr="حالة الوكلاء المشغّلين لأصول الذكاء الاصطناعي وحالة مراجعة صلاحياتهم"
      />

      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-card">
          <p className="text-xs text-emerald-700">نشطون</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{active}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">قيد المراجعة</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{underReview}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">معلّقون</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{suspended}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">الوكيل</th>
              <th className="px-4 py-3 text-start font-medium">النوع</th>
              <th className="px-4 py-3 text-start font-medium">الفريق المالك</th>
              <th className="px-4 py-3 text-start font-medium">الوصول للأدوات</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">آخر مراجعة صلاحيات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-navy-50/60">
                <td className="px-4 py-3">
                  <Link href={`/agents/${a.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                    {a.nameAr}
                  </Link>
                  <p className="text-[11px] text-navy-400">{a.name}</p>
                </td>
                <td className="px-4 py-3 text-navy-700">{a.agentType}</td>
                <td className="px-4 py-3 text-navy-700">{a.ownerTeam}</td>
                <td className="px-4 py-3 text-navy-700">{getToolAccessLabel(a.toolAccess).ar}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getAgentStatusClasses(a.status)}`}>
                    {getAgentStatusLabel(a.status).ar}
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-500">{a.lastPermissionReview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
