/**
 * Governed Planner. Deterministic, rule-based — no live model call. Builds
 * a fixed, bounded five-step research pipeline (plan → collect evidence →
 * review source quality → analyze governance risk → draft decision packet)
 * using only approved skills and tools, and refuses to plan requests that
 * ask for an official decision, a production approval, a KFSA verdict, an
 * unauthorized write action, or that lack an owner/authority where required.
 */

import type { SkillDefinition, ToolDefinition } from "./types";
import type { ExecutionPlan, GovernedResearchRequest, PlanStep } from "./types";

const FORBIDDEN_REQUEST_PATTERNS: { pattern: RegExp; reasonAr: string }[] = [
  { pattern: /قرار رسمي|official[_ ]?decision/i, reasonAr: "الطلب يطلب إصدار قرار رسمي مباشرةً — غير مسموح لهذا النظام." },
  { pattern: /موافقة إنتاج|production[_ ]?approv/i, reasonAr: "الطلب يطلب موافقة إنتاج مباشرةً — غير مسموح لهذا النظام." },
  { pattern: /حكم\s*kfsa|kfsa[_ ]?verdict/i, reasonAr: "الطلب يطلب إصدار حكم KFSA مباشرةً — يبقى KFSA خارجيًا ولا يُصدره هذا النظام." },
];

function classifyRequest(request: GovernedResearchRequest): string {
  if (request.riskLevel === "high" && request.dataSensitivity === "high") return "بحث مؤسسي عالي الخطورة";
  if (request.requiresWriteAction || request.requiresExternalAccess) return "بحث مؤسسي بحاجة لتكامل موسّع";
  return "بحث مؤسسي محكوم قياسي";
}

/**
 * Picks a fixed local evidence-corpus topic key from the request text. This
 * only selects which deterministic demo evidence set to draw from — it does
 * not perform any live search.
 */
export function inferEvidenceTopic(request: GovernedResearchRequest): string {
  const text = `${request.titleAr} ${request.researchQuestionAr}`;
  if (/CRM|عملاء/i.test(text)) return "crm-agent-risk";
  if (/مورد|vendor/i.test(text)) return "vendor-model-due-diligence";
  if (/مالي|financial/i.test(text)) return "high-risk-financial-recommendation";
  if (/تكرار|loop/i.test(text)) return "loop-demo";
  return "crm-agent-risk";
}

export interface PlannerResult {
  plan: ExecutionPlan | null;
  rejected: boolean;
  rejectionReasonsAr: string[];
}

export function createGovernedPlan(
  request: GovernedResearchRequest,
  availableSkills: SkillDefinition[],
  availableTools: ToolDefinition[]
): PlannerResult {
  const rejectionReasonsAr: string[] = [];

  const text = `${request.titleAr} ${request.researchQuestionAr} ${request.businessPurposeAr}`;
  for (const { pattern, reasonAr } of FORBIDDEN_REQUEST_PATTERNS) {
    if (pattern.test(text)) rejectionReasonsAr.push(reasonAr);
  }

  if (request.requiresWriteAction) {
    const hasApprovedWriteTool = availableTools.some((t) => t.readWriteClass === "WRITE" && t.enabled && t.approvalMode !== "FORBIDDEN");
    if (!hasApprovedWriteTool) {
      rejectionReasonsAr.push("الطلب يتطلب إجراء كتابة، ولا توجد أداة كتابة معتمدة ومفعّلة في سجل الأدوات لهذا الإصدار التجريبي.");
    }
  }

  if (request.riskLevel === "high" && (!request.owner || request.owner.trim().length === 0)) {
    rejectionReasonsAr.push("الطلب عالي الخطورة دون مالك حالة محدد.");
  }

  if ((request.requiresExternalAccess || request.requiresWriteAction) && (!request.authorityHolder || request.authorityHolder.trim().length === 0)) {
    rejectionReasonsAr.push("الطلب يتطلب وصولًا خارجيًا أو إجراء كتابة دون تحديد صاحب صلاحية مؤسسية.");
  }

  if (rejectionReasonsAr.length > 0) {
    return { plan: null, rejected: true, rejectionReasonsAr };
  }

  const pipeline = [
    "institutional-research-planning",
    "evidence-collection",
    "source-quality-review",
    "governance-risk-analysis",
    "decision-packet-drafting",
  ];

  const steps: PlanStep[] = [];
  for (const skillId of pipeline) {
    const skill = availableSkills.find((s) => s.id === skillId);
    if (!skill) continue;
    const toolIds = skill.requiredTools.filter((toolId) => availableTools.some((t) => t.id === toolId && t.enabled));
    steps.push({
      stepId: `step-${steps.length + 1}-${skillId}`,
      objectiveAr: skill.descriptionAr,
      skillId,
      toolIds,
      expectedEvidenceAr: skillId === "evidence-collection" ? "عناصر أدلة موثقة من الأدوات المعتمدة" : "لا ينطبق",
      requiredAuthority: skill.requiredAuthority,
      blockingConditionsAr: skill.requiredAuthority ? ["غياب صاحب الصلاحية المؤسسية المثبت في الطلب"] : [],
      completionConditionAr: `اكتمال مخرجات مهارة "${skill.nameAr}" وتسجيلها في سجل التنفيذ.`,
    });
  }

  const plan: ExecutionPlan = {
    requestId: request.id,
    objectiveAr: `تحليل تمهيدي محكوم للسؤال البحثي: ${request.researchQuestionAr}`,
    classification: classifyRequest(request),
    steps,
    maxSteps: request.maxSteps,
    maxToolCalls: request.maxToolCalls,
    evaluationRequired: true,
    stopConditionsAr: [
      "بلوغ الحد الأقصى للخطوات",
      "بلوغ الحد الأقصى لاستدعاءات الأدوات",
      "رصد نمط تكرار (Loop Detected)",
      "الحاجة لصلاحية مؤسسية غير متوفرة",
      "طلب استخدام أداة ممنوعة",
    ],
    rejectedAr: [],
  };

  return { plan, rejected: false, rejectionReasonsAr: [] };
}
