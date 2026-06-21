import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const TABS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/finance", label: "Finance" },
  { to: "/calendar", label: "Calendar" },
  { to: "/console", label: "Console" },
  { to: "/security", label: "Security keys" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <header className="glass flex shrink-0 items-center gap-6 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-warm to-accent text-sm font-bold text-[#0b1220]">
            NL
          </span>
          <span className="truncate text-base font-semibold tracking-tight">
            NewLocalConsole
          </span>
        </div>
        <nav className="flex flex-1 items-center gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
                  isActive
                    ? "bg-accent text-[#0b1220]"
                    : "text-muted hover:bg-panel-2 hover:text-text",
                ].join(" ")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              [
                "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
                isActive ? "bg-accent text-[#0b1220]" : "text-muted hover:bg-panel-2 hover:text-text",
              ].join(" ")
            }
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
          </NavLink>
          <span className="truncate text-sm text-muted">{user?.username}</span>
          <button className="bg-panel-2 text-text" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="glass min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
