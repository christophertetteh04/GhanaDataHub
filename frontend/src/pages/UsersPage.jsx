import { useState, useEffect } from "react";
import { usersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UserCheck, UserX, Shield, Search } from "lucide-react";

const ROLES = ["super_admin", "org_admin", "data_manager", "analyst", "viewer"];
const ROLE_COLORS = {
  super_admin: "badge-red",
  org_admin: "badge-gold",
  data_manager: "badge-blue",
  analyst: "badge-green",
  viewer: "badge-gray",
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    usersApi.list({ search, per_page: 100 })
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const updateRole = async (userId, role) => {
    try {
      await usersApi.updateRole(userId, role);
      toast.success("Role updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    }
  };

  const suspend = async (userId) => {
    if (!confirm("Suspend this user?")) return;
    try {
      await usersApi.suspend(userId);
      toast.success("User suspended");
      load();
    } catch { toast.error("Failed"); }
  };

  const reactivate = async (userId) => {
    try {
      await usersApi.reactivate(userId);
      toast.success("User reactivated");
      load();
    } catch { toast.error("Failed"); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-subtitle">{users.length} registered users</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <Search size={14} color="var(--gray-400)" />
          <input
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  <span className="spinner" />
                </td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--green)", color: "white" }}>
                        {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>@{u.username}</td>
                  <td>
                    {u.id === me?.id ? (
                      <span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role.replace("_", " ")}</span>
                    ) : (
                      <select
                        style={{ fontSize: 12, padding: "3px 6px", borderRadius: 5, border: "1px solid var(--gray-300)", background: "white" }}
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        disabled={me?.role !== "super_admin" && u.role === "super_admin"}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                      </select>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                      {u.is_active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--gray-400)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      u.is_active ? (
                        <button className="btn btn-danger btn-sm" onClick={() => suspend(u.id)}>
                          <UserX size={12} /> Suspend
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => reactivate(u.id)}>
                          <UserCheck size={12} /> Reactivate
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
