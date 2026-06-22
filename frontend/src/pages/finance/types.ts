export interface Income {
  id: number;
  source: string;
  amount: string;
  period: string;
  monthly_equivalent: number;
}

export interface Rent {
  id: number;
  period: string;
  amount: string;
  paid: boolean;
}

export interface Stock {
  id: number;
  ticker: string;
  quantity: string;
  avg_cost: string;
  price: number | null;
  change_pct: number | null;
  market_value: number | null;
}

export interface Balance {
  id: number;
  label: string;
  amount: string;
}
