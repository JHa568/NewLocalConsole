import { useEffect, useState } from "react";
import { api } from "../api/client";

const money = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString(undefined, { style: "currency", currency: "AUD" });

interface Income {
  id: number;
  source: string;
  amount: string;
  period: string;
  monthly_equivalent: number;
}
interface Rent {
  id: number;
  period: string;
  amount: string;
  paid: boolean;
}
interface Stock {
  id: number;
  ticker: string;
  quantity: string;
  avg_cost: string;
  price: number | null;
  change_pct: number | null;
  market_value: number | null;
}
interface Balance {
  id: number;
  label: string;
  amount: string;
}

export default function Finance() {
  const [income, setIncome] = useState<Income[]>([]);
  const [rent, setRent] = useState<Rent[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);

  async function loadAll() {
    const [i, r, s, b] = await Promise.all([
      api.get<Income[]>("/finance/income/"),
      api.get<Rent[]>("/finance/rent/"),
      api.get<Stock[]>("/finance/stocks/"),
      api.get<Balance[]>("/finance/balances/"),
    ]);
    setIncome(i.data);
    setRent(r.data);
    setStocks(s.data);
    setBalances(b.data);
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6" data-testid="finance">
      <h2 className="text-xl">Finance</h2>

      <section className="glass p-5">
        <h3 className="mb-3 text-base">Income</h3>
        <AddIncome onAdded={loadAll} />
        <ul className="mt-3 list-none p-0">
          {income.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-b-0"
            >
              <span className="min-w-0 truncate">
                {it.source} — <span className="tabular-nums">{money(Number(it.amount))}</span>{" "}
                ({it.period})
              </span>
              <span className="pill shrink-0 bg-panel-2 text-muted tabular-nums">
                {money(it.monthly_equivalent)}/mo
              </span>
              <button
                className="shrink-0 bg-bad/90 px-2 py-1 text-xs"
                onClick={async () => {
                  await api.delete(`/finance/income/${it.id}/`);
                  loadAll();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-5">
        <h3 className="mb-3 text-base">Rent</h3>
        <AddRent onAdded={loadAll} />
        <ul className="mt-3 list-none p-0">
          {rent.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-b-0"
            >
              <span className="min-w-0 truncate">
                {it.period} — <span className="tabular-nums">{money(Number(it.amount))}</span>
              </span>
              <span className={`pill shrink-0 ${it.paid ? "bg-good/15 text-good" : "bg-bad/15 text-bad"}`}>
                {it.paid ? "Paid" : "Outstanding"}
              </span>
              <label className="m-0 flex shrink-0 flex-row items-center gap-1.5 text-text">
                <input
                  type="checkbox"
                  checked={it.paid}
                  onChange={async (e) => {
                    await api.patch(`/finance/rent/${it.id}/`, { paid: e.target.checked });
                    loadAll();
                  }}
                />
                Paid
              </label>
              <button
                className="shrink-0 bg-bad/90 px-2 py-1 text-xs"
                onClick={async () => {
                  await api.delete(`/finance/rent/${it.id}/`);
                  loadAll();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-5">
        <h3 className="mb-3 text-base">Stock portfolio</h3>
        <AddStock onAdded={loadAll} />
        <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                Ticker
              </th>
              <th className="border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                Qty
              </th>
              <th className="border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                Avg cost
              </th>
              <th className="border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                Price
              </th>
              <th className="border-b border-border p-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                Value
              </th>
              <th className="border-b border-border p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.id} className="hover:bg-panel-2/60">
                <td className="border-b border-border p-2 font-medium">{s.ticker}</td>
                <td className="border-b border-border p-2 tabular-nums">{s.quantity}</td>
                <td className="border-b border-border p-2 tabular-nums">
                  {money(Number(s.avg_cost))}
                </td>
                <td className="border-b border-border p-2 tabular-nums">{money(s.price)}</td>
                <td className="border-b border-border p-2 tabular-nums">
                  {money(s.market_value)}
                </td>
                <td className="border-b border-border p-2">
                  <button
                    className="bg-bad/90 px-2 py-1 text-xs"
                    onClick={async () => {
                      await api.delete(`/finance/stocks/${s.id}/`);
                      loadAll();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>

      <section className="glass p-5">
        <h3 className="mb-3 text-base">Other balances</h3>
        <AddBalance onAdded={loadAll} />
        <ul className="mt-3 list-none p-0">
          {balances.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-b-0"
            >
              <span className="min-w-0 truncate">
                {b.label} — <span className="tabular-nums">{money(Number(b.amount))}</span>
              </span>
              <button
                className="shrink-0 bg-bad/90 px-2 py-1 text-xs"
                onClick={async () => {
                  await api.delete(`/finance/balances/${b.id}/`);
                  loadAll();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AddIncome({ onAdded }: { onAdded: () => void }) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/income/", { source, amount, period });
        setSource("");
        setAmount("");
        onAdded();
      }}
    >
      <input className="min-w-[100px] flex-1" placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} required />
      <input className="min-w-[100px] flex-1" placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <select className="min-w-[100px] flex-1" value={period} onChange={(e) => setPeriod(e.target.value)}>
        <option value="weekly">Weekly</option>
        <option value="fortnightly">Fortnightly</option>
        <option value="monthly">Monthly</option>
        <option value="annual">Annual</option>
        <option value="one_off">One-off</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}

function AddRent({ onAdded }: { onAdded: () => void }) {
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/rent/", { period, amount, paid: false });
        setPeriod("");
        setAmount("");
        onAdded();
      }}
    >
      <input className="min-w-[100px] flex-1" type="date" value={period} onChange={(e) => setPeriod(e.target.value)} required />
      <input className="min-w-[100px] flex-1" placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
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

function AddBalance({ onAdded }: { onAdded: () => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/balances/", { label, amount });
        setLabel("");
        setAmount("");
        onAdded();
      }}
    >
      <input className="min-w-[100px] flex-1" placeholder="Label e.g. Savings" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <input className="min-w-[100px] flex-1" placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
  );
}
