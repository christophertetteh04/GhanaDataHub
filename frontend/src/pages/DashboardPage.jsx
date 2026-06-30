import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { Database, Users, Building2, HardDrive } from "lucide-react";

const COLORS = ["#006B3F", "#FCD116", "#CE1126", "#00A35C", "#374151"];

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  if (!stats) return <div>Failed to load dashboard.</div>;

  const statCards = [
    { label: "Total Datasets", value: stats.total_datasets, icon: Database, color: "var(--green)" },
    { label: "Total Users", value: stats.total_users, icon: Users, color: "#1D4ED8" },
    { label: "Organizations", value: stats.total_organizations, icon: Building2, color: "#7C3AED" },
    { label: "Storage Used", value: formatBytes(stats.total_storage_bytes), icon: HardDrive, color: "#D97706" },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Platform overview and analytics</div>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label} style={{ borderLeftColor: color }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div style={{ background: color + "15", borderRadius: 8, padding: 8, color }}>
                <Icon size={20} />
              </div>
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="chart-title">Monthly Uploads (last 6 months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.monthly_uploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--green)" radius={[4, 4, 0, 0]} name="Uploads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Datasets by Visibility</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.datasets_by_visibility.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="visibility"
                cx="50%" cy="50%"
                outerRadius={70}
                label={({ visibility, percent }) =>
                  percent > 0.05 ? `${visibility} ${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {stats.datasets_by_visibility.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="card">
          <div className="chart-title" style={{ marginBottom: 12 }}>Most Downloaded</div>
          {stats.most_downloaded.length === 0 ? (
            <p style={{ color: "var(--gray-500)", fontSize: 13 }}>No downloads yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.most_downloaded.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-700)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.title}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--gray-500)", marginLeft: 12, flexShrink: 0 }}>
                    {d.download_count} ↓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="chart-title" style={{ marginBottom: 12 }}>Recent Uploads</div>
          {stats.recent_uploads.length === 0 ? (
            <p style={{ color: "var(--gray-500)", fontSize: 13 }}>No datasets yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.recent_uploads.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-700)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--gray-400)", marginLeft: 12, flexShrink: 0 }}>
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
