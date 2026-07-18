import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "نظام تشغيل حوكمة الذكاء الاصطناعي — NEXGEGL",
  description:
    "NEXGEGL AI Governance Operating System — منصة تنفيذية موحدة تغطي طبقات حوكمة الذكاء الاصطناعي الثماني: السجل والملكية، الأساس البياني، دورة حياة النماذج، أمن البيانات والخصوصية، التحكم في الوصول، حوكمة الوكلاء، الإشراف البشري، والامتثال والتدقيق.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-navy-50 text-navy-950 antialiased">{children}</body>
    </html>
  );
}
