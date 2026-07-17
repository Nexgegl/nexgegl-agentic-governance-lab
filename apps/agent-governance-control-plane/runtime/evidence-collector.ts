/**
 * Deterministic evidence collector. Every evidence item is derived from a
 * fixed local demonstration corpus keyed by tool + topic — no live network
 * calls. No evidence item is ever auto-accepted: reviewerStatus always
 * starts at "UNREVIEWED".
 */

import type { DataSensitivity } from "@/lib/governance-model";
import type { EvidenceItem, EvidenceSourceQuality, ToolType } from "./types";

interface DemoEvidenceSeed {
  titleAr: string;
  summaryAr: string;
  sourceReference: string;
  sourceQuality: EvidenceSourceQuality;
  freshness: EvidenceItem["freshnessStatus"];
}

const EVIDENCE_CORPUS: Record<string, DemoEvidenceSeed[]> = {
  "crm-agent-risk": [
    {
      titleAr: "سياسة حوكمة الوكلاء الداخلية — قسم صلاحيات الكتابة",
      summaryAr: "توضح السياسة الداخلية أن أي وكيل بصلاحية كتابة على نظام العملاء يتطلب موافقة بشرية لكل استدعاء وسجل تدقيق كامل.",
      sourceReference: "demo-policy://internal-agent-governance-policy#write-permissions",
      sourceQuality: "HIGH",
      freshness: "CURRENT",
    },
    {
      titleAr: "ملاحظات صناعية عامة حول مخاطر أتمتة تحديث بيانات العملاء",
      summaryAr: "مصدر بحثي عام (تجريبي) يشير إلى أن أخطاء التحديث التلقائي لبيانات العملاء غالبًا ما تنتج عن غياب حدود سياسة واضحة وليس عن ضعف النموذج نفسه.",
      sourceReference: "demo-web://industry-notes-crm-automation-risk",
      sourceQuality: "MEDIUM",
      freshness: "CURRENT",
    },
    {
      titleAr: "سجل حوادث داخلي سابق مرتبط بوكيل تحديث نظام العملاء",
      summaryAr: "سجل تجريبي يوثّق حادثة سابقة لوكيل مشابه تطلبت تصعيدًا بسبب غياب حدود السياسة الموثقة.",
      sourceReference: "demo-doc://incident-log-crm-update-agent",
      sourceQuality: "HIGH",
      freshness: "CURRENT",
    },
  ],
  "vendor-model-due-diligence": [
    {
      titleAr: "ملخص تقييم مورد النموذج — إقامة البيانات",
      summaryAr: "مصدر تجريبي يشير إلى أن إقامة بيانات النموذج المزوَّد من المورد غير محددة بوضوح في الوثائق المتاحة.",
      sourceReference: "demo-doc://vendor-model-data-residency-summary",
      sourceQuality: "LOW",
      freshness: "STALE",
    },
    {
      titleAr: "بحث عام حول ممارسات العناية الواجبة لموردي نماذج الذكاء الاصطناعي",
      summaryAr: "مصدر بحثي عام (تجريبي) يوضح المعايير المعتادة لمراجعة موردي النماذج، دون تفاصيل خاصة بهذا المورد تحديدًا.",
      sourceReference: "demo-web://vendor-model-due-diligence-practices",
      sourceQuality: "MEDIUM",
      freshness: "CURRENT",
    },
    {
      titleAr: "سياسة الحوكمة الداخلية — مراجعة موردي النماذج",
      summaryAr: "تحدد السياسة الداخلية الحد الأدنى من متطلبات مراجعة أي مورد نموذج قبل اعتماده.",
      sourceReference: "demo-policy://internal-vendor-model-review-policy",
      sourceQuality: "HIGH",
      freshness: "CURRENT",
    },
  ],
  "high-risk-financial-recommendation": [
    {
      titleAr: "سياسة الحوكمة الداخلية — القرارات المالية عالية الأثر",
      summaryAr: "تشير السياسة إلى أن أي توصية مالية عالية الأثر تتطلب تحديد صلاحية مؤسسية صريحة قبل أي عرض تنفيذي.",
      sourceReference: "demo-policy://internal-governance-policy#high-impact-financial",
      sourceQuality: "HIGH",
      freshness: "CURRENT",
    },
    {
      titleAr: "بيانات تجريبية غير مكتملة حول نطاق القرار المالي المطلوب",
      summaryAr: "الطلب لا يحدد بوضوح ما إذا كان القرار يمس محفظة عميل واحد أو سياسة مؤسسية عامة — غموض يتطلب تصعيدًا.",
      sourceReference: "demo-doc://financial-recommendation-scope-note",
      sourceQuality: "UNKNOWN",
      freshness: "UNKNOWN",
    },
    {
      titleAr: "ملخص عام لمخاطر التوصيات المالية عالية الأثر",
      summaryAr: "مصدر بحثي عام (تجريبي) يوضح المخاطر المعتادة المرتبطة بالتوصيات المالية عالية الأثر دون تفاصيل خاصة بهذه الحالة.",
      sourceReference: "demo-web://high-impact-financial-recommendation-risks",
      sourceQuality: "MEDIUM",
      freshness: "CURRENT",
    },
  ],
  "forbidden-write-request": [
    {
      titleAr: "سياسة حوكمة الوصول — الأدوات الممنوعة",
      summaryAr: "تُدرج السياسة أداة الكتابة المباشرة على نظام العملاء ضمن الأدوات الممنوعة (FORBIDDEN) في هذا الإصدار التجريبي.",
      sourceReference: "demo-policy://internal-tool-registry#forbidden-tools",
      sourceQuality: "HIGH",
      freshness: "CURRENT",
    },
  ],
  "loop-demo": [
    {
      titleAr: "نتيجة بحث تجريبية متكررة (Loop A)",
      summaryAr: "مقتطف بحثي تجريبي يتكرر بنفس المصدر والمحتوى لتوضيح آلية كشف التكرار.",
      sourceReference: "demo-web://loop-demo-fixed-snippet",
      sourceQuality: "MEDIUM",
      freshness: "CURRENT",
    },
  ],
};

export function collectEvidence(
  runId: string,
  topicKey: string,
  index: number,
  context: { sourceType: ToolType; capturedByTool: string; capturedBySkill: string; capturedAt: string; dataClassification: DataSensitivity }
): EvidenceItem {
  const seeds = EVIDENCE_CORPUS[topicKey] ?? EVIDENCE_CORPUS["crm-agent-risk"];
  const seed = seeds[index % seeds.length];
  const id = `ev-${runId}-${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    runId,
    sourceType: context.sourceType,
    sourceReference: seed.sourceReference,
    title: seed.titleAr,
    titleAr: seed.titleAr,
    summaryAr: seed.summaryAr,
    capturedAt: context.capturedAt,
    capturedByTool: context.capturedByTool,
    capturedBySkill: context.capturedBySkill,
    dataClassification: context.dataClassification,
    provenanceStatus: "SIMULATED_DEMO_SOURCE",
    freshnessStatus: seed.freshness,
    sourceQuality: seed.sourceQuality,
    relevanceScore: seed.sourceQuality === "HIGH" ? 90 : seed.sourceQuality === "MEDIUM" ? 65 : seed.sourceQuality === "LOW" ? 40 : 20,
    integrityStatus: "INTACT",
    // Never auto-accepted — always starts unreviewed regardless of source quality.
    reviewerStatus: "UNREVIEWED",
  };
}

export function evidenceTopicCount(topicKey: string): number {
  return (EVIDENCE_CORPUS[topicKey] ?? EVIDENCE_CORPUS["crm-agent-risk"]).length;
}
