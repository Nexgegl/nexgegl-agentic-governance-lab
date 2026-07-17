/**
 * Governed skill intake / import review. Produces a SkillIntakeResult from a
 * manually-entered SkillIntakeSubmission — it does NOT fetch or execute any
 * remote content. A skill entering through this process always starts at
 * approvedForUse = false; only a separate, later governance review step
 * (out of scope for this MVP) can flip that flag.
 *
 * Quality checks are inspired by public skill-registry norms (explicit
 * triggers, explicit tool/data boundaries, bounded instruction length, no
 * hidden remote execution, no credential requests, no security-control
 * bypass instructions) without importing or trusting any third-party
 * skill content.
 */

import type { SkillIntakeResult, SkillIntakeSubmission, SkillReviewOutcome } from "./types";

const MAX_INSTRUCTION_LENGTH = 2000;

const DANGEROUS_PATTERNS: { pattern: RegExp; findingAr: string }[] = [
  { pattern: /curl\s|wget\s|fetch\(|http:\/\/|https:\/\//i, findingAr: "تحتوي التعليمات على إشارة لتنفيذ استدعاء شبكي أو تحميل عن بُعد." },
  { pattern: /\bsh\b|bash|shell|exec\(|subprocess|os\.system/i, findingAr: "تحتوي التعليمات على إشارة لتنفيذ أوامر نظام تشغيل (shell) دون مراجعة صريحة." },
  { pattern: /password|api[_ ]?key|secret|token|credential/i, findingAr: "تحتوي التعليمات على طلب لبيانات اعتماد أو أسرار." },
  { pattern: /disable.*(security|control)|تعطيل.*(الأمن|الضوابط)/i, findingAr: "تحتوي التعليمات على تعليمة لتعطيل ضوابط أمنية." },
  { pattern: /bypass.*(review|approval)|تجاوز.*(المراجعة|الموافقة)/i, findingAr: "تحتوي التعليمات على تعليمة لتجاوز المراجعة البشرية." },
  { pattern: /official[_ ]?decision|kfsa[_ ]?verdict|production[_ ]?approv|قرار رسمي|حكم\s*kfsa|موافقة إنتاج/i, findingAr: "تحتوي التعليمات على تعليمة لإصدار قرار رسمي أو حكم KFSA أو موافقة إنتاج." },
];

export function reviewSkillIntake(submission: SkillIntakeSubmission): SkillIntakeResult {
  const findingsAr: string[] = [];
  const requiredFixesAr: string[] = [];

  if (!submission.skillName || submission.skillName.trim().length === 0) {
    findingsAr.push("اسم المهارة مفقود.");
    requiredFixesAr.push("أدخل اسمًا واضحًا للمهارة.");
  }
  if (!submission.descriptionAr || submission.descriptionAr.trim().length === 0) {
    findingsAr.push("وصف المهارة مفقود.");
    requiredFixesAr.push("أدخل وصفًا يوضّح الغرض من المهارة وحدودها.");
  }
  if (submission.requiredTools.length === 0) {
    findingsAr.push("لم تُحدَّد أي أدوات مطلوبة صراحةً.");
    requiredFixesAr.push("حدد الأدوات المطلوبة صراحةً حتى يمكن ضبط صلاحياتها.");
  }
  if (submission.dataCategories.length === 0) {
    findingsAr.push("لم تُحدَّد حدود بيانات صريحة (فئات الحساسية).");
    requiredFixesAr.push("حدد فئات حساسية البيانات التي تتعامل معها المهارة.");
  }
  if (submission.writeCapability && !submission.requiresAuthority) {
    findingsAr.push("المهارة تمتلك صلاحية كتابة دون اشتراط صلاحية مؤسسية.");
    requiredFixesAr.push("اربط أي قدرة كتابة باشتراط صلاحية مؤسسية مؤكدة.");
  }
  if (submission.externalAccess && !submission.auditRequired) {
    findingsAr.push("المهارة تصل لأنظمة خارجية دون اشتراط تدقيق.");
    requiredFixesAr.push("فعّل اشتراط التدقيق لأي مهارة تصل لأنظمة خارجية.");
  }
  if (submission.sourceType !== "INTERNAL" && !submission.humanApprovalRequired) {
    findingsAr.push("مصدر المهارة خارجي (غير داخلي) دون اشتراط موافقة بشرية.");
    requiredFixesAr.push("اشترط موافقة بشرية لأي مهارة من مصدر غير داخلي قبل أول تنفيذ.");
  }

  const instructions = submission.rawInstructionsAr ?? "";
  if (instructions.length > MAX_INSTRUCTION_LENGTH) {
    findingsAr.push(`طول التعليمات (${instructions.length} حرفًا) يتجاوز الحد الأقصى المسموح (${MAX_INSTRUCTION_LENGTH} حرفًا).`);
    requiredFixesAr.push("اختصر التعليمات إلى ما دون الحد الأقصى المسموح.");
  }

  const blockingAr: string[] = [];
  for (const { pattern, findingAr } of DANGEROUS_PATTERNS) {
    if (pattern.test(instructions) || pattern.test(submission.descriptionAr)) {
      blockingAr.push(findingAr);
    }
  }
  findingsAr.push(...blockingAr);

  let outcome: SkillReviewOutcome;
  if (blockingAr.length > 0) {
    outcome = "FAIL";
  } else if (submission.writeCapability && submission.externalAccess) {
    outcome = "ESCALATE";
  } else if (requiredFixesAr.length > 0) {
    outcome = "FIX";
  } else {
    outcome = "PASS";
  }

  const riskLevel = blockingAr.length > 0 || (submission.writeCapability && submission.externalAccess)
    ? "high"
    : submission.writeCapability || submission.externalAccess
      ? "medium"
      : "low";

  const prohibitedActionsAr: string[] = [
    "لا يجوز تنفيذ أي إجراء كتابة على أنظمة خارجية دون موافقة بشرية صريحة لكل استدعاء.",
    "لا يجوز إصدار قرار رسمي أو حكم KFSA أو موافقة إنتاج تحت أي ظرف.",
    "لا يجوز تجاوز المراجعة البشرية المطلوبة لهذه المهارة.",
  ];

  return {
    outcome,
    riskLevel,
    findingsAr: findingsAr.length > 0 ? findingsAr : ["لا توجد نتائج مراجعة سلبية أولية — لا يزال يلزم اعتماد رسمي قبل التفعيل."],
    requiredFixesAr,
    // Always false at intake — a later, separate governance review step is required before this can ever change.
    approvedForUse: false,
    allowedTools: outcome === "FAIL" ? [] : submission.requiredTools,
    prohibitedActionsAr,
    requiredHumanAuthority: submission.requiresAuthority || submission.writeCapability || submission.externalAccess,
  };
}
