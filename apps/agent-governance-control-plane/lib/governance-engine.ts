/**
 * Cross-layer governance engine for the NEXGEGL AI Governance Operating
 * System MVP. Deterministic, pure functions over mock data only — no
 * network calls, no persistence. Reuses the existing Governance Gate
 * vocabulary (FAIL > ESCALATE > FIX > PASS priority) from governance-model.ts
 * for any status derived across layers.
 */

import {
  PERMISSION_COLUMNS,
  computeMissingControls,
  computeNextAction,
  getAuthorityLabel,
  getGateStatusLabel,
  getLifecycleStageLabel,
  getRiskLabel,
  getToolAccessLabel,
  type EvidenceStatus,
  type GateStatus,
  type UseCase,
} from "./governance-model";
import type {
  Agent,
  AuditEvent,
  ComplianceMapping,
  DataSource,
  GovernanceLayer,
  HumanReview,
  IncidentRecord,
  ModelRecord,
  PrivacyControl,
  SecurityControl,
  VendorRecord,
} from "./types";
import { getHumanReviewDecisionLabel, getModelProviderLabel } from "./labels";

function statusScore(status: EvidenceStatus): number {
  if (status === "complete") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function averagePercent(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100);
}

export function computeDataGovernancePosture(sources: DataSource[]): {
  readinessPercent: number;
  missingClassification: number;
  totalSources: number;
} {
  return {
    readinessPercent: averagePercent(sources.map((s) => statusScore(s.classificationStatus))),
    missingClassification: sources.filter((s) => s.classificationStatus === "missing").length,
    totalSources: sources.length,
  };
}

export function computeModelLifecyclePosture(models: ModelRecord[]): {
  readinessPercent: number;
  unreviewedModels: number;
  highRiskModels: number;
  totalModels: number;
} {
  return {
    readinessPercent: averagePercent(models.map((m) => statusScore(m.evaluationStatus))),
    unreviewedModels: models.filter((m) => m.evaluationStatus === "missing").length,
    highRiskModels: models.filter((m) => m.riskTier === "high").length,
    totalModels: models.length,
  };
}

export function computeSecurityPosture(
  security: SecurityControl[],
  privacy: PrivacyControl[]
): {
  readinessPercent: number;
  missingSecurityControls: number;
  missingPrivacyControls: number;
} {
  const scores = [...security.map((s) => statusScore(s.status)), ...privacy.map((p) => statusScore(p.status))];
  return {
    readinessPercent: averagePercent(scores),
    missingSecurityControls: security.filter((s) => s.status === "missing").length,
    missingPrivacyControls: privacy.filter((p) => p.status === "missing").length,
  };
}

export function computeAgentGovernancePosture(agents: Agent[]): {
  readinessPercent: number;
  activeAgents: number;
  underReviewAgents: number;
  suspendedAgents: number;
} {
  const total = agents.length || 1;
  const active = agents.filter((a) => a.status === "active").length;
  return {
    readinessPercent: Math.round((active / total) * 100),
    activeAgents: active,
    underReviewAgents: agents.filter((a) => a.status === "under_review").length,
    suspendedAgents: agents.filter((a) => a.status === "suspended").length,
  };
}

export function computeComplianceReadiness(mappings: ComplianceMapping[]): {
  readinessPercent: number;
  missingRequirements: number;
  totalRequirements: number;
} {
  return {
    readinessPercent: averagePercent(mappings.map((m) => statusScore(m.status))),
    missingRequirements: mappings.filter((m) => m.status === "missing").length,
    totalRequirements: mappings.length,
  };
}

