import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

interface Credential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export default function RegisterKeyPage() {
  const { registerSecurityKey } = useAuth();
  const [name, setName] = useState("YubiKey");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [status, setStatus] = useState<"idle" | "registering">("idle");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const resp = await api.get<Credential[]>("/auth/webauthn/credentials/");
    setCredentials(resp.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("registering");
    try {
      await registerSecurityKey(name);
      await load();
    } catch {
      setError("Could not register the security key. Try again.");
    } finally {
      setStatus("idle");
    }
  }

  async function onDelete(id: string) {
    await api.delete(`/auth/webauthn/credentials/${id}/`);
    await load();
  }

  return (
    <div className="p-6">
      <h2 className="mb-1 text-xl">Security keys</h2>
      <p className="mb-4 text-sm text-muted">
        Register a YubiKey to use as your second factor. You'll be asked to touch
        it whenever you sign in.
      </p>

      <form className="glass mb-4 flex flex-wrap items-end gap-3 p-4" onSubmit={onRegister}>
        <label className="my-0 min-w-[160px] flex-1">
          Key name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {error && <p className="text-sm text-bad">{error}</p>}
        <button type="submit" disabled={status === "registering"}>
          {status === "registering" ? "Touch your key…" : "Register a new key"}
        </button>
      </form>

      <ul className="mt-2 flex flex-col gap-3 list-none p-0">
        {credentials.map((c) => (
          <li key={c.id} className="glass flex items-center justify-between gap-3 p-4">
            <div>
              <strong>{c.name}</strong>
              <div className="text-xs text-muted">
                Added {new Date(c.created_at).toLocaleDateString()}
                {c.last_used_at &&
                  ` · last used ${new Date(c.last_used_at).toLocaleDateString()}`}
              </div>
            </div>
            <button className="bg-bad/90 px-3 py-1.5 text-xs" onClick={() => onDelete(c.id)}>
              Remove
            </button>
          </li>
        ))}
        {credentials.length === 0 && (
          <li className="text-sm text-muted">No security keys registered yet.</li>
        )}
      </ul>
    </div>
  );
}
