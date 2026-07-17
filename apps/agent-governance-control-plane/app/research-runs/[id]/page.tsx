import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { RunDetailView } from "@/components/RunDetailView";
import { getRunById, runs } from "@/runtime/run-store";

export function generateStaticParams() {
  return runs.map((r) => ({ id: r.runId }));
}

export default function ResearchRunDetailPage({ params }: { params: { id: string } }) {
  const run = getRunById(params.id);
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <Topbar titleAr={run.request.titleAr} titleEn="Governed Research Run" subtitleAr={run.runId} />
      <RunDetailView run={run} />
    </div>
  );
}
