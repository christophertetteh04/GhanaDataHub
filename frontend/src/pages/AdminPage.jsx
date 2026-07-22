import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { adminApi, usersApi, datasetsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  ShieldAlert,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { computeQuality } from "../components/QualityBadge";

const SECTIONS = [
  { key: "queue", label: "Needs Attention", icon: AlertCircle },
  { key: "overview", label: "Overview", icon: Activity },
  { key: "users", label: "Users", icon: Users },
  { key: "datasets", label: "Datasets", icon: Database },
  { key: "audit", label: "Audit Log", icon: ShieldAlert },
  { key: "storage", label: "Storage", icon: Download },
  { key: "settings", label: "Settings", icon: AlertCircle },
];

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "org_admin", label: "Org Admin" },
  { value: "data_manager", label: "Data Manager" },
  { value: "analyst", label: "Analyst" },
  { value: "viewer", label: "Viewer" },
];

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444"];

const STORAGE_TOGGLES = [
  {
    key: "require_email_verification",
    label: "Require email verification for new users",
  },
  {
    key: "allow_public_uploads_without_org",
    label: "Allow public dataset uploads without org membership",
  },
  {
    key: "enable_user_registration",
    label: "Enable user registration (open/closed)",
  },
];

function SectionTab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      className={`admin-tab${active ? " active" : ""}`}
      onClick={onClick}
      type="button"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown time";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

function daysUntil(value) {
  const eventDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((eventDate - today) / 86400000);
}

