import Sidebar from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import SearchDropdown from "./SearchDropdown";

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
  const navigate = useNavigate();
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k) && (k === "/" ? pathname === "/" : true))?.[1] || "GhanaDataHub";

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main" style={{ marginLeft: "var(--sidebar-width, 240px)", transition: "margin-left 0.25s ease" }}>
        <div className="topbar">
          <span className="topbar-title">{title}</span>
          
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div 
              ref={searchContainerRef}
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '400px',
                display: pathname === '/search' ? 'none' : 'block' // hide topbar search when on search page
              }}
            >
              <div 
                className="search-bar" 
                style={{ 
                  background: 'var(--surface-elevated)', 
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <Search size={15} color="var(--gray-400)" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search datasets, stories..."
                  style={{ width: '100%' }}
                />
              </div>
              
              {showDropdown && searchQuery.length >= 2 && (
                <SearchDropdown 
                  query={searchQuery}
                  onSelectDataset={(d) => {
                    navigate(`/datasets/${d.id}`);
                    setShowDropdown(false);
                    setSearchQuery("");
                  }}
                  onSelectStory={(id) => {
                    navigate(`/insights/${id}`);
                    setShowDropdown(false);
                    setSearchQuery("");
                  }}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>

          <div className="topbar-actions">
            <DarkModeToggle />
          </div>
        </div>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
