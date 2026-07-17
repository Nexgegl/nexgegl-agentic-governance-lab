/**
 * Governed execution engine — runGovernedResearch(request) is the single
 * entry point. Every step is deterministic and bounded: validate → plan →
 * validate skills/tools → execute bounded steps → collect evidence → trace
 * → evaluate → governance gate → draft decision packet → stop. There is no
 * free-running autonomous loop, and no run ever produces an institutional
 * decision, an official verdict, a KFSA verdict, or a production approval.
 *
 * Governance identities preserved throughout this engine: Signal ≠ Decision.
 * Research Output ≠ Recommendation. Recommendation ≠ Institutional Decision.
 * Agent Action ≠ Approved Institutional Action. No tool call this engine
 * executes — however successful — is ever treated as an approved
 * institutional action; it remains a bounded, audited research step only.
 */

import type { GateStatus } from "@/lib/governance-model";
import { createGovernedPlan, inferEvidenceTopic } from "./planner";
import { checkSkillEligibility } from "./skill-registry";
import { checkToolPermission } from "./tool-registry";
import { collectEvidence, evidenceTopicCount } from "./evidence-collector";
import { appendTraceEntry } from "./execution-trace";
import { evaluateRun } from "./evaluator";
import { advanceLoopControl, createLoopControlState } from "./loop-controller";
import { runGovernanceGate } from "./governance-gate";
import { demoSkills } from "./demo-skills";
import { demoTools, getToolById } from "./demo-tools";
import type {
  DraftDecisionPacket,
  EvidenceItem,
  ExecutionRun,
  ExecutionTraceEntry,
  GovernanceFinding,
  RunStatus,
  ToolCall,
} from "./types";
import type { GovernedResearchRequest } from "./types";

const RESEARCH_BOUNDARY_AR =
  "هذه الحزمة لا تصدر موافقة إنتاج، ولا تنشئ قرارًا رسميًا، ولا تنتج حكم KFSA. مخرجات البحث تمهيدية وتتطلب مراجعة واعتمادًا من سلطة مؤسسية مخولة.";

function gateStatusToRunStatus(status: GateStatus | "BLOCKED_PRE_EXECUTION"): RunStatus {
  if (status === "BLOCKED_PRE_EXECUTION") return "BLOCKED";
  return status;
}

