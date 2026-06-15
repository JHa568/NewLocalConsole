import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import Finance from "./Finance";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe("Finance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it("adds a stock position via the form", async () => {
    render(<Finance />);
    await waitFor(() => expect(screen.getByTestId("finance")).toBeInTheDocument());

    await userEvent.type(screen.getByPlaceholderText("Ticker e.g. CBA.AX"), "VAS.AX");
    await userEvent.type(screen.getByPlaceholderText("Qty"), "5");
    await userEvent.type(screen.getByPlaceholderText("Avg cost"), "80");

    const stockForm = screen
      .getByPlaceholderText("Ticker e.g. CBA.AX")
      .closest("form")!;
    await userEvent.click(stockForm.querySelector("button[type=submit]")!);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/finance/stocks/", {
        ticker: "VAS.AX",
        quantity: "5",
        avg_cost: "80",
      }),
    );
  });
});
