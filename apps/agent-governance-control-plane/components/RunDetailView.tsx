"use client";

import { useState } from "react";
import Link from "next/link";
import { GateStatusBadge, RiskBadge } from "@/components/badges";
import { RunStatusBadge, ReviewOutcomeBadge } from "@/components/RuntimeBadges";
import {
  getEvaluationDimensionLabel,
  getEvidenceReviewerStatusLabel,
  getEvidenceSourceQualityLabel,
  getStopReasonLabel,
  getTraceStageLabel,
} from "@/runtime/runtime-labels";
import { getHumanReviewDecisionLabel } from "@/lib/labels";
import { getSkillById } from "@/runtime/demo-skills";
import { getToolById } from "@/runtime/demo-tools";
import type { ExecutionRun } from "@/runtime/types";

const TABS = [
  { key: "summary", labelAr: "الملخص" },
  { key: "plan", labelAr: "الخطة" },
  { key: "skills", labelAr: "المهارات" },
  { key: "tools", labelAr: "الأدوات" },
  { key: "evidence", labelAr: "الأدلة" },
  { key: "evaluation", labelAr: "التقييم" },
  { key: "trace", labelAr: "سجل التنفيذ" },
  { key: "review", labelAr: "المراجعة البشرية" },
  { key: "packet", labelAr: "حزمة القرار" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function RunDetailView({ run }: { run: ExecutionRun }) {
  const [tab, setTab] = useState<TabKey>("summary");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <RunStatusBadge status={run.status} />
        <RiskBadge risk={run.request.riskLevel} />
        {run.governanceGate ? <GateStatusBadge status={run.governanceGate.status === "BLOCKED_PRE_EXECUTION" ? "BLOCKED" : run.governanceGate.status} /> : null}
        {run.stopReason ? (
          <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
            سبب الإيقاف: {getStopReasonLabel(run.stopReason)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-navy-100">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-navy-950 text-gold-400" : "text-navy-500 hover:bg-navy-50"
            }`}
          >
            {t.labelAr}
          </button>
        ))}
      </div>

      <div className="rounded-b-xl rounded-tl-xl border border-navy-100 bg-white p-5 shadow-card">
        {tab === "summary" ? <SummaryTab run={run} /> : null}
        {tab === "plan" ? <PlanTab run={run} /> : null}
        {tab === "skills" ? <SkillsTab run={run} /> : null}
        {tab === "tools" ? <ToolsTab run={run} /> : null}
        {tab === "evidence" ? <EvidenceTab run={run} /> : null}
        {tab === "evaluation" ? <EvaluationTab run={run} /> : null}
        {tab === "trace" ? <TraceTab run={run} /> : null}
        {tab === "review" ? <ReviewTab run={run} /> : null}
        {tab === "packet" ? <PacketTab run={run} /> : null}
      </div>
    </div>
  );
}

function SummaryTab({ run }: { run: ExecutionRun }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">عنوان الطلب</h3>
        <p className="font-medium text-navy-900">{run.request.titleAr}</p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">السؤال البحثي</h3>
        <p className="text-navy-700">{run.request.researchQuestionAr}</p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">الغرض التجاري</h3>
        <p className="text-navy-700">{run.businessPurposeAr}</p>
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-navy-400">الإدارة</dt>
          <dd className="font-medium text-navy-900">{run.request.department}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">مقدم الطلب</dt>
          <dd className="font-medium text-navy-900">{run.requester}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">مالك الحالة</dt>
          <dd className="font-medium text-navy-900">{run.request.owner}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">صاحب الصلاحية</dt>
          <dd className="font-medium text-navy-900">{run.request.authorityHolder || "غير محدد"}</dd>
        </div>
      </dl>
      {run.governanceGate ? (
        <div className="rounded-lg border border-navy-100 bg-navy-50 p-3">
          <p className="text-xs font-semibold text-navy-500">سبب حالة بوابة الحوكمة</p>
          <p className="mt-1 text-navy-800">{run.governanceGate.reasonAr}</p>
        </div>
      ) : null}
    </div>
  );
}

function PlanTab({ run }: { run: ExecutionRun }) {
  if (!run.plan) return <p className="text-sm text-navy-400">لم تُنشأ خطة تنفيذ — تم رفض الطلب في مرحلة التخطيط.</p>;
  return (
    <div className="space-y-4 text-sm">
      <p className="text-navy-700">{run.plan.objectiveAr}</p>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-navy-400">التصنيف</dt>
          <dd className="font-medium text-navy-900">{run.plan.classification}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">الحد الأقصى للخطوات</dt>
          <dd className="font-medium text-navy-900">{run.plan.maxSteps}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">الحد الأقصى لاستدعاءات الأدوات</dt>
          <dd className="font-medium text-navy-900">{run.plan.maxToolCalls}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">يتطلب تقييمًا</dt>
          <dd className="font-medium text-navy-900">{run.plan.evaluationRequired ? "نعم" : "لا"}</dd>
        </div>
      </dl>
      <ol className="space-y-2 border-s-2 border-navy-100 ps-4">
        {run.plan.steps.map((s) => (
          <li key={s.stepId} className="rounded-lg border border-navy-100 p-3">
            <p className="font-medium text-navy-900">{s.objectiveAr}</p>
            <p className="mt-1 text-xs text-navy-500">المهارة: {s.skillId} · الأدوات: {s.toolIds.join("، ") || "لا يوجد"}</p>
            <p className="mt-1 text-xs text-navy-400">شرط الإكمال: {s.completionConditionAr}</p>
          </li>
        ))}
      </ol>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">شروط الإيقاف</h3>
        <ul className="list-inside list-disc text-navy-700">
          {run.plan.stopConditionsAr.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SkillsTab({ run }: { run: ExecutionRun }) {
  if (run.selectedSkills.length === 0) return <p className="text-sm text-navy-400">لم تُستخدم أي مهارة لهذا التشغيل.</p>;
  return (
    <ul className="space-y-3 text-sm">
      {run.selectedSkills.map((skillId) => {
        const skill = getSkillById(skillId);
        return (
          <li key={skillId} className="rounded-lg border border-navy-100 p-3">
            <Link href={`/skills/${skillId}`} className="font-medium text-navy-900 hover:text-gold-600">
              {skill?.nameAr ?? skillId}
            </Link>
            <p className="mt-1 text-xs text-navy-500">{skill?.descriptionAr}</p>
          </li>
        );
      })}
    </ul>
  );
}

function ToolsTab({ run }: { run: ExecutionRun }) {
  return (
    <div className="space-y-4 text-sm">
      {run.selectedTools.length > 0 ? (
        <ul className="space-y-2">
          {run.selectedTools.map((toolId) => {
            const tool = getToolById(toolId);
            return (
              <li key={toolId} className="rounded-lg border border-navy-100 p-3">
                <Link href={`/tools/${toolId}`} className="font-medium text-navy-900 hover:text-gold-600">
                  {tool?.nameAr ?? toolId}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-navy-400">لم تُستخدم أي أداة لهذا التشغيل.</p>
      )}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-navy-400">سجل استدعاءات الأدوات</h3>
        <table className="w-full text-xs">
          <thead className="text-navy-400">
            <tr>
              <th className="py-1 text-start">الأداة</th>
              <th className="py-1 text-start">الحالة</th>
              <th className="py-1 text-start">الملخص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {run.toolCalls.map((c) => (
              <tr key={c.id}>
                <td className="py-1.5 text-navy-800">{getToolById(c.toolId)?.nameAr ?? c.toolId}</td>
                <td className="py-1.5">
                  <span className={c.status === "SUCCESS" ? "text-emerald-700" : c.status === "REFUSED" ? "text-red-700" : "text-amber-700"}>
                    {c.status === "SUCCESS" ? "نجاح" : c.status === "REFUSED" ? "مرفوض" : "فشل"}
                  </span>
                </td>
                <td className="py-1.5 text-navy-600">{c.resultSummaryAr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvidenceTab({ run }: { run: ExecutionRun }) {
  if (run.evidence.length === 0) return <p className="text-sm text-navy-400">لم يُجمع أي دليل لهذا التشغيل.</p>;
  return (
    <ul className="space-y-3 text-sm">
      {run.evidence.map((e) => (
        <li key={e.id} className="rounded-lg border border-navy-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-navy-900">{e.titleAr}</p>
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
              {getEvidenceReviewerStatusLabel(e.reviewerStatus)}
            </span>
          </div>
          <p className="mt-1 text-navy-600">{e.summaryAr}</p>
          <p className="mt-1 text-[11px] text-navy-400">
            جودة المصدر: {getEvidenceSourceQualityLabel(e.sourceQuality)} · المصدر: {e.sourceReference}
          </p>
        </li>
      ))}
    </ul>
  );
}

function EvaluationTab({ run }: { run: ExecutionRun }) {
  if (run.evaluations.length === 0) return <p className="text-sm text-navy-400">لم يُجرَ أي تقييم — التشغيل محظور قبل التنفيذ.</p>;
  return (
    <ul className="space-y-3 text-sm">
      {run.evaluations.map((e) => (
        <li key={e.dimension} className="rounded-lg border border-navy-100 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-navy-900">{getEvaluationDimensionLabel(e.dimension)}</p>
            <ReviewOutcomeBadge outcome={e.outcome} />
          </div>
          <p className="mt-1 text-navy-600">{e.findingsAr.join(" ")}</p>
          {e.requiredFixesAr.length > 0 ? <p className="mt-1 text-[11px] text-amber-700">إصلاح مطلوب: {e.requiredFixesAr.join("، ")}</p> : null}
          {e.blockingFailuresAr.length > 0 ? <p className="mt-1 text-[11px] text-red-700">إخفاق حاجب: {e.blockingFailuresAr.join("، ")}</p> : null}
          {e.escalationReasonsAr.length > 0 ? <p className="mt-1 text-[11px] text-orange-700">سبب التصعيد: {e.escalationReasonsAr.join("، ")}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function TraceTab({ run }: { run: ExecutionRun }) {
  return (
    <div>
      <p className="mb-3 text-xs text-navy-400">سجل تنفيذ منظّم — لا يحتوي على أي تفكير داخلي مخفي (Chain of Thought)، بل أحداث ملحوظة فقط.</p>
      <ol className="space-y-2 border-s-2 border-navy-100 ps-4 text-sm">
        {run.trace.map((t) => (
          <li key={t.id} className="relative">
            <span
              className={`absolute -start-[21px] top-1 h-2.5 w-2.5 rounded-full ${
                t.status === "BLOCKED" ? "bg-red-500" : t.status === "WARNING" ? "bg-amber-500" : "bg-gold-500"
              }`}
            />
            <p className="text-navy-900">{t.actionAr}</p>
            <p className="text-xs text-navy-500">{t.summaryAr}</p>
            <p className="text-[11px] text-navy-400">
              {t.actor} · {getTraceStageLabel(t.stage)} · {t.timestamp.slice(11, 19)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReviewTab({ run }: { run: ExecutionRun }) {
  if (!run.humanReview) {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4 text-sm text-amber-800">
        لا توجد مراجعة بشرية مسجلة بعد لهذا التشغيل. هذا التشغيل التجريبي لا يُنشئ مراجعة بشرية تلقائيًا — يجب أن تتم يدويًا من خارج هذا النظام.
      </div>
    );
  }
  return (
    <div className="text-sm">
      <p className="font-medium text-navy-900">{getHumanReviewDecisionLabel(run.humanReview.decision).ar}</p>
      <p className="mt-1 text-navy-600">{run.humanReview.notesAr}</p>
      <p className="mt-1 text-[11px] text-navy-400">
        {run.humanReview.reviewer} · {run.humanReview.reviewDate}
      </p>
    </div>
  );
}

function PacketTab({ run }: { run: ExecutionRun }) {
  if (!run.decisionPacket) return <p className="text-sm text-navy-400">لا توجد حزمة قرار لهذا التشغيل.</p>;
  const p = run.decisionPacket;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">ملخص الطلب</h3>
        <p className="text-navy-800">{p.requestSummaryAr}</p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">ملخص الخطة</h3>
        <p className="text-navy-800">{p.planSummaryAr}</p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">ملخص الأدلة</h3>
        <p className="text-navy-800">{p.evidenceSummaryAr}</p>
      </div>
      <div>
        <h3 className="mb-1 text-xs font-semibold text-navy-400">ملخص التقييم</h3>
        <p className="text-navy-800">{p.evaluationSummaryAr}</p>
      </div>
      <div className="rounded-lg border border-red-100 bg-red-50/60 p-3">
        <h3 className="mb-1 text-xs font-semibold text-red-700">فجوات غير محلولة</h3>
        {p.unresolvedGapsAr.length === 0 ? (
          <p className="text-emerald-700">لا توجد فجوات غير محلولة.</p>
        ) : (
          <ul className="list-inside list-disc text-red-700">
            {p.unresolvedGapsAr.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg border border-gold-400 bg-gold-100/60 p-3">
        <h3 className="mb-1 text-xs font-semibold text-gold-700">الإجراء التنفيذي الموصى به</h3>
        <p className="font-medium text-navy-900">{p.recommendedNextActionAr}</p>
      </div>
      <div className="rounded-lg border-2 border-navy-900 bg-navy-950 p-4 text-white">
        <p className="text-xs leading-relaxed text-navy-200">{p.boundaryAr}</p>
      </div>
    </div>
  );
}
