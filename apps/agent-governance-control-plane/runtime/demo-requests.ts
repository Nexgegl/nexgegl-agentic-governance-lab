/**
 * Deterministic demo request set for the Governed Research Runtime.
 * Fixed IDs and a fixed submittedAt per request keep every derived run
 * (trace timestamps, evidence IDs, tool-call IDs) reproducible across
 * server restarts — no Date.now(), no Math.random() anywhere in the
 * runtime pipeline.
 */

import type { GovernedResearchRequest } from "./types";

export const demoRequests: GovernedResearchRequest[] = [
  {
    id: "run-001",
    titleAr: "تقييم مخاطر اعتماد وكيل ذكاء اصطناعي لتحديث بيانات العملاء",
    researchQuestionAr:
      "حلل مخاطر اعتماد وكيل ذكاء اصطناعي لتحديث بيانات العملاء في CRM، وحدد المخاطر والضوابط المطلوبة قبل عرضه على صاحب الصلاحية.",
    businessPurposeAr: "دعم لجنة الحوكمة بتحليل تمهيدي لمخاطر وضوابط وكيل تحديث بيانات العملاء قبل أي مراجعة اعتماد.",
    department: "Customer Service",
    requester: "Lama Al-Harbi — CS Team Lead",
    owner: "Lama Al-Harbi — CS Team Lead",
    riskLevel: "medium",
    dataSensitivity: "medium",
    requiresExternalAccess: false,
    requiresWriteAction: false,
    authorityHolder: "Customer Service Director",
    maxSteps: 12,
    maxToolCalls: 10,
    submittedAt: "2026-07-10T08:00:00.000Z",
  },
  {
    id: "run-002",
    titleAr: "العناية الواجبة تجاه مورد نموذج ذكاء اصطناعي جديد",
    researchQuestionAr: "راجع مورد نموذج الذكاء الاصطناعي المقترح من حيث إقامة البيانات وممارسات الحوكمة قبل أي تعاقد.",
    businessPurposeAr: "دعم إدارة المشتريات بمراجعة تمهيدية لمخاطر مورد نموذج جديد قبل عرضه على لجنة التعاقد.",
    department: "Operations",
    requester: "Khalid Al-Zahrani — Procurement Manager",
    owner: "Khalid Al-Zahrani — Procurement Manager",
    riskLevel: "medium",
    dataSensitivity: "medium",
    requiresExternalAccess: false,
    requiresWriteAction: false,
    authorityHolder: "Chief Procurement Officer",
    maxSteps: 12,
    maxToolCalls: 10,
    submittedAt: "2026-07-10T09:00:00.000Z",
  },
  {
    id: "run-003",
    titleAr: "طلب توصية مالية عالية الخطورة وغامضة النطاق",
    researchQuestionAr: "قيّم توصية مالية عالية الأثر متعلقة بإعادة تسعير محفظة عملاء دون تحديد واضح لنطاق القرار أو صاحب صلاحيته.",
    businessPurposeAr: "دعم إدارة المالية بتحليل تمهيدي لتوصية مالية عالية الخطورة قبل أي عرض تنفيذي.",
    department: "Finance",
    requester: "Mansour Al-Shehri — Collections Manager",
    owner: "Mansour Al-Shehri — Collections Manager",
    riskLevel: "high",
    dataSensitivity: "high",
    requiresExternalAccess: false,
    requiresWriteAction: false,
    authorityHolder: "",
    maxSteps: 12,
    maxToolCalls: 10,
    submittedAt: "2026-07-10T10:00:00.000Z",
  },
  {
    id: "run-004",
    titleAr: "طلب تحديث مباشر لبيانات العملاء عبر أداة كتابة على CRM",
    researchQuestionAr: "نفّذ تحديثًا مباشرًا لبيانات العملاء في نظام CRM باستخدام أداة كتابة تلقائية دون مراجعة بشرية لكل استدعاء.",
    businessPurposeAr: "طلب تنفيذي (مرفوض) لاختبار رفض النظام لأي إجراء كتابة غير معتمد على أنظمة خارجية.",
    department: "Operations",
    requester: "Turki Al-Anazi — Automation Engineer",
    owner: "Turki Al-Anazi — Automation Engineer",
    riskLevel: "high",
    dataSensitivity: "high",
    requiresExternalAccess: true,
    requiresWriteAction: true,
    authorityHolder: "",
    maxSteps: 12,
    maxToolCalls: 10,
    submittedAt: "2026-07-10T11:00:00.000Z",
  },
  {
    id: "run-005",
    titleAr: "تشغيل تجريبي لاختبار اكتشاف حلقة التكرار",
    researchQuestionAr: "أعد تنفيذ نفس عملية البحث بنمط تكرار (loop) متعمد لاختبار آلية اكتشاف الحلقات وإيقاف التشغيل بأمان.",
    businessPurposeAr: "سيناريو تجريبي داخلي للتحقق من أن أداة التحكم بالحلقات (Loop Controller) توقف التشغيل عند رصد نمط غير منتج.",
    department: "Operations",
    requester: "AI Governance Office",
    owner: "AI Governance Office",
    riskLevel: "low",
    dataSensitivity: "low",
    requiresExternalAccess: false,
    requiresWriteAction: false,
    authorityHolder: "COO Office",
    maxSteps: 12,
    maxToolCalls: 10,
    submittedAt: "2026-07-10T12:00:00.000Z",
  },
];

export function getDemoRequestById(id: string): GovernedResearchRequest | undefined {
  return demoRequests.find((r) => r.id === id);
}

/** Three prefill templates for the "/research-runs/new" form (per spec). */
export const newRunTemplates: { key: string; labelAr: string; request: Omit<GovernedResearchRequest, "id" | "submittedAt"> }[] = [
  { key: "crm-agent", labelAr: "تقييم مخاطر حوكمة وكيل CRM", request: (({ id, submittedAt, ...rest }) => rest)(demoRequests[0]) },
  { key: "vendor-diligence", labelAr: "العناية الواجبة لمورد نموذج", request: (({ id, submittedAt, ...rest }) => rest)(demoRequests[1]) },
  { key: "financial-high-risk", labelAr: "توصية مالية عالية الخطورة", request: (({ id, submittedAt, ...rest }) => rest)(demoRequests[2]) },
];
