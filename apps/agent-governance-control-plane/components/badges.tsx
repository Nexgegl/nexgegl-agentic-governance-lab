import {
  type AuthorityStatus,
  type EvidenceStatus,
  type GateStatus,
  type PermissionCellStatus,
  type RiskLevel,
  getAuthorityClasses,
  getAuthorityLabel,
  getEvidenceClasses,
  getEvidenceLabel,
  getGateStatusClasses,
  getGateStatusLabel,
  getPermissionCellClasses,
  getPermissionCellLabel,
  getRiskClasses,
  getRiskLabel,
} from "@/lib/governance-model";

function BaseBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function GateStatusBadge({ status }: { status: GateStatus }) {
  const label = getGateStatusLabel(status);
  return (
    <BaseBadge className={getGateStatusClasses(status)}>
      {label.ar} <span className="ms-1 text-[10px] opacity-70">{status}</span>
    </BaseBadge>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const label = getRiskLabel(risk);
  return <BaseBadge className={getRiskClasses(risk)}>{label.ar}</BaseBadge>;
}

export function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  const label = getEvidenceLabel(status);
  return <BaseBadge className={getEvidenceClasses(status)}>{label.ar}</BaseBadge>;
}

export function AuthorityBadge({ status }: { status: AuthorityStatus }) {
  const label = getAuthorityLabel(status);
  return <BaseBadge className={getAuthorityClasses(status)}>{label.ar}</BaseBadge>;
}

export function PermissionCellBadge({ status }: { status: PermissionCellStatus }) {
  const label = getPermissionCellLabel(status);
  return <BaseBadge className={`w-full justify-center ${getPermissionCellClasses(status)}`}>{label.ar}</BaseBadge>;
}
