import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Database,
  Search,
  Building2,
  Users,
  Bell,
  FileText,
  LogOut,
  Tag,
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
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayRole = user?.role ? user.role.replace("_", " ") : "";

  return (
    <aside className="sidebar sidebar-premium">
      <style>{`
        .sidebar-premium {
          background: var(--white);
          color: var(--gray-900);
          border-right: 1px solid var(--gray-300);
          padding: 14px 0;
          width: 240px;
        }

        .sidebar-logo {
          padding: 18px 18px 12px;
          margin-bottom: 6px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 48px;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(0,107,63,0.08);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 800;
          box-shadow: 0 10px 22px rgba(0,0,0,0.06);
          flex-shrink: 0;
        }

        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.1;
          color: var(--green);
        }

        .brand-sub {
          font-size: 10px;
          opacity: 0.65;
          font-weight: 500;
          margin-top: 2px;
          color: var(--gray-700);
        }

        .sidebar-nav {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .sidebar-group {
          display: grid;
          gap: 10px;
        }

        .nav-section-label {
          padding: 0 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 900;
          color: var(--gray-500);
        }

        .sidebar-nav-list {
          display: grid;
          gap: 10px;
        }

        .nav-item {
          min-height: 44px;
          width: 100%;
          border-radius: 12px;
          color: var(--gray-700);
          margin: 0;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 11px;
          background: transparent;
          border: 0;
          font-size: 13.5px;
          font-weight: 650;
          transition: background-color 0.15s ease, transform 0.15s ease, color 0.15s ease;
          position: relative;
        }

        .nav-item-main {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .nav-item svg {
          color: #9CA3AF;
          transition: color 0.15s ease;
        }

        .nav-item span {
          color: #9CA3AF;
        }

        .nav-item:hover {
          background: var(--green-pale);
          transform: translateX(2px);
        }

        .nav-item:hover svg,
        .nav-item:hover span {
          color: var(--green);
        }

        .nav-item.active {
          background: var(--green-pale);
          color: var(--green);
          font-weight: 800;
        }

        .nav-item.active svg,
        .nav-item.active span {
          color: var(--green);
        }

        .nav-item.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          background: var(--green);
          border-radius: 999px;
        }

        .sidebar-footer {
          padding: 12px 10px 0;
          border-top: 0;
          margin-top: auto;
        }

        .upgrade-card {
          border-radius: 16px;
          padding: 14px 14px;
          background: linear-gradient(135deg, var(--green-pale), var(--white));
          border: 1px solid rgba(0,107,63,0.12);
          box-shadow: 0 18px 40px rgba(0,0,0,0.06);
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
        }

        .upgrade-card::after {
          content: "";
          position: absolute;
          inset: -40px -40px auto auto;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(0,107,63,0.08);
          transform: rotate(12deg);
        }

        .upgrade-title {
          font-family: 'Sora', sans-serif;
          font-weight: 900;
          color: var(--green);
          font-size: 14px;
          margin-bottom: 6px;
          position: relative;
          z-index: 1;
        }

        .upgrade-sub {
          font-size: 12.5px;
          color: var(--gray-700);
          font-weight: 600;
          opacity: 0.9;
          position: relative;
          z-index: 1;
          margin-bottom: 12px;
          line-height: 1.35;
        }

        .upgrade-btn {
          background: var(--green);
          color: var(--white);
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 13px;
          transition: transform 0.15s ease, background-color 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .upgrade-btn:hover {
          transform: translateY(-1px);
          background: #005a35;
        }

        .user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-radius: 16px;
          padding: 12px 12px;
          background: var(--green-pale);
          border: 1px solid rgba(0,107,63,0.12);
        }

        .user-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: rgba(0,107,63,0.08);
          color: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
          flex-shrink: 0;
        }

        .user-info {
          min-width: 0;
        }

        .user-name {
          font-size: 13px;
          font-weight: 900;
          color: var(--gray-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .user-role {
          font-size: 11px;
          font-weight: 700;
          color: var(--gray-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: capitalize;
        }

        .logout-btn {
          min-width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 0;
          background: rgba(255,255,255,0.7);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, transform 0.15s ease;
        }

        .logout-btn:hover {
          background: rgba(232,245,239,1);
          transform: translateY(-1px);
        }

        /* Mobile: keep existing index.css behavior (slide out). */
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
        <NavGroup label="MAIN" items={NAV} />
        <NavGroup label="MANAGE" items={FEATURE_NAV} />
        {isAdmin && <NavGroup label="SYSTEM" items={ADMIN_NAV} />}
      </nav>

      <div className="sidebar-footer">
        <div className="upgrade-card">
          <div className="upgrade-title">Upgrade to Pro</div>
          <div className="upgrade-sub">
            Unlock advanced analytics, faster processing, and priority support.
          </div>
          {/* If /pricing exists it will work; otherwise it will simply navigate without visual break. */}
          <a
            className="upgrade-btn"
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              navigate("/pricing");
            }}
          >
            Get Premium
          </a>
        </div>

        <div className="user-row">
          <div className="user-left">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{displayRole}</div>
            </div>
          </div>

          <button
            className="logout-btn"
            aria-label="Log out"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
