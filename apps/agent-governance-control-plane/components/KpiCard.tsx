interface KpiCardProps {
  label: string;
  labelEn?: string;
  value: number | string;
  tone?: "neutral" | "danger" | "warning" | "success";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  neutral: "text-navy-900",
  danger: "text-red-700",
  warning: "text-amber-700",
  success: "text-emerald-700",
};

export function KpiCard({ label, labelEn, value, tone = "neutral" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-navy-500">{label}</p>
      {labelEn ? <p className="text-[11px] text-navy-400">{labelEn}</p> : null}
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  );
}
