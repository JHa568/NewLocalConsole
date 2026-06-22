import BarRow from "../../components/ui/BarRow";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import { money } from "../../lib/format";
import type { Summary } from "./types";

interface Props {
  summary: Summary;
  updatedAt: Date | null;
  onRefresh: () => void;
}

/** Net-worth total with a portfolio/balances allocation breakdown. */
export default function NetWorthCard({ summary, updatedAt, onRefresh }: Props) {
  const allocationBase = summary.portfolio_value + summary.balances_total || 1;

  return (
    <Card className="flex flex-col gap-4">
      <SectionLabel>Net worth breakdown</SectionLabel>
      <div className="text-[28px] font-bold tabular-nums">{money(summary.net_worth_estimate)}</div>
      <div className="flex flex-col gap-3">
        <BarRow
          label="Portfolio"
          width={(summary.portfolio_value / allocationBase) * 100}
          valueLabel={money(summary.portfolio_value)}
        />
        <BarRow
          label="Balances"
          width={(summary.balances_total / allocationBase) * 100}
          valueLabel={money(summary.balances_total)}
        />
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : ""}</span>
        <button className="bg-transparent p-0 text-accent underline" onClick={onRefresh}>
          Click to refresh
        </button>
      </div>
    </Card>
  );
}
