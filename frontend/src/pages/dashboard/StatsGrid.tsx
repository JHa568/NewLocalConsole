import StatsCard from "../../components/StatsCard";
import { money } from "../../lib/format";
import type { Summary } from "./types";

/** The four headline finance figures shown at the top of the dashboard. */
export default function StatsGrid({ summary }: { summary: Summary }) {
  const rent = summary.rent_status;
  const rentLabel = !rent.exists ? "Not recorded" : rent.paid ? "Paid" : "Outstanding";

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatsCard label="Monthly income" value={money(summary.monthly_income)} />
      <StatsCard
        label="Rent this month"
        value={rentLabel}
        sub={rent.amount != null ? money(rent.amount) : undefined}
        tone={!rent.exists ? "default" : rent.paid ? "good" : "bad"}
      />
      <StatsCard label="Portfolio value" value={money(summary.portfolio_value)} />
      <StatsCard
        label="Net worth (est.)"
        value={money(summary.net_worth_estimate)}
        sub={`incl. ${money(summary.balances_total)} in balances`}
      />
    </div>
  );
}
