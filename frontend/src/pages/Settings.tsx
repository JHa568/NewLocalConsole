import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="p-6" data-testid="settings">
      <h2 className="mb-4 text-xl">Settings</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass p-5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">
            Appearance
          </div>
          <p className="mt-1.5 mb-4 text-sm text-muted">
            Choose how NewLocalConsole looks on this device.
          </p>
          <div className="flex gap-2">
            <button
              className={theme === "dark" ? "" : "bg-panel-2 text-text"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              className={theme === "light" ? "" : "bg-panel-2 text-text"}
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
      </div>
    </div>
  );
}
