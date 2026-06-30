import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Database, Search, Building2,
  Users, Bell, FileText, LogOut, Settings, Tag
} from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/datasets", icon: Database, label: "Datasets" },
  { to: "/search", icon: Search, label: "Search" },
];

const ADMIN_NAV = [
  { to: "/organizations", icon: Building2, label: "Organizations" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/audit", icon: FileText, label: "Audit Logs" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "super_admin" || user?.role === "org_admin";
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">
          <div className="logo-mark">GD</div>
          <div>
            <div className="brand-name">GhanaDataHub</div>
            <div className="brand-sub">Data Management Platform</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Bell size={16} />
          Notifications
        </NavLink>

        {isAdmin && (
          <>
            <div className="nav-section-label" style={{ marginTop: 12 }}>Administration</div>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{user?.role?.replace("_", " ")}</div>
          </div>
        </div>
        <button
          className="nav-item"
          style={{ width: "100%", marginTop: 4 }}
          onClick={() => { logout(); navigate("/login"); }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
