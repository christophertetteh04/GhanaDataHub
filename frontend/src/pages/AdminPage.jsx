import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi, usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const SECTIONS = [
  "overview",
  "users",
  "datasets",
  "audit",
  "storage",
  "settings",
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

function SectionTab({ label, active, onClick }) {
  return (
    <button
      className={`admin-tab${active ? " active" : ""}`}
      onClick={onClick}
      type="button"
    >
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

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [datasets, setDatasets] = useState([]);
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
    if (activeSection !== "overview") return;
    adminApi.overview().then((res) => setOverview(res.data)).catch((err) => toast.error("Unable to load overview"));
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

  const overviewStats = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "Total Users", value: overview.total_users },
      { label: "New Today", value: overview.new_users_today },
      { label: "Total Datasets", value: overview.total_datasets },
      { label: "New This Week", value: overview.new_datasets_this_week },
      { label: "Total Downloads", value: overview.total_downloads_all_time },
      { label: "Active Users 30d", value: overview.active_users_last_30_days },
    ];
  }, [overview]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-page" style={{ display: "flex", minHeight: "100%" }}>
      <div style={{ width: 200, background: "#fff", borderRight: "1px solid rgba(148,163,184,0.18)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--green)", marginBottom: 4 }}>Admin Panel</div>
          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Control center</div>
        </div>
        {SECTIONS.map((section) => (
          <SectionTab
            key={section}
            label={section.replace(/\b\w/g, (c) => c.toUpperCase())}
            active={activeSection === section}
            onClick={() => setActiveSection(section)}
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

        {activeSection === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
              {overviewStats.map((item) => (
                <div key={item.label} style={{ background: "#fff", padding: 18, borderRadius: 16, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                  <div style={{ color: "var(--gray-500)", fontSize: 12, marginBottom: 10 }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
                <div style={{ marginBottom: 14, fontWeight: 700 }}>Recent Signups</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {(overview?.recent_signups || []).map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, background: "#f8fafc" }}>
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

              <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
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

            <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
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
                style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)", background: "#fff" }}
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
            <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
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
                style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)", background: "#fff" }}
              />
              <select value={datasetsVisibility} onChange={(e) => setDatasetsVisibility(e.target.value)} style={{ minWidth: 180, padding: 10, borderRadius: 14, border: "1px solid rgba(148,163,184,0.3)" }}>
                <option value="">All visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="organization">Organization</option>
              </select>
            </div>
            <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: 420, boxShadow: "0 28px 60px rgba(15,23,42,0.2)" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>Settings</div>
              {STORAGE_TOGGLES.map((toggle) => (
                <div key={toggle.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: 16, borderRadius: 14, background: "#f8fafc" }}>
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
            <div style={{ background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 10px 30px rgba(15,23,42,0.04)" }}>
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
  background: "#f8fafc",
  color: "var(--gray-900)",
};

const paginationButtonStyle = {
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.3)",
  padding: "10px 14px",
  background: "#fff",
  cursor: "pointer",
};
