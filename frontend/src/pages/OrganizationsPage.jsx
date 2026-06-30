import { useState, useEffect } from "react";
import { orgsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Plus, Building2, Users, X, Globe, UserPlus, Trash2 } from "lucide-react";

function CreateOrgModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", description: "", website: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await orgsApi.create(form);
      toast.success("Organization created!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create Organization</div>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Organization Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ghana Statistical Service" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What does this organization do?" />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input className="form-input" value={form.website}
              onChange={e => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.gov.gh" type="url" />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ org, onClose }) {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    orgsApi.members(org.id).then(r => setMembers(r.data)).finally(() => setLoading(false));
  }, [org.id]);

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await orgsApi.invite(org.id, { email: inviteEmail, role: inviteRole });
      toast.success("Member invited!");
      setInviteEmail("");
      orgsApi.members(org.id).then(r => setMembers(r.data));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const remove = async (userId) => {
    if (!confirm("Remove this member?")) return;
    try {
      await orgsApi.removeMember(org.id, userId);
      toast.success("Member removed");
      setMembers(members.filter(m => m.id !== userId));
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title">Members — {org.name}</div>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={18} /></button>
        </div>

        <form onSubmit={invite} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="Email address"
            value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required type="email" />
          <select className="form-select" style={{ width: 130 }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
            {["viewer", "analyst", "data_manager", "org_admin"].map(r => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={inviting}>
            {inviting ? <span className="spinner" /> : <><UserPlus size={13} /> Invite</>}
          </button>
        </form>

        {loading ? <div style={{ textAlign: "center" }}><span className="spinner" /></div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                background: "var(--gray-100)", borderRadius: 7 }}>
                <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--green)", color: "white" }}>
                  {m.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.full_name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>{m.email}</div>
                </div>
                <span className="badge badge-gray" style={{ fontSize: 10 }}>{m.role.replace("_", " ")}</span>
                <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {members.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--gray-400)", fontSize: 13, padding: 20 }}>
                No members yet. Invite someone above.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const canCreate = ["super_admin", "org_admin"].includes(user?.role);

  const load = () => {
    setLoading(true);
    orgsApi.list().then(r => setOrgs(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Organizations</div>
          <div className="page-subtitle">{orgs.length} organizations</div>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Organization
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : orgs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Building2 size={24} /></div>
          <div style={{ fontWeight: 600 }}>No organizations yet</div>
          {canCreate && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Organization
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {orgs.map(org => (
            <div key={org.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, background: "var(--green-pale)", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)", flexShrink: 0 }}>
                  <Building2 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 15 }}>{org.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-400)" }}>/{org.slug}</div>
                </div>
                <span className={`badge ${org.is_active ? "badge-green" : "badge-red"}`}>
                  {org.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {org.description && (
                <p style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {org.description}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingTop: 10, borderTop: "1px solid var(--gray-100)" }}>
                {org.website ? (
                  <a href={org.website} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--green)" }}>
                    <Globe size={12} /> Website
                  </a>
                ) : <span />}
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrg(org)}>
                  <Users size={12} /> Manage Members
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateOrgModal onClose={() => setShowCreate(false)} onSuccess={load} />}
      {selectedOrg && <MembersModal org={selectedOrg} onClose={() => setSelectedOrg(null)} />}
    </div>
  );
}
