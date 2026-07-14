import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Database, Bell, TrendingUp, Clock, X, CheckCircle } from "lucide-react";
import api, { datasetsApi, dashboardApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "a while ago";
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 60) {
    const mins = Math.max(1, diffMins);
    return `${mins} minutes ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays < 7) {
    if (diffDays === 1) return "yesterday";
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    return `${diffWeeks} weeks ago`;
  }
  return "a while ago";
}

export default function SinceLastVisit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [newDatasets, setNewDatasets] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [growthCount, setGrowthCount] = useState(0);

  // Timestamp and dropdown states
  const [lastVisitTimestamp, setLastVisitTimestamp] = useState(null);
  const [showDatasetsDropdown, setShowDatasetsDropdown] = useState(false);

  const firstName = user?.full_name?.split(" ")?.[0] || "";

  useEffect(() => {
    // 1. Read last visit from localStorage
    const storedLastVisit = localStorage.getItem("gdh_last_visit");
    const lastVisitTime = storedLastVisit ? parseInt(storedLastVisit, 10) : null;
    setLastVisitTimestamp(lastVisitTime);

    // 2. Read last dataset count from localStorage
    const storedDatasetCount = localStorage.getItem("gdh_last_dataset_count");
    const lastDatasetCount = storedDatasetCount ? parseInt(storedDatasetCount, 10) : null;

    const fetchData = async () => {
      try {
        const [dsRes, notifRes, statsRes] = await Promise.all([
          datasetsApi.list({ sort_by: "created_at", sort_dir: "desc", per_page: 50 }),
          api.get("/notifications/", { params: { per_page: 10 } }),
          dashboardApi.stats(),
        ]);

        // Process new datasets since last visit
        const dsData = dsRes.data;
        const allDatasets = Array.isArray(dsData)
          ? dsData
          : Array.isArray(dsData?.items)
          ? dsData.items
          : [];

        if (lastVisitTime) {
          const filtered = allDatasets.filter((ds) => {
            const createdAt = new Date(ds.created_at).getTime();
            return createdAt > lastVisitTime;
          });
          setNewDatasets(filtered);
        } else {
          setNewDatasets([]);
        }

        // Process unread notifications
        const notifications = Array.isArray(notifRes.data)
          ? notifRes.data
          : Array.isArray(notifRes.data?.items)
          ? notifRes.data.items
          : [];
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        setUnreadNotificationsCount(unreadCount);

        // Process platform growth
        const currentCount = statsRes.data?.total_datasets ?? 0;
        if (lastDatasetCount !== null && currentCount > lastDatasetCount) {
          setGrowthCount(currentCount - lastDatasetCount);
        } else {
          setGrowthCount(0);
        }

        // Update dataset count in localStorage
        localStorage.setItem("gdh_last_dataset_count", currentCount.toString());
      } catch (err) {
        console.error("Error loading SinceLastVisit data:", err);
      } finally {
        // Update last visit timestamp in localStorage
        localStorage.setItem("gdh_last_visit", Date.now().toString());
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (dismissed || loading) return null;

  const isAllUpToDate =
    lastVisitTimestamp !== null &&
    newDatasets.length === 0 &&
    unreadNotificationsCount === 0 &&
    growthCount === 0;

  return (
    <div className="slv-card fade-in">
      <style>{slvStyles}</style>
      <div className="slv-header">
        <span className="slv-title">Since Your Last Visit</span>
        <button
          className="slv-dismiss-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss panel"
        >
          <X size={14} />
        </button>
      </div>

      {isAllUpToDate ? (
        <div className="slv-up-to-date">
          <CheckCircle size={16} color="var(--green)" />
          <span>Welcome back! Everything is up to date.</span>
        </div>
      ) : (
        <>
          <div className="slv-greeting">
            Welcome back, <strong>{firstName}</strong>. Here is what happened since you were last here.
          </div>
          <div className="slv-items-row">
            {/* Item 1 - New Datasets */}
            {newDatasets.length > 0 && (
              <div className="slv-pill-wrapper">
                <button
                  className="slv-pill slv-clickable"
                  onClick={() => setShowDatasetsDropdown(!showDatasetsDropdown)}
                >
                  <span className="slv-icon">
                    <Database size={16} />
                  </span>
                  <span>{newDatasets.length} new datasets added</span>
                </button>
                {showDatasetsDropdown && (
                  <div className="slv-dropdown">
                    <div className="slv-dropdown-title">New Datasets</div>
                    <div className="slv-dropdown-list">
                      {newDatasets.slice(0, 5).map((ds) => (
                        <Link
                          key={ds.id}
                          to={`/datasets/${ds.id}`}
                          className="slv-dropdown-link"
                          onClick={() => setShowDatasetsDropdown(false)}
                        >
                          {ds.title}
                        </Link>
                      ))}
                    </div>
                    <Link
                      to="/datasets"
                      className="slv-dropdown-view-all"
                      onClick={() => setShowDatasetsDropdown(false)}
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Item 2 - Unread Notifications */}
            {unreadNotificationsCount > 0 && (
              <button
                className="slv-pill slv-clickable"
                onClick={() => navigate("/notifications")}
              >
                <span className="slv-icon">
                  <Bell size={16} />
                </span>
                <span>{unreadNotificationsCount} unread notifications</span>
              </button>
            )}

            {/* Item 3 - Platform Growth */}
            {growthCount > 0 && (
              <div className="slv-pill">
                <span className="slv-icon">
                  <TrendingUp size={16} />
                </span>
                <span>Platform grew by {growthCount} datasets since your last visit</span>
              </div>
            )}

            {/* Item 4 - Time since last visit */}
            <div className="slv-pill">
              <span className="slv-icon">
                <Clock size={16} />
              </span>
              <span>
                {lastVisitTimestamp
                  ? `Last visited ${formatTimeAgo(lastVisitTimestamp)}`
                  : "Welcome! This is your first visit."}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const slvStyles = `
  .slv-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    padding: 16px 20px;
    margin-bottom: 20px;
    border-left: 4px solid var(--green, #006B3F);
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
  }
  .slv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .slv-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--green, #006B3F);
    font-family: 'Sora', sans-serif;
  }
  .slv-dismiss-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--gray-400, #9CA3AF);
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
  }
  .slv-dismiss-btn:hover {
    background: var(--gray-100, #F3F4F6);
    color: var(--gray-700, #374151);
  }
  .slv-greeting {
    font-size: 13px;
    color: var(--gray-700, #374151);
    line-height: 1.4;
  }
  .slv-items-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
  @media (max-width: 768px) {
    .slv-items-row {
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
    }
    .slv-pill-wrapper {
      width: 100%;
    }
    .slv-pill {
      width: 100%;
    }
  }
  .slv-pill-wrapper {
    position: relative;
  }
  .slv-pill {
    background: var(--green-pale, rgba(0, 107, 63, 0.08));
    border: none;
    border-radius: 99px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--dark, #1F2937);
    font-family: inherit;
    text-align: left;
  }
  .slv-clickable {
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
  }
  .slv-clickable:hover {
    background: rgba(0, 107, 63, 0.15);
  }
  .slv-icon {
    color: var(--green, #006B3F);
    display: flex;
    align-items: center;
  }
  .slv-up-to-date {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--dark, #1F2937);
    padding: 4px 0;
  }
  .slv-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 100;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--gray-200, #E5E7EB);
    padding: 12px;
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .slv-dropdown-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--gray-500, #6B7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .slv-dropdown-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .slv-dropdown-link {
    font-size: 12px;
    color: var(--gray-700, #374151);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.15s;
    display: block;
  }
  .slv-dropdown-link:hover {
    color: var(--green, #006B3F);
    text-decoration: underline;
  }
  .slv-dropdown-view-all {
    font-size: 11px;
    font-weight: 600;
    color: var(--green, #006B3F);
    text-decoration: none;
    align-self: flex-start;
    margin-top: 4px;
    display: block;
  }
  .slv-dropdown-view-all:hover {
    text-decoration: underline;
  }
`;