export function runGovernedResearch(request: GovernedResearchRequest): ExecutionRun {
  const trace: ExecutionTraceEntry[] = [];
  const evidence: EvidenceItem[] = [];
  const toolCalls: ToolCall[] = [];
  const findings: GovernanceFinding[] = [];
  let loopControl = createLoopControlState(request.maxSteps, request.maxToolCalls);
  const hasAuthorityHolder = request.authorityHolder.trim().length > 0;

  appendTraceEntry(trace, request.id, request.submittedAt, {
    stage: "REQUEST_RECEIVED",
    actor: "Governed Planner",
    action: "Request received",
    actionAr: "تم استلام طلب البحث المؤسسي",
    summaryAr: `طلب: ${request.titleAr} — مقدّم من ${request.requester}.`,
  });

  // 1 & 2. validate request, create the plan (or a rejection).
  const plannerResult = createGovernedPlan(request, demoSkills, demoTools);

  if (plannerResult.rejected || !plannerResult.plan) {
    appendTraceEntry(trace, request.id, request.submittedAt, {
      stage: "PLAN_CREATED",
      actor: "Governed Planner",
      action: "Plan rejected",
      actionAr: "رفض الخطة قبل التنفيذ",
      status: "BLOCKED",
      summaryAr: plannerResult.rejectionReasonsAr.join(" | "),
    });
    const gate = { status: "BLOCKED" as const, reasonAr: plannerResult.rejectionReasonsAr.join(" "), missingControlsAr: plannerResult.rejectionReasonsAr, production_approval_status: false as const };
    appendTraceEntry(trace, request.id, request.submittedAt, {
      stage: "GOVERNANCE_FINDING",
      actor: "Governance Gate",
      action: "Gate resolved",
      actionAr: "تحديد حالة بوابة الحوكمة",
      status: "BLOCKED",
      summaryAr: gate.reasonAr,
    });

    const decisionPacket: DraftDecisionPacket = {
      runId: request.id,
      requestSummaryAr: `${request.titleAr} — ${request.researchQuestionAr}`,
      planSummaryAr: "لم تُنشأ خطة تنفيذ — رُفض الطلب في مرحلة التخطيط.",
      skillsUsed: [],
      toolsUsed: [],
      evidenceSummaryAr: "لا توجد أدلة — لم يبدأ التنفيذ.",
      evaluationSummaryAr: "لا يوجد تقييم — التشغيل محظور قبل التنفيذ.",
      governanceFindingsAr: plannerResult.rejectionReasonsAr,
      unresolvedGapsAr: plannerResult.rejectionReasonsAr,
      humanReviewSummaryAr: "لا توجد مراجعة بشرية — التشغيل محظور بنيويًا.",
      recommendedNextActionAr: "أعد صياغة الطلب لإزالة أسباب الحظر (قرار رسمي/موافقة إنتاج/حكم KFSA/إجراء كتابة غير معتمد) ثم أعد التقديم.",
      executionTraceReference: `trace-count:${trace.length}`,
      boundaryAr: RESEARCH_BOUNDARY_AR,
    };

    return {
      runId: request.id,
      tenantId: "demo-tenant",
      requestId: request.id,
      requester: request.requester,
      businessPurposeAr: request.businessPurposeAr,
      submittedAt: request.submittedAt,
      status: "BLOCKED",
      request,
      plan: null,
      selectedSkills: [],
      selectedTools: [],
      toolCalls: [],
      evidence: [],
      trace,
      evaluations: [],
      findings,
      governanceGate: gate,
      humanReview: null,
      decisionPacket,
      loopControl,
      stopReason: "POLICY_BLOCK",
      retries: 0,
      production_approval_status: false,
    };
  }

  const plan = plannerResult.plan;
  appendTraceEntry(trace, request.id, request.submittedAt, {
    stage: "PLAN_CREATED",
    actor: "Governed Planner",
    action: "Plan created",
    actionAr: "تم إنشاء خطة تنفيذ محكومة",
    summaryAr: `${plan.classification} — ${plan.steps.length} خطوات، حد أقصى ${plan.maxSteps} خطوة و${plan.maxToolCalls} استدعاء أداة.`,
  });

  const selectedSkills: string[] = [];
  const selectedTools = new Set<string>();
  const topicKey = inferEvidenceTopic(request);
  let stopReason: ExecutionRun["stopReason"] = null;
  let forbiddenActionAttempted = false;
  let evidenceIndex = 0;

  stepLoop: for (const step of plan.steps) {
    const eligibility = checkSkillEligibility(step.skillId, { dataSensitivity: request.dataSensitivity, hasAuthorityHolder });
    appendTraceEntry(trace, request.id, request.submittedAt, {
      stage: "SKILL_SELECTED",
      actor: "Governed Planner",
      action: `Skill evaluated: ${step.skillId}`,
      actionAr: `تقييم صلاحية المهارة: ${eligibility.skill.nameAr ?? step.skillId}`,
      status: eligibility.eligible ? "OK" : "BLOCKED",
      summaryAr: eligibility.eligible ? "المهارة معتمدة ومؤهلة للتنفيذ." : eligibility.reasonsAr.join(" | "),
      policyReference: "skill-registry.checkSkillEligibility",
    });

    if (!eligibility.eligible) {
      const loopCheck = advanceLoopControl(loopControl, { progressed: false, policyBlocked: true });
      loopControl = loopCheck.state;
      stopReason = "AUTHORITY_REQUIRED";
      appendTraceEntry(trace, request.id, request.submittedAt, {
        stage: "STOP",
        actor: "Loop Controller",
        action: "Run stopped",
        actionAr: "تم إيقاف التشغيل",
        status: "BLOCKED",
        summaryAr: `توقف بسبب: عدم تأهل المهارة "${step.skillId}" — ${eligibility.reasonsAr.join(" | ")}`,
      });
      break stepLoop;
    }

    selectedSkills.push(step.skillId);

    for (const toolId of step.toolIds) {
      const tool = getToolById(toolId);
      appendTraceEntry(trace, request.id, request.submittedAt, {
        stage: "TOOL_SELECTED",
        actor: step.skillId,
        action: `Tool selected: ${toolId}`,
        actionAr: `اختيار الأداة: ${tool?.nameAr ?? toolId}`,
        summaryAr: `الأداة مطلوبة لخطوة "${step.objectiveAr}".`,
      });

      const permission = checkToolPermission(toolId, {
        runId: request.id,
        dataSensitivity: request.dataSensitivity,
        hasAuthorityHolder,
        callsSoFar: toolCalls.filter((c) => c.toolId === toolId).length,
      });
      appendTraceEntry(trace, request.id, request.submittedAt, {
        stage: "PERMISSION_CHECK",
        actor: "Tool Registry",
        action: `Permission check: ${toolId}`,
        actionAr: `فحص صلاحية الأداة: ${tool?.nameAr ?? toolId}`,
        status: permission.granted ? "OK" : "BLOCKED",
        summaryAr: permission.reasonAr,
        policyReference: "tool-registry.checkToolPermission",
      });

      if (!permission.granted) {
        if (tool?.approvalMode === "FORBIDDEN") {
          forbiddenActionAttempted = true;
        }
        const refusedCall: ToolCall = {
          id: `call-${request.id}-${toolCalls.length + 1}`,
          runId: request.id,
          stepId: step.stepId,
          toolId,
          skillId: step.skillId,
          arguments: { query: request.researchQuestionAr },
          startedAt: request.submittedAt,
          endedAt: request.submittedAt,
          status: "REFUSED",
          resultSummaryAr: permission.reasonAr,
          rawResultReference: "",
          evidenceIds: [],
          approvalEvidenceAr: "رفض — لا يوجد اعتماد صلاحية.",
          policyFindingAr: permission.reasonAr,
        };
        toolCalls.push(refusedCall);
        continue;
      }

      selectedTools.add(toolId);
      const signature = `${toolId}:${step.skillId}:${topicKey}`;
      const callTimestamp = request.submittedAt;
      const call: ToolCall = {
        id: `call-${request.id}-${toolCalls.length + 1}`,
        runId: request.id,
        stepId: step.stepId,
        toolId,
        skillId: step.skillId,
        arguments: { query: request.researchQuestionAr, topic: topicKey },
        startedAt: callTimestamp,
        endedAt: callTimestamp,
        status: "SUCCESS",
        resultSummaryAr: `تم تنفيذ استدعاء تجريبي حتمي للأداة "${tool?.nameAr ?? toolId}".`,
        rawResultReference: `demo-result://${toolId}/${topicKey}`,
        evidenceIds: [],
        approvalEvidenceAr: permission.reasonAr,
        policyFindingAr: "لا توجد مخالفة سياسة لهذا الاستدعاء.",
      };
      appendTraceEntry(trace, request.id, request.submittedAt, {
        stage: "TOOL_CALL",
        actor: step.skillId,
        action: `Tool call: ${toolId}`,
        actionAr: `استدعاء الأداة: ${tool?.nameAr ?? toolId}`,
        summaryAr: call.resultSummaryAr,
        outputReference: call.rawResultReference,
      });

      if (step.skillId === "evidence-collection" && tool?.readWriteClass === "READ_ONLY") {
        const item = collectEvidence(request.id, topicKey, evidenceIndex, {
          sourceType: tool.toolType,
          capturedByTool: toolId,
          capturedBySkill: step.skillId,
          capturedAt: callTimestamp,
          dataClassification: request.dataSensitivity,
        });
        evidenceIndex += 1;
        evidence.push(item);
        call.evidenceIds.push(item.id);
        appendTraceEntry(trace, request.id, request.submittedAt, {
          stage: "EVIDENCE_CREATED",
          actor: step.skillId,
          action: `Evidence created: ${item.id}`,
          actionAr: `إنشاء دليل: ${item.titleAr}`,
          summaryAr: item.summaryAr,
          evidenceIds: [item.id],
        });

        // Loop-demo scenario deliberately reuses the same tool+evidence signature
        // to exercise repeated-evidence detection.
        if (topicKey === "loop-demo" && evidenceIndex > 1) {
          const loopCheck = advanceLoopControl(loopControl, { toolCallSignature: signature, evidenceSignature: item.sourceReference, progressed: false });
          loopControl = loopCheck.state;
          toolCalls.push(call);
          if (loopCheck.stop) {
            stopReason = loopCheck.stop;
            appendTraceEntry(trace, request.id, request.submittedAt, {
              stage: "STOP",
              actor: "Loop Controller",
              action: "Run stopped",
              actionAr: "تم إيقاف التشغيل بأمان",
              status: "BLOCKED",
              summaryAr: `رصد نمط متكرر لنفس الأداة والدليل (${signature}) — تم الإيقاف لمنع حلقة تكرار غير منتجة.`,
            });
            break stepLoop;
          }
          continue;
        }
      }

      toolCalls.push(call);
      const loopCheck = advanceLoopControl(loopControl, { toolCallSignature: signature, progressed: true });
      loopControl = loopCheck.state;
      if (loopCheck.stop) {
        stopReason = loopCheck.stop;
        appendTraceEntry(trace, request.id, request.submittedAt, {
          stage: "STOP",
          actor: "Loop Controller",
          action: "Run stopped",
          actionAr: "تم إيقاف التشغيل",
          status: "BLOCKED",
          summaryAr: `توقف بسبب: ${loopCheck.stop}`,
        });
        break stepLoop;
      }
    }

    const stepLoopCheck = advanceLoopControl(loopControl, { progressed: true });
    loopControl = stepLoopCheck.state;
    if (stepLoopCheck.stop) {
      stopReason = stepLoopCheck.stop;
      appendTraceEntry(trace, request.id, request.submittedAt, {
        stage: "STOP",
        actor: "Loop Controller",
        action: "Run stopped",
        actionAr: "تم إيقاف التشغيل",
        status: "BLOCKED",
        summaryAr: `توقف بسبب: ${stepLoopCheck.stop}`,
      });
      break stepLoop;
    }
  }

  if (forbiddenActionAttempted) {
    findings.push({
      id: `finding-${request.id}-forbidden`,
      runId: request.id,
      category: "action_safety",
      severity: "critical",
      findingAr: "تم رصد محاولة استخدام أداة ممنوعة (FORBIDDEN) خلال التنفيذ — رُفضت الأداة بنيويًا ولم تُنفَّذ.",
      relatedEvidenceIds: [],
    });
  }

  // 9. evaluate results.
  const requiredAuthorityInPlan = plan.steps.some((s) => s.requiredAuthority);
  const expectedEvidenceCount = evidenceTopicCount(topicKey);
  const evaluations = evaluateRun({
    plan,
    evidence,
    hasAuthorityHolder,
    requiredAuthorityInPlan,
    forbiddenActionAttempted,
    loopControl,
    expectedEvidenceCount,
  });
  for (const evalResult of evaluations) {
    appendTraceEntry(trace, request.id, request.submittedAt, {
      stage: "EVALUATION_RESULT",
      actor: "Evaluator",
      action: `Evaluated dimension: ${evalResult.dimension}`,
      actionAr: `تقييم بُعد: ${evalResult.dimension}`,
      status: evalResult.outcome === "PASS" ? "OK" : evalResult.outcome === "FAIL" ? "BLOCKED" : "WARNING",
      summaryAr: evalResult.findingsAr.join(" | "),
      evidenceIds: evalResult.evidenceIds,
    });
  }

  // 10. run governance gate.
  const gate = runGovernanceGate({ evaluations, request, evidence, expectedEvidenceCount });
  appendTraceEntry(trace, request.id, request.submittedAt, {
    stage: "GOVERNANCE_FINDING",
    actor: "Governance Gate",
    action: "Gate resolved",
    actionAr: "تحديد حالة بوابة الحوكمة",
    status: gate.status === "READY_FOR_AUTHORITY_REVIEW" ? "OK" : gate.status === "BLOCKED" ? "BLOCKED" : "WARNING",
    summaryAr: gate.reasonAr,
  });

  // 11. draft decision packet.
  const decisionPacket: DraftDecisionPacket = {
    runId: request.id,
    requestSummaryAr: `${request.titleAr} — ${request.researchQuestionAr}`,
    planSummaryAr: `${plan.classification} عبر ${selectedSkills.length} مهارات معتمدة و${selectedTools.size} أدوات معتمدة.`,
    skillsUsed: selectedSkills,
    toolsUsed: Array.from(selectedTools),
    evidenceSummaryAr: `تم جمع ${evidence.length} عنصر دليل، جميعها بحالة "غير مراجَع" حتى تُراجعها جهة بشرية.`,
    evaluationSummaryAr: evaluations.map((e) => `${e.dimension}: ${e.outcome}`).join("، "),
    governanceFindingsAr: [gate.reasonAr, ...findings.map((f) => f.findingAr)],
    unresolvedGapsAr: gate.missingControlsAr,
    humanReviewSummaryAr: "لم تُسجَّل مراجعة بشرية بعد لهذا التشغيل.",
    recommendedNextActionAr:
      gate.status === "READY_FOR_AUTHORITY_REVIEW"
        ? "جاهز لعرضه على صاحب الصلاحية المعتمدة للمراجعة، ولا يمثل ذلك موافقة إنتاج."
        : gate.status === "BLOCKED"
          ? "لا تنتقل للمراجعة. أغلق أسباب الحظر أولًا."
          : gate.status === "ESCALATE_REQUIRED"
            ? "تصعيد مطلوب لمراجعة حوكمة بشرية قبل أي خطوة لاحقة."
            : gate.status === "REPAIR_REQUIRED"
              ? "أكمل النواقص المذكورة ثم أعد التقييم."
              : "مراجعة حوكمة مطلوبة قبل عرضه على صاحب الصلاحية.",
    executionTraceReference: `trace-count:${trace.length}`,
    boundaryAr: RESEARCH_BOUNDARY_AR,
  };

  // 12. stop before institutional decision — final status.
  let status: RunStatus;
  if (stopReason && ["LOOP_DETECTED", "MAX_STEPS_REACHED", "MAX_TOOL_CALLS_REACHED", "NO_PROGRESS", "TOOL_FAILURE"].includes(stopReason)) {
    status = "FAILED";
  } else if (stopReason === "AUTHORITY_REQUIRED") {
    status = "ESCALATE_REQUIRED";
  } else {
    status = gateStatusToRunStatus(gate.status);
  }

  return {
    runId: request.id,
    tenantId: "demo-tenant",
    requestId: request.id,
    requester: request.requester,
    businessPurposeAr: request.businessPurposeAr,
    submittedAt: request.submittedAt,
    status,
    request,
    plan,
    selectedSkills,
    selectedTools: Array.from(selectedTools),
    toolCalls,
    evidence,
    trace,
    evaluations,
    findings,
    governanceGate: gate,
    humanReview: null,
    decisionPacket,
    loopControl,
    stopReason: stopReason ?? "COMPLETED",
    retries: 0,
    production_approval_status: false,
  };
}
