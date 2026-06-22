import { useState } from "react";
import { api } from "../../api/client";
import Card from "../../components/ui/Card";
import DeleteButton from "../../components/ui/DeleteButton";
import { money } from "../../lib/format";
import type { Stock } from "./types";

const TH =
  "border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase";

export default function StocksSection({
  stocks,
  onChanged,
}: {
  stocks: Stock[];
  onChanged: () => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-base">Stock portfolio</h3>
      <AddStock onAdded={onChanged} />
      <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={TH}>Ticker</th>
              <th className={TH}>Qty</th>
              <th className={TH}>Avg cost</th>
              <th className={TH}>Price</th>
              <th className={TH}>Value</th>
              <th className="border-b border-border p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.id} className="hover:bg-panel-2/60">
                <td className="border-b border-border p-2 font-medium">{s.ticker}</td>
                <td className="border-b border-border p-2 tabular-nums">{s.quantity}</td>
                <td className="border-b border-border p-2 tabular-nums">{money(s.avg_cost)}</td>
                <td className="border-b border-border p-2 tabular-nums">{money(s.price)}</td>
                <td className="border-b border-border p-2 tabular-nums">{money(s.market_value)}</td>
                <td className="border-b border-border p-2">
                  <DeleteButton
                    onClick={async () => {
                      await api.delete(`/finance/stocks/${s.id}/`);
                      onChanged();
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AddStock({ onAdded }: { onAdded: () => void }) {
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/stocks/", { ticker, quantity, avg_cost: avgCost });
        setTicker("");
        setQuantity("");
        setAvgCost("");
        onAdded();
      }}
    >
      <input className="min-w-[100px] flex-1" placeholder="Ticker e.g. CBA.AX" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
      <input className="min-w-[100px] flex-1" placeholder="Qty" type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <input className="min-w-[100px] flex-1" placeholder="Avg cost" type="number" step="0.0001" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
  );
}
