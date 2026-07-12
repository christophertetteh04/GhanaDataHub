import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi, datasetsApi, apiKeysApi, authApi } from "../services/api";
import toast from "react-hot-toast";
import { Database, Bookmark, Download, Settings, Key, Edit3, Copy, ChevronRight, ExternalLink } from "lucide-react";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
}

function timeAgo(value) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Badge({ label }) {
  return (
    <span className="badge badge-green" style={{ textTransform: "capitalize", marginLeft: 6 }}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "" });
  const [datasets, setDatasets] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState(null);
  const [notifications, setNotifications] = useState({ downloads: false, comments: false, digest: false });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [activeTab, setActiveTab] = useState("datasets");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ full_name: user.full_name || "", email: user.email || "" });
    const saved = window.localStorage.getItem("gdh_profile_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
    Promise.all([
      datasetsApi.list({ owner_id: user.id, per_page: 100 }),
      usersApi.bookmarks.list(),
      usersApi.downloadHistory(),
      apiKeysApi.list(),
    ])
      .then(([datasetsRes, bookmarksRes, historyRes, keysRes]) => {
        setDatasets(datasetsRes.data.items || datasetsRes.data);
        setBookmarks(bookmarksRes.data);
        setHistory(historyRes.data);
        setApiKeys(keysRes.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Unable to load profile data");
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem("gdh_profile_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const totalDownloads = useMemo(() => datasets.reduce((sum, item) => sum + (item.download_count || 0), 0), [datasets]);

  const handleProfileSave = async () => {
    try {
      const { data } = await usersApi.updateMe(profileForm);
      setUser(data);
      toast.success("Profile updated");
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to save profile");
    }
  };

  const handleBookmarkRemove = async (datasetId) => {
    try {
      await usersApi.bookmarks.remove(datasetId);
      setBookmarks((prev) => prev.filter((item) => item.id !== datasetId));
      toast.success("Bookmark removed");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to remove bookmark");
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return toast.error("Please enter a key name");
    try {
      const { data } = await apiKeysApi.create({ name: keyName });
      setNewKey(data);
      setApiKeys((prev) => [data, ...prev]);
      setKeyName("");
      toast.success("API key created");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to create API key");
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm("Revoke this API key?")) return;
    try {
      await apiKeysApi.revoke(id);
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
      toast.success("API key revoked");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Unable to revoke key");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error("New passwords must match");
    }
    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Password changed successfully");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Password change coming soon.");
      } else {
        toast.error(err.response?.data?.detail || "Unable to change password");
      }
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px" }}>
      <div className="card" style={{ position: "relative", overflow: "visible", padding: 0 }}>
        <div style={{ height: 120, background: "linear-gradient(90deg, var(--green), #004D2C)" }} />
        <div style={{ position: "absolute", left: 28, bottom: -36 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--green)", border: "3px solid white", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, fontWeight: 800 }}>
            {user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div style={{ padding: "48px 32px 32px 140px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{user.full_name}</div>
              <div style={{ fontSize: 14, color: "var(--gray-500)" }}>{`@${user.username}`}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge label={user.role.replace("_", " ")} />
                <span style={{ color: "var(--gray-500)", fontSize: 13 }}>Member since {formatDate(user.created_at)}</span>
                {user.organization_id && <span style={{ color: "var(--gray-500)", fontSize: 13 }}>Organization ID: {user.organization_id}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              style={{ border: "1px solid var(--green)", background: "transparent", color: "var(--green)", borderRadius: 12, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
            >
              <Edit3 size={16} style={{ marginRight: 8 }} />
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {editMode && (
            <div style={{ marginTop: 24, padding: 24, borderRadius: 18, background: "rgba(240,255,245,0.9)", border: "1px solid rgba(0,107,63,0.15)" }}>
              <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>Full name</span>
                  <input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>Email</span>
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  style={{ width: 160, borderRadius: 12, border: "none", background: "var(--green)", color: "white", padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}
                >
                  Save profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginTop: 24 }}>
        <StatCard icon={Database} label="My Datasets" value={datasets.length} />
        <StatCard icon={Download} label="Total Downloads" value={totalDownloads} />
        <StatCard icon={Bookmark} label="Bookmarks" value={bookmarks.length} />
        <StatCard icon={Settings} label="Member Since" value={formatDate(user.created_at)} />
      </div>

      <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { key: "datasets", label: "My Datasets" },
          { key: "bookmarks", label: "Bookmarks" },
          { key: "history", label: "Download History" },
          { key: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? "tab-pill active" : "tab-pill"}
            style={{ minWidth: 150 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {activeTab === "datasets" && (
          <div className="card" style={{ padding: 20 }}>
            {loading ? (
              <div className="spinner" />
            ) : datasets.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>You have not uploaded any datasets yet.</div>
                <button
                  type="button"
                  onClick={() => navigate("/datasets")}
                  style={{ borderRadius: 10, border: "1px solid var(--green)", background: "white", color: "var(--green)", padding: "10px 18px", cursor: "pointer" }}
                >
                  Upload Your First Dataset
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {datasets.map((item) => (
                  <div key={item.id} className="list-row">
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div className="file-icon">{item.file_type?.slice(0, 2).toUpperCase() || "DS"}</div>
                      <div>
                        <a href={`/datasets/${item.id}`} style={{ fontWeight: 700, color: "var(--gray-900)" }}>{item.title}</a>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 3 }}>
                          {item.visibility} · {item.download_count} downloads · uploaded {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                    <a href={`/datasets/${item.id}`} className="text-link">Edit <ChevronRight size={14} /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "bookmarks" && (
          <div className="card" style={{ padding: 20 }}>
            {loading ? (
              <div className="spinner" />
            ) : bookmarks.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>No bookmarks yet.</div>
                <div style={{ color: "var(--gray-500)" }}>Bookmark datasets to keep them handy.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {bookmarks.map((item) => (
                  <div key={item.id} className="list-row">
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div className="file-icon">{item.file_type?.slice(0, 2).toUpperCase() || "DS"}</div>
                      <div>
                        <a href={`/datasets/${item.id}`} style={{ fontWeight: 700, color: "var(--gray-900)" }}>{item.title}</a>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 3 }}>
                          {item.visibility} · {item.download_count} downloads · uploaded {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleBookmarkRemove(item.id)} className="btn btn-secondary btn-sm">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="card" style={{ padding: 20 }}>
            {loading ? (
              <div className="spinner" />
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>No downloads found yet.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {history.map((item, index) => (
                  <div key={index} className="list-row">
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div className="file-icon">{item.file_type?.slice(0, 2).toUpperCase() || "DL"}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>
                          {item.title || "[Deleted dataset]"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 3 }}>
                          Downloaded · {timeAgo(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "grid", gap: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Settings size={18} />
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Change password</div>
                </div>
                <form onSubmit={handlePasswordSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                  />
                  <button type="submit" className="btn btn-primary btn-lg">Change password</button>
                </form>
                <div style={{ marginTop: 10, color: "var(--gray-500)", fontSize: 13 }}>
                  If password change is not available, this feature will show as coming soon.
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Bookmark size={18} />
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Notification preferences</div>
                </div>
                <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
                  {[
                    { key: "downloads", label: "Email me when my dataset is downloaded" },
                    { key: "comments", label: "Email me when someone comments on my dataset" },
                    { key: "digest", label: "Weekly data digest email" },
                  ].map((pref) => (
                    <label key={pref.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 14, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
                      <span>{pref.label}</span>
                      <input
                        type="checkbox"
                        checked={notifications[pref.key]}
                        onChange={(e) => setNotifications((prev) => ({ ...prev, [pref.key]: e.target.checked }))}
                        style={{ width: 44, height: 24, accentColor: "var(--green)" }}
                      />
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 10, color: "var(--gray-500)", fontSize: 13 }}>
                  Saved locally in your browser.
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Key size={18} />
                  <div style={{ fontSize: 16, fontWeight: 700 }}>API keys</div>
                </div>
                <form onSubmit={handleGenerateKey} style={{ display: "grid", gap: 12, maxWidth: 520, marginBottom: 18 }}>
                  <input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Key name"
                  />
                  <button type="submit" className="btn btn-primary btn-lg">Generate key</button>
                </form>
                {newKey && (
                  <div style={{ padding: 18, borderRadius: 14, background: "rgba(254,243,235,0.95)", border: "1px solid rgba(249,115,22,0.3)", marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Save this key now. You will never see it again.</div>
                    <div style={{ fontFamily: "monospace", background: "white", padding: 12, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ overflowWrap: "anywhere" }}>{newKey.key}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newKey.key);
                          toast.success("Copied to clipboard");
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gap: 12 }}>
                  {apiKeys.map((key) => (
                    <div key={key.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{key.name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{key.key_prefix}... · {key.is_active ? "Active" : "Revoked"}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>Last used {key.last_used_at ? formatDate(key.last_used_at) : "never"}</div>
                      </div>
                      <button type="button" onClick={() => handleRevokeKey(key.id)} className="btn btn-secondary btn-sm">Revoke</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
