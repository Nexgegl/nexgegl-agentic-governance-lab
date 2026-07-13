import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { PermissionCellBadge } from "@/components/badges";
import { useCases } from "@/lib/mock-data";
import { PERMISSION_COLUMNS } from "@/lib/governance-model";

export default function AccessControlPage() {
  const externalSystemCount = useCases.filter((u) => u.toolAccess === "external_system").length;
  const writeCount = useCases.filter((u) => u.toolAccess === "write" || u.toolAccess === "external_system").length;
  const missingAuthorityCount = useCases.filter((u) => u.authorityStatus === "missing").length;
  const missingPolicyBoundaryCount = useCases.filter((u) => !u.evidenceDetail.policy_boundary_evidence).length;

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="التحكم في الوصول"
        titleEn="Access Control"
        subtitleAr="ما الذي يمكن لكل وكيل فعله، وما الذي لا يمكنه فعله"
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">وصول لأنظمة خارجية</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{externalSystemCount}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-card">
          <p className="text-xs text-navy-400">صلاحية كتابة</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{writeCount}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 shadow-card">
          <p className="text-xs text-red-600">بدون سلطة معتمدة</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{missingAuthorityCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-card">
          <p className="text-xs text-amber-700">بدون حدود سياسة معتمدة</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{missingPolicyBoundaryCount}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-navy-500">مفتاح الحالات:</span>
          <div className="w-28">
            <PermissionCellBadge status="allowed" />
          </div>
          <div className="w-28">
            <PermissionCellBadge status="requires_approval" />
          </div>
          <div className="w-24">
            <PermissionCellBadge status="blocked" />
          </div>
          <div className="w-24">
            <PermissionCellBadge status="forbidden" />
          </div>
        </div>
        <p className="flex items-center gap-1 text-xs text-navy-400">
          <span aria-hidden>⇠</span> اسحب الجدول أفقيًا لعرض جميع الصلاحيات
        </p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-card">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-navy-50 text-xs text-navy-500">
            <tr>
              <th className="sticky start-0 z-10 bg-navy-50 px-4 py-3 text-start font-medium">الوكيل / أصل الذكاء الاصطناعي</th>
              {PERMISSION_COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-3 text-center font-medium">
                  <span className="block">{col.labelAr}</span>
                  <span className="block text-[10px] font-normal text-navy-400">{col.labelEn}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {useCases.map((u) => {
              const isExternal = u.toolAccess === "external_system";
              const isWrite = u.toolAccess === "write" || isExternal;
              const missingAuthority = u.authorityStatus === "missing";
              const missingPolicyBoundary = !u.evidenceDetail.policy_boundary_evidence;

              return (
                <tr key={u.id} className="hover:bg-navy-50/60">
                  <td className="sticky start-0 z-10 bg-white px-4 py-3 hover:bg-navy-50/60">
                    <Link href={`/ai-inventory/${u.id}`} className="font-medium text-navy-900 hover:text-gold-600">
                      {u.nameAr}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {isWrite ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                          صلاحية كتابة
                        </span>
                      ) : null}
                      {isExternal ? (
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-800 ring-1 ring-inset ring-orange-600/20">
                          نظام خارجي
                        </span>
                      ) : null}
                      {missingAuthority ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                          بدون سلطة
                        </span>
                      ) : null}
                      {missingPolicyBoundary ? (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-700 ring-1 ring-inset ring-neutral-400/40">
                          بدون حدود سياسة
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {PERMISSION_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-3">
                      <PermissionCellBadge status={u.permissions[col.key]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
