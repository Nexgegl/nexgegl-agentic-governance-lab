/**
 * Arabic/English label maps for the Governed Research Runtime's own
 * vocabulary (run status, stop reasons, review outcomes, skill/tool enums).
 */

import type {
  ApprovalMode,
  EvaluationDimension,
  EvidenceReviewerStatus,
  EvidenceSourceQuality,
  ReadWriteClass,
  ReviewOutcome,
  RunStatus,
  SkillActionType,
  SkillReversibility,
  SkillReviewStatus,
  SkillSourceType,
  StopReason,
  ToolType,
  TraceStage,
} from "./types";

const SKILL_ACTION_TYPE_LABELS: Record<SkillActionType, string> = {
  READ: "قراءة",
  ANALYSIS: "تحليل",
  GENERATION: "توليد",
  WRITE: "كتابة",
};

export function getSkillActionTypeLabel(type: SkillActionType): string {
  return SKILL_ACTION_TYPE_LABELS[type];
}

const SKILL_REVERSIBILITY_LABELS: Record<SkillReversibility, string> = {
  REVERSIBLE: "قابلة للتراجع",
  IRREVERSIBLE: "غير قابلة للتراجع",
  NOT_APPLICABLE: "لا ينطبق",
};

export function getSkillReversibilityLabel(reversibility: SkillReversibility): string {
  return SKILL_REVERSIBILITY_LABELS[reversibility];
}

const READ_WRITE_CLASS_LABELS: Record<ReadWriteClass, string> = {
  READ_ONLY: "قراءة فقط",
  WRITE: "كتابة",
};

export function getReadWriteClassLabel(cls: ReadWriteClass): string {
  return READ_WRITE_CLASS_LABELS[cls];
}

const TRACE_STAGE_LABELS: Record<TraceStage, string> = {
  REQUEST_RECEIVED: "استلام الطلب",
  PLAN_CREATED: "إنشاء الخطة",
  SKILL_SELECTED: "اختيار المهارة",
  TOOL_SELECTED: "اختيار الأداة",
  PERMISSION_CHECK: "فحص الصلاحية",
  TOOL_CALL: "استدعاء الأداة",
  RESULT_REFERENCE: "مرجع النتيجة",
  EVIDENCE_CREATED: "إنشاء دليل",
  EVALUATION_RESULT: "نتيجة تقييم",
  GOVERNANCE_FINDING: "نتيجة حوكمة",
  RETRY: "إعادة محاولة",
  STOP: "إيقاف",
  HUMAN_REVIEW_TRANSITION: "انتقال مراجعة بشرية",
};

export function getTraceStageLabel(stage: TraceStage): string {
  return TRACE_STAGE_LABELS[stage];
}

const RUN_STATUS_LABELS: Record<RunStatus, { ar: string; en: string }> = {
  SUBMITTED: { ar: "تم التقديم", en: "Submitted" },
  PLANNING: { ar: "قيد التخطيط", en: "Planning" },
  WAITING_FOR_SKILL_APPROVAL: { ar: "بانتظار اعتماد المهارة", en: "Waiting for Skill Approval" },
  WAITING_FOR_TOOL_APPROVAL: { ar: "بانتظار اعتماد الأداة", en: "Waiting for Tool Approval" },
  EXECUTING: { ar: "قيد التنفيذ", en: "Executing" },
  EVALUATING: { ar: "قيد التقييم", en: "Evaluating" },
  GOVERNANCE_REVIEW_REQUIRED: { ar: "يتطلب مراجعة حوكمة", en: "Governance Review Required" },
  ESCALATE_REQUIRED: { ar: "يتطلب تصعيدًا", en: "Escalation Required" },
  REPAIR_REQUIRED: { ar: "يتطلب إصلاحًا", en: "Repair Required" },
  BLOCKED: { ar: "محظور", en: "Blocked" },
  READY_FOR_AUTHORITY_REVIEW: { ar: "جاهز لمراجعة السلطة المعتمدة", en: "Ready for Authority Review" },
  COMPLETED_WITHOUT_DECISION: { ar: "اكتمل دون قرار مؤسسي", en: "Completed Without Decision" },
  FAILED: { ar: "فشل التشغيل", en: "Failed" },
};

