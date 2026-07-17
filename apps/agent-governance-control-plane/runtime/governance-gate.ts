/**
 * Governance Gate for the Research Runtime — maps evaluation outcomes to the
 * same gate vocabulary used across the rest of the platform (GateStatus).
 * READY_FOR_AUTHORITY_REVIEW never approves production; it only means the
 * run may be presented to an institutional authority for review.
 */

import type { GateStatus } from "@/lib/governance-model";
import type { EvaluationResult, EvidenceItem, GovernanceGateResult, GovernedResearchRequest, ReviewOutcome } from "./types";
import { worstOutcome } from "./evaluator";

export function runGovernanceGate(input: {
  evaluations: EvaluationResult[];
  request: GovernedResearchRequest;
  evidence: EvidenceItem[];
  expectedEvidenceCount: number;
}): GovernanceGateResult {
  const worst: ReviewOutcome = worstOutcome(input.evaluations.map((e) => e.outcome));
  const missingControlsAr: string[] = input.evaluations.flatMap((e) => [...e.blockingFailuresAr, ...e.requiredFixesAr]);

  let status: GateStatus;
  let reasonAr: string;

  if (worst === "FAIL") {
    status = "BLOCKED";
    reasonAr = "فشل تقييم واحد أو أكثر من أبعاد التقييم — التشغيل محظور ولا يمكن عرضه على صاحب الصلاحية.";
  } else if (worst === "ESCALATE") {
    status = "ESCALATE_REQUIRED";
    reasonAr = "رصد التقييم حاجة للتصعيد — يتطلب مراجعة حوكمة بشرية قبل أي خطوة لاحقة.";
  } else if (worst === "FIX") {
    status = "REPAIR_REQUIRED";
    reasonAr = "توجد نواقص قابلة للإصلاح في الأدلة أو الجودة — يلزم استكمالها قبل إعادة التقييم.";
  } else {
    const governanceSensitive = input.request.requiresWriteAction || input.request.requiresExternalAccess || input.request.riskLevel === "high";
    const evidenceSufficient = input.evidence.length >= input.expectedEvidenceCount && input.expectedEvidenceCount > 0;
    const hasAuthority = input.request.authorityHolder.trim().length > 0;

    if (governanceSensitive) {
      status = "GOVERNANCE_REVIEW_REQUIRED";
      reasonAr = "التقييم إيجابي، إلا أن الطلب يتضمن شرطًا حساسًا حوكميًا (كتابة/وصول خارجي/خطورة عالية) يستدعي مراجعة لجنة الحوكمة قبل عرضه على صاحب الصلاحية.";
    } else if (evidenceSufficient && hasAuthority) {
      status = "READY_FOR_AUTHORITY_REVIEW";
      reasonAr = "التقييم إيجابي، والأدلة كافية، وصاحب الصلاحية المؤسسية محدد — التشغيل جاهز لعرضه للمراجعة، دون أن يمثل ذلك موافقة إنتاج.";
    } else {
      status = "GOVERNANCE_REVIEW_REQUIRED";
      reasonAr = evidenceSufficient
        ? "التقييم إيجابي، لكن لا يوجد صاحب صلاحية مؤسسية محدد — يلزم تحديده قبل الجاهزية لمراجعة السلطة."
        : "التقييم إيجابي، لكن الأدلة المجمعة لا تغطي جميع خطوات الخطة — يلزم استكمالها.";
    }
  }

  return {
    status,
    reasonAr,
    missingControlsAr: Array.from(new Set(missingControlsAr)),
    production_approval_status: false,
  };
}
