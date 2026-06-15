import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import Dashboard from "./Dashboard";

vi.mock("../api/client", () => ({
  api: { get: vi.fn() },
}));

describe("Dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders summary stats and holdings", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        monthly_income: 6000,
        rent_status: { period: "2026-06-01", exists: true, paid: true, amount: 2200 },
        portfolio_value: 1500,
        positions: [
          {
            id: 1,
            ticker: "CBA.AX",
            quantity: "10",
            price: 150,
            change_pct: 1.2,
            market_value: 1500,
          },
        ],
        balances_total: 500,
        net_worth_estimate: 2000,
      },
    });

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByTestId("dashboard")).toBeInTheDocument());
    expect(screen.getByText("Monthly income")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("CBA.AX")).toBeInTheDocument();
    expect(screen.getByText("1.2%")).toBeInTheDocument();
  });
});
