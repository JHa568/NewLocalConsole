import { useEffect, useState } from "react";
import { api } from "../api/client";
import Page from "../components/ui/Page";
import BalancesSection from "./finance/BalancesSection";
import IncomeSection from "./finance/IncomeSection";
import RentSection from "./finance/RentSection";
import StocksSection from "./finance/StocksSection";
import type { Balance, Income, Rent, Stock } from "./finance/types";

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
    <Page title="Finance" testId="finance">
      <div className="flex flex-col gap-4">
        <IncomeSection income={income} onChanged={loadAll} />
        <RentSection rent={rent} onChanged={loadAll} />
        <StocksSection stocks={stocks} onChanged={loadAll} />
        <BalancesSection balances={balances} onChanged={loadAll} />
      </div>
    </Page>
  );
}
