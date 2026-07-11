/**
 * Frontend-only governance model for the Agent Governance Control Plane MVP.
 *
 * This mirrors the vocabulary of Governance Lab v0.4's reference
 * implementations (gate statuses, review outcomes, risk/sensitivity levels,
 * evidence/authority statuses) for product-demo purposes only. It does not
 * call, import, or replace any reference implementation in
 * claude-operating-system/08-ai-governance-adoption-os/reference-implementations/.
 *
 * This is a product demo with mock data. It does not approve production,
 * does not create an official decision, and does not generate a KFSA
 * verdict. production_approval_status is always false conceptually — no
 * screen in this app ever claims production approval.
 */

export type GateStatus =
  | "BLOCKED"
  | "REPAIR_REQUIRED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED"
  | "READY_FOR_AUTHORITY_REVIEW";

export type RiskLevel = "low" | "medium" | "high";

export type DataSensitivity = "low" | "medium" | "high";

export type ToolAccessLevel = "none" | "read_only" | "write" | "external_system";

export type EvidenceStatus = "complete" | "partial" | "missing";

export type AuthorityStatus = "confirmed" | "missing" | "escalation_required";

export type Department =
  | "Finance"
  | "Sales"
  | "HR"
  | "Legal"
  | "Operations"
  | "Customer Service"
  | "Executive Office";

export type PermissionColumn =
  | "read_internal_docs"
  | "read_customer_data"
  | "read_crm"
  | "update_crm"
  | "send_email"
  | "export_data"
  | "trigger_workflow"
  | "external_api_access";

export type PermissionCellStatus = "allowed" | "requires_approval" | "blocked" | "forbidden";

export interface EvidenceDetail {
  owner_evidence: boolean;
  authority_evidence: boolean;
  eval_evidence: boolean;
  audit_evidence: boolean;
  policy_boundary_evidence: boolean;
  approval_evidence: boolean;
}

export interface TimelineEvent {
  date: string;
  event: string;
  actor: string;
}

export interface UseCase {
  id: string;
  name: string;
  nameAr: string;
  department: Department;
  owner: string;
  authority: string;
  aiType: string;
  businessPurpose: string;
  riskLevel: RiskLevel;
  dataSensitivity: DataSensitivity;
  toolAccess: ToolAccessLevel;
  externalSystems: string[];
  writeTools: string[];
  readOnlyTools: string[];
  governanceStatus: GateStatus;
  evalScore: number;
  evalOutcome: "PASS" | "FIX" | "FAIL" | "ESCALATE";
  readinessScore: number;
  evidenceStatus: EvidenceStatus;
  authorityStatus: AuthorityStatus;
  evidenceDetail: EvidenceDetail;
  permissions: Record<PermissionColumn, PermissionCellStatus>;
  lastReviewed: string;
  auditTrailStatus: "present" | "partial" | "missing";
  connectedSystems: string[];
  timeline: TimelineEvent[];
}

export const PERMISSION_COLUMNS: { key: PermissionColumn; labelEn: string; labelAr: string }[] = [
  { key: "read_internal_docs", labelEn: "Read Internal Docs", labelAr: "قراءة المستندات الداخلية" },
  { key: "read_customer_data", labelEn: "Read Customer Data", labelAr: "قراءة بيانات العملاء" },
  { key: "read_crm", labelEn: "Read CRM", labelAr: "قراءة نظام العملاء" },
  { key: "update_crm", labelEn: "Update CRM", labelAr: "تحديث نظام العملاء" },
  { key: "send_email", labelEn: "Send Email", labelAr: "إرسال بريد إلكتروني" },
  { key: "export_data", labelEn: "Export Data", labelAr: "تصدير البيانات" },
  { key: "trigger_workflow", labelEn: "Trigger Workflow", labelAr: "تشغيل سير عمل" },
  { key: "external_api_access", labelEn: "External API Access", labelAr: "الوصول لواجهة خارجية" },
];

// Ordered by governance severity priority (FAIL > ESCALATE > FIX > PASS),
// matching the Governance Gate decision priority. Used by both the Gate
// Board (columns) and the Dashboard (status distribution) so the two views
// stay consistent with each other.
export const GATE_STATUS_ORDER: GateStatus[] = [
  "BLOCKED",
  "ESCALATE_REQUIRED",
  "REPAIR_REQUIRED",
  "GOVERNANCE_REVIEW_REQUIRED",
  "READY_FOR_AUTHORITY_REVIEW",
];

