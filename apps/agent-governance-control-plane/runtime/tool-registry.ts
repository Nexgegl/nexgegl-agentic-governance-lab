/**
 * Governed tool registry — permission checks over the tool catalog. A tool
 * call may proceed only when: the tool is enabled, its approvalMode is not
 * FORBIDDEN, the data class is within its allowed classes, authority is
 * present when required, and the per-run call budget has not been exceeded.
 */

import type { DataSensitivity } from "@/lib/governance-model";
import { demoTools, getToolById } from "./demo-tools";
import type { ToolDefinition, ToolPermission } from "./types";

export function listTools(): ToolDefinition[] {
  return demoTools;
}

export function checkToolPermission(
  toolId: string,
  context: { runId: string; dataSensitivity: DataSensitivity; hasAuthorityHolder: boolean; callsSoFar: number }
): ToolPermission {
  const tool = getToolById(toolId);
  if (!tool) {
    return { toolId, runId: context.runId, granted: false, reasonAr: `الأداة "${toolId}" غير موجودة في السجل.` };
  }
  if (!tool.enabled) {
    return { toolId, runId: context.runId, granted: false, reasonAr: `الأداة "${tool.nameAr}" غير مفعّلة.` };
  }
  if (tool.approvalMode === "FORBIDDEN") {
    return { toolId, runId: context.runId, granted: false, reasonAr: `الأداة "${tool.nameAr}" ممنوعة صراحةً (approvalMode = FORBIDDEN).` };
  }
  if (!tool.dataClasses.includes(context.dataSensitivity)) {
    return { toolId, runId: context.runId, granted: false, reasonAr: `الأداة "${tool.nameAr}" لا تسمح بفئة حساسية البيانات لهذا الطلب.` };
  }
  if (tool.requiredAuthority && !context.hasAuthorityHolder) {
    return { toolId, runId: context.runId, granted: false, reasonAr: `الأداة "${tool.nameAr}" تتطلب صاحب صلاحية مؤسسية مثبتًا.` };
  }
  if (context.callsSoFar >= tool.maxCallsPerRun) {
    return { toolId, runId: context.runId, granted: false, reasonAr: `تم تجاوز الحد الأقصى لاستدعاءات الأداة "${tool.nameAr}" لهذا التشغيل.` };
  }
  return { toolId, runId: context.runId, granted: true, reasonAr: `مسموح — ضمن حدود السياسة والميزانية لهذا التشغيل.` };
}
