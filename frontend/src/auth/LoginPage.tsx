import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <form className="glass w-[380px] max-w-full p-8" onSubmit={onSubmit}>
        <div className="mb-6 flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <div>
            <h1 className="m-0 text-lg leading-tight">Patientia</h1>
            <p className="m-0 text-xs text-muted">Sign in to continue</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="my-0">
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </label>
          <label className="my-0">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {status === "mfa" && (
          <p className="mt-3 mb-0 text-sm text-muted" role="status">
            Touch your YubiKey to continue…
          </p>
        )}
        {error && (
          <p className="mt-3 mb-0 text-sm text-bad" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-5 w-full"
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
