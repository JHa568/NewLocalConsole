import BarRow from "../../components/ui/BarRow";
import Card from "../../components/ui/Card";
import { money } from "../../lib/format";
import type { Position } from "./types";

const TH =
  "border-b border-border p-3 text-left text-xs font-medium tracking-wide text-muted uppercase";

function HoldingsTable({ positions }: { positions: Position[] }) {
  return (
    <div>
      <h3 className="mb-3 text-base">Holdings</h3>
      {positions.length === 0 ? (
        <Card className="text-sm text-muted">
          No stock positions yet. Add some in the Finance tab.
        </Card>
      ) : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={TH}>Ticker</th>
                <th className={TH}>Qty</th>
                <th className={TH}>Price</th>
                <th className={TH}>Change</th>
                <th className={TH}>Value</th>
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
                  <td className="border-b border-border p-3 tabular-nums">{money(p.market_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function BarChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-base">{title}</h3>
      <Card className="flex flex-col gap-3">{children}</Card>
    </div>
  );
}

/** Holdings table plus the by-value and daily-change bar charts. */
export default function Holdings({ positions }: { positions: Position[] }) {
  const maxValue = Math.max(...positions.map((p) => p.market_value ?? 0), 1);
  const maxAbsChange = Math.max(...positions.map((p) => Math.abs(p.change_pct ?? 0)), 1);
  const empty = positions.length === 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
      <HoldingsTable positions={positions} />

      <BarChart title="Holdings by value">
        {empty ? (
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
      </BarChart>

      <BarChart title="Daily change">
        {empty ? (
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
      </BarChart>
    </div>
  );
}
