import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import { useAuth } from "../../auth/AuthContext";

/** Read-only account summary. */
export default function AccountCard() {
  const { user } = useAuth();

  const rows = [
    { label: "Username", value: user?.username },
    { label: "Email", value: user?.email },
    { label: "Security key", value: user?.has_security_key ? "Registered" : "Not registered" },
  ];

  return (
    <Card>
      <SectionLabel>Account</SectionLabel>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-muted">{r.label}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
