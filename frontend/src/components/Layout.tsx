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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">NewLocalConsole</div>
        <nav>
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="muted small">{user?.username}</div>
          <button className="link" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
