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
    <div className="centered">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>NewLocalConsole</h1>
        <p className="muted">Sign in with your password and security key.</p>

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
          <p className="muted" role="status">
            Touch your YubiKey to continue…
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={status === "submitting" || status === "mfa"}>
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
