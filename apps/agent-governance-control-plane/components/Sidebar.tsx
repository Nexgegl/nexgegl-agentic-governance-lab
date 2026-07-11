"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", labelAr: "لوحة القيادة", labelEn: "Command Center" },
  { href: "/use-cases", labelAr: "سجل حالات الاستخدام", labelEn: "Use Case Registry" },
  { href: "/permissions", labelAr: "خريطة الصلاحيات", labelEn: "Permission Map" },
  { href: "/evidence", labelAr: "غرفة الأدلة", labelEn: "Evidence Room" },
  { href: "/gate-board", labelAr: "لوحة بوابات الحوكمة", labelEn: "Governance Gate Board" },
  { href: "/decision-packet/uc-01", labelAr: "حزمة القرار", labelEn: "Decision Packet" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-s border-navy-800 bg-navy-950 text-navy-50">
      <div className="flex items-center gap-3 border-b border-navy-800 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500 text-lg font-bold text-navy-950">
          ن
        </div>
        <div>
          <p className="text-sm font-semibold text-white">مركز تحكم حوكمة الوكلاء</p>
          <p className="text-[11px] text-navy-400">NEXGEGL Control Plane</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href.split("/").slice(0, 2).join("/")));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-gold-500 text-navy-950 font-semibold" : "text-navy-200 hover:bg-navy-800 hover:text-white"
              }`}
            >
              <span>{item.labelAr}</span>
              <span className={`text-[10px] ${isActive ? "text-navy-800" : "text-navy-400"}`}>{item.labelEn}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-800 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-navy-400">
          حالة تجريبية — بيانات وهمية لأغراض العرض فقط
        </p>
      </div>
    </aside>
  );
}
