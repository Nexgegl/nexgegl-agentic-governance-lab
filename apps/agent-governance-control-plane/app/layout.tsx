import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { BoundaryFooter } from "@/components/BoundaryFooter";

export const metadata: Metadata = {
  title: "مركز تحكم حوكمة وكلاء الذكاء الاصطناعي — NEXGEGL",
  description:
    "NEXGEGL Agent Governance Control Plane — منصة تنفيذية لعرض وتصنيف وحوكمة ومراجعة حالات استخدام الذكاء الاصطناعي والوكلاء عبر المؤسسة.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-navy-50 text-navy-950 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
            <BoundaryFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
