import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Logo from "./Logo";

function Icon({ d, animKey }: { d: string; animKey: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`nav-icon nav-icon-${animKey} shrink-0`}
    >
      <path d={d} />
    </svg>
  );
}

const TABS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    animKey: "dashboard",
  },
  {
    to: "/finance",
    label: "Finance",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    animKey: "finance",
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: "M3 10h18M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    animKey: "calendar",
  },
  {
    to: "/console",
    label: "Console",
    icon: "M4 17l6-5-6-5M12 19h8",
    animKey: "console",
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col gap-4 p-2 sm:p-4">
      <header className="glass flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:gap-x-6 sm:px-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="truncate text-base font-semibold tracking-tight">
            Patientia
          </span>
        </div>
        <nav className="order-3 flex w-full flex-1 items-center gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                [
                  "group flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors",
                  isActive
                    ? "bg-accent text-ink"
                    : "text-muted hover:bg-panel-2 hover:text-text",
                ].join(" ")
              }
            >
              <Icon d={tab.icon} animKey={tab.animKey} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 border-l border-border pl-3 sm:gap-3 sm:pl-4">
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              [
                "group grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
                isActive ? "bg-accent text-ink" : "text-muted hover:bg-panel-2 hover:text-text",
              ].join(" ")
            }
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="nav-icon nav-icon-settings"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
          </NavLink>
          <span className="hidden truncate text-sm text-muted sm:inline">{user?.username}</span>
          <button className="bg-panel-2 text-text" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="glass min-w-0 flex-1 overflow-auto">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
