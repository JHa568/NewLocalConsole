import { useState } from "react";
import { api } from "../../api/client";
import Card from "../../components/ui/Card";
import DeleteButton from "../../components/ui/DeleteButton";
import { money } from "../../lib/format";
import FinanceListItem from "./FinanceListItem";
import type { Balance } from "./types";

export default function BalancesSection({
  balances,
  onChanged,
}: {
  balances: Balance[];
  onChanged: () => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-base">Other balances</h3>
      <AddBalance onAdded={onChanged} />
      <ul className="mt-3 list-none p-0">
        {balances.map((b) => (
          <FinanceListItem key={b.id}>
            <span className="min-w-0 truncate">
              {b.label} — <span className="tabular-nums">{money(b.amount)}</span>
            </span>
            <DeleteButton
              onClick={async () => {
                await api.delete(`/finance/balances/${b.id}/`);
                onChanged();
              }}
            />
          </FinanceListItem>
        ))}
      </ul>
    </Card>
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
