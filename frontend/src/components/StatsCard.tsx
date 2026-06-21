interface Props {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad";
}

const VALUE_TONE: Record<Required<Props>["tone"], string> = {
  default: "text-text",
  good: "text-good",
  bad: "text-bad",
};

export default function StatsCard({ label, value, sub, tone = "default" }: Props) {
  return (
    <div className="glass p-5">
      <div className="text-xs font-medium tracking-wide text-muted uppercase">{label}</div>
      <div className={`my-1.5 text-[28px] font-bold tabular-nums ${VALUE_TONE[tone]}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}
