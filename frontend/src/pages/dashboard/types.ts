export interface Position {
  id: number;
  ticker: string;
  quantity: string;
  price: number | null;
  change_pct: number | null;
  market_value: number | null;
}

export interface Summary {
  monthly_income: number;
  rent_status: { period: string; exists: boolean; paid: boolean; amount: number | null };
  portfolio_value: number;
  positions: Position[];
  balances_total: number;
  net_worth_estimate: number;
}
