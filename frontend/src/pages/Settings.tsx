import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

interface Credential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export default function Settings() {
  const { preference, setTheme } = useTheme();
  const { user, registerSecurityKey } = useAuth();

  const [name, setName] = useState("YubiKey");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [status, setStatus] = useState<"idle" | "registering">("idle");
  const [error, setError] = useState<string | null>(null);

  async function loadCredentials() {
    const resp = await api.get<Credential[]>("/auth/webauthn/credentials/");
    setCredentials(resp.data);
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("registering");
    try {
      await registerSecurityKey(name);
      await loadCredentials();
    } catch {
      setError("Could not register the security key. Try again.");
    } finally {
      setStatus("idle");
    }
  }

  async function onDelete(id: string) {
    await api.delete(`/auth/webauthn/credentials/${id}/`);
    await loadCredentials();
  }

  return (
    <div className="p-3 sm:p-6" data-testid="settings">
      <h2 className="mb-4 text-xl">Settings</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">
            Appearance
          </div>
          <p className="mt-1.5 mb-4 text-sm text-muted">
            Choose how Patientia looks on this device.
          </p>
          <div className="flex gap-2">
            <button
              className={preference === "system" ? "" : "bg-panel-2 text-text"}
              onClick={() => setTheme("system")}
            >
              System
            </button>
            <button
              className={preference === "dark" ? "" : "bg-panel-2 text-text"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              className={preference === "light" ? "" : "bg-panel-2 text-text"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
          </div>
        </div>

        <div className="glass p-5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">
            Account
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Username</span>
              <span>{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Email</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Security key</span>
              <span>{user?.has_security_key ? "Registered" : "Not registered"}</span>
            </div>
          </div>
        </div>

        <div className="glass p-5 lg:col-span-2">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">
            Security keys
          </div>
          <p className="mt-1.5 mb-4 text-sm text-muted">
            Register a YubiKey to use as your second factor. You'll be asked to
            touch it whenever you sign in.
          </p>

          <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={onRegister}>
            <label className="my-0 min-w-[160px] flex-1">
              Key name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            {error && <p className="text-sm text-bad">{error}</p>}
            <button type="submit" disabled={status === "registering"}>
              {status === "registering" ? "Touch your key…" : "Register a new key"}
            </button>
          </form>

          <ul className="flex flex-col gap-3 list-none p-0">
            {credentials.map((c) => (
              <li
                key={c.id}
                className="bg-panel-2 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
              >
                <div className="min-w-0">
                  <strong className="truncate">{c.name}</strong>
                  <div className="text-xs text-muted">
                    Added {new Date(c.created_at).toLocaleDateString()}
                    {c.last_used_at &&
                      ` · last used ${new Date(c.last_used_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button className="shrink-0 bg-bad/90 px-3 py-1.5 text-xs" onClick={() => onDelete(c.id)}>
                  Remove
                </button>
              </li>
            ))}
            {credentials.length === 0 && (
              <li className="text-sm text-muted">No security keys registered yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
