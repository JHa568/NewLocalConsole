import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import CalendarPage from "./Calendar";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it("renders a month grid with weekday headers", async () => {
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByTestId("calendar")).toBeInTheDocument());
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("opens the create dialog and toggles to Task fields", async () => {
    render(<CalendarPage />);
    await waitFor(() => expect(screen.getByTestId("calendar")).toBeInTheDocument());

    await userEvent.click(screen.getByText("+ Add"));
    expect(screen.getByText("New item")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Task" }));
    // Task type shows a Notes field.
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });
});
