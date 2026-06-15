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
    <div className="page" data-testid="finance">
      <h2>Finance</h2>

      <section className="card">
        <h3>Income</h3>
        <AddIncome onAdded={loadAll} />
        <ul className="list">
          {income.map((it) => (
            <li key={it.id} className="row">
              <span>
                {it.source} — {money(Number(it.amount))} ({it.period})
              </span>
              <span className="muted small">{money(it.monthly_equivalent)}/mo</span>
              <button
                className="danger small"
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

      <section className="card">
        <h3>Rent</h3>
        <AddRent onAdded={loadAll} />
        <ul className="list">
          {rent.map((it) => (
            <li key={it.id} className="row">
              <span>
                {it.period} — {money(Number(it.amount))}
              </span>
              <label className="inline">
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
                className="danger small"
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

      <section className="card">
        <h3>Stock portfolio</h3>
        <AddStock onAdded={loadAll} />
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Qty</th>
              <th>Avg cost</th>
              <th>Price</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={s.id}>
                <td>{s.ticker}</td>
                <td>{s.quantity}</td>
                <td>{money(Number(s.avg_cost))}</td>
                <td>{money(s.price)}</td>
                <td>{money(s.market_value)}</td>
                <td>
                  <button
                    className="danger small"
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
      </section>

      <section className="card">
        <h3>Other balances</h3>
        <AddBalance onAdded={loadAll} />
        <ul className="list">
          {balances.map((b) => (
            <li key={b.id} className="row">
              <span>
                {b.label} — {money(Number(b.amount))}
              </span>
              <button
                className="danger small"
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
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/income/", { source, amount, period });
        setSource("");
        setAmount("");
        onAdded();
      }}
    >
      <input placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} required />
      <input placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <select value={period} onChange={(e) => setPeriod(e.target.value)}>
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
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/rent/", { period, amount, paid: false });
        setPeriod("");
        setAmount("");
        onAdded();
      }}
    >
      <input type="date" value={period} onChange={(e) => setPeriod(e.target.value)} required />
      <input placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/stocks/", { ticker, quantity, avg_cost: avgCost });
        setTicker("");
        setQuantity("");
        setAvgCost("");
        onAdded();
      }}
    >
      <input placeholder="Ticker e.g. CBA.AX" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
      <input placeholder="Qty" type="number" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <input placeholder="Avg cost" type="number" step="0.0001" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
  );
}

function AddBalance({ onAdded }: { onAdded: () => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await api.post("/finance/balances/", { label, amount });
        setLabel("");
        setAmount("");
        onAdded();
      }}
    >
      <input placeholder="Label e.g. Savings" value={label} onChange={(e) => setLabel(e.target.value)} required />
      <input placeholder="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <button type="submit">Add</button>
    </form>
  );
}
