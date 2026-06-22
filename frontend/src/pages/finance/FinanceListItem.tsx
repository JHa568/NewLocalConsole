import type { ReactNode } from "react";

/** A single row inside one of the finance list sections (income, rent, balances). */
export default function FinanceListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-b-0">
      {children}
    </li>
  );
}
