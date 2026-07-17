/**
 * Governed skill registry — query and eligibility helpers over the skill
 * catalog. A skill may execute only when it passes ALL of:
 *   1. approvedForUse === true
 *   2. its required tools are themselves approved/enabled
 *   3. the run's data class is within allowedDataClasses (and not prohibited)
 *   4. authority requirements are satisfied (an authorityHolder is present
 *      when requiredAuthority is true)
 *   5. its checksum matches the last-reviewed checksum (i.e. it has not
 *      silently changed since review)
 */

import type { DataSensitivity } from "@/lib/governance-model";
import { demoSkills, getSkillById } from "./demo-skills";
import { getToolById } from "./demo-tools";
import type { SkillDefinition } from "./types";

export interface SkillEligibilityResult {
  eligible: boolean;
  skill: SkillDefinition;
  reasonsAr: string[];
}

export function listSkills(): SkillDefinition[] {
  return demoSkills;
}

export function checkSkillEligibility(
  skillId: string,
  context: { dataSensitivity: DataSensitivity; hasAuthorityHolder: boolean; reviewedChecksum?: string }
): SkillEligibilityResult {
  const skill = getSkillById(skillId);
  if (!skill) {
    return {
      eligible: false,
      skill: {
        id: skillId,
      } as SkillDefinition,
      reasonsAr: [`المهارة "${skillId}" غير موجودة في السجل.`],
    };
  }

  const reasonsAr: string[] = [];

  if (!skill.approvedForUse) {
    reasonsAr.push("المهارة غير معتمدة للاستخدام (approvedForUse = false).");
  }
  if (skill.reviewStatus !== "APPROVED_FOR_DEMO") {
    reasonsAr.push(`حالة مراجعة المهارة (${skill.reviewStatus}) لا تسمح بالتنفيذ.`);
  }
  for (const toolId of skill.requiredTools) {
    const tool = getToolById(toolId);
    if (!tool) {
      reasonsAr.push(`الأداة المطلوبة "${toolId}" غير موجودة في سجل الأدوات.`);
    } else if (!tool.enabled || tool.approvalMode === "FORBIDDEN") {
      reasonsAr.push(`الأداة المطلوبة "${tool.nameAr}" غير مفعّلة أو ممنوعة.`);
    }
  }
  if (skill.prohibitedDataClasses.includes(context.dataSensitivity)) {
    reasonsAr.push("فئة حساسية بيانات الطلب ضمن الفئات الممنوعة لهذه المهارة.");
  }
  if (!skill.allowedDataClasses.includes(context.dataSensitivity)) {
    reasonsAr.push("فئة حساسية بيانات الطلب خارج الفئات المسموحة لهذه المهارة.");
  }
  if (skill.requiredAuthority && !context.hasAuthorityHolder) {
    reasonsAr.push("المهارة تتطلب صاحب صلاحية مؤسسية مثبتًا في الطلب.");
  }
  if (context.reviewedChecksum && context.reviewedChecksum !== skill.checksum) {
    reasonsAr.push("بصمة المهارة (checksum) لا تطابق النسخة المراجَعة — يلزم إعادة مراجعة قبل التنفيذ.");
  }

  return { eligible: reasonsAr.length === 0, skill, reasonsAr };
}
