import type { ApprovalMode, ReviewOutcome, RunStatus, SkillReviewStatus } from "@/runtime/types";
import {
  getApprovalModeClasses,
  getApprovalModeLabel,
  getReviewOutcomeClasses,
  getReviewOutcomeLabel,
  getRunStatusClasses,
  getRunStatusLabel,
  getSkillReviewStatusClasses,
  getSkillReviewStatusLabel,
} from "@/runtime/runtime-labels";

function BaseBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const label = getRunStatusLabel(status);
  return (
    <BaseBadge className={getRunStatusClasses(status)}>
      {label.ar} <span className="ms-1 text-[10px] opacity-70">{status}</span>
    </BaseBadge>
  );
}

export function ReviewOutcomeBadge({ outcome }: { outcome: ReviewOutcome }) {
  const label = getReviewOutcomeLabel(outcome);
  return <BaseBadge className={getReviewOutcomeClasses(outcome)}>{label.ar}</BaseBadge>;
}

export function SkillReviewStatusBadge({ status }: { status: SkillReviewStatus }) {
  return <BaseBadge className={getSkillReviewStatusClasses(status)}>{getSkillReviewStatusLabel(status)}</BaseBadge>;
}

export function ApprovalModeBadge({ mode }: { mode: ApprovalMode }) {
  return <BaseBadge className={getApprovalModeClasses(mode)}>{getApprovalModeLabel(mode)}</BaseBadge>;
}
