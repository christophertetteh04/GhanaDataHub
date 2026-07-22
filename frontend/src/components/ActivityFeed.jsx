import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Upload, TrendingUp, Database, Activity } from "lucide-react";
import { datasetsApi, dashboardApi } from "../services/api";

// Same charCode hash as NewsPage/Dataset card
function getAvatarBg(name) {
  if (!name) return "var(--green)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colours = ["#006B3F", "#1D4ED8", "#7C3AED", "#B45309", "#0F766E", "#BE185D"];
  return colours[Math.abs(hash) % colours.length];
}

function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [platformTotals, setPlatformTotals] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const fetchFeed = async () => {
    setIsRefreshing(true);
    try {
      const [dsRes, dashRes] = await Promise.allSettled([
        datasetsApi.list({ sort_by: "created_at", sort_dir: "desc", per_page: 10, limit: 10 }),
        dashboardApi.stats(),
      ]);

      if (dsRes.status === "fulfilled") {
        const data = dsRes.value?.data;
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        setDatasets(items);
      }
      if (dashRes.status === "fulfilled") {
        setPlatformTotals(dashRes.value?.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, 60000);
    return () => clearInterval(id);
  }, []);

  const feedItems = useMemo(() => {
    let items = [];

    // Platform event
    if (platformTotals?.total_datasets > 0) {
      items.push({
        id: "platform-total",
        type: "platform",
        icon: Database,
        iconBg: "var(--green-pale, #DCFCE7)",
        iconColor: "var(--green)",
        action: `GhanaDataHub now hosts ${platformTotals.total_datasets} datasets`,
        subject: "Platform milestone",
        time: "platform update",
        onClick: null,
      });
    }

    datasets.forEach((ds) => {
      // Upload event
      items.push({
        id: `up-${ds.id}`,
        type: "upload",
        avatarInitial: ds.owner?.full_name?.[0]?.toUpperCase() || "U",
        avatarBg: getAvatarBg(ds.owner?.full_name),
        action: `${ds.owner?.full_name || "A user"} published a new dataset`,
        subject: ds.title,
        time: timeAgo(ds.created_at),
        onClick: () => navigate(`/datasets/${ds.id}`),
      });

      // Milestone event
      if (ds.download_count && ds.download_count >= 10 && ds.download_count % 10 === 0) {
        items.push({
          id: `dl-${ds.id}-${ds.download_count}`,
          type: "milestone",
          icon: TrendingUp,
          iconBg: "rgba(245, 158, 11, 0.15)",
          iconColor: "var(--gold, #F59E0B)",
          action: `Dataset reached ${ds.download_count} downloads`,
          subject: ds.title,
          time: "recently",
          onClick: () => navigate(`/datasets/${ds.id}`),
        });
      }
    });

    return items;
  }, [datasets, platformTotals, navigate]);

  return (
    <div className="af-card">
      <style>{afStyles}</style>
      
      <div className="af-head">
        <span className="af-title">Platform Activity</span>
        {isRefreshing && <RefreshCw size={14} color="var(--green)" className="af-spin" />}
      </div>

      <div className="af-list">
        {feedItems.length === 0 && !isRefreshing ? (
          <div className="af-empty">
            <Activity size={32} color="var(--gray-300)" />
            <div className="af-empty-title">No recent activity yet</div>
            <div className="af-empty-sub" onClick={() => navigate("/datasets")}>
              Upload a dataset to get started
            </div>
          </div>
        ) : (
          feedItems.map((item, idx) => (
            <div 
              key={item.id} 
              className="af-item fadeSlideIn" 
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={item.onClick}
              data-clickable={!!item.onClick}
            >
              <div 
                className="af-avatar"
                style={{ 
                  background: item.avatarBg || item.iconBg, 
                  color: item.iconColor || "#fff" 
                }}
              >
                {item.type === "upload" ? item.avatarInitial : <item.icon size={16} />}
              </div>
              <div className="af-body">
                <div className="af-action">{item.action}</div>
                <div className="af-subject">{item.subject}</div>
                <div className="af-time">{item.time}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="af-foot">
        Auto-refreshes every minute
      </div>
    </div>
  );
}

const afStyles = `
  .af-card {
    background: var(--surface-card);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    height: 480px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .af-head {
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    padding: 16px 18px 12px;
    border-bottom: 1px solid var(--gray-100);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }
  .af-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-900);
    font-family: 'Sora', sans-serif;
  }
  .af-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin { 100% { transform: rotate(360deg); } }

  .af-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--green-pale, #DCFCE7) transparent;
  }
  .af-list::-webkit-scrollbar { width: 6px; }
  .af-list::-webkit-scrollbar-thumb { background: var(--green-pale, #DCFCE7); border-radius: 6px; }

  .af-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 18px;
    border-bottom: 1px solid rgba(0,0,0,0.04);
    transition: background 0.15s;
  }
  .af-item[data-clickable="true"] {
    cursor: pointer;
  }
  .af-item[data-clickable="true"]:hover {
    background: rgba(0,107,63,0.02);
  }

  .af-avatar {
    width: 32px;
    height: 32px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .af-body {
    flex: 1;
    min-width: 0;
  }
  .af-action {
    font-size: 13px;
    color: var(--dark, #111827);
    font-weight: 500;
    line-height: 1.4;
  }
  .af-subject {
    font-size: 12px;
    color: var(--green);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 2px 0;
  }
  .af-time {
    font-size: 11px;
    color: var(--gray-400);
  }

  .af-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
  }
  .af-empty-title {
    font-size: 13px;
    color: var(--gray-500);
    margin-top: 10px;
  }
  .af-empty-sub {
    font-size: 12px;
    color: var(--green);
    margin-top: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .af-foot {
    position: sticky;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    padding: 10px 18px;
    text-align: center;
    font-size: 11px;
    color: var(--gray-400);
    border-top: 1px solid var(--gray-100);
    z-index: 10;
  }
`;
