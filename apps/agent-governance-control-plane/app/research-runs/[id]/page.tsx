"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { RunDetailView } from "@/components/RunDetailView";
import { getRunById } from "@/runtime/run-store";
import { getLocalRunById } from "@/runtime/local-run-store";
import type { ExecutionRun } from "@/runtime/types";

export default function ResearchRunDetailPage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState<ExecutionRun | null | undefined>(undefined);

  useEffect(() => {
    setRun(getRunById(params.id) ?? getLocalRunById(params.id) ?? null);
  }, [params.id]);

  if (run === undefined) {
    return <p className="text-sm text-navy-400">جارٍ التحميل…</p>;
  }

  if (run === null) {
    return (
      <div className="space-y-4">
        <Topbar titleAr="التشغيل غير موجود" titleEn="Research Run Not Found" subtitleAr={params.id} />
        <p className="text-sm text-navy-500">
          لم يُعثر على تشغيل بهذا المعرّف — قد يكون معرّفًا محليًا تم مسحه من هذا المتصفح، أو معرّفًا غير صحيح.
        </p>
        <Link href="/research-runs" className="text-sm font-medium text-navy-700 hover:text-gold-600">
          العودة إلى تشغيلات البحث ←
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Topbar titleAr={run.request.titleAr} titleEn="Governed Research Run" subtitleAr={run.runId} />
      <RunDetailView run={run} />
    </div>
  );
}