const GATE_STATUS_LABELS: Record<GateStatus, { en: string; ar: string }> = {
  BLOCKED: { en: "Blocked", ar: "محظور" },
  REPAIR_REQUIRED: { en: "Repair Required", ar: "يتطلب إصلاحًا" },
  GOVERNANCE_REVIEW_REQUIRED: { en: "Governance Review Required", ar: "يتطلب مراجعة حوكمة" },
  ESCALATE_REQUIRED: { en: "Escalation Required", ar: "يتطلب تصعيدًا" },
  READY_FOR_AUTHORITY_REVIEW: { en: "Ready for Authority Review", ar: "جاهز لمراجعة السلطة المعتمدة" },
};

export function getGateStatusLabel(status: GateStatus): { en: string; ar: string } {
  return GATE_STATUS_LABELS[status];
}

const GATE_STATUS_CLASSES: Record<GateStatus, string> = {
  BLOCKED: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  REPAIR_REQUIRED: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  GOVERNANCE_REVIEW_REQUIRED: "bg-navy-100 text-navy-800 ring-1 ring-inset ring-navy-600/20",
  ESCALATE_REQUIRED: "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20",
  READY_FOR_AUTHORITY_REVIEW: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
};

export function getGateStatusClasses(status: GateStatus): string {
  return GATE_STATUS_CLASSES[status];
}

const RISK_LABELS: Record<RiskLevel, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
};

export function getRiskLabel(risk: RiskLevel): { en: string; ar: string } {
  return RISK_LABELS[risk];
}

const RISK_CLASSES: Record<RiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  medium: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  high: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

export function getRiskClasses(risk: RiskLevel): string {
  return RISK_CLASSES[risk];
}

const SENSITIVITY_LABELS: Record<DataSensitivity, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
};

export function getSensitivityLabel(sensitivity: DataSensitivity): { en: string; ar: string } {
  return SENSITIVITY_LABELS[sensitivity];
}

const TOOL_ACCESS_LABELS: Record<ToolAccessLevel, { en: string; ar: string }> = {
  none: { en: "None", ar: "بدون" },
  read_only: { en: "Read Only", ar: "قراءة فقط" },
  write: { en: "Write", ar: "كتابة" },
  external_system: { en: "External System", ar: "نظام خارجي" },
};

export function getToolAccessLabel(level: ToolAccessLevel): { en: string; ar: string } {
  return TOOL_ACCESS_LABELS[level];
}

const EVIDENCE_LABELS: Record<EvidenceStatus, { en: string; ar: string }> = {
  complete: { en: "Complete", ar: "مكتملة" },
  partial: { en: "Partial", ar: "جزئية" },
  missing: { en: "Missing", ar: "ناقصة" },
};

export function getEvidenceLabel(status: EvidenceStatus): { en: string; ar: string } {
  return EVIDENCE_LABELS[status];
}

const EVIDENCE_CLASSES: Record<EvidenceStatus, string> = {
  complete: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  partial: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  missing: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
};

export function getEvidenceClasses(status: EvidenceStatus): string {
  return EVIDENCE_CLASSES[status];
}

const AUTHORITY_LABELS: Record<AuthorityStatus, { en: string; ar: string }> = {
  confirmed: { en: "Confirmed", ar: "مؤكدة" },
  missing: { en: "Missing", ar: "غير موجودة" },
  escalation_required: { en: "Escalation Required", ar: "تتطلب تصعيدًا" },
};

export function getAuthorityLabel(status: AuthorityStatus): { en: string; ar: string } {
  return AUTHORITY_LABELS[status];
}

const AUTHORITY_CLASSES: Record<AuthorityStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  missing: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  escalation_required: "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-600/20",
};

export function getAuthorityClasses(status: AuthorityStatus): string {
  return AUTHORITY_CLASSES[status];
}

const PERMISSION_CELL_LABELS: Record<PermissionCellStatus, { en: string; ar: string }> = {
  allowed: { en: "Allowed", ar: "مسموح" },
  requires_approval: { en: "Requires Approval", ar: "يتطلب موافقة" },
  blocked: { en: "Blocked", ar: "محظور مؤقتًا" },
  forbidden: { en: "Forbidden", ar: "ممنوع" },
};

