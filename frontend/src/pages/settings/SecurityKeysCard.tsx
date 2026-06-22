import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import Card from "../../components/ui/Card";
import DeleteButton from "../../components/ui/DeleteButton";
import SectionLabel from "../../components/ui/SectionLabel";

interface Credential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

/** Register and manage WebAuthn security keys (YubiKeys). */
export default function SecurityKeysCard() {
  const { registerSecurityKey } = useAuth();

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
    <Card className="lg:col-span-2">
      <SectionLabel>Security keys</SectionLabel>
      <p className="mt-1.5 mb-4 text-sm text-muted">
        Register a YubiKey to use as your second factor. You'll be asked to touch it whenever you
        sign in.
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
            <DeleteButton label="Remove" className="px-3 py-1.5" onClick={() => onDelete(c.id)} />
          </li>
        ))}
        {credentials.length === 0 && (
          <li className="text-sm text-muted">No security keys registered yet.</li>
        )}
      </ul>
    </Card>
  );
}
