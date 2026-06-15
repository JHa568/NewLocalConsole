interface Props {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad";
}

export default function StatsCard({ label, value, sub, tone = "default" }: Props) {
  return (
    <div className={`card stat stat-${tone}`}>
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="muted small">{sub}</div>}
    </div>
  );
}