export function getRunStatusLabel(status: RunStatus) {
  return RUN_STATUS_LABELS[status];
}

const RUN_STATUS_CLASSES: Record<RunStatus, string> = {
  SUBMITTED: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  PLANNING: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  WAITING_FOR_SKILL_APPROVAL: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  WAITING_FOR_TOOL_APPROVAL: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  EXECUTING: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  EVALUATING: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  GOVERNANCE_REVIEW_REQUIRED: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  ESCALATE_REQUIRED: "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20",
  REPAIR_REQUIRED: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  BLOCKED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  READY_FOR_AUTHORITY_REVIEW: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  COMPLETED_WITHOUT_DECISION: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  FAILED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

export function getRunStatusClasses(status: RunStatus): string {
  return RUN_STATUS_CLASSES[status];
}

const STOP_REASON_LABELS: Record<StopReason, string> = {
  COMPLETED: "اكتمل بشكل طبيعي",
  MAX_STEPS_REACHED: "بلوغ الحد الأقصى للخطوات",
  MAX_TOOL_CALLS_REACHED: "بلوغ الحد الأقصى لاستدعاءات الأدوات",
  LOOP_DETECTED: "تم رصد حلقة تكرار",
  NO_PROGRESS: "لا يوجد تقدم",
  POLICY_BLOCK: "حظر سياسي",
  AUTHORITY_REQUIRED: "يتطلب صلاحية مؤسسية",
  HUMAN_REVIEW_REQUIRED: "يتطلب مراجعة بشرية",
  EVIDENCE_INSUFFICIENT: "أدلة غير كافية",
  TOOL_FAILURE: "فشل أداة",
};

export function getStopReasonLabel(reason: StopReason): string {
  return STOP_REASON_LABELS[reason];
}

const REVIEW_OUTCOME_LABELS: Record<ReviewOutcome, { ar: string; en: string }> = {
  PASS: { ar: "اجتياز", en: "PASS" },
  FIX: { ar: "يتطلب إصلاحًا", en: "FIX" },
  FAIL: { ar: "فشل", en: "FAIL" },
  ESCALATE: { ar: "تصعيد", en: "ESCALATE" },
};

export function getReviewOutcomeLabel(outcome: ReviewOutcome) {
  return REVIEW_OUTCOME_LABELS[outcome];
}

const REVIEW_OUTCOME_CLASSES: Record<ReviewOutcome, string> = {
  PASS: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  FIX: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  FAIL: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  ESCALATE: "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20",
};

export function getReviewOutcomeClasses(outcome: ReviewOutcome): string {
  return REVIEW_OUTCOME_CLASSES[outcome];
}

const SKILL_REVIEW_STATUS_LABELS: Record<SkillReviewStatus, string> = {
  UNREVIEWED: "غير مراجَعة",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED_FOR_DEMO: "معتمدة للعرض التجريبي",
  REPAIR_REQUIRED: "تتطلب إصلاحًا",
  BLOCKED: "محظورة",
  RETIRED: "متوقفة",
};

export function getSkillReviewStatusLabel(status: SkillReviewStatus): string {
  return SKILL_REVIEW_STATUS_LABELS[status];
}

const SKILL_REVIEW_STATUS_CLASSES: Record<SkillReviewStatus, string> = {
  UNREVIEWED: "bg-neutral-200 text-neutral-700 ring-1 ring-inset ring-neutral-400/40",
  UNDER_REVIEW: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  APPROVED_FOR_DEMO: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  REPAIR_REQUIRED: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  BLOCKED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  RETIRED: "bg-neutral-200 text-neutral-700 ring-1 ring-inset ring-neutral-400/40",
};

export function getSkillReviewStatusClasses(status: SkillReviewStatus): string {
  return SKILL_REVIEW_STATUS_CLASSES[status];
}

const SKILL_SOURCE_TYPE_LABELS: Record<SkillSourceType, string> = {
  INTERNAL: "داخلي",
  OFFICIAL_VENDOR: "مورد رسمي",
  COMMUNITY: "مجتمعي",
  CUSTOM_ADAPTED: "مُكيَّف داخليًا",
};

export function getSkillSourceTypeLabel(type: SkillSourceType): string {
  return SKILL_SOURCE_TYPE_LABELS[type];
}

const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  WEB_SEARCH: "بحث ويب",
  DOCUMENT_RETRIEVAL: "استرجاع مستندات",
  INTERNAL_DATA_LOOKUP: "اطلاع على بيانات داخلية",
  CALCULATOR: "حاسبة",
  REPORT_GENERATOR: "توليد تقارير",
  EXTERNAL_API: "واجهة برمجية خارجية",
  WRITE_ACTION: "إجراء كتابة",
};

