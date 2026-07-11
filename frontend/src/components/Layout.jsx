import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

const TITLES = {
  "/": "Dashboard",
  "/datasets": "Datasets",
  "/search": "Search",
  "/organizations": "Organizations",
  "/users": "Users",
  "/categories": "Categories",
  "/notifications": "Notifications",
  "/audit": "Audit Logs",
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k) && (k === "/" ? pathname === "/" : true))?.[1] || "GhanaDataHub";

  return (
    <div className="layout">
      <Sidebar />
      <div className="main" style={{ marginLeft: "var(--sidebar-width, 240px)", transition: "margin-left 0.25s ease" }}>
        <div className="topbar">
          <span className="topbar-title">{title}</span>
        </div>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