function formatBytes(value = 0) {
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value || 0} B`;
}

function getItems(payload) {
  return Array.isArray(payload) ? payload : payload?.items || [];
}

function MiniBars({ values = [], colour = "var(--green)", gradient = false }) {
  const safeValues = values.length ? values : [1, 2, 1, 3, 2, 4];
  const max = Math.max(...safeValues, 1);
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" aria-hidden="true">
      {gradient ? (
        <defs>
          <linearGradient id="adminStorageBars" x1="0" x2="1">
            <stop offset="0%" stopColor="#006B3F" />
            <stop offset="100%" stopColor="#00A35C" />
          </linearGradient>
        </defs>
      ) : null}
      {safeValues.slice(0, 6).map((value, index) => {
        const height = Math.max(4, (value / max) * 22);
        return (
          <rect
            key={index}
            x={index * 10}
            y={24 - height}
            width="7"
            height={height}
            rx="2"
            fill={gradient ? "url(#adminStorageBars)" : colour}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

function computeMilestones(overview) {
  const milestones = [];
  if (!overview) return milestones;
  if (overview.total_datasets > 0) {
    milestones.push({
      icon: Database,
      colour: "#006B3F",
      text: `Platform hosts ${overview.total_datasets} datasets`,
      sub: "Total platform dataset count",
      ts: "now",
    });
  }
  if (overview.new_datasets_today > 0) {
    milestones.push({
      icon: Upload,
      colour: "#059669",
      text: `${overview.new_datasets_today} new dataset${overview.new_datasets_today > 1 ? "s" : ""} today`,
      sub: "Published today",
      ts: "today",
    });
  }
  if (overview.new_users_this_week > 0) {
    milestones.push({
      icon: UserPlus,
      colour: "#1D4ED8",
      text: `${overview.new_users_this_week} new users this week`,
      sub: "Platform is growing",
      ts: "this week",
    });
  }
  if (overview.active_users_last_30_days > 5) {
    milestones.push({
      icon: Activity,
      colour: "#7C3AED",
      text: `${overview.active_users_last_30_days} active users in 30 days`,
      sub: "Monthly active users",
      ts: "last 30 days",
    });
  }
  return milestones;
}

function heatCellStyle(score) {
  if (score >= 70) return { background: "var(--green-pale)", color: "var(--green)" };
  if (score >= 50) return { background: "#FEF9C3", color: "#854D0E" };
  return { background: "#FEF2F2", color: "#991B1B" };
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("queue");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [queueAlerts, setQueueAlerts] = useState([]);
  const [queueObservances, setQueueObservances] = useState([]);
  const [queueDatasets, setQueueDatasets] = useState([]);
  const [overviewDatasets, setOverviewDatasets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [storageRows, setStorageRows] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, per_page: 20, total: 0, pages: 1 });
  const [datasetsMeta, setDatasetsMeta] = useState({ page: 1, per_page: 20, total: 0, pages: 1 });
  const [auditMeta, setAuditMeta] = useState({ page: 1, per_page: 50, total: 0, pages: 1 });
  const [usersSearch, setUsersSearch] = useState("");
  const [usersSearchDebounced, setUsersSearchDebounced] = useState("");
  const [datasetsSearch, setDatasetsSearch] = useState("");
  const [datasetsSearchDebounced, setDatasetsSearchDebounced] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [datasetsVisibility, setDatasetsVisibility] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [selectedDelete, setSelectedDelete] = useState(null);
  const [toggleStates, setToggleStates] = useState(() => {
    const saved = localStorage.getItem("admin_settings");
    return saved ? JSON.parse(saved) : {};
  });

  const isAdmin = user?.role === "super_admin" || user?.role === "org_admin";

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      toast.error("Access denied");
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (activeSection !== "overview" && activeSection !== "queue") return;
    adminApi.overview().then((res) => setOverview(res.data)).catch((err) => toast.error("Unable to load overview"));
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "queue" && activeSection !== "overview") return;
    datasetsApi
      .list({ per_page: activeSection === "overview" ? 100 : 50 })
      .then((res) => {
        const items = getItems(res.data);
        if (activeSection === "overview") setOverviewDatasets(items);
        else setQueueDatasets(items);
      })
      .catch(() => toast.error("Unable to load dataset queue"));
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "queue") return;
    Promise.all([
      api.get("/admin/security/alerts", { params: { is_resolved: false, per_page: 5 } }).catch(() => ({ data: [] })),
      api.get("/observances/upcoming", { params: { days: 7 } }).catch(() => ({ data: [] })),
    ]).then(([alertsRes, observancesRes]) => {
      setQueueAlerts(getItems(alertsRes.data));
      setQueueObservances(getItems(observancesRes.data).filter((item) => item.status === "pending"));
    });
  }, [activeSection]);

  useEffect(() => {
    const timeout = setTimeout(() => setUsersSearchDebounced(usersSearch), 400);
    return () => clearTimeout(timeout);
  }, [usersSearch]);

  useEffect(() => {
    if (activeSection !== "users") return;
    adminApi
      .users({ page: usersMeta.page, per_page: usersMeta.per_page, search: usersSearchDebounced, role: userRoleFilter, is_active: userStatusFilter || undefined })
      .then((res) => {
        setUsers(res.data.items);
        setUsersMeta((prev) => ({ ...prev, total: res.data.total, pages: res.data.pages }));
      })
      .catch(() => toast.error("Unable to load users"));
  }, [activeSection, usersMeta.page, usersMeta.per_page, usersSearchDebounced, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => setDatasetsSearchDebounced(datasetsSearch), 400);
    return () => clearTimeout(timeout);
  }, [datasetsSearch]);

  useEffect(() => {
    if (activeSection !== "datasets") return;
    adminApi
      .datasets({ page: datasetsMeta.page, per_page: datasetsMeta.per_page, search: datasetsSearch, visibility: datasetsVisibility || undefined })
      .then((res) => {
        setDatasets(res.data.items);
        setDatasetsMeta((prev) => ({ ...prev, total: res.data.total, pages: res.data.pages }));
      })
      .catch(() => toast.error("Unable to load datasets"));
  }, [activeSection, datasetsMeta.page, datasetsMeta.per_page, datasetsSearch, datasetsVisibility]);

  useEffect(() => {
    if (activeSection !== "audit") return;
    adminApi
      .auditLogs({ page: auditMeta.page, per_page: auditMeta.per_page, action: auditActionFilter || undefined, date_from: auditDateFrom || undefined })
      .then((res) => {
        setAuditLogs(res.data.items);
        setAuditMeta((prev) => ({ ...prev, total: res.data.total, pages: res.data.pages }));
      })
      .catch(() => toast.error("Unable to load audit logs"));
  }, [activeSection, auditMeta.page, auditMeta.per_page, auditActionFilter, auditDateFrom]);

  useEffect(() => {
    if (activeSection !== "storage") return;
    adminApi.storageBreakdown().then((res) => setStorageRows(res.data)).catch(() => toast.error("Unable to load storage data"));
  }, [activeSection]);

  useEffect(() => {
    localStorage.setItem("admin_settings", JSON.stringify(toggleStates));
  }, [toggleStates]);

  const statusLabel = (isActive) => (isActive ? "Active" : "Suspended");
  const statusColor = (isActive) => (isActive ? "var(--green)" : "#d97706");

  const handleUserRoleChange = async (userId, role) => {
    try {
      await adminApi.changeUserRole(userId, role);
      toast.success("Role updated");
      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role } : item)));
    } catch (err) {
      toast.error("Unable to update role");
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      if (action === "suspend") await adminApi.changeUserRole(userId, { role: "" });
      toast.success("Action completed");
    } catch {
      toast.error("Unable to perform action");
    }
  };

  const uncategorisedDatasets = useMemo(
    () => queueDatasets.filter((item) => !item.category && !item.category_id).slice(0, 5),
    [queueDatasets],
  );

  const dQualityDatasets = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return queueDatasets
      .map((dataset) => ({ dataset, quality: computeQuality(dataset) }))
      .filter(({ dataset, quality }) => quality.grade === "D" && new Date(dataset.created_at).getTime() < cutoff)
      .slice(0, 3);
  }, [queueDatasets]);

  const milestones = useMemo(() => computeMilestones(overview), [overview]);

  const vitalSigns = useMemo(() => {
    const visibilityCounts = Object.values(overview?.datasets_by_status || {});
    const downloadCounts = overviewDatasets
      .map((item) => item.download_count || 0)
      .sort((a, b) => b - a)
      .slice(0, 6);
    const errors = overview?.error_events_last_24h || 0;
    return [
      {
        label: "Datasets",
        value: overview?.total_datasets ?? 0,
        colour: "#006B3F",
        icon: Database,
        bars: visibilityCounts.length ? visibilityCounts : [overview?.new_datasets_today || 0, overview?.new_datasets_this_week || 0, overview?.total_datasets || 0],
        trend: `+${overview?.new_datasets_today || 0} today`,
      },
      {
        label: "Users",
        value: overview?.total_users ?? 0,
        colour: "#1D4ED8",
        icon: Users,
        bars: [overview?.new_users_today || 0, overview?.new_users_this_week || 0, overview?.active_users_last_30_days || 0, overview?.total_users || 0],
        trend: `+${overview?.new_users_today || 0} today, +${overview?.new_users_this_week || 0} this week`,
      },
      {
        label: "Downloads",
        value: overview?.total_downloads_all_time ?? 0,
        colour: "#D97706",
        icon: Download,
        bars: downloadCounts.length ? downloadCounts : [0, 1, 0, 2, 1, 3],
        trend: `${formatBytes(overview?.total_storage_bytes || 0)} stored`,
      },
      {
        label: "Errors",
        value: errors,
        colour: "#DC2626",
        icon: ShieldAlert,
        bars: [0, Math.max(1, errors * 0.25), Math.max(1, errors * 0.4), Math.max(1, errors * 0.7), Math.max(1, errors), errors],
        trend: `${errors} events in last 24h`,
      },
    ];
  }, [overview, overviewDatasets]);

  const qualityHeatmapRows = useMemo(() => {
    const grouped = overviewDatasets.reduce((acc, dataset) => {
      const category = dataset.category?.name || "Uncategorised";
      acc[category] = acc[category] || [];
      acc[category].push(dataset);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, rows]) => {
      if (rows.length < 3) {
        return { category, insufficient: true };
      }

      const completeness = Math.round(
        rows.reduce((sum, dataset) => {
          const profiles = dataset.analysis_data?.column_profiles || [];
          if (!profiles.length) return sum + 50;
          const avgNull = profiles.reduce((profileSum, profile) => profileSum + (profile.null_rate_pct || 0), 0) / profiles.length;
          return sum + Math.max(0, 100 - avgNull);
        }, 0) / rows.length,
      );
      const freshness = Math.round(
        (rows.filter((dataset) => Date.now() - new Date(dataset.updated_at || dataset.created_at).getTime() <= 90 * 86400000).length / rows.length) * 100,
      );
      const maxDownloads = Math.max(...rows.map((dataset) => dataset.download_count || 0), 1);
      const engagement = Math.round(
        rows.reduce((sum, dataset) => sum + ((dataset.download_count || 0) / maxDownloads) * 100, 0) / rows.length,
      );
      return { category, completeness, freshness, engagement };
    });
  }, [overviewDatasets]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-page" style={{ display: "flex", minHeight: "100%" }}>
      <div style={{ width: 200, background: "var(--surface-card)", borderRight: "1px solid rgba(148,163,184,0.18)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--green)", marginBottom: 4 }}>Admin Panel</div>
          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Control center</div>
        </div>
        {SECTIONS.map((section) => (
          <SectionTab
            key={section.key}
            label={section.label}
            icon={section.icon}
            active={activeSection === section.key}
            onClick={() => setActiveSection(section.key)}
          />
        ))}
      </div>

      <div style={{ flex: 1, background: "var(--gray-100)", minHeight: "100vh", padding: 24 }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Admin Panel</h1>
            <p style={{ color: "var(--gray-600)", marginTop: 4 }}>Manage users, datasets, audit records, and storage.</p>
          </div>
        </div>

        {activeSection === "queue" && (
          <div style={{ display: "grid", gap: 14 }}>
            {queueAlerts.map((alert) => (
              <div key={alert.id} style={{ background: "var(--surface-card)", border: "1px solid rgba(220,38,38,0.28)", borderLeft: "4px solid #DC2626", borderRadius: 14, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <AlertTriangle size={22} color="#DC2626" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{alert.alert_type || "Security alert"}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{alert.description || "Unresolved security alert needs review."}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                      IP {alert.ip_address || alert.ip || "unknown"} · {timeAgo(alert.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "#DC2626", color: "#fff" }}
                    onClick={async () => {
                      try {
                        await api.patch(`/admin/security/alerts/${alert.id}/resolve`);
                        setQueueAlerts((prev) => prev.filter((item) => item.id !== alert.id));
                        toast.success("Alert resolved");
                      } catch {
                        toast.error("Unable to resolve alert");
                      }
                    }}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}

            {queueObservances.map((observance) => {
              const due = daysUntil(observance.observance_date);
              return (
                <div key={observance.id} style={{ background: "var(--surface-card)", border: "1px solid rgba(217,119,6,0.26)", borderLeft: "4px solid #D97706", borderRadius: 14, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <Calendar size={22} color="#D97706" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{observance.observance_name}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{formatDate(observance.observance_date)}</div>
                      <span style={{ display: "inline-flex", marginTop: 8, borderRadius: 99, padding: "3px 8px", background: "rgba(217,119,6,0.14)", color: "#D97706", fontSize: 11, fontWeight: 800 }}>
                        {due === 0 ? "Due today" : due === 1 ? "Due tomorrow" : due === null ? "Date pending" : `${due} days`}
                      </span>
                    </div>
                    <button type="button" style={buttonStyle} onClick={() => setActiveSection("observances")}>
                      Review
                    </button>
                  </div>
                </div>
              );
            })}

            {uncategorisedDatasets.map((dataset) => (
              <div key={dataset.id} style={{ background: "var(--surface-card)", border: "1px solid rgba(252,209,22,0.35)", borderLeft: "4px solid #FCD116", borderRadius: 14, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Database size={22} color="#D97706" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{dataset.title}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>No category assigned</div>
                  </div>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => {
                      setDatasetsSearch(dataset.title);
                      setActiveSection("datasets");
                    }}
                  >
                    Assign Category
                  </button>
                </div>
              </div>
            ))}

            {dQualityDatasets.map(({ dataset, quality }) => (
              <div key={dataset.id} style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderLeft: "4px solid var(--text-muted)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <ShieldAlert size={22} color="var(--text-muted)" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{dataset.title}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 5 }}>Quality grade {quality.grade} · score {quality.score}/100</div>
                  </div>
                  <button type="button" style={buttonStyle} onClick={() => navigate(`/datasets/${dataset.id}`)}>
                    Improve Metadata
                  </button>
                </div>
              </div>
            ))}

            {queueAlerts.length === 0 && queueObservances.length === 0 && uncategorisedDatasets.length === 0 && dQualityDatasets.length === 0 && (
              <div style={{ background: "var(--surface-card)", border: "1px solid rgba(0,163,92,0.22)", borderLeft: "4px solid var(--green)", borderRadius: 16, padding: 34, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                <CheckCircle2 size={48} color="var(--green)" />
                <div style={{ marginTop: 14, fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>Everything looks good!</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>No alerts, no pending observances, no uncategorised datasets.</div>
              </div>
            )}
          </div>
        )}

        {activeSection === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
              {vitalSigns.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} style={{ background: "var(--surface-card)", padding: 20, borderRadius: 14, borderLeft: `4px solid ${item.colour}`, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.label}</div>
                      <Icon size={18} color={item.colour} />
                    </div>
                    <div style={{ marginTop: 12, fontSize: 32, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>
                      {item.value}
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <MiniBars values={item.bars} colour={item.colour} gradient={item.label === "Storage"} />
                    </div>
                    <div style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 11 }}>
                      {item.trend}
                    </div>
                  </div>
                );
              })}
            </div>

            {milestones.length > 0 && (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  return (
                    <div key={`${milestone.text}-${index}`} style={{ minWidth: 200, flexShrink: 0, background: "var(--surface-card)", borderRadius: 12, boxShadow: "0 10px 30px rgba(15,23,42,0.04)", padding: "14px 16px", border: "1px solid var(--border-subtle)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: milestone.colour, color: "#fff", display: "grid", placeItems: "center", marginBottom: 12 }}>
                        <Icon size={17} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.35 }}>{milestone.text}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{milestone.sub}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <span style={{ borderRadius: 99, padding: "2px 7px", background: "var(--green-pale)", color: "var(--green)", fontSize: 10, fontWeight: 800 }}>{milestone.ts}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                <div style={{ marginBottom: 14, fontWeight: 700 }}>Recent Signups</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {(overview?.recent_signups || []).map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "var(--surface-base)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(16,185,129,0.12)", color: "var(--green)", display: "grid", placeItems: "center", fontWeight: 800 }}>{item.full_name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.full_name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-600)" }}>{item.email}</div>
                      </div>
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", textTransform: "capitalize" }}>{item.role.replace("_", " ")}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{formatDate(item.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                <div style={{ marginBottom: 14, fontWeight: 700 }}>Dataset Status Breakdown</div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview ? Object.entries(overview.datasets_by_status).map(([key, value]) => ({ name: key, value })) : []}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {Object.keys(overview?.datasets_by_status || {}).map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 14, color: "var(--text-primary)" }}>Content Quality by Category</div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(3, 1fr)", gap: 8, color: "var(--text-muted)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <div>Category</div>
                  <div>Completeness</div>
                  <div>Freshness</div>
                  <div>Engagement</div>
                </div>
                {qualityHeatmapRows.length === 0 ? (
                  <div style={{ color: "var(--text-secondary)", fontSize: 13, padding: "18px 0" }}>No dataset quality data available yet.</div>
                ) : (
                  qualityHeatmapRows.map((row) => (
                    <div key={row.category} style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(3, 1fr)", gap: 8, alignItems: "stretch" }}>
                      <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-base)", fontWeight: 800, color: "var(--text-primary)", fontSize: 13 }}>
                        {row.category}
                      </div>
                      {row.insufficient ? (
                        <div style={{ gridColumn: "span 3", padding: "10px 12px", borderRadius: 10, background: "var(--surface-base)", color: "var(--text-muted)", fontSize: 12 }}>
                          Insufficient data
                        </div>
                      ) : (
                        ["completeness", "freshness", "engagement"].map((key) => {
                          const score = row[key];
                          const style = heatCellStyle(score);
                          return (
                            <div key={key} style={{ padding: "9px 10px", borderRadius: 10, background: style.background, color: style.color, fontSize: 12, fontWeight: 900 }}>
                              <div>{score}%</div>
                              <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.65)", overflow: "hidden" }}>
                                <div style={{ width: `${score}%`, height: "100%", background: style.color, borderRadius: 99 }} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Security Events</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: overview?.error_events_last_24h > 10 ? "#b91c1c" : "var(--gray-900)" }}>{overview?.error_events_last_24h ?? 0}</span>
                <span style={{ color: overview?.error_events_last_24h > 10 ? "#b91c1c" : "var(--gray-600)", fontWeight: 600 }}>
                  Error events in the last 24 hours
                </span>
              </div>
            </div>
          </>
        )}

        {activeSection === "users" && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <input
                type="search"
                placeholder="Search users..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)", background: "var(--surface-card)" }}
              />
              <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} style={{ minWidth: 180, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }}>
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} style={{ minWidth: 180, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }}>
                <option value="">All users</option>
                <option value="true">Active</option>
                <option value="false">Suspended</option>
              </select>
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "var(--surface-base)" }}>
                  <tr>
                    <th style={tableHeaderStyle}>User</th>
                    <th style={tableHeaderStyle}>Username</th>
                    <th style={tableHeaderStyle}>Role</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Datasets</th>
                    <th style={tableHeaderStyle}>Joined</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.12)", color: "var(--green)", display: "grid", placeItems: "center", fontWeight: 800 }}>
                            {item.full_name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{item.full_name}</div>
                            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{item.username}</td>
                      <td style={tableCellStyle}>
                        <select
                          value={item.role}
                          onChange={(e) => handleUserRoleChange(item.id, e.target.value)}
                          style={{ padding: 8, borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)", minWidth: 140 }}
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...tableCellStyle, color: statusColor(item.is_active) }}>{statusLabel(item.is_active)}</td>
                      <td style={tableCellStyle}>{item.dataset_count}</td>
                      <td style={tableCellStyle}>{formatDate(item.created_at)}</td>
                      <td style={tableCellStyle}>
                        {item.is_active ? (
                          <button onClick={() => usersApi.suspend(item.id).then(() => setUsers((prev) => prev.map((value) => value.id === item.id ? { ...value, is_active: false } : value))).catch(() => toast.error("Action failed"))} style={buttonStyle}>Suspend</button>
                        ) : (
                          <button onClick={() => usersApi.reactivate(item.id).then(() => setUsers((prev) => prev.map((value) => value.id === item.id ? { ...value, is_active: true } : value))).catch(() => toast.error("Action failed"))} style={{ ...buttonStyle, background: "#16a34a", color: "#fff" }}>Reactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setUsersMeta((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))} style={paginationButtonStyle} disabled={usersMeta.page === 1}>Previous</button>
              <button onClick={() => setUsersMeta((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))} style={paginationButtonStyle} disabled={usersMeta.page === usersMeta.pages}>Next</button>
            </div>
          </div>
        )}

        {activeSection === "datasets" && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <input
                type="search"
                placeholder="Search datasets..."
                value={datasetsSearch}
                onChange={(e) => setDatasetsSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)", background: "var(--surface-card)" }}
              />
              <select value={datasetsVisibility} onChange={(e) => setDatasetsVisibility(e.target.value)} style={{ minWidth: 180, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }}>
                <option value="">All visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "var(--surface-base)" }}>
                  <tr>
                    <th style={tableHeaderStyle}>Title</th>
                    <th style={tableHeaderStyle}>Owner</th>
                    <th style={tableHeaderStyle}>Org</th>
                    <th style={tableHeaderStyle}>Visibility</th>
                    <th style={tableHeaderStyle}>Size</th>
                    <th style={tableHeaderStyle}>Downloads</th>
                    <th style={tableHeaderStyle}>Uploaded</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <td style={tableCellStyle}>
                        <a href={`/datasets/${item.id}`} target="_blank" rel="noreferrer" style={{ color: "var(--green)", fontWeight: 700 }}>{item.title}</a>
                      </td>
                      <td style={tableCellStyle}>{item.owner || "—"}</td>
                      <td style={tableCellStyle}>{item.organization || "No Org"}</td>
                      <td style={tableCellStyle}>{item.visibility}</td>
                      <td style={tableCellStyle}>{item.file_size}</td>
                      <td style={tableCellStyle}>{item.download_count}</td>
                      <td style={tableCellStyle}>{formatDate(item.created_at)}</td>
                      <td style={tableCellStyle}>
                        <button
                          onClick={() => setSelectedDelete(item)}
                          style={{ ...buttonStyle, background: "#ef4444", color: "#fff" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setDatasetsMeta((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))} style={paginationButtonStyle} disabled={datasetsMeta.page === 1}>Previous</button>
              <button onClick={() => setDatasetsMeta((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))} style={paginationButtonStyle} disabled={datasetsMeta.page === datasetsMeta.pages}>Next</button>
            </div>
          </div>
        )}

        {selectedDelete && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "grid", placeItems: "center", zIndex: 200 }}>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 28, width: 420, boxShadow: "0 28px 60px rgba(15,23,42,0.2)" }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Confirm delete</h2>
              <p style={{ color: "var(--gray-600)", marginTop: 12 }}>This will permanently remove the dataset and all versions.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setSelectedDelete(null)} style={{ ...buttonStyle, background: "#e5e7eb", color: "var(--gray-800)" }}>Cancel</button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await adminApi.deleteDataset(selectedDelete.id, "Admin panel deletion");
                      toast.success("Dataset deleted");
                      setSelectedDelete(null);
                      setDatasets((prev) => prev.filter((row) => row.id !== selectedDelete.id));
                    } catch {
                      toast.error("Delete failed");
                    }
                  }}
                  style={{ ...buttonStyle, background: "#dc2626", color: "#fff" }}
                >
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "audit" && (
          <div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)} style={{ minWidth: 200, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }}>
                <option value="">All actions</option>
                <option value="failed_login">Failed Login</option>
                <option value="login">Login</option>
                <option value="upload">Upload</option>
                <option value="delete">Delete</option>
                <option value="update">Update</option>
              </select>
              <input type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} style={{ padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }} />
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "var(--surface-base)" }}>
                  <tr>
                    <th style={tableHeaderStyle}>Action</th>
                    <th style={tableHeaderStyle}>User</th>
                    <th style={tableHeaderStyle}>Resource</th>
                    <th style={tableHeaderStyle}>IP</th>
                    <th style={tableHeaderStyle}>When</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <td style={tableCellStyle}>{item.action}</td>
                      <td style={tableCellStyle}>{item.user_id || "System"}</td>
                      <td style={tableCellStyle}>{item.resource_type}{item.resource_id ? ` #${item.resource_id}` : ""}</td>
                      <td style={tableCellStyle}>{item.ip_address || "—"}</td>
                      <td style={tableCellStyle}>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setAuditMeta((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))} style={paginationButtonStyle} disabled={auditMeta.page === 1}>Previous</button>
              <button onClick={() => setAuditMeta((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))} style={paginationButtonStyle} disabled={auditMeta.page === auditMeta.pages}>Next</button>
            </div>
          </div>
        )}

        {activeSection === "storage" && (
          <div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <div style={{ marginBottom: 14, fontWeight: 700 }}>Storage Breakdown by Organization</div>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storageRows} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1024 / 1024).toFixed(1)} MB`} />
                    <YAxis dataKey="organization_name" type="category" width={180} />
                    <Tooltip formatter={(value) => `${(value / 1024 / 1024).toFixed(2)} MB`} />
                    <Bar dataKey="total_bytes" fill="#16a34a" radius={[8, 8, 8, 8]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "var(--surface-base)" }}>
                  <tr>
                    <th style={tableHeaderStyle}>Organization</th>
                    <th style={tableHeaderStyle}>Users</th>
                    <th style={tableHeaderStyle}>Datasets</th>
                    <th style={tableHeaderStyle}>Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {storageRows.map((row) => (
                    <tr key={row.organization_name} style={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                      <td style={tableCellStyle}>{row.organization_name}</td>
                      <td style={tableCellStyle}>{row.user_count}</td>
                      <td style={tableCellStyle}>{row.dataset_count}</td>
                      <td style={tableCellStyle}>{`${(row.total_bytes / 1024 / 1024).toFixed(2)} MB`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Settings</div>
              {STORAGE_TOGGLES.map((toggle) => (
                <div key={toggle.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: 16, borderRadius: 14, background: "var(--surface-base)" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{toggle.label}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Configuration coming soon.</div>
                  </div>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={!!toggleStates[toggle.key]}
                      onChange={(e) => setToggleStates((prev) => ({ ...prev, [toggle.key]: e.target.checked }))}
                    />
                    <span style={{ color: "var(--gray-600)" }}>{toggleStates[toggle.key] ? "On" : "Off"}</span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Maintenance Mode</div>
              <div style={{ color: "var(--gray-600)", marginBottom: 16 }}>This is a placeholder for future maintenance controls. No live action is taken yet.</div>
              <button style={{ border: "1px solid #dc2626", color: "#dc2626", background: "transparent", borderRadius: 12, padding: "10px 16px", cursor: "pointer" }} onClick={() => toast.success("Maintenance toggle is coming soon")}>Enable Maintenance Mode</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  textAlign: "left",
  padding: "14px 16px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--gray-500)",
  fontWeight: 800,
};

const tableCellStyle = {
  padding: "14px 16px",
  fontSize: 14,
  color: "var(--gray-700)",
  verticalAlign: "middle",
};

const buttonStyle = {
  borderRadius: 12,
  border: "none",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  background: "var(--surface-base)",
  color: "var(--gray-900)",
};

const paginationButtonStyle = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.3)",
  padding: "10px 14px",
  background: "var(--surface-card)",
  cursor: "pointer",
};
