import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "mfa">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      // login() will trigger the YubiKey prompt itself if MFA is required.
      setStatus("mfa");
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setStatus("idle");
      setError(messageFor(err));
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form className="glass w-[360px] p-7" onSubmit={onSubmit}>
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-warm to-accent text-base font-bold text-[#0b1220]">
          NL
        </span>
        <h1 className="mt-0 mb-1 text-2xl">NewLocalConsole</h1>
        <p className="mb-2 text-sm text-muted">
          Sign in with your password and security key.
        </p>

        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {status === "mfa" && (
          <p className="text-sm text-muted" role="status">
            Touch your YubiKey to continue…
          </p>
        )}
        {error && (
          <p className="text-sm text-bad" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 w-full"
          disabled={status === "submitting" || status === "mfa"}
        >
          {status === "idle" ? "Sign in" : "Verifying…"}
        </button>
      </form>
    </div>
  );
}

function messageFor(err: unknown): string {
  if (typeof err === "object" && err && "name" in err) {
    const name = (err as { name?: string }).name;
    if (name === "NotAllowedError" || name === "AbortError") {
      return "Security key prompt was cancelled or timed out.";
    }
  }
  if (
    typeof err === "object" &&
    err &&
    "response" in err &&
    (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
  ) {
    return (err as { response: { data: { detail: string } } }).response.data.detail;
  }
  return "Sign in failed. Check your credentials and try again.";
}
