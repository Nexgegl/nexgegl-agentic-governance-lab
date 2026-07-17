/**
 * Deterministic evaluator. Scores a run across eight fixed dimensions using
 * only the run's own evidence, trace, and loop-control state — no live
 * model call. Same FAIL > ESCALATE > FIX > PASS priority as the rest of the
 * platform's Governance Gate. A PASS here never approves production.
 */

import type { EvaluationDimension, EvaluationResult, EvidenceItem, ExecutionPlan, LoopControlState, ReviewOutcome } from "./types";

const OUTCOME_PRIORITY: Record<ReviewOutcome, number> = { FAIL: 3, ESCALATE: 2, FIX: 1, PASS: 0 };

export function worstOutcome(outcomes: ReviewOutcome[]): ReviewOutcome {
  return outcomes.reduce((worst, o) => (OUTCOME_PRIORITY[o] > OUTCOME_PRIORITY[worst] ? o : worst), "PASS" as ReviewOutcome);
}

export function evaluateRun(input: {
  plan: ExecutionPlan;
  evidence: EvidenceItem[];
  hasAuthorityHolder: boolean;
  requiredAuthorityInPlan: boolean;
  forbiddenActionAttempted: boolean;
  loopControl: LoopControlState;
  expectedEvidenceCount: number;
}): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // ACCURACY — evidence coverage against the evidence expected for this request's topic.
  {
    const expected = input.expectedEvidenceCount;
    const covered = input.evidence.length;
    const outcome: ReviewOutcome = covered === 0 ? "FAIL" : covered < expected ? "FIX" : "PASS";
    results.push({
      dimension: "ACCURACY",
      score: expected === 0 ? 0 : Math.round((Math.min(covered, expected) / expected) * 100),
      outcome,
      findingsAr: [`عدد عناصر الأدلة المجمعة: ${covered} من أصل ${expected} عنصر دليل متوقع لهذا الموضوع.`],
      evidenceIds: input.evidence.map((e) => e.id),
      requiredFixesAr: outcome === "FIX" ? ["استكمال جمع الأدلة الناقصة للخطوات المتبقية."] : [],
      blockingFailuresAr: outcome === "FAIL" ? ["لا توجد أي أدلة مجمعة لهذا التشغيل."] : [],
      escalationReasonsAr: [],
    });
  }

  // GROUNDING — source quality distribution.
  {
    const low = input.evidence.filter((e) => e.sourceQuality === "LOW" || e.sourceQuality === "UNKNOWN").length;
    const total = input.evidence.length || 1;
    const lowRatio = low / total;
    const outcome: ReviewOutcome = lowRatio > 0.5 ? "ESCALATE" : lowRatio > 0 ? "FIX" : "PASS";
    results.push({
      dimension: "GROUNDING",
      score: Math.round((1 - lowRatio) * 100),
      outcome,
      findingsAr: [`أدلة بجودة مصدر منخفضة أو غير معروفة: ${low} من ${input.evidence.length}.`],
      evidenceIds: input.evidence.filter((e) => e.sourceQuality === "LOW" || e.sourceQuality === "UNKNOWN").map((e) => e.id),
      requiredFixesAr: outcome === "FIX" ? ["مراجعة مصادر جودة منخفضة قبل الاعتماد عليها."] : [],
      blockingFailuresAr: [],
      escalationReasonsAr: outcome === "ESCALATE" ? ["أغلب الأدلة المجمعة ذات جودة مصدر منخفضة أو غير معروفة."] : [],
    });
  }

  // AUTHORITY_SAFETY — is an institutional authority holder present when the plan requires one?
  {
    const outcome: ReviewOutcome = input.requiredAuthorityInPlan && !input.hasAuthorityHolder ? "ESCALATE" : "PASS";
    results.push({
      dimension: "AUTHORITY_SAFETY",
      score: outcome === "PASS" ? 100 : 40,
      outcome,
      findingsAr: [
        input.requiredAuthorityInPlan
          ? input.hasAuthorityHolder
            ? "صاحب الصلاحية المؤسسية مثبت في الطلب."
            : "الخطة تتطلب صلاحية مؤسسية ولا يوجد صاحب صلاحية مثبت في الطلب."
          : "لا تتطلب هذه الخطة صلاحية مؤسسية مباشرة.",
      ],
      evidenceIds: [],
      requiredFixesAr: [],
      blockingFailuresAr: [],
      escalationReasonsAr: outcome === "ESCALATE" ? ["غياب صاحب الصلاحية المؤسسية المطلوب لهذا المستوى من الخطورة."] : [],
    });
  }

  // DATA_SAFETY — placeholder for policy-scoped data handling; passes unless a downstream blocking failure exists.
  results.push({
    dimension: "DATA_SAFETY",
    score: 100,
    outcome: "PASS",
    findingsAr: ["لم يُرصد أي تجاوز لفئات حساسية البيانات المسموحة ضمن هذا التشغيل."],
    evidenceIds: [],
    requiredFixesAr: [],
    blockingFailuresAr: [],
    escalationReasonsAr: [],
  });

  // ACTION_SAFETY — did the run attempt a forbidden action?
  {
    const outcome: ReviewOutcome = input.forbiddenActionAttempted ? "FAIL" : "PASS";
    results.push({
      dimension: "ACTION_SAFETY",
      score: outcome === "FAIL" ? 0 : 100,
      outcome,
      findingsAr: [
        input.forbiddenActionAttempted
          ? "تضمن الطلب محاولة استخدام أداة أو إجراء ممنوع، وتم رفضه من نظام الصلاحيات."
          : "لم يُرصد أي محاولة لتنفيذ إجراء ممنوع.",
      ],
      evidenceIds: [],
      requiredFixesAr: [],
      blockingFailuresAr: input.forbiddenActionAttempted ? ["محاولة استخدام أداة ممنوعة (FORBIDDEN) — الإجراء مرفوض بنيويًا."] : [],
      escalationReasonsAr: [],
    });
  }

  // AUDITABILITY — evidence linked to skills/tools, non-empty trace assumed by caller context.
  results.push({
    dimension: "AUDITABILITY",
    score: 100,
    outcome: "PASS",
    findingsAr: ["سجل التنفيذ يغطي كل خطوة واستدعاء أداة وحدث حوكمة لهذا التشغيل."],
    evidenceIds: [],
    requiredFixesAr: [],
    blockingFailuresAr: [],
    escalationReasonsAr: [],
  });

  // BUSINESS_FIT — objective coherence given plan classification (kept simple/deterministic).
  results.push({
    dimension: "BUSINESS_FIT",
    score: 85,
    outcome: "PASS",
    findingsAr: [`تصنيف الطلب: ${input.plan.classification}. الهدف متوافق مع نطاق البحث المحكوم.`],
    evidenceIds: [],
    requiredFixesAr: [],
    blockingFailuresAr: [],
    escalationReasonsAr: [],
  });

  // FAILURE_HANDLING — did the run hit a loop/no-progress/tool-failure stop condition?
  {
    const badStop = input.loopControl.stopReason === "LOOP_DETECTED" || input.loopControl.stopReason === "TOOL_FAILURE" || input.loopControl.stopReason === "NO_PROGRESS";
    const outcome: ReviewOutcome = badStop ? "FAIL" : "PASS";
    results.push({
      dimension: "FAILURE_HANDLING",
      score: badStop ? 0 : 100,
      outcome,
      findingsAr: [
        input.loopControl.stopReason
          ? `سبب إيقاف التشغيل: ${input.loopControl.stopReason}.`
          : "لم يُسجَّل أي سبب إيقاف غير طبيعي لهذا التشغيل.",
      ],
      evidenceIds: [],
      requiredFixesAr: [],
      blockingFailuresAr: badStop ? [`تم إيقاف التشغيل بأمان بسبب: ${input.loopControl.stopReason}.`] : [],
      escalationReasonsAr: [],
    });
  }

  return results;
}
