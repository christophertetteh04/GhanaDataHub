import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, notifApi } from "../services/api";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  Bell,
  Building2,
  Database,
  Download,
  HardDrive,
  Users,
  Lock,
  Globe,
  Share2,
  Upload,
  TrendingUp,
  ShieldCheck,
  FileText,
  Circle,
} from "lucide-react";

import useCountUp from "../hooks/useCountUp";

const VIS_LABELS = {
  public: "Public",
  private: "Private",
  organization: "Organization",
  shared_link: "Shared Link",
};

const VIS_COLORS = {
  public: "var(--green)",
  private: "#EF4444",
  organization: "#3B82F6",
  shared_link: "var(--gold)",
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatShortDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatShortDate(value);
}

function fileTypeVisualColor(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("csv")) return "#22C55E";
  if (t.includes("json")) return "#3B82F6";
  if (t.includes("excel") || t.includes("xls")) return "#F59E0B";
  if (t.includes("pdf")) return "#EF4444";
  return "#9CA3AF";
}

function fileTypeLabel(type) {
  if (!type) return "Dataset";
  return type.split("/").pop()?.toUpperCase() || type;
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

function clampTitle(s, max = 42) {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function EmptyState({ children }) {
  return <div className="dash-empty">{children}</div>;
}

function Skeleton({ className }) {
  return <div className={`dash-skeleton ${className || ""}`} />;
}

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      <div className="dash-tooltip-value">{payload[0].value} uploads</div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadPeriod, setUploadPeriod] = useState("monthly");
  const [notifUnreadCount, setNotifUnreadCount] = useState(null);

  useEffect(() => {
    dashboardApi
      .stats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    notifApi
      .list()
      .then((r) => {
        const unread = (r.data || []).filter((n) => !n.is_read).length;
        setNotifUnreadCount(unread);
      })
      .catch(() => setNotifUnreadCount(0));
  }, []);

  const visibilityData = stats?.datasets_by_visibility || [];
  const mostDownloaded = stats?.most_downloaded || [];
  const recentUploads = stats?.recent_uploads || [];
  const monthlyUploads = stats?.monthly_uploads || [];

  const firstName = user?.full_name?.split(" ")?.[0] || "";
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  const datasetCount = stats?.total_datasets ?? 0;
  const userCount = stats?.total_users ?? 0;
  const orgCount = stats?.total_organizations ?? 0;

  const storageBytes = stats?.total_storage_bytes ?? 0;
  const storageNumber = useMemo(() => {
    // parse number from formatBytes is not possible reliably; animate raw bytes in GB scale.
    return storageBytes / 1024 ** 3;
  }, [storageBytes]);

  const animateDatasets = useCountUp(datasetCount);
  const animateUsers = useCountUp(userCount);
  const animateOrgs = useCountUp(orgCount);
  const animateStorageGb = useCountUp(storageNumber);

  const storageDisplay = `${animateStorageGb.toFixed(1)} GB`;

  const unread = notifUnreadCount ?? 0;

  // My activity computed client-side (no new API calls)
  const myRecent = recentUploads.filter(
    (d) => d.owner_id && d.owner_id === user?.id,
  );
  const myDatasetsCount = myRecent.length ? myRecent.length : datasetCount;

  const myOrgLabel = stats?.organizations?.find?.(
    (o) => o.id === user?.organization_id,
  )?.name;

  if (loading) {
    return (
      <div className="dashboard-page fade-in">
        <style>{dashboardStyles}</style>
        <div className="dash-wrap">
          <div className="dash-greet">
            <Skeleton className="w-220 h-18" />
            <Skeleton className="w-160 h-40" />
          </div>
          <div className="dash-toolbar">
            {["Filter", "This Month", "Download Report"].map((t) => (
              <Skeleton key={t} className="h-36 w-160" />
            ))}
          </div>
          <div className="dash-stat-row">
            {[1, 2, 3, 4].map((i) => (
              <div className="dash-stat-card" key={i}>
                <Skeleton className="stat-icon" />
                <Skeleton className="w-110 h-12" />
                <Skeleton className="w-180 h-28" />
                <Skeleton className="w-120 h-18" />
              </div>
            ))}
          </div>

          <div className="dash-bento">
            <div className="bento-a1 cardpad">
              <Skeleton className="w-100 h-300" />
            </div>
            <div className="bento-a2 cardpad">
              <Skeleton className="w-100 h-300" />
            </div>
            <div className="bento-b1 cardpad">
              <Skeleton className="w-100 h-280" />
            </div>
            <div className="bento-b2 cardpad">
              <Skeleton className="w-100 h-280" />
            </div>
            <div className="bento-b3 cardpad">
              <Skeleton className="w-100 h-280" />
            </div>
            <div className="bento-c1 cardpad">
              <Skeleton className="w-100 h-300" />
            </div>
            <div className="bento-c2 cardpad">
              <Skeleton className="w-100 h-300" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div>Failed to load dashboard.</div>;

  const spotlight = mostDownloaded[0] || null;
  const periodData =
    uploadPeriod === "monthly" ? monthlyUploads : monthlyUploads;

  const datasetClick = (to) => () => navigate(to);

  return (
    <div className="dashboard-page fade-in">
      <style>{dashboardStyles}</style>
      <div className="dash-wrap">
        <div className="dash-header">
          <div className="dash-greet">
            <div>
              <div className="dash-greet-line">
                <span>{greeting} </span>
                <span className="dash-greet-name">{firstName}</span>
              </div>
              <div className="dash-sub">Platform overview and analytics</div>
            </div>
          </div>

          <div className="dash-header-actions">
            <button
              className="dash-green-btn"
              onClick={() => navigate("/datasets")}
            >
              + Upload Dataset
            </button>
          </div>
        </div>

        <div className="dash-toolbar">
          <button className="dash-tool-btn" type="button">
            Filter
          </button>
          <button className="dash-tool-btn" type="button">
            This Month
          </button>
          <button
            className="dash-tool-btn dash-tool-btn-primary"
            type="button"
            onClick={() => window.print()}
          >
            Download Report
          </button>
        </div>

        <div className="dash-stat-row">
          <button
            className="dash-stat-card"
            onClick={datasetClick("/datasets")}
          >
            <div className="dash-stat-icon">
              <Database size={18} />
            </div>
            <div className="dash-stat-label">Total Datasets</div>
            <div className="dash-stat-value">
              {Math.round(animateDatasets).toLocaleString()}
            </div>
            <div className="dash-delta dash-delta-green">+ Trend</div>
          </button>

          <button className="dash-stat-card" onClick={datasetClick("/users")}>
            <div className="dash-stat-icon dash-stat-icon-blue">
              <Users size={18} />
            </div>
            <div className="dash-stat-label">Total Users</div>
            <div className="dash-stat-value">
              {Math.round(animateUsers).toLocaleString()}
            </div>
            <div className="dash-delta"> </div>
          </button>

          <button
            className="dash-stat-card"
            onClick={datasetClick("/organizations")}
          >
            <div className="dash-stat-icon dash-stat-icon-gold">
              <Building2 size={18} />
            </div>
            <div className="dash-stat-label">Organizations</div>
            <div className="dash-stat-value">
              {Math.round(animateOrgs).toLocaleString()}
            </div>
            <div className="dash-delta"> </div>
          </button>

          <button className="dash-stat-card" onClick={() => {}}>
            <div className="dash-stat-icon dash-stat-icon-red">
              <HardDrive size={18} />
            </div>
            <div className="dash-stat-label">Storage Used</div>
            <div className="dash-stat-value">{storageDisplay}</div>
            <div className="dash-delta"> </div>
          </button>
        </div>

        <div className="dash-bento">
          <section className="dash-card bento-a1" aria-label="Upload Activity">
            <div className="dash-card-head">
              <div>
                <div className="dash-card-title">Upload Activity</div>
                <div className="dash-card-sub">Dataset activity over time</div>
              </div>
              <div className="dash-period-toggle">
                <button
                  className={`dash-period-btn ${uploadPeriod === "monthly" ? "is-active" : ""}`}
                  onClick={() => setUploadPeriod("monthly")}
                  type="button"
                >
                  Monthly
                </button>
                <button
                  className={`dash-period-btn ${uploadPeriod === "weekly" ? "is-active" : ""}`}
                  onClick={() => setUploadPeriod("weekly")}
                  type="button"
                >
                  Weekly
                </button>
              </div>
            </div>

            {periodData.length === 0 ? (
              <EmptyState>No monthly upload data yet.</EmptyState>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart
                  data={periodData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="dashAreaFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="rgba(0,107,63,0.25)" />
                      <stop offset="100%" stopColor="rgba(0,107,63,0.02)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "var(--gray-500)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TooltipCard />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--green)"
                    fill="url(#dashAreaFill)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>

          <section
            className="dash-spotlight bento-a2 dash-card"
            aria-label="Top Dataset This Month"
          >
            <div className="dash-spotlight-inner">
              <div className="dash-spotlight-label">Top Dataset This Month</div>
              <div className="dash-spotlight-title">
                {spotlight ? clampTitle(spotlight.title, 44) : "No data"}
              </div>

              {spotlight ? (
                <div className="dash-spotlight-meta">
                  <span className="dash-spotlight-pill">
                    <Download size={14} /> {spotlight.download_count} downloads
                  </span>
                  <span className="dash-spotlight-cat">
                    {spotlight.category || spotlight.visibility || ""}
                  </span>
                </div>
              ) : null}

              <button
                className="dash-view-btn"
                onClick={() =>
                  spotlight?.id && navigate(`/datasets/${spotlight.id}`)
                }
                type="button"
              >
                View Dataset
              </button>

              <div className="dash-spotlight-glass">
                <div className="dash-spotlight-glass-circle">
                  {datasetCount}
                </div>
              </div>
            </div>
          </section>

          <section
            className="dash-card bento-b1"
            aria-label="Dataset Visibility"
          >
            <div className="dash-card-head">
              <div>
                <div className="dash-card-title">Dataset Visibility</div>
                <div className="dash-card-sub">How datasets are shared</div>
              </div>
            </div>

            {visibilityData.length === 0 ? (
              <EmptyState>No visibility data yet.</EmptyState>
            ) : (
              <div className="dash-vis-grid">
                <div className="dash-vis-chart">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={visibilityData.filter((d) => d.count > 0)}
                        dataKey="count"
                        nameKey="visibility"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {visibilityData.map((item, i) => (
                          <Cell
                            key={`${item.visibility}-${i}`}
                            fill={VIS_COLORS[item.visibility] || "#9CA3AF"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="dash-vis-legend">
                  {visibilityData.map((item) => (
                    <div className="dash-legend-row" key={item.visibility}>
                      <span
                        className="dash-legend-swatch"
                        style={{
                          background: VIS_COLORS[item.visibility] || "#9CA3AF",
                        }}
                      />
                      <span className="dash-legend-label">
                        {VIS_LABELS[item.visibility] || item.visibility}
                      </span>
                      <span className="dash-legend-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section
            className="dash-card bento-b2 dash-card-solid"
            aria-label="Platform Activity"
          >
            <div className="dash-solid-title">Platform Activity</div>
            <div className="dash-solid-stats">
              <div className="dash-solid-row">
                <div className="dash-solid-row-label">Lifetime datasets</div>
                <div className="dash-solid-row-value">
                  {datasetCount.toLocaleString()}
                </div>
              </div>
              <div className="dash-solid-row">
                <div className="dash-solid-row-label">Top downloads</div>
                <div className="dash-solid-row-value">
                  {(mostDownloaded[0]?.download_count || 0).toLocaleString()}
                </div>
              </div>
              <div className="dash-solid-row">
                <div className="dash-solid-row-label">Latest upload</div>
                <div className="dash-solid-row-value">
                  {recentUploads[0]?.title ? (
                    <span className="dash-new-wrap">
                      <span className="dash-new-badge">NEW</span>
                      {clampTitle(recentUploads[0].title, 22)}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>

            <button
              className="dash-solid-btn"
              onClick={() => navigate("/datasets")}
              type="button"
            >
              Browse All Datasets
            </button>
          </section>

          <section className="dash-card bento-b3" aria-label="Top Downloads">
            <div className="dash-card-head">
              <div>
                <div className="dash-card-title">Top Downloads</div>
                <div className="dash-card-sub">Most downloaded datasets</div>
              </div>
            </div>

            {mostDownloaded.length === 0 ? (
              <EmptyState>No downloads yet.</EmptyState>
            ) : (
              <div className="dash-rank-list">
                {mostDownloaded.slice(0, 5).map((d, idx) => (
                  <button
                    className="dash-rank-row"
                    type="button"
                    key={d.id}
                    onClick={() => d.id && navigate(`/datasets/${d.id}`)}
                  >
                    <span className="dash-rank-num">{idx + 1}</span>
                    <span className="dash-rank-title">
                      {clampTitle(d.title, 34)}
                    </span>
                    <span className="dash-rank-download">
                      {d.download_count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="dash-card bento-c1" aria-label="Recent Uploads">
            <div className="dash-card-head dash-card-head-row">
              <div>
                <div className="dash-card-title">Recent Uploads</div>
                <div className="dash-card-sub">
                  Latest datasets added to the portal
                </div>
              </div>
              <button
                className="dash-link"
                onClick={() => navigate("/datasets")}
                type="button"
              >
                See All
              </button>
            </div>

            {recentUploads.length === 0 ? (
              <EmptyState>No datasets uploaded yet.</EmptyState>
            ) : (
              <div className="dash-recent-list">
                {recentUploads.slice(0, 8).map((d) => (
                  <button
                    className="dash-recent-row"
                    type="button"
                    key={d.id}
                    onClick={() => d.id && navigate(`/datasets/${d.id}`)}
                  >
                    <span
                      className="dash-recent-icon"
                      style={{ background: fileTypeVisualColor(d.file_type) }}
                    />
                    <span className="dash-recent-title">
                      {clampTitle(d.title, 38)}
                    </span>
                    <span className={`badge vis-${d.visibility || "private"}`}>
                      {VIS_LABELS[d.visibility] || d.visibility || "Private"}
                    </span>
                    <span className="dash-recent-size">
                      {formatBytes(d.size_bytes)}
                    </span>
                    <span className="dash-recent-time">
                      {timeAgo(d.created_at)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="dash-card bento-c2" aria-label="Personal Summary">
            <div className="dash-card-head">
              <div>
                <div className="dash-card-title">My Activity</div>
                <div className="dash-card-sub">
                  A quick snapshot of your workspace
                </div>
              </div>
            </div>

            <div className="dash-metric-pills">
              <div className="dash-pill">
                <div className="dash-pill-label">My Datasets</div>
                <div className="dash-pill-value">{myDatasetsCount}</div>
              </div>
              <div className="dash-pill">
                <div className="dash-pill-label">My Org</div>
                <div className="dash-pill-value">
                  {user?.organization_id ? "Organisation" : "No organisation"}
                </div>
              </div>
              <div className="dash-pill">
                <div className="dash-pill-label">My Role</div>
                <div className="dash-pill-value">
                  {(user?.role || "").replace("_", " ") || ""}
                </div>
              </div>
            </div>

            <div className="dash-timeline">
              {(myRecent.length ? myRecent : recentUploads)
                .slice(0, 3)
                .map((d) => (
                  <div className="dash-timeline-item" key={d.id}>
                    <span className="dash-timeline-dot" />
                    <div className="dash-timeline-body">
                      <div className="dash-timeline-title">
                        {clampTitle(d.title, 30)}
                      </div>
                      <div className="dash-timeline-date">
                        {timeAgo(d.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <button
              className="dash-notif-row"
              type="button"
              onClick={() => navigate("/notifications")}
            >
              <Bell size={16} />
              <span>{unread} unread notifications</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

const dashboardStyles = `
  .dashboard-page {
    background: var(--gray-100);
    min-height: 100vh;
  }

  .dash-wrap {
    padding: 24px;
    max-width: 1400px;
    margin-left: 0;
  }

  .dash-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .dash-greet-line {
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 700;
  }

  .dash-greet-name {
    font-size: 30px;
    color: var(--gray-900);
    font-family: 'Sora', sans-serif;
    font-weight: 900;
    margin-left: 8px;
  }

  .dash-sub {
    margin-top: 6px;
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 600;
  }

  .dash-green-btn {
    background: var(--green);
    color: var(--white);
    border: 0;
    border-radius: 14px;
    padding: 12px 16px;
    font-weight: 900;
    transition: transform 0.15s ease, background-color 0.15s ease;
    box-shadow: 0 10px 25px rgba(0,107,63,0.18);
    white-space: nowrap;
  }
  .dash-green-btn:hover {
    transform: translateY(-1px);
    background: #005a35;
  }

  .dash-toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
  }

  .dash-tool-btn {
    border: 1px solid var(--gray-300);
    background: var(--white);
    color: var(--gray-700);
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 800;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }

  .dash-tool-btn:hover {
    background: var(--green-pale);
    transform: translateY(-1px);
  }

  .dash-tool-btn-primary {
    background: var(--green);
    border-color: var(--green);
    color: var(--white);
  }

  .dash-tool-btn-primary:hover {
    background: #005a35;
    transform: translateY(-1px);
  }

  .dash-stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 18px;
  }

  .dash-stat-card {
    background: var(--white);
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.04);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    text-align: left;
  }

  .dash-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.06);
  }

  .dash-stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--green-pale);
    color: var(--green);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dash-stat-icon-blue { background: #DBEAFE; color: #1D4ED8; }
  .dash-stat-icon-gold { background: #FEF9C3; color: #854D0E; }
  .dash-stat-icon-red { background: #FEE2E2; color: var(--red); }

  .dash-stat-label {
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 800;
  }

  .dash-stat-value {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: var(--gray-900);
    line-height: 1.1;
  }

  .dash-delta {
    font-size: 12px;
    color: var(--gray-500);
    font-weight: 800;
    min-height: 18px;
  }

  .dash-delta-green {
    color: var(--green);
    background: rgba(0,107,63,0.10);
    padding: 6px 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
  }

  .dash-bento {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 18px;
    align-items: stretch;
  }

  .dash-card {
    background: var(--white);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.04);
    padding: 18px;
  }

  .dash-card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .dash-card-head-row {
    align-items: center;
  }

  .dash-card-title {
    font-family: 'Sora', sans-serif;
    font-weight: 900;
    font-size: 15px;
    color: var(--gray-900);
  }

  .dash-card-sub {
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--gray-500);
    font-weight: 700;
  }

  .bento-a1 { grid-column: span 8; }
  .bento-a2 { grid-column: span 4; }
  .bento-b1 { grid-column: span 4; }
  .bento-b2 { grid-column: span 4; }
  .bento-b3 { grid-column: span 4; }
  .bento-c1 { grid-column: span 6; }
  .bento-c2 { grid-column: span 6; }

  .dash-period-toggle {
    display: flex;
    gap: 8px;
  }
  .dash-period-btn {
    border: 1px solid var(--gray-300);
    background: var(--white);
    padding: 8px 10px;
    border-radius: 12px;
    font-weight: 900;
    color: var(--gray-700);
    transition: background-color 0.15s ease, transform 0.15s ease;
  }
  .dash-period-btn:hover {
    background: var(--green-pale);
    transform: translateY(-1px);
  }
  .dash-period-btn.is-active {
    border-color: var(--green);
    background: var(--green-pale);
    color: var(--green);
  }

  .dash-tooltip {
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: 12px;
    box-shadow: 0 14px 34px rgba(17, 24, 39, 0.14);
    padding: 10px 12px;
  }
  .dash-tooltip-label { color: var(--gray-500); font-size: 12px; font-weight: 800; margin-bottom: 4px; }
  .dash-tooltip-value { color: var(--gray-900); font-weight: 900; }

  .dash-spotlight {
    padding: 0;
    position: relative;
    overflow: hidden;
    border: 0;
    background: linear-gradient(135deg, var(--green) 0%, #00A35C 100%);
    color: var(--white);
  }

  .dash-spotlight::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0 6px, transparent 7px),
      radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0 5px, transparent 6px),
      radial-gradient(circle at 40% 80%, rgba(255,255,255,0.10) 0 7px, transparent 8px);
    pointer-events: none;
  }

  .dash-spotlight-inner {
    position: relative;
    padding: 18px;
    min-height: 292px;
    display: flex;
    flex-direction: column;
  }

  .dash-spotlight-label {
    font-size: 12px;
    font-weight: 900;
    opacity: 0.9;
  }

  .dash-spotlight-title {
    margin-top: 8px;
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1.15;
    max-height: 2.6em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .dash-spotlight-meta {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dash-spotlight-pill {
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.18);
    color: var(--white);
    width: fit-content;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .dash-view-btn {
    margin-top: auto;
    align-self: flex-start;
    background: rgba(255,255,255,0.0);
    color: var(--white);
    border: 1.5px solid rgba(255,255,255,0.9);
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }
  .dash-view-btn:hover {
    background: rgba(255,255,255,0.12);
    transform: translateY(-1px);
  }

  .dash-spotlight-glass {
    position: absolute;
    right: 14px;
    bottom: 14px;
    width: 110px;
    height: 110px;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dash-spotlight-glass-circle {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-family: 'Sora', sans-serif;
    color: var(--white);
  }

  .dash-vis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; }
  .dash-vis-legend { display: grid; gap: 10px; }
  .dash-legend-row { display: grid; grid-template-columns: auto 1fr auto; gap: 10px; align-items: center; }
  .dash-legend-swatch { width: 10px; height: 10px; border-radius: 3px; }
  .dash-legend-label { color: var(--gray-700); font-weight: 800; font-size: 13px; }
  .dash-legend-count { color: var(--gray-900); font-weight: 900; }

  .dash-card-solid {
    background: var(--green);
    color: var(--white);
    border: 0;
    padding: 18px;
  }

  .dash-solid-title {
    font-family: 'Sora', sans-serif;
    font-weight: 900;
    font-size: 16px;
    margin-bottom: 14px;
  }

  .dash-solid-stats { display: grid; gap: 12px; }
  .dash-solid-row-label { opacity: 0.82; font-weight: 800; font-size: 12.5px; }
  .dash-solid-row-value { font-family: 'Sora', sans-serif; font-weight: 900; font-size: 18px; margin-top: 2px; }

  .dash-new-badge {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.25);
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
    margin-right: 8px;
  }

  .dash-solid-btn {
    margin-top: 16px;
    background: rgba(255,255,255,0.92);
    color: var(--green);
    border: 0;
    border-radius: 14px;
    padding: 11px 14px;
    font-weight: 900;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }
  .dash-solid-btn:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }

  .dash-rank-list { display: grid; gap: 8px; margin-top: 10px; }
  .dash-rank-row {
    border: 1px solid rgba(0,0,0,0.04);
    background: rgba(243,244,246,0.45);
    border-radius: 14px;
    padding: 12px 12px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }
  .dash-rank-row:hover {
    background: var(--green-pale);
    transform: translateY(-2px);
  }
  .dash-rank-num { width: 28px; height: 28px; border-radius: 10px; background: var(--gray-100); color: var(--green); display: inline-flex; align-items: center; justify-content: center; font-weight: 900; }
  .dash-rank-title { font-weight: 900; color: var(--gray-900); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .dash-rank-download { background: rgba(0,107,63,0.12); color: var(--green); font-weight: 900; padding: 6px 10px; border-radius: 999px; }

  .dash-recent-list { display: grid; gap: 10px; margin-top: 10px; }
  .dash-recent-row {
    width: 100%;
    border: 1px solid rgba(0,0,0,0.04);
    background: rgba(243,244,246,0.55);
    border-radius: 14px;
    padding: 12px 12px;
    display: grid;
    grid-template-columns: 14px 1fr auto auto auto;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }
  .dash-recent-row:hover {
    background: var(--green-pale);
    transform: translateY(-2px);
  }
  .dash-recent-icon { width: 12px; height: 12px; border-radius: 4px; }
  .dash-recent-title { font-weight: 900; color: var(--gray-900); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .dash-recent-size { color: var(--gray-500); font-weight: 800; font-size: 12.5px; }
  .dash-recent-time { color: var(--gray-700); font-weight: 900; font-size: 12.5px; }

  .dash-metric-pills { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
  .dash-pill { background: rgba(243,244,246,0.6); border: 1px solid rgba(0,0,0,0.04); border-radius: 999px; padding: 10px 12px; }
  .dash-pill-label { color: var(--gray-500); font-weight: 900; font-size: 12px; }
  .dash-pill-value { color: var(--gray-900); font-weight: 900; font-family: 'Sora', sans-serif; margin-top: 2px; }

  .dash-timeline { margin-top: 14px; display: grid; gap: 10px; }
  .dash-timeline-item { display: grid; grid-template-columns: 14px 1fr; gap: 10px; align-items: start; }
  .dash-timeline-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--green); margin-top: 6px; }
  .dash-timeline-title { font-weight: 900; color: var(--gray-900); }
  .dash-timeline-date { font-weight: 800; color: var(--gray-500); margin-top: 3px; font-size: 12.5px; }

  .dash-notif-row {
    margin-top: auto;
    width: 100%;
    border: 1px solid rgba(0,107,63,0.18);
    background: rgba(0,107,63,0.10);
    border-radius: 14px;
    padding: 12px 12px;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    color: var(--green);
    cursor: pointer;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }
  .dash-notif-row:hover {
    background: rgba(0,107,63,0.14);
    transform: translateY(-1px);
  }

  .dash-empty {
    min-height: 120px;
    border: 1px dashed var(--gray-300);
    border-radius: 14px;
    color: var(--gray-500);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    font-weight: 700;
  }

  .dash-skeleton {
    background: #E5E7EB;
    background-image: linear-gradient(90deg, #F3F4F6, #E5E7EB, #F3F4F6);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  .w-100 { width: 100%; }
  .w-220 { width: 220px; }
  .w-160 { width: 160px; }
  .w-110 { width: 110px; }
  .w-180 { width: 180px; }
  .w-120 { width: 120px; }
  .h-18 { height: 18px; }
  .h-12 { height: 12px; }
  .h-28 { height: 28px; }
  .h-40 { height: 40px; }
  .h-36 { height: 36px; }
  .h-300 { height: 300px; }
  .h-280 { height: 280px; }

  .stat-icon { width: 44px; height: 44px; }
  .cardpad { }

  @media (max-width: 1200px) {
    .bento-a1 { grid-column: span 12; }
    .bento-a2 { grid-column: span 12; }
  }

  @media (max-width: 900px) {
    .dash-stat-row { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }

  @media (max-width: 768px) {
    .dash-wrap { padding: 16px; }
    .dash-stat-row { grid-template-columns: 1fr; }
    .bento-a1,.bento-a2,.bento-b1,.bento-b2,.bento-b3,.bento-c1,.bento-c2 { grid-column: span 12; }
  }
`;
