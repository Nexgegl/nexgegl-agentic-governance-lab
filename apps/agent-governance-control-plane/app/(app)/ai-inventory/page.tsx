import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { AiInventoryTable } from "./AiInventoryTable";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUseCases } from "@/repositories/use-cases-repository";

export const dynamic = "force-dynamic";

export default async function AiInventoryPage() {
  const supabase = createServerSupabaseClient();
  const useCases = await listUseCases(supabase);

  return (
    <div className="space-y-6">
      <Topbar
        titleAr="سجل الذكاء الاصطناعي والملكية"
        titleEn="AI Inventory & Ownership"
        subtitleAr="جميع أصول الذكاء الاصطناعي والوكلاء عبر المؤسسة، مع مالكها وصلاحيتها ومرحلة دورة حياتها"
        badgeAr="بيانات حقيقية"
        badgeEn="Live — Supabase"
      />

      {useCases.length === 0 ? (
        <section className="rounded-xl border border-navy-100 bg-white p-8 text-center shadow-card">
          <p className="text-sm text-navy-500">
            لا توجد حالات استخدام مسجلة بعد لمؤسستك في Supabase.
          </p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs text-navy-400 hover:text-gold-600">
            العودة إلى لوحة القيادة ←
          </Link>
        </section>
      ) : (
        <AiInventoryTable useCases={useCases} />
      )}
    </div>
  );
}
