import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  Database,
  Search,
  Newspaper,
  BookText,
  BookOpen,
  Building2,
  Users,
  Bell,
  FileText,
  LogOut,
  Tag,
  ShieldCheck,
  PanelLeftClose,
  Pin,
  Menu,
  X
} from "lucide-react";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profile", icon: Users, label: "My Profile" },
  { to: "/datasets", icon: Database, label: "Datasets" },
  { to: "/catalogue", icon: BookOpen, label: "Catalogue" },
  { to: "/categories", icon: LayoutGrid, label: "Categories" },
  { to: "/insights", icon: BookText, label: "Insights" },
  { to: "/pulse", icon: Newspaper, label: "Ghana Pulse" },
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
  { to: "/admin", icon: ShieldCheck, label: "Admin Panel" },
];

function readSidebarPinned() {
  try {
    return localStorage.getItem('gdh_sidebar_pinned') === 'true';
  } catch {
    return false;
  }
}

function writeSidebarPinned(value) {
  try {
    localStorage.setItem('gdh_sidebar_pinned', value);
  } catch {
    // Sidebar pinning is a preference; storage failures should not break auth.
  }
}

function NavGroup({ label, items, isExpanded, hoveredItem, setHoveredItem }) {
  return (
    <div className="sidebar-group">
      <div className={`nav-section-label sidebar-label ${!isExpanded ? 'hidden' : ''}`}>{label}</div>
      <div className="sidebar-nav-list">
        {items.map(({ to, icon: Icon, label: itemLabel }) => (
          <div key={to} style={{ position: 'relative' }} 
               onMouseEnter={() => setHoveredItem(itemLabel)}
               onMouseLeave={() => setHoveredItem(null)}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              style={{ 
                justifyContent: isExpanded ? 'flex-start' : 'center',
                paddingLeft: isExpanded ? 10 : 0,
                paddingRight: isExpanded ? 10 : 0,
              }}
            >
              <span className="nav-item-main" style={{ gap: isExpanded ? 11 : 0 }}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span className={`sidebar-label ${!isExpanded ? 'hidden' : ''}`}>{itemLabel}</span>
              </span>
            </NavLink>
            {!isExpanded && hoveredItem === itemLabel && (
              <div className="sidebar-tooltip">{itemLabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isPinned, setIsPinned] = useState(() => {
    return readSidebarPinned();
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    writeSidebarPinned(isPinned);
  }, [isPinned]);

  const isExpanded = isMobile ? true : (isPinned || isHovered);

  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', isExpanded ? '240px' : '64px');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [isExpanded, isMobile]);

  const handleMouseEnter = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const isAdmin = user?.role === "super_admin" || user?.role === "org_admin";
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "DG";

  const displayRole = user?.role ? user.role.replace("_", " ") : "";

  return (
    <>
      {isMobile && !mobileOpen && (
        <button 
          onClick={() => setMobileOpen(true)}
          style={{ position: 'fixed', top: 12, left: 16, zIndex: 101, background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
        >
          <Menu size={24} />
        </button>
      )}

      {isMobile && mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 105 }} 
        />
      )}

      <aside 
        className={`sidebar sidebar-premium ${!isExpanded && !isMobile ? 'collapsed' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          width: isMobile ? 240 : (isExpanded ? 240 : 64),
          transition: 'width 0.25s ease, transform 0.25s ease',
          transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          zIndex: 110
        }}
      >
        <style>{`
          .sidebar-premium {
            background: var(--surface-sidebar);
            color: var(--text-primary);
            border-right: 1px solid var(--border-subtle);
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
            color: var(--text-secondary);
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
            color: var(--text-muted);
          }

          .sidebar-nav-list {
            display: grid;
            gap: 10px;
          }

          .nav-item {
            min-height: 44px;
            width: 100%;
            border-radius: 12px;
            color: var(--text-secondary);
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
            color: var(--text-secondary);
            transition: color 0.15s ease;
          }

          .nav-item span {
            color: var(--text-secondary);
          }

          .nav-item:hover {
            background: rgba(0,163,92,0.08);
            transform: translateX(2px);
          }

          .nav-item:hover svg,
          .nav-item:hover span {
            color: var(--text-primary);
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
            border-top: 1px solid var(--border-subtle);
            margin-top: auto;
          }

          .upgrade-card {
            border-radius: 16px;
            padding: 14px 14px;
            background: linear-gradient(135deg, var(--green-pale), var(--surface-elevated));
            border: 1px solid var(--border-subtle);
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
            color: var(--text-secondary);
            font-weight: 600;
            opacity: 0.9;
            position: relative;
            z-index: 1;
            margin-bottom: 12px;
            line-height: 1.35;
          }

          .upgrade-btn {
            background: var(--green);
            color: var(--text-on-accent);
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
            background: var(--surface-elevated);
            border: 1px solid var(--border-subtle);
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
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
          }

          .user-role {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-secondary);
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
            background: var(--surface-card);
            color: var(--green);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.15s ease, transform 0.15s ease;
          }

          .logout-btn:hover {
            background: var(--green-pale);
            transform: translateY(-1px);
          }

          /* Appended Sidebar Behavior Styles */
          .sidebar.collapsed .nav-item.active { background: transparent; }
          .sidebar.collapsed .nav-item:hover { background: transparent; transform: none; }
          .sidebar-toggle-btn:hover { background: rgba(0,0,0,0.08) !important; }
        `}</style>

        <div className="sidebar-logo" style={{ position: 'relative' }}>
          <div className="brand" style={{ justifyContent: isExpanded ? 'flex-start' : 'center', paddingLeft: isExpanded ? 0 : 4 }}>
            <div className="logo-mark">GD</div>
            <div className={`sidebar-label ${!isExpanded ? 'hidden' : ''}`}>
              <div className="brand-name">GhanaDataHub</div>
              <div className="brand-sub">Data Management Platform</div>
            </div>
          </div>
          {!isMobile && isExpanded && (
            <button 
              onClick={() => setIsPinned(!isPinned)}
              style={{ 
                 position: 'absolute', right: 12, top: 22, 
                 width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 cursor: 'pointer', color: 'var(--gray-400)',
                 transition: 'background 0.15s'
              }}
              className="sidebar-toggle-btn"
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isPinned ? <PanelLeftClose size={16} /> : <Pin size={16} />}
            </button>
          )}
          {isMobile && (
            <button 
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', right: 12, top: 24, border: 'none', background: 'transparent', color: 'var(--gray-500)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavGroup label="MAIN" items={NAV} isExpanded={isExpanded} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />
          <NavGroup label="MANAGE" items={FEATURE_NAV} isExpanded={isExpanded} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />
          {isAdmin && <NavGroup label="SYSTEM" items={ADMIN_NAV} isExpanded={isExpanded} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />}
        </nav>

        <div className="sidebar-footer">
          <div className={`upgrade-card sidebar-label ${!isExpanded ? 'hidden' : ''}`} style={{ marginBottom: isExpanded ? 14 : 0 }}>
            <div className="upgrade-title">Upgrade to Pro</div>
            <div className="upgrade-sub">
              Unlock advanced analytics, faster processing, and priority support.
            </div>
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

          <div className="user-row" style={{ 
            padding: isExpanded ? '12px' : '12px 0', 
            justifyContent: isExpanded ? 'space-between' : 'center', 
            background: isExpanded ? 'var(--surface-elevated)' : 'transparent', 
            border: isExpanded ? '1px solid var(--border-subtle)' : 'none' 
          }}>
            <div className="user-left" style={{ gap: isExpanded ? 10 : 0 }}>
              <div className="avatar">{initials}</div>
              <div className={`user-info sidebar-label ${!isExpanded ? 'hidden' : ''}`}>
                <div className="user-name">{user?.full_name || "Guest"}</div>
                <div className="user-role">{displayRole || "Public browser"}</div>
              </div>
            </div>

            <button
              className={`logout-btn sidebar-label ${!isExpanded ? 'hidden' : ''}`}
              aria-label={user ? "Log out" : "Log in"}
              onClick={() => {
                if (user) logout();
                navigate("/login");
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