export function computeAuditEventsForAsset(events: AuditEvent[], assetId: string): AuditEvent[] {
  return events
    .filter((e) => e.assetId === assetId)
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export interface LayerCoverage {
  layer: GovernanceLayer;
  readinessPercent: number;
}

export function computeLayerReadiness(input: {
  useCases: UseCase[];
  dataSources: DataSource[];
  models: ModelRecord[];
  securityControls: SecurityControl[];
  privacyControls: PrivacyControl[];
  agents: Agent[];
  humanReviews: HumanReview[];
  incidents: IncidentRecord[];
  complianceMappings: ComplianceMapping[];
}): LayerCoverage[] {
  const inventoryReadiness = averagePercent(input.useCases.map((u) => statusScore(u.evidenceStatus)));
  const dataFoundation = computeDataGovernancePosture(input.dataSources).readinessPercent;
  const modelLifecycle = computeModelLifecyclePosture(input.models).readinessPercent;
  const security = computeSecurityPosture(input.securityControls, input.privacyControls).readinessPercent;
  const accessControl = averagePercent(
    input.useCases.map((u) => (u.evidenceDetail.policy_boundary_evidence ? 1 : 0))
  );
  const agentGovernance = computeAgentGovernancePosture(input.agents).readinessPercent;
  const oversight = averagePercent(
    input.humanReviews.map((r) => (r.decision === "approved_for_next_stage" ? 1 : r.decision === "escalated" ? 0.5 : 0))
  );
  const compliance = computeComplianceReadiness(input.complianceMappings).readinessPercent;

  return [
    { layer: "ai_inventory", readinessPercent: inventoryReadiness },
    { layer: "data_foundation", readinessPercent: dataFoundation },
    { layer: "model_lifecycle", readinessPercent: modelLifecycle },
    { layer: "data_security_privacy", readinessPercent: security },
    { layer: "access_control", readinessPercent: accessControl },
    { layer: "agent_governance", readinessPercent: agentGovernance },
    { layer: "human_oversight", readinessPercent: oversight },
    { layer: "compliance_audit", readinessPercent: compliance },
  ];
}

export type LayerSeverity = "ok" | "warning" | "critical";

export interface DecisionPacketLayer {
  layer: GovernanceLayer;
  severity: LayerSeverity;
  findingAr: string;
  missingControlAr: string;
  nextActionAr?: string;
  details: { labelAr: string; valueAr: string }[];
}

const NO_CRITICAL_GAP_AR = "لا توجد فجوة حرجة";

function gateStatusSeverity(status: GateStatus): LayerSeverity {
  if (status === "BLOCKED" || status === "ESCALATE_REQUIRED") return "critical";
  if (status === "REPAIR_REQUIRED" || status === "GOVERNANCE_REVIEW_REQUIRED") return "warning";
  return "ok";
}

/**
 * Builds one concise, executive-readable snapshot per governance layer for a
 * single AI asset, for the Decision Packet. Every fact is derived from real
 * mock data — no fabricated approvals, no live-monitoring claims. Where the
 * current data model does not track a requested sub-item (e.g. model drift,
 * injection defense, consent/licensing basis), that gap is disclosed as an
 * honest "not yet tracked in this MVP" finding rather than invented.
 */
export function computeDecisionPacketLayers(
  useCase: UseCase,
  ctx: {
    agents: Agent[];
    models: ModelRecord[];
    vendors: VendorRecord[];
    dataSources: DataSource[];
    securityControls: SecurityControl[];
    privacyControls: PrivacyControl[];
    humanReviews: HumanReview[];
    incidents: IncidentRecord[];
    complianceMappings: ComplianceMapping[];
    auditEvents: AuditEvent[];
  }
): DecisionPacketLayer[] {
  const linkedAgents = ctx.agents.filter((a) => useCase.agentIds.includes(a.id));
  const linkedModel = ctx.models.find((m) => m.id === useCase.modelId);
  const linkedVendor = ctx.vendors.find((v) => v.id === useCase.vendorId);
  const linkedDataSources = ctx.dataSources.filter((d) => useCase.dataSourceIds.includes(d.id));
  const linkedSecurity = ctx.securityControls.filter((c) => c.appliesToAssetIds.includes(useCase.id));
  const linkedPrivacy = ctx.privacyControls.filter((c) => c.appliesToAssetIds.includes(useCase.id));
  const assetReviews = ctx.humanReviews
    .filter((r) => r.assetId === useCase.id)
    .slice()
    .sort((a, b) => (a.reviewDate < b.reviewDate ? 1 : -1));
  const latestReview = assetReviews[0];
  const openIncidents = ctx.incidents.filter((i) => i.assetId === useCase.id && i.status !== "resolved");
  const assetAuditEvents = computeAuditEventsForAsset(ctx.auditEvents, useCase.id).slice(0, 3);
  const missingControls = computeMissingControls(useCase);
  const complianceReadiness = computeComplianceReadiness(ctx.complianceMappings);

  const layers: DecisionPacketLayer[] = [];

  // 1. AI Inventory & Ownership
  layers.push({
    layer: "ai_inventory",
    severity: gateStatusSeverity(useCase.governanceStatus),
    findingAr: `التصنيف: ${useCase.aiType}. الإدارة: ${useCase.department}. المالك: ${useCase.owner}.`,
    missingControlAr: missingControls.length > 0 ? missingControls.join("، ") : NO_CRITICAL_GAP_AR,
    nextActionAr: computeNextAction(useCase),
    details: [
      { labelAr: "حالة الحوكمة", valueAr: getGateStatusLabel(useCase.governanceStatus).ar },
      { labelAr: "مستوى الخطورة", valueAr: getRiskLabel(useCase.riskLevel).ar },
      { labelAr: "مرحلة دورة الحياة", valueAr: getLifecycleStageLabel(useCase.lifecycleStage).ar },
    ],
  });

  // 2. Data Foundation
  {
    const missingClassification = linkedDataSources.filter((d) => d.classificationStatus === "missing");
    const partialClassification = linkedDataSources.filter((d) => d.classificationStatus === "partial");
    const severity: LayerSeverity =
      linkedDataSources.length === 0
        ? "warning"
        : missingClassification.length > 0
          ? "critical"
          : partialClassification.length > 0
            ? "warning"
            : "ok";
    layers.push({
      layer: "data_foundation",
      severity,
      findingAr:
        linkedDataSources.length === 0
          ? "لا توجد مصادر بيانات مرتبطة بهذا الأصل."
          : `عدد مصادر البيانات المرتبطة: ${linkedDataSources.length}. الحساسية: ${linkedDataSources.map((d) => d.sensitivity).includes("high") ? "تتضمن حساسية عالية" : "منخفضة إلى متوسطة"}.`,
      missingControlAr:
        missingClassification.length > 0
          ? `تصنيف ناقص لـ: ${missingClassification.map((d) => d.nameAr).join("، ")}`
          : partialClassification.length > 0
            ? `تصنيف جزئي لـ: ${partialClassification.map((d) => d.nameAr).join("، ")}`
            : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "مصادر البيانات", valueAr: linkedDataSources.map((d) => d.nameAr).join("، ") || "لا يوجد" },
        { labelAr: "سجلات تتبع التدفق (Lineage)", valueAr: `${linkedDataSources.length > 0 ? "متوفرة" : "غير متوفرة"}` },
        { labelAr: "أساس الترخيص/الموافقة", valueAr: "غير مُتتبَّع في هذا الإصدار التجريبي" },
      ],
    });
  }

  // 3. Model Lifecycle
  {
    const severity: LayerSeverity = !linkedModel
      ? "warning"
      : linkedModel.evaluationStatus === "missing"
        ? "critical"
        : linkedModel.evaluationStatus === "partial"
          ? "warning"
          : "ok";
    layers.push({
      layer: "model_lifecycle",
      severity,
      findingAr: linkedModel
        ? `النموذج: ${linkedModel.name} (${getModelProviderLabel(linkedModel.provider)} · ${linkedModel.version}).`
        : "لا يوجد نموذج مرتبط مسجل لهذا الأصل.",
      missingControlAr: !linkedModel
        ? "لا يوجد نموذج مسجل"
        : linkedModel.evaluationStatus !== "complete"
          ? "تقييم النموذج غير مكتمل"
          : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "المورد", valueAr: linkedVendor?.nameAr ?? "لا يوجد" },
        { labelAr: "موافقة الإنتاج", valueAr: "غير معتمد دائمًا" },
        { labelAr: "الإنصاف / الانحراف / جاهزية التراجع", valueAr: "غير مُتتبَّع في هذا الإصدار التجريبي" },
      ],
    });
  }

  // 4. Data Security & Privacy
  {
    const allControls = [...linkedSecurity, ...linkedPrivacy];
    const missing = allControls.filter((c) => c.status === "missing");
    const partial = allControls.filter((c) => c.status === "partial");
    const severity: LayerSeverity =
      allControls.length === 0 ? "warning" : missing.length > 0 ? "critical" : partial.length > 0 ? "warning" : "ok";
    layers.push({
      layer: "data_security_privacy",
      severity,
      findingAr:
        allControls.length === 0
          ? "لا توجد ضوابط أمن أو خصوصية مخصصة مسجلة لهذا الأصل."
          : `عدد الضوابط المطبقة: ${allControls.length} (مكتملة: ${allControls.filter((c) => c.status === "complete").length}).`,
      missingControlAr:
        missing.length > 0
          ? `ضوابط ناقصة: ${missing.map((c) => c.nameAr).join("، ")}`
          : partial.length > 0
            ? `ضوابط جزئية: ${partial.map((c) => c.nameAr).join("، ")}`
            : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "التشفير وسجلات المراقبة", valueAr: linkedSecurity.map((c) => c.nameAr).join("، ") || "لا يوجد ضابط مخصص" },
        { labelAr: "تقليل البيانات الشخصية والإخفاء", valueAr: linkedPrivacy.map((c) => c.nameAr).join("، ") || "لا يوجد ضابط مخصص" },
        { labelAr: "دفاع الحقن (Prompt Injection)", valueAr: "غير مُتتبَّع في هذا الإصدار التجريبي" },
      ],
    });
  }

  // 5. Access Control
  {
    const approvalRequired = PERMISSION_COLUMNS.filter((col) => useCase.permissions[col.key] === "requires_approval");
    const leastPrivilegeDocumented = useCase.evidenceDetail.policy_boundary_evidence;
    layers.push({
      layer: "access_control",
      severity: leastPrivilegeDocumented ? "ok" : "warning",
      findingAr: `صلاحية الوصول للأدوات: ${getToolAccessLabel(useCase.toolAccess).ar}. السلطة المطلوبة: ${useCase.authority}.`,
      missingControlAr: leastPrivilegeDocumented ? NO_CRITICAL_GAP_AR : "حدود السياسة والصلاحيات غير موثقة (مبدأ الحد الأدنى من الصلاحيات)",
      details: [
        { labelAr: "حالة الحد الأدنى من الصلاحيات", valueAr: leastPrivilegeDocumented ? "موثقة" : "غير موثقة" },
        {
          labelAr: "صلاحيات تتطلب موافقة",
          valueAr: approvalRequired.length > 0 ? approvalRequired.map((c) => c.labelAr).join("، ") : "لا يوجد",
        },
      ],
    });
  }

  // 6. Agent Governance
  {
    const isAgentEligible = useCase.toolAccess === "write" || useCase.toolAccess === "external_system";
    const missingAgentRecord = isAgentEligible && linkedAgents.length === 0;
    const approvalRule = PERMISSION_COLUMNS.some((col) => useCase.permissions[col.key] === "requires_approval")
      ? "يتطلب موافقة بشرية على إجراءات محددة"
      : "لا يوجد شرط موافقة موثق";
    const severity: LayerSeverity = missingAgentRecord
      ? "critical"
      : linkedAgents.some((a) => a.status === "under_review")
        ? "warning"
        : "ok";
    layers.push({
      layer: "agent_governance",
      severity,
      findingAr:
        linkedAgents.length > 0
          ? `الوكيل المرتبط: ${linkedAgents.map((a) => a.nameAr).join("، ")}.`
          : missingAgentRecord
            ? "لا يوجد وكيل مسجّل رسميًا في حوكمة الوكلاء لهذا الأصل رغم امتلاكه صلاحية أدوات."
            : "لا ينطبق — هذا الأصل لا يمتلك صلاحية أدوات تستدعي وكيلًا مسجَّلًا.",
      missingControlAr: missingAgentRecord
        ? "الأصل يمتلك صلاحية أدوات دون وكيل مسجّل رسميًا في حوكمة الوكلاء"
        : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "مستوى الاستقلالية", valueAr: linkedAgents.map((a) => a.agentType).join("، ") || "لا ينطبق" },
        { labelAr: "قاعدة الموافقة البشرية", valueAr: approvalRule },
        {
          labelAr: "جاهزية مفتاح الإيقاف",
          valueAr: linkedAgents.some((a) => a.status === "suspended")
            ? "مُفعَّل حاليًا — الوكيل معلّق"
            : "لم يُختبر مفتاح الإيقاف بعد",
        },
        { labelAr: "قابلية التدقيق", valueAr: useCase.evidenceDetail.audit_evidence ? "موثقة" : "غير موثقة" },
      ],
    });
  }

  // 7. Human Oversight
  {
    const readyOrHighRisk =
      useCase.governanceStatus === "READY_FOR_AUTHORITY_REVIEW" || useCase.riskLevel === "high" || useCase.governanceStatus === "BLOCKED";
    const severity: LayerSeverity = !latestReview
      ? readyOrHighRisk
        ? "critical"
        : "warning"
      : useCase.authorityStatus === "missing"
        ? "critical"
        : openIncidents.length > 0
          ? "warning"
          : "ok";
    layers.push({
      layer: "human_oversight",
      severity,
      findingAr: latestReview
        ? `آخر مراجعة: ${getHumanReviewDecisionLabel(latestReview.decision).ar} — ${latestReview.reviewer} (${latestReview.reviewDate}).`
        : "لا توجد مراجعة بشرية مسجلة",
      missingControlAr:
        useCase.authorityStatus === "missing"
          ? "لا توجد جهة مساءلة مؤكدة"
          : openIncidents.length > 0
            ? `حوادث مفتوحة: ${openIncidents.map((i) => i.titleAr).join("، ")}`
            : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "حالة التصعيد", valueAr: getAuthorityLabel(useCase.authorityStatus).ar },
        { labelAr: "عدد الحوادث المفتوحة", valueAr: String(openIncidents.length) },
      ],
    });
  }

  // 8. Compliance & Audit
  {
    const evidenceGap = useCase.evidenceStatus !== "complete";
    layers.push({
      layer: "compliance_audit",
      severity: evidenceGap ? "warning" : "ok",
      findingAr: `أحدث أحداث التدقيق لهذا الأصل: ${assetAuditEvents.length > 0 ? assetAuditEvents.map((e) => e.actionAr).join("؛ ") : "لا توجد أحداث مسجلة"}.`,
      missingControlAr: evidenceGap ? "دليل الحوكمة غير مكتمل لهذا الأصل" : NO_CRITICAL_GAP_AR,
      details: [
        { labelAr: "عدد الحوادث الإجمالي", valueAr: String(ctx.incidents.filter((i) => i.assetId === useCase.id).length) },
        { labelAr: "الوضع المؤسسي العام للامتثال", valueAr: `${complianceReadiness.readinessPercent}%` },
      ],
    });
  }

  return layers;
}
