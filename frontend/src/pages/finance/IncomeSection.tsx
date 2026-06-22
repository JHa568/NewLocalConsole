import { useState } from "react";
import { api } from "../../api/client";
import Card from "../../components/ui/Card";
import DeleteButton from "../../components/ui/DeleteButton";
import { money } from "../../lib/format";
import FinanceListItem from "./FinanceListItem";
import type { Income } from "./types";

export default function IncomeSection({
  income,
  onChanged,
}: {
  income: Income[];
  onChanged: () => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-base">Income</h3>
      <AddIncome onAdded={onChanged} />
      <ul className="mt-3 list-none p-0">
        {income.map((it) => (
          <FinanceListItem key={it.id}>
            <span className="min-w-0 truncate">
              {it.source} — <span className="tabular-nums">{money(it.amount)}</span> ({it.period})
            </span>
            <span className="pill shrink-0 bg-panel-2 text-muted tabular-nums">
              {money(it.monthly_equivalent)}/mo
            </span>
            <DeleteButton
              onClick={async () => {
                await api.delete(`/finance/income/${it.id}/`);
                onChanged();
              }}
            />
          </FinanceListItem>
        ))}
      </ul>
    </Card>
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
