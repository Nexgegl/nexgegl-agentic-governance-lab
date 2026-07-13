import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { BoundaryFooter } from "@/components/BoundaryFooter";

export const metadata: Metadata = {
  title: "نظام تشغيل حوكمة الذكاء الاصطناعي — NEXGEGL",
  description:
    "NEXGEGL AI Governance Operating System — منصة تنفيذية موحدة تغطي طبقات حوكمة الذكاء الاصطناعي الثماني: السجل والملكية، الأساس البياني، دورة حياة النماذج، أمن البيانات والخصوصية، التحكم في الوصول، حوكمة الوكلاء، الإشراف البشري، والامتثال والتدقيق.",
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
