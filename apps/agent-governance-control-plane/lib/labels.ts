/**
 * Arabic/English label maps for the eight governance layers and the new
 * domain enums introduced for the AI Governance Operating System MVP.
 */

import type {
  AgentStatus,
  DataResidency,
  DataSourceType,
  GovernanceLayer,
  HumanReviewDecision,
  IncidentSeverity,
  IncidentStatus,
  ModelProvider,
  PrivacyControlCategory,
  SecurityControlCategory,
  VendorContractStatus,
  VendorRiskTier,
} from "./types";

export const GOVERNANCE_LAYERS: { key: GovernanceLayer; labelAr: string; labelEn: string; href: string }[] = [
  { key: "ai_inventory", labelAr: "سجل الذكاء الاصطناعي والملكية", labelEn: "AI Inventory & Ownership", href: "/ai-inventory" },
  { key: "data_foundation", labelAr: "الأساس البياني", labelEn: "Data Foundation", href: "/data-sources" },
  { key: "model_lifecycle", labelAr: "دورة حياة النماذج", labelEn: "Model Lifecycle", href: "/models" },
  { key: "data_security_privacy", labelAr: "أمن البيانات والخصوصية", labelEn: "Data Security & Privacy", href: "/security" },
  { key: "access_control", labelAr: "التحكم في الوصول", labelEn: "Access Control", href: "/access-control" },
  { key: "agent_governance", labelAr: "حوكمة الوكلاء", labelEn: "Agent Governance", href: "/agents" },
  { key: "human_oversight", labelAr: "الإشراف البشري", labelEn: "Human Oversight", href: "/oversight" },
  { key: "compliance_audit", labelAr: "الامتثال والتدقيق", labelEn: "Compliance & Audit", href: "/compliance" },
];

export function getGovernanceLayerLabel(layer: GovernanceLayer) {
  return GOVERNANCE_LAYERS.find((l) => l.key === layer)!;
}

const MODEL_PROVIDER_LABELS: Record<ModelProvider, string> = {
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Microsoft: "Microsoft",
  Google: "Google",
  "Open-source": "مفتوح المصدر",
  Internal: "داخلي",
};

export function getModelProviderLabel(provider: ModelProvider): string {
  return MODEL_PROVIDER_LABELS[provider];
}

const DATA_RESIDENCY_LABELS: Record<DataResidency, { en: string; ar: string }> = {
  in_country: { en: "In-Country", ar: "داخل الدولة" },
  regional: { en: "Regional", ar: "إقليمي" },
  unknown: { en: "Unknown", ar: "غير محدد" },
};

export function getDataResidencyLabel(residency: DataResidency) {
  return DATA_RESIDENCY_LABELS[residency];
}

const DATA_SOURCE_TYPE_LABELS: Record<DataSourceType, { en: string; ar: string }> = {
  structured: { en: "Structured", ar: "منظمة" },
  unstructured: { en: "Unstructured", ar: "غير منظمة" },
  document_repository: { en: "Document Repository", ar: "مستودع مستندات" },
  api_feed: { en: "API Feed", ar: "تغذية واجهة برمجية" },
};

export function getDataSourceTypeLabel(type: DataSourceType) {
  return DATA_SOURCE_TYPE_LABELS[type];
}

const VENDOR_RISK_LABELS: Record<VendorRiskTier, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
};

export function getVendorRiskLabel(tier: VendorRiskTier) {
  return VENDOR_RISK_LABELS[tier];
}

const VENDOR_CONTRACT_LABELS: Record<VendorContractStatus, { en: string; ar: string }> = {
  active: { en: "Active", ar: "سارٍ" },
  under_review: { en: "Under Review", ar: "قيد المراجعة" },
  expired: { en: "Expired", ar: "منتهٍ" },
};

export function getVendorContractLabel(status: VendorContractStatus) {
  return VENDOR_CONTRACT_LABELS[status];
}

const SECURITY_CATEGORY_LABELS: Record<SecurityControlCategory, { en: string; ar: string }> = {
  access: { en: "Access", ar: "الوصول" },
  encryption: { en: "Encryption", ar: "التشفير" },
  monitoring: { en: "Monitoring", ar: "المراقبة" },
  network: { en: "Network", ar: "الشبكة" },
  secrets: { en: "Secrets Management", ar: "إدارة الأسرار" },
};

export function getSecurityCategoryLabel(category: SecurityControlCategory) {
  return SECURITY_CATEGORY_LABELS[category];
}

const PRIVACY_CATEGORY_LABELS: Record<PrivacyControlCategory, { en: string; ar: string }> = {
  pii_minimization: { en: "PII Minimization", ar: "تقليل البيانات الشخصية" },
  consent: { en: "Consent", ar: "الموافقة" },
  retention: { en: "Retention", ar: "الاحتفاظ بالبيانات" },
  anonymization: { en: "Anonymization", ar: "إخفاء الهوية" },
};

export function getPrivacyCategoryLabel(category: PrivacyControlCategory) {
  return PRIVACY_CATEGORY_LABELS[category];
}

const AGENT_STATUS_LABELS: Record<AgentStatus, { en: string; ar: string }> = {
  active: { en: "Active", ar: "نشط" },
  suspended: { en: "Suspended", ar: "معلّق" },
  under_review: { en: "Under Review", ar: "قيد المراجعة" },
};

export function getAgentStatusLabel(status: AgentStatus) {
  return AGENT_STATUS_LABELS[status];
}

const AGENT_STATUS_CLASSES: Record<AgentStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  suspended: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  under_review: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
};

export function getAgentStatusClasses(status: AgentStatus): string {
  return AGENT_STATUS_CLASSES[status];
}

const HUMAN_REVIEW_DECISION_LABELS: Record<HumanReviewDecision, { en: string; ar: string }> = {
  approved_for_next_stage: { en: "Approved for Next Stage", ar: "معتمدة للمرحلة التالية" },
  returned_for_repair: { en: "Returned for Repair", ar: "أعيدت للإصلاح" },
  escalated: { en: "Escalated", ar: "مُصعَّدة" },
};

export function getHumanReviewDecisionLabel(decision: HumanReviewDecision) {
  return HUMAN_REVIEW_DECISION_LABELS[decision];
}

const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
};

export function getIncidentSeverityLabel(severity: IncidentSeverity) {
  return INCIDENT_SEVERITY_LABELS[severity];
}

const INCIDENT_STATUS_LABELS: Record<IncidentStatus, { en: string; ar: string }> = {
  open: { en: "Open", ar: "مفتوحة" },
  investigating: { en: "Investigating", ar: "قيد التحقيق" },
  resolved: { en: "Resolved", ar: "تم الحل" },
};

export function getIncidentStatusLabel(status: IncidentStatus) {
  return INCIDENT_STATUS_LABELS[status];
}

const INCIDENT_STATUS_CLASSES: Record<IncidentStatus, string> = {
  open: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  investigating: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  resolved: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
};

export function getIncidentStatusClasses(status: IncidentStatus): string {
  return INCIDENT_STATUS_CLASSES[status];
}
