import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Database, Search, Building2,
  Users, Bell, FileText, LogOut, Tag
} from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/datasets", icon: Database, label: "Datasets" },
  { to: "/search", icon: Search, label: "Search" },
];

const FEATURE_NAV = [
  { to: "/notifications", icon: Bell, label: "Notifications" },
];

const ADMIN_NAV = [
  { to: "/organizations", icon: Building2, label: "Organizations" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/categories", icon: Tag, label: "Categories" },
  { to: "/audit", icon: FileText, label: "Audit Logs" },
];

function NavGroup({ label, items }) {
  return (
    <div className="sidebar-group">
      <div className="nav-section-label">{label}</div>
      <div className="sidebar-nav-list">
        {items.map(({ to, icon: Icon, label: itemLabel }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-item-main">
              <Icon size={17} />
              <span>{itemLabel}</span>
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "super_admin" || user?.role === "org_admin";
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <style>{`
        .sidebar {
          background: linear-gradient(180deg, var(--green) 0%, #075236 100%);
          padding: 14px;
        }

        .sidebar-logo {
          padding: 8px 6px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          margin-bottom: 8px;
        }

        .brand {
          min-height: 48px;
        }

        .logo-mark {
          box-shadow: 0 10px 22px rgba(0,0,0,0.16);
        }

        .brand-name {
          letter-spacing: 0;
        }

        .brand-sub {
          opacity: 0.62;
        }

        .sidebar-nav {
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sidebar-group {
          display: grid;
          gap: 10px;
        }

        .sidebar-nav-list {
          display: grid;
          gap: 12px;
        }

        .nav-section-label {
          padding: 0 10px;
          color: rgba(255,255,255,0.46);
          opacity: 1;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 800;
        }

        .nav-item {
          min-height: 42px;
          width: 100%;
          border-radius: 12px;
          color: rgba(255,255,255,0.74);
          margin: 0;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: transparent;
          border: 0;
          font-size: 13.5px;
          font-weight: 650;
          transition: all 0.2s ease;
        }

        .nav-item-main {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          color: var(--white);
          transform: translateX(2px);
        }

        .nav-item.active {
          background: var(--white);
          color: var(--green);
          font-weight: 800;
          box-shadow: 0 12px 28px rgba(0,0,0,0.14);
        }

        .sidebar-footer {
          padding: 0;
          border-top: 0;
        }

        .sidebar-user-card {
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 16px;
          background: rgba(255,255,255,0.1);
          box-shadow: 0 14px 32px rgba(0,0,0,0.12);
          padding: 14px;
        }

        .user-card {
          padding: 0;
          border-radius: 0;
          gap: 10px;
          margin-bottom: 13px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: var(--white);
          color: var(--green);
        }

        .user-name {
          color: var(--white);
          font-size: 13px;
          font-weight: 800;
        }

        .user-role {
          color: rgba(255,255,255,0.6);
          font-weight: 600;
        }

        .sidebar-card-title {
          color: var(--white);
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 12px;
        }

        .sidebar-logout {
          min-height: 36px;
          justify-content: center;
          background: var(--white);
          color: var(--green);
          font-weight: 800;
          box-shadow: none;
        }

        .sidebar-logout:hover {
          background: var(--green-pale);
          color: var(--green);
          transform: translateY(-1px);
        }
      `}</style>

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
        <NavGroup label="Main Menu" items={NAV} />
        <NavGroup label="Features" items={FEATURE_NAV} />
        {isAdmin && <NavGroup label="Admin" items={ADMIN_NAV} />}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-card">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role?.replace("_", " ")}</div>
            </div>
          </div>
          <div className="sidebar-card-title">Workspace access secured</div>
          <button
            className="nav-item sidebar-logout"
            onClick={() => { logout(); navigate("/login"); }}
          >
            <span className="nav-item-main">
              <LogOut size={15} />
              <span>Sign out</span>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