export function getPermissionCellLabel(status: PermissionCellStatus): { en: string; ar: string } {
  return PERMISSION_CELL_LABELS[status];
}

const PERMISSION_CELL_CLASSES: Record<PermissionCellStatus, string> = {
  allowed: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  requires_approval: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  blocked: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  forbidden: "bg-neutral-200 text-neutral-600 ring-1 ring-inset ring-neutral-400/40",
};

export function getPermissionCellClasses(status: PermissionCellStatus): string {
  return PERMISSION_CELL_CLASSES[status];
}

export interface KpiSet {
  totalUseCases: number;
  activeAgents: number;
  highRiskUseCases: number;
  blockedCases: number;
  missingAuthorityCases: number;
  missingEvidenceCases: number;
  externalSystemAgents: number;
  writeCapableAgents: number;
}

export function computeKpis(useCases: UseCase[]): KpiSet {
  return {
    totalUseCases: useCases.length,
    activeAgents: useCases.filter((u) => u.toolAccess !== "none").length,
    highRiskUseCases: useCases.filter((u) => u.riskLevel === "high").length,
    blockedCases: useCases.filter((u) => u.governanceStatus === "BLOCKED").length,
    missingAuthorityCases: useCases.filter((u) => u.authorityStatus === "missing").length,
    missingEvidenceCases: useCases.filter((u) => u.evidenceStatus === "missing").length,
    externalSystemAgents: useCases.filter((u) => u.toolAccess === "external_system").length,
    writeCapableAgents: useCases.filter((u) => u.toolAccess === "write" || u.toolAccess === "external_system")
      .length,
  };
}

export function computeStatusDistribution(useCases: UseCase[]): { status: GateStatus; count: number }[] {
  return GATE_STATUS_ORDER.map((status) => ({
    status,
    count: useCases.filter((u) => u.governanceStatus === status).length,
  }));
}

export function computeRiskDistribution(useCases: UseCase[]): { risk: RiskLevel; count: number }[] {
  const levels: RiskLevel[] = ["low", "medium", "high"];
  return levels.map((risk) => ({ risk, count: useCases.filter((u) => u.riskLevel === risk).length }));
}

const URGENCY_WEIGHT: Record<GateStatus, number> = {
  BLOCKED: 4,
  ESCALATE_REQUIRED: 3,
  REPAIR_REQUIRED: 2,
  GOVERNANCE_REVIEW_REQUIRED: 1,
  READY_FOR_AUTHORITY_REVIEW: 0,
};

const RISK_WEIGHT: Record<RiskLevel, number> = { high: 2, medium: 1, low: 0 };

export function computeUrgentItems(useCases: UseCase[], limit = 5): UseCase[] {
  return [...useCases]
    .sort((a, b) => {
      const scoreA = URGENCY_WEIGHT[a.governanceStatus] * 10 + RISK_WEIGHT[a.riskLevel];
      const scoreB = URGENCY_WEIGHT[b.governanceStatus] * 10 + RISK_WEIGHT[b.riskLevel];
      return scoreB - scoreA;
    })
    .filter((u) => u.governanceStatus !== "READY_FOR_AUTHORITY_REVIEW")
    .slice(0, limit);
}

export function computeMissingControls(useCase: UseCase): string[] {
  const missing: string[] = [];
  const d = useCase.evidenceDetail;
  if (!d.owner_evidence) missing.push("دليل المالك غير مكتمل");
  if (!d.authority_evidence) missing.push("دليل السلطة غير مكتمل");
  if (!d.eval_evidence) missing.push("دليل التقييم غير مكتمل");
  if (!d.audit_evidence) missing.push("دليل التدقيق غير مكتمل");
  if (!d.policy_boundary_evidence) missing.push("حدود السياسة والصلاحيات غير مكتملة");
  if (!d.approval_evidence) missing.push("دليل الموافقة غير مكتمل");
  if (useCase.authorityStatus === "missing") missing.push("الصلاحية غير مثبتة");
  if (useCase.authorityStatus === "escalation_required") missing.push("مراجعة السلطة المؤسسية مطلوبة");
  return missing;
}

