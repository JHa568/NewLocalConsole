import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import { useTheme } from "../../theme/ThemeContext";

const THEMES = [
  { id: "system", label: "System" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
] as const;

/** Theme preference picker. */
export default function AppearanceCard() {
  const { preference, setTheme } = useTheme();

  return (
    <Card>
      <SectionLabel>Appearance</SectionLabel>
      <p className="mt-1.5 mb-4 text-sm text-muted">Choose how Patientia looks on this device.</p>
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={preference === t.id ? "" : "bg-panel-2 text-text"}
            onClick={() => setTheme(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