export function getToolTypeLabel(type: ToolType): string {
  return TOOL_TYPE_LABELS[type];
}

const APPROVAL_MODE_LABELS: Record<ApprovalMode, string> = {
  NONE: "بدون موافقة",
  PRE_APPROVAL: "موافقة مسبقة",
  PER_CALL_APPROVAL: "موافقة لكل استدعاء",
  HUMAN_CONFIRMATION: "تأكيد بشري",
  FORBIDDEN: "ممنوع",
};

export function getApprovalModeLabel(mode: ApprovalMode): string {
  return APPROVAL_MODE_LABELS[mode];
}

const APPROVAL_MODE_CLASSES: Record<ApprovalMode, string> = {
  NONE: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  PRE_APPROVAL: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  PER_CALL_APPROVAL: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  HUMAN_CONFIRMATION: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  FORBIDDEN: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

export function getApprovalModeClasses(mode: ApprovalMode): string {
  return APPROVAL_MODE_CLASSES[mode];
}

const EVIDENCE_SOURCE_QUALITY_LABELS: Record<EvidenceSourceQuality, string> = {
  HIGH: "عالية",
  MEDIUM: "متوسطة",
  LOW: "منخفضة",
  UNKNOWN: "غير معروفة",
};

export function getEvidenceSourceQualityLabel(quality: EvidenceSourceQuality): string {
  return EVIDENCE_SOURCE_QUALITY_LABELS[quality];
}

const EVIDENCE_REVIEWER_STATUS_LABELS: Record<EvidenceReviewerStatus, string> = {
  UNREVIEWED: "غير مراجَع",
  ACCEPTED_FOR_REVIEW: "مقبول للمراجعة",
  REJECTED: "مرفوض",
  REQUIRES_ESCALATION: "يتطلب تصعيدًا",
};

export function getEvidenceReviewerStatusLabel(status: EvidenceReviewerStatus): string {
  return EVIDENCE_REVIEWER_STATUS_LABELS[status];
}

const EVALUATION_DIMENSION_LABELS: Record<EvaluationDimension, string> = {
  ACCURACY: "الدقة",
  GROUNDING: "الإسناد المرجعي",
  AUTHORITY_SAFETY: "سلامة الصلاحية",
  DATA_SAFETY: "سلامة البيانات",
  ACTION_SAFETY: "سلامة الإجراء",
  AUDITABILITY: "قابلية التدقيق",
  BUSINESS_FIT: "الملاءمة التجارية",
  FAILURE_HANDLING: "التعامل مع الإخفاق",
};

export function getEvaluationDimensionLabel(dimension: EvaluationDimension): string {
  return EVALUATION_DIMENSION_LABELS[dimension];
}
