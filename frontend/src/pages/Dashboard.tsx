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

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Summary>("/finance/summary/")
      .then((r) => setSummary(r.data))
      .catch(() => setError("Could not load dashboard data."));
  }, []);

  if (error) return <div className="page error">{error}</div>;
  if (!summary) return <div className="page">Loading dashboard…</div>;

  const rent = summary.rent_status;
  const rentLabel = !rent.exists
    ? "Not recorded"
    : rent.paid
      ? "Paid"
      : "Outstanding";

  return (
    <div className="page" data-testid="dashboard">
      <h2>Dashboard</h2>
      <div className="stat-grid">
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

      <h3>Holdings</h3>
      {summary.positions.length === 0 ? (
        <p className="muted">No stock positions yet. Add some in the Finance tab.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Change</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {summary.positions.map((p) => (
              <tr key={p.id}>
                <td>{p.ticker}</td>
                <td>{p.quantity}</td>
                <td>{p.price == null ? "—" : money(p.price)}</td>
                <td className={(p.change_pct ?? 0) >= 0 ? "pos" : "neg"}>
                  {p.change_pct == null ? "—" : `${p.change_pct}%`}
                </td>
                <td>{money(p.market_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
