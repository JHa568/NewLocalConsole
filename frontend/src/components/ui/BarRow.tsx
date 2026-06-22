interface Props {
  label: string;
  /** Bar fill width as a percentage (0–100). */
  width: number;
  /** Right-aligned value text. */
  valueLabel: string;
  tone?: "default" | "good" | "bad";
}

const FILL = {
  default: "bg-accent",
  good: "bg-good",
  bad: "bg-bad",
} as const;

/** Labelled horizontal bar used in the dashboard's breakdown charts. */
export default function BarRow({ label, width, valueLabel, tone = "default" }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0 truncate text-xs font-medium text-muted">{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full ${FILL[tone]}`}
          style={{ width: `${Math.max(width, 2)}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-xs tabular-nums text-muted">{valueLabel}</div>
    </div>
  );
}
