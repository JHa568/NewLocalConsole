import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(() => null),
  setAuthLostHandler: vi.fn(),
  setTokens: vi.fn(),
}));

const startAuthentication = vi.fn();
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: (...args: unknown[]) => startAuthentication(...args),
  startRegistration: vi.fn(),
}));

function Harness() {
  const { user, login } = useAuth();
  return (
    <div>
      <div data-testid="user">{user?.username ?? "anon"}</div>
      <button onClick={() => login("alice", "pw")}>login</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs in directly when no second factor is required", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { mfa_required: false, tokens: { access: "a", refresh: "r" } },
    });
    vi.mocked(api.get).mockResolvedValue({ data: { username: "alice" } });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("anon"));
    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("alice"));
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it("runs the WebAuthn ceremony when MFA is required", async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          mfa_required: true,
          mfa_token: "tok",
          webauthn_options: { challenge: "x" },
        },
      })
      .mockResolvedValueOnce({ data: { tokens: { access: "a", refresh: "r" } } });
    vi.mocked(api.get).mockResolvedValue({ data: { username: "alice" } });
    startAuthentication.mockResolvedValue({ id: "cred" });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("anon"));

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(startAuthentication).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("alice"));
  });
});
