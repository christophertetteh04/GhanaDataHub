import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../services/api";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { Bell, Building2, Database, Download, HardDrive, Search, Users } from "lucide-react";

const COLORS = ["#006B3F", "#FCD116", "#CE1126", "#00A35C", "#374151"];
const VIS_LABELS = {
  public: "Public",
  private: "Private",
  organization: "Organization",
  shared_link: "Shared Link",
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fileTypeLabel(type) {
  if (!type) return "Dataset";
  return type.split("/").pop()?.toUpperCase() || type;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      <div className="dash-tooltip-value">{payload[0].value} uploads</div>
    </div>
  );
}

function EmptyState({ children }) {
  return <div className="dash-empty">{children}</div>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSearch, setRecentSearch] = useState("");

  useEffect(() => {
    dashboardApi.stats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>
      <div className="dash-skeleton-header">
        <div className="dash-skeleton dash-skeleton-title" />
        <div className="dash-skeleton dash-skeleton-action" />
      </div>
      <div className="dash-stat-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="dash-card dash-skeleton-card" key={item}>
            <div className="dash-skeleton dash-skeleton-icon" />
            <div className="dash-skeleton dash-skeleton-line short" />
            <div className="dash-skeleton dash-skeleton-line" />
          </div>
        ))}
      </div>
      <div className="dash-main-grid">
        <div className="dash-card dash-skeleton-chart" />
        <div className="dash-card dash-skeleton-chart compact" />
      </div>
    </div>
  );

  if (!stats) return <div>Failed to load dashboard.</div>;

  const visibilityData = stats.datasets_by_visibility || [];
  const filteredRecentUploads = (stats.recent_uploads || []).filter((dataset) =>
    dataset.title?.toLowerCase().includes(recentSearch.toLowerCase())
  );

  const statCards = [
    {
      label: "Total Datasets",
      value: stats.total_datasets,
      icon: Database,
      tone: "green",
      to: "/datasets",
      action: "See details",
    },
    {
      label: "Total Users",
      value: stats.total_users,
      icon: Users,
      tone: "blue",
      to: "/users",
      action: "View users",
    },
    {
      label: "Organizations",
      value: stats.total_organizations,
      icon: Building2,
      tone: "gold",
      to: "/organizations",
      action: "View orgs",
    },
    {
      label: "Storage Used",
      value: formatBytes(stats.total_storage_bytes),
      icon: HardDrive,
      tone: "red",
    },
  ];

  return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>

      <div className="dash-header">
        <div>
          <div className="dash-breadcrumb">Home / Dashboard</div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Platform overview and analytics</p>
        </div>
        <div className="dash-top-actions">
          <button className="dash-icon-button" type="button" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <div className="dash-avatar" aria-label="Current user">GD</div>
        </div>
      </div>

      <div className="dash-stat-grid">
        {statCards.map(({ label, value, icon: Icon, tone, to, action }) => {
          const content = (
            <>
              <div className={`dash-stat-icon ${tone}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="dash-stat-label">{label}</div>
                <div className="dash-stat-value">{value}</div>
              </div>
              {to ? <div className="dash-stat-link">{action}</div> : null}
            </>
          );

          return to ? (
            <Link className="dash-card dash-stat-card is-clickable" key={label} to={to}>
              {content}
            </Link>
          ) : (
            <div className="dash-card dash-stat-card" key={label}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="dash-main-grid">
        <section className="dash-card dash-chart-card" aria-labelledby="monthly-uploads-title">
          <div className="dash-card-header">
            <div>
              <h2 id="monthly-uploads-title">Monthly Uploads</h2>
              <p>Dataset activity over the last 6 months</p>
            </div>
          </div>
          {(stats.monthly_uploads || []).length === 0 ? (
            <EmptyState>No monthly upload data yet.</EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={stats.monthly_uploads} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--gray-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(232,245,239,0.55)" }} />
                <Bar dataKey="count" fill="var(--green)" radius={[8, 8, 0, 0]} name="Uploads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="dash-card dash-visibility-card" aria-labelledby="visibility-title">
          <div className="dash-card-header">
            <div>
              <h2 id="visibility-title">Visibility Breakdown</h2>
              <p>Dataset access distribution</p>
            </div>
          </div>
          {visibilityData.length === 0 ? (
            <EmptyState>No visibility data yet.</EmptyState>
          ) : (
            <>
              <div className="dash-donut">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={visibilityData.filter(d => d.count > 0)}
                      dataKey="count"
                      nameKey="visibility"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={4}
                    >
                      {visibilityData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-visibility-list">
                {visibilityData.map((item, index) => (
                  <div className="dash-visibility-row" key={item.visibility}>
                    <span className="dash-dot" style={{ background: COLORS[index % COLORS.length] }} />
                    <span>{VIS_LABELS[item.visibility] || item.visibility}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="dash-secondary-grid">
        <section className="dash-card" aria-labelledby="most-downloaded-title">
          <div className="dash-card-header">
            <div>
              <h2 id="most-downloaded-title">Most Downloaded</h2>
              <p>Top datasets by downloads</p>
            </div>
          </div>
          {(stats.most_downloaded || []).length === 0 ? (
            <EmptyState>No downloads yet.</EmptyState>
          ) : (
            <div className="dash-download-list">
              {stats.most_downloaded.map((dataset, index) => (
                <div className="dash-download-row" key={dataset.id}>
                  <span className="dash-rank">{index + 1}</span>
                  <span className="dash-download-title">{dataset.title}</span>
                  <span className="dash-download-count">
                    <Download size={13} />
                    {dataset.download_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dash-card dash-recent-card" aria-labelledby="recent-uploads-title">
          <div className="dash-card-header dash-table-header">
            <div>
              <h2 id="recent-uploads-title">Recent Uploads</h2>
              <p>Latest datasets added to the portal</p>
            </div>
            <div className="dash-search">
              <Search size={14} />
              <input
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                placeholder="Filter uploads..."
              />
            </div>
          </div>

          {(stats.recent_uploads || []).length === 0 ? (
            <EmptyState>No datasets uploaded yet.</EmptyState>
          ) : filteredRecentUploads.length === 0 ? (
            <EmptyState>No uploads match your search.</EmptyState>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Type</th>
                    <th>Visibility</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentUploads.map((dataset) => (
                    <tr key={dataset.id}>
                      <td>
                        <div className="dash-table-title">{dataset.title}</div>
                      </td>
                      <td>{fileTypeLabel(dataset.file_type)}</td>
                      <td>
                        <span className={`badge vis-${dataset.visibility || "private"}`}>
                          {VIS_LABELS[dataset.visibility] || dataset.visibility || "Private"}
                        </span>
                      </td>
                      <td>{formatDate(dataset.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const dashboardStyles = `
  .topbar {
    background: rgba(255, 255, 255, 0.92);
    border-bottom: 1px solid rgba(209, 213, 219, 0.76);
    backdrop-filter: blur(16px);
  }

  .topbar-title {
    color: var(--gray-500);
    font-size: 13px;
    font-weight: 700;
  }

  .page-content {
    background: var(--gray-100);
  }

  .dashboard-page {
    display: grid;
    gap: 24px;
  }

  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .dash-breadcrumb {
    color: var(--gray-500);
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .dash-title {
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: 0;
    margin-bottom: 4px;
  }

  .dash-subtitle,
  .dash-card-header p {
    color: var(--gray-500);
    font-size: 13px;
  }

  .dash-top-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dash-icon-button,
  .dash-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid var(--gray-300);
    background: var(--white);
    color: var(--gray-700);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dash-avatar {
    background: var(--green);
    color: var(--white);
    border-color: var(--green);
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 700;
  }

  .dash-card {
    background: var(--white);
    border: 1px solid rgba(209, 213, 219, 0.72);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
  }

  .dash-card.is-clickable {
    color: inherit;
    transition: all 0.2s ease;
  }

  .dash-card.is-clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 18px 36px rgba(0,0,0,0.08);
  }

  .dash-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
  }

  .dash-stat-card {
    min-height: 168px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
  }

  .dash-stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .dash-stat-icon.green { background: var(--green-pale); color: var(--green); }
  .dash-stat-icon.blue { background: #DBEAFE; color: #1D4ED8; }
  .dash-stat-icon.gold { background: #FEF9C3; color: #854D0E; }
  .dash-stat-icon.red { background: #FEE2E2; color: var(--red); }

  .dash-stat-label {
    color: var(--gray-500);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .dash-stat-value {
    color: var(--gray-900);
    font-family: 'Sora', sans-serif;
    font-size: 31px;
    font-weight: 700;
    line-height: 1;
  }

  .dash-stat-link {
    color: var(--green);
    font-size: 13px;
    font-weight: 800;
  }

  .dash-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.85fr);
    gap: 24px;
    align-items: stretch;
  }

  .dash-secondary-grid {
    display: grid;
    grid-template-columns: minmax(280px, 0.75fr) minmax(0, 1.25fr);
    gap: 24px;
  }

  .dash-chart-card,
  .dash-visibility-card,
  .dash-secondary-grid > .dash-card {
    padding: 24px;
  }

  .dash-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .dash-card-header h2 {
    font-size: 16px;
    letter-spacing: 0;
    margin-bottom: 5px;
  }

  .dash-tooltip {
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: 12px;
    box-shadow: 0 14px 34px rgba(17, 24, 39, 0.14);
    padding: 10px 12px;
  }

  .dash-tooltip-label {
    color: var(--gray-500);
    font-size: 12px;
    margin-bottom: 4px;
  }

  .dash-tooltip-value {
    color: var(--gray-900);
    font-weight: 800;
  }

  .dash-donut {
    margin: -6px 0 4px;
  }

  .dash-visibility-list,
  .dash-download-list {
    display: grid;
    gap: 12px;
  }

  .dash-visibility-row,
  .dash-download-row {
    display: grid;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    border-radius: 12px;
    background: var(--gray-100);
    padding: 10px 12px;
  }

  .dash-visibility-row {
    grid-template-columns: auto 1fr auto;
    color: var(--gray-700);
    font-weight: 600;
  }

  .dash-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }

  .dash-download-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    transition: background 0.2s ease;
  }

  .dash-download-row:hover {
    background: var(--green-pale);
  }

  .dash-rank {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    background: var(--white);
    color: var(--green);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
  }

  .dash-download-title,
  .dash-table-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--gray-900);
    font-weight: 700;
  }

  .dash-download-count {
    color: var(--gray-500);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 700;
  }

  .dash-table-header {
    align-items: center;
  }

  .dash-search {
    min-width: 220px;
    min-height: 40px;
    border: 1px solid var(--gray-300);
    border-radius: 12px;
    background: var(--gray-100);
    color: var(--gray-500);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
  }

  .dash-search input {
    border: 0;
    outline: 0;
    background: transparent;
    min-width: 0;
    flex: 1;
    color: var(--gray-700);
  }

  .dash-table-wrap {
    overflow-x: auto;
  }

  .dash-table {
    min-width: 620px;
  }

  .dash-table th {
    background: transparent;
    border-bottom: 1px solid var(--gray-100);
    padding: 12px 14px;
  }

  .dash-table td {
    padding: 15px 14px;
    vertical-align: middle;
  }

  .dash-table tbody tr {
    transition: background 0.2s ease;
  }

  .dash-table tbody tr:hover td {
    background: var(--gray-100);
  }

  .dash-empty {
    min-height: 132px;
    border: 1px dashed var(--gray-300);
    border-radius: 14px;
    color: var(--gray-500);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    font-weight: 600;
  }

  .dash-skeleton {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    background: #E5E7EB;
  }

  .dash-skeleton::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    animation: dash-shimmer 1.2s infinite;
  }

  .dash-skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dash-skeleton-title {
    width: 220px;
    height: 34px;
  }

  .dash-skeleton-action {
    width: 92px;
    height: 40px;
  }

  .dash-skeleton-card {
    min-height: 168px;
    padding: 22px;
  }

  .dash-skeleton-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 24px;
  }

  .dash-skeleton-line {
    width: 78%;
    height: 18px;
    margin-top: 12px;
  }

  .dash-skeleton-line.short {
    width: 46%;
  }

  .dash-skeleton-chart {
    height: 360px;
  }

  .dash-skeleton-chart.compact {
    height: 360px;
  }

  @keyframes dash-shimmer {
    100% { transform: translateX(100%); }
  }

  @media (max-width: 1120px) {
    .dash-stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dash-main-grid,
    .dash-secondary-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .dash-header,
    .dash-card-header,
    .dash-table-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .dash-top-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .dash-stat-grid {
      grid-template-columns: 1fr;
    }

    .dash-search {
      width: 100%;
      min-width: 0;
    }
  }
`;
