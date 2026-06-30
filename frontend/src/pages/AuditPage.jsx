import { useState, useEffect } from "react";
import api from "../services/api";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_COLORS = {
  login: "badge-green", logout: "badge-gray", upload: "badge-blue",
  delete: "badge-red", update: "badge-gold", share: "badge-blue",
  failed_login: "badge-red", role_change: "badge-gold",
  register: "badge-green", download: "badge-blue",
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PER_PAGE = 50;

  const load = () => {
    setLoading(true);
    api.get("/audit-logs/", { params: { page, per_page: PER_PAGE } })
      .then(r => { setLogs(r.data.items); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const pages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Audit Logs</div>
          <div className="page-subtitle">{total} total events recorded</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>User ID</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                  <span className="spinner" />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--gray-400)" }}>
                  No audit logs yet
                </td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge ${ACTION_COLORS[log.action] || "badge-gray"}`}>
                      {log.action?.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--gray-400)", fontFamily: "monospace" }}>
                    {log.user_id ? log.user_id.slice(0, 8) + "…" : "—"}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {log.resource_type ? (
                      <span>{log.resource_type} {log.resource_id ? `· ${log.resource_id.slice(0, 8)}…` : ""}</span>
                    ) : "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{log.ip_address || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-400)" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="pagination" style={{ paddingTop: 16 }}>
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: "var(--gray-500)" }}>Page {page} of {pages}</span>
            <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