export function computeNextAction(useCase: UseCase): string {
  switch (useCase.governanceStatus) {
    case "BLOCKED":
      return "أعد الحالة إلى المالك لإغلاق العوائق قبل أي مراجعة لاحقة";
    case "REPAIR_REQUIRED":
      return "أكمل النواقص ثم أعد التقييم";
    case "GOVERNANCE_REVIEW_REQUIRED":
      return "التوجيه إلى لجنة مراجعة الحوكمة";
    case "ESCALATE_REQUIRED":
      return "تصعيد إلى صاحب الصلاحية المؤسسية المعتمدة";
    case "READY_FOR_AUTHORITY_REVIEW":
      return "العرض على صاحب الصلاحية المعتمدة للمراجعة";
    default:
      return "مراجعة حالة الاستخدام";
  }
}

export function computeEvidenceCompleteness(useCase: UseCase): number {
  const d = useCase.evidenceDetail;
  const items = [
    d.owner_evidence,
    d.authority_evidence,
    d.eval_evidence,
    d.audit_evidence,
    d.policy_boundary_evidence,
    d.approval_evidence,
  ];
  const present = items.filter(Boolean).length;
  return Math.round((present / items.length) * 100);
}

/**
 * A short, distinct Arabic governance summary sentence — status, risk,
 * evidence, authority, and whether the case can move to authority review.
 * Deliberately separate from the use case's business-purpose description so
 * the Decision Packet's Executive Summary and Business Purpose sections
 * never repeat the same paragraph.
 */
export function computeExecutiveSummary(useCase: UseCase): string {
  const statusLabel = getGateStatusLabel(useCase.governanceStatus).ar;
  const riskLabel = getRiskLabel(useCase.riskLevel).ar;
  const evidenceLabel = getEvidenceLabel(useCase.evidenceStatus).ar;
  const authorityLabel = getAuthorityLabel(useCase.authorityStatus).ar;
  const movementNote =
    useCase.governanceStatus === "READY_FOR_AUTHORITY_REVIEW"
      ? "يمكن عرض هذه الحالة على صاحب الصلاحية المعتمدة للمراجعة."
      : "لا يمكن عرض هذه الحالة على صاحب الصلاحية المعتمدة في وضعها الحالي.";
  return `حالة الحوكمة: ${statusLabel}. مستوى الخطورة: ${riskLabel}. حالة الأدلة: ${evidenceLabel}. حالة السلطة المعتمدة: ${authorityLabel}. ${movementNote}`;
}

export interface DecisionPacketSummary {
  useCase: UseCase;
  executiveSummary: string;
  missingControls: string[];
  nextAction: string;
  evidenceCompleteness: number;
  recommendedExecutiveAction: string;
}

export function computeDecisionPacketSummary(useCase: UseCase): DecisionPacketSummary {
  const missingControls = computeMissingControls(useCase);
  const evidenceCompleteness = computeEvidenceCompleteness(useCase);

  let recommendedExecutiveAction: string;
  if (useCase.governanceStatus === "BLOCKED") {
    recommendedExecutiveAction = "لا تنتقل للمراجعة. أعد الحالة إلى المالك لإغلاق العوائق قبل أي خطوة لاحقة.";
  } else if (useCase.governanceStatus === "ESCALATE_REQUIRED") {
    recommendedExecutiveAction = "تصعيد مطلوب. تحتاج الحالة إلى مراجعة حوكمة بشرية.";
  } else if (useCase.governanceStatus === "REPAIR_REQUIRED") {
    recommendedExecutiveAction = "إصلاح مطلوب. أكمل النواقص ثم أعد التقييم.";
  } else if (useCase.governanceStatus === "GOVERNANCE_REVIEW_REQUIRED") {
    recommendedExecutiveAction = "مراجعة حوكمة مطلوبة قبل العرض على صاحب الصلاحية.";
  } else {
    recommendedExecutiveAction = "جاهز للمراجعة من صاحب الصلاحية، ولا يعني ذلك موافقة إنتاج.";
  }

  return {
    useCase,
    executiveSummary: computeExecutiveSummary(useCase),
    missingControls,
    nextAction: computeNextAction(useCase),
    evidenceCompleteness,
    recommendedExecutiveAction,
  };
}

export const BOUNDARY_NOTE_AR =
  "هذه المنصة لا تصدر موافقة إنتاج، ولا تنشئ قرارًا رسميًا، ولا تنتج حكم KFSA. جميع المخرجات تمهيدية وتحتاج سلطة مؤسسية معتمدة.";

export const BOUNDARY_NOTE_EN =
  "This platform does not issue production approval, does not create an official decision, and does not generate a KFSA verdict. All outputs are preliminary and require an authorized institutional authority.";
