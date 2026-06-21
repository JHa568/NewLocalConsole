import { useEffect, useState } from "react";
import { api } from "../api/client";
import StatsCard from "../components/StatsCard";

interface Position {
  id: number;
  ticker: string;
  quantity: string;
  price: number | null;
  change_pct: number | null;
  market_value: number | null;
}

interface Summary {
  monthly_income: number;
  rent_status: { period: string; exists: boolean; paid: boolean; amount: number | null };
  portfolio_value: number;
  positions: Position[];
  balances_total: number;
  net_worth_estimate: number;
}

const money = (n: number | null) =>
  n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "AUD" });

function BarRow({
  label,
  width,
  valueLabel,
  tone = "default",
}: {
  label: string;
  width: number;
  valueLabel: string;
  tone?: "default" | "good" | "bad";
}) {
  const fillClass =
    tone === "good" ? "bg-good" : tone === "bad" ? "bg-bad" : "bg-accent";
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 shrink-0 truncate text-xs font-medium text-muted">{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${Math.max(width, 2)}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right text-xs tabular-nums text-muted">{valueLabel}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchSummary = () => {
    api
      .get<Summary>("/finance/summary/")
      .then((r) => {
        setSummary(r.data);
        setUpdatedAt(new Date());
        setError(null);
      })
      .catch(() => setError("Could not load dashboard data."));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (error) return <div className="p-6 text-bad">{error}</div>;
  if (!summary) return <div className="p-6 text-muted">Loading dashboard…</div>;

  const rent = summary.rent_status;
  const rentLabel = !rent.exists
    ? "Not recorded"
    : rent.paid
      ? "Paid"
      : "Outstanding";

  const positions = summary.positions;
  const maxValue = Math.max(...positions.map((p) => p.market_value ?? 0), 1);
  const maxAbsChange = Math.max(...positions.map((p) => Math.abs(p.change_pct ?? 0)), 1);
  const allocationBase = summary.portfolio_value + summary.balances_total || 1;

  return (
    <div className="p-3 sm:p-6" data-testid="dashboard">
      <h2 className="mb-4 text-xl">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
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

        <div className="glass flex flex-col gap-4 p-5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">
            Net worth breakdown
          </div>
          <div className="text-[28px] font-bold tabular-nums">
            {money(summary.net_worth_estimate)}
          </div>
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
            <button
              className="bg-transparent p-0 text-accent underline"
              onClick={fetchSummary}
            >
              Click to refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h3 className="mb-3 text-base">Holdings</h3>
          {positions.length === 0 ? (
            <div className="glass p-5 text-sm text-muted">
              No stock positions yet. Add some in the Finance tab.
            </div>
          ) : (
            <div className="glass overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                      Ticker
                    </th>
                    <th className="border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                      Qty
                    </th>
                    <th className="border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                      Price
                    </th>
                    <th className="border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                      Change
                    </th>
                    <th className="border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} className="hover:bg-panel-2/60">
                      <td className="border-b border-border p-3 font-medium">{p.ticker}</td>
                      <td className="border-b border-border p-3 tabular-nums">{p.quantity}</td>
                      <td className="border-b border-border p-3 tabular-nums">
                        {p.price == null ? "—" : money(p.price)}
                      </td>
                      <td
                        className={`border-b border-border p-3 tabular-nums ${
                          (p.change_pct ?? 0) >= 0 ? "text-good" : "text-bad"
                        }`}
                      >
                        {p.change_pct == null ? "—" : `${p.change_pct}%`}
                      </td>
                      <td className="border-b border-border p-3 tabular-nums">
                        {money(p.market_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-base">Holdings by value</h3>
          <div className="glass flex flex-col gap-3 p-5">
            {positions.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              positions.map((p) => (
                <BarRow
                  key={p.id}
                  label={p.ticker}
                  width={((p.market_value ?? 0) / maxValue) * 100}
                  valueLabel={money(p.market_value)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-base">Daily change</h3>
          <div className="glass flex flex-col gap-3 p-5">
            {positions.length === 0 ? (
              <p className="text-sm text-muted">No data yet.</p>
            ) : (
              positions.map((p) => (
                <BarRow
                  key={p.id}
                  label={p.ticker}
                  width={(Math.abs(p.change_pct ?? 0) / maxAbsChange) * 100}
                  valueLabel={p.change_pct == null ? "—" : `${p.change_pct}%`}
                  tone={(p.change_pct ?? 0) >= 0 ? "good" : "bad"}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
