import { useState } from "react";
import { api } from "../../api/client";
import Card from "../../components/ui/Card";
import DeleteButton from "../../components/ui/DeleteButton";
import { money } from "../../lib/format";
import FinanceListItem from "./FinanceListItem";
import type { Rent } from "./types";

export default function RentSection({
  rent,
  onChanged,
}: {
  rent: Rent[];
  onChanged: () => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-base">Rent</h3>
      <AddRent onAdded={onChanged} />
      <ul className="mt-3 list-none p-0">
        {rent.map((it) => (
          <FinanceListItem key={it.id}>
            <span className="min-w-0 truncate">
              {it.period} — <span className="tabular-nums">{money(it.amount)}</span>
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
                  onChanged();
                }}
              />
              Paid
            </label>
            <DeleteButton
              onClick={async () => {
                await api.delete(`/finance/rent/${it.id}/`);
                onChanged();
              }}
            />
          </FinanceListItem>
        ))}
      </ul>
    </Card>
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
