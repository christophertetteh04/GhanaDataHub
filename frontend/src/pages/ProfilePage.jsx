import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi, datasetsApi, apiKeysApi, authApi } from "../services/api";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Award,
  Bookmark,
  Calendar,
  Copy,
  Database,
  Download,
  Edit3,
  Globe,
  Key,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  UserRound,
} from "lucide-react";
import ActivityHeatmap from "../components/ActivityHeatmap";
import DataRadar from "../components/DataRadar";
import QualityBadge from "../components/QualityBadge";

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

function pad(value) {
  return String(value).padStart(2, "0");
}

function getISOWeekKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${pad(weekNo)}`;
}

function buildWeekCounts(items, dateKey = "created_at") {
  return items.reduce((acc, item) => {
    const key = getISOWeekKey(item?.[dateKey]);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function truncate(text, max) {
  if (!text) return "No description provided.";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getInitials(name = "") {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  return (parts.length ? parts : ["U"]).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function toList(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function MiniDatasetSparkline({ dataset }) {
  const raw = Array.isArray(dataset?.preview_data)
    ? dataset.preview_data
    : Array.isArray(dataset?.preview_data?.values)
      ? dataset.preview_data.values
      : [];
  const values = raw.map((value) => Number(value)).filter((value) => !Number.isNaN(value));

  if (values.length < 2) {
    return (
      <div style={{ width: 70, height: 42, borderRadius: 10, background: "var(--green-pale)", display: "grid", placeItems: "center", color: "var(--green)", fontSize: 12, fontWeight: 900 }}>
        {dataset.file_type?.slice(0, 2).toUpperCase() || "DS"}
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 68;
    const y = 36 - ((value - min) / range) * 28;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="70" height="42" viewBox="0 0 70 42" aria-label="Dataset sparkline">
      <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ACHIEVEMENT_ICONS = {
  Upload,
  TrendingUp,
  Database,
  Bookmark,
  Globe,
  Search,
};

const ACHIEVEMENTS = [
  { id: "first_upload", icon: "Upload", label: "First Upload", desc: "Uploaded your first dataset", colour: "#006B3F", earned: (stats) => stats.datasetCount >= 1 },
  { id: "downloads_100", icon: "TrendingUp", label: "100 Downloads Club", desc: "Your datasets received 100+ downloads", colour: "#1D4ED8", earned: (stats) => stats.totalDownloadsReceived >= 100 },
  { id: "prolific", icon: "Database", label: "Prolific Contributor", desc: "Uploaded 10 or more datasets", colour: "#7C3AED", earned: (stats) => stats.datasetCount >= 10 },
  { id: "curator", icon: "Bookmark", label: "Data Curator", desc: "Bookmarked 20 or more datasets", colour: "#0369A1", earned: (stats) => stats.bookmarkCount >= 20 },
  { id: "open_advocate", icon: "Globe", label: "Open Data Advocate", desc: "All your datasets are public", colour: "#059669", earned: (stats) => stats.datasetCount > 0 && stats.privateCount === 0 },
  { id: "explorer", icon: "Search", label: "Explorer", desc: "Downloaded 10 or more datasets", colour: "#D97706", earned: (stats) => stats.downloadHistoryCount >= 10 },
];

function Badge({ label }) {
  return (
    <span className="badge badge-green" style={{ textTransform: "capitalize", marginLeft: 6 }}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent = "var(--green)", hint }) {
  return (
    <div
      className="profile-stat-card"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 96,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: `${accent}18`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700, marginTop: 6 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{hint}</div>}
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
  const [profileLoadWarnings, setProfileLoadWarnings] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setProfileLoadWarnings([]);
    setProfileForm({ full_name: user.full_name || "", email: user.email || "" });
    const saved = window.localStorage.getItem("gdh_profile_notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch {
        window.localStorage.removeItem("gdh_profile_notifications");
      }
    }

    const requests = [
      { key: "datasets", label: "datasets", request: datasetsApi.list({ owner_id: user.id, per_page: 100 }) },
      { key: "bookmarks", label: "bookmarks", request: usersApi.bookmarks.list() },
      { key: "history", label: "download history", request: usersApi.downloadHistory() },
      { key: "keys", label: "API keys", request: apiKeysApi.list() },
    ];

    Promise.allSettled(requests.map((item) => item.request))
      .then((results) => {
        if (cancelled) return;
        const warnings = [];

        results.forEach((result, index) => {
          const request = requests[index];
          if (result.status === "fulfilled") {
            const list = toList(result.value);
            if (request.key === "datasets") setDatasets(list);
            if (request.key === "bookmarks") setBookmarks(list);
            if (request.key === "history") setHistory(list);
            if (request.key === "keys") setApiKeys(list);
            return;
          }

          console.warn(`Unable to load profile ${request.label}`, result.reason);
          warnings.push(request.label);
          if (request.key === "datasets") setDatasets([]);
          if (request.key === "bookmarks") setBookmarks([]);
          if (request.key === "history") setHistory([]);
          if (request.key === "keys") setApiKeys([]);
        });

        setProfileLoadWarnings(warnings);
        if (warnings.length === requests.length) {
          toast.error("Unable to load profile data");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    window.localStorage.setItem("gdh_profile_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const totalDownloads = useMemo(() => datasets.reduce((sum, item) => sum + (item.download_count || 0), 0), [datasets]);
  const uploadWeeks = useMemo(() => buildWeekCounts(datasets, "created_at"), [datasets]);
  const downloadWeeks = useMemo(() => buildWeekCounts(history, "created_at"), [history]);
  const profileStats = useMemo(() => ({
    datasetCount: datasets.length,
    totalDownloadsReceived: totalDownloads,
    bookmarkCount: bookmarks.length,
    privateCount: datasets.filter((item) => item.visibility !== "public").length,
    downloadHistoryCount: history.length,
  }), [datasets, totalDownloads, bookmarks, history]);
  const earnedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((achievement) => achievement.earned(profileStats)),
    [profileStats],
  );

  const getAchievementProgress = (achievementId) => {
    if (achievementId === "first_upload") return Math.min(1, profileStats.datasetCount / 1);
    if (achievementId === "downloads_100") return Math.min(1, profileStats.totalDownloadsReceived / 100);
    if (achievementId === "prolific") return Math.min(1, profileStats.datasetCount / 10);
    if (achievementId === "curator") return Math.min(1, profileStats.bookmarkCount / 20);
    if (achievementId === "open_advocate") return profileStats.datasetCount > 0 ? Math.max(0, 1 - profileStats.privateCount / profileStats.datasetCount) : 0;
    if (achievementId === "explorer") return Math.min(1, profileStats.downloadHistoryCount / 10);
    return 0;
  };

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
    <div className="profile-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 16px 48px" }}>
      <div
        className="profile-hero-card"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(0,107,63,0.96) 0%, #0A1410 58%, rgba(252,209,22,0.22) 120%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
          color: "white",
        }}
      >
        <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 68%)", top: -160, right: -80 }} />
        <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,209,22,0.16), transparent 70%)", bottom: -130, left: "30%" }} />

        <div className="profile-hero-inner" style={{ position: "relative", padding: "34px 34px 30px", display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", gap: 22, alignItems: "center" }}>
          <div style={{ width: 92, height: 92, borderRadius: 28, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 30, fontWeight: 900, boxShadow: "0 12px 30px rgba(0,0,0,0.20)" }}>
            {getInitials(user.full_name || user.username)}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.7 }}>
                DataGhana.io Profile
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(0,163,92,0.18)", color: "#A7F3D0", fontSize: 11, fontWeight: 900 }}>
                <ShieldCheck size={13} /> {user.role?.replace("_", " ") || "member"}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.08, fontWeight: 900, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
              {user.full_name || user.username}
            </h1>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><UserRound size={14} /> @{user.username}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> Member since {formatDate(user.created_at)}</span>
              {user.organization_id && <span>Organization ID: {user.organization_id}</span>}
            </div>
          </div>

          <div className="profile-hero-actions" style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/datasets")}
              style={{ height: 42, border: "none", background: "white", color: "var(--green)", borderRadius: 12, padding: "0 16px", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Upload size={16} /> Upload
            </button>
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              style={{ height: 42, border: "1px solid rgba(255,255,255,0.32)", background: "rgba(255,255,255,0.08)", color: "white", borderRadius: 12, padding: "0 16px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Edit3 size={16} />
              {editMode ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="profile-hero-metrics" style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 10 }}>
            {[
              ["Datasets", datasets.length],
              ["Downloads", totalDownloads.toLocaleString()],
              ["Saved", bookmarks.length],
              ["Badges", `${earnedAchievements.length}/${ACHIEVEMENTS.length}`],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)" }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {editMode && (
            <div style={{ gridColumn: "1 / -1", marginTop: 8, padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(16px)" }}>
              <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 800, color: "white" }}>Full name</span>
                  <input
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontWeight: 800, color: "white" }}>Email</span>
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

      {profileLoadWarnings.length > 0 && (
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.22)", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
          <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Some optional profile sections could not load: {profileLoadWarnings.join(", ")}. Your main profile is still available.
          </span>
        </div>
      )}

      <div className="profile-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginTop: 24 }}>
        <StatCard icon={Database} label="My Datasets" value={datasets.length} accent="#006B3F" hint="Published or private uploads" />
        <StatCard icon={Download} label="Total Downloads" value={totalDownloads.toLocaleString()} accent="#1D4ED8" hint="Across your uploads" />
        <StatCard icon={Bookmark} label="Saved Datasets" value={bookmarks.length} accent="#7C3AED" hint="Your research shortlist" />
        <StatCard icon={Award} label="Achievements" value={`${earnedAchievements.length}/${ACHIEVEMENTS.length}`} accent="#D97706" hint="Progress milestones" />
      </div>

      <div className="profile-insights-grid" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
        <div className="card" style={{ padding: 22, overflow: "hidden", border: "1px solid var(--border-subtle)", borderRadius: 18, background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)" }}>Activity</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Uploads and downloads across the last year.</div>
            </div>
            <span style={{ padding: "5px 9px", borderRadius: 999, background: "var(--green-pale)", color: "var(--green)", fontSize: 11, fontWeight: 900 }}>
              52 weeks
            </span>
          </div>
          <ActivityHeatmap uploadWeeks={uploadWeeks} downloadWeeks={downloadWeeks} />
        </div>
        <div className="card" style={{ padding: 22, border: "1px solid var(--border-subtle)", borderRadius: 18, background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>Data Interests</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Your strongest research signals.</div>
          <DataRadar datasets={datasets} downloadHistory={history} />
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginTop: 16, border: "1px solid var(--border-subtle)", borderRadius: 18, background: "var(--surface-card)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)" }}>Achievements</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Milestones that show your contribution to Ghana's data ecosystem.</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 800 }}>
            {earnedAchievements.length}/{ACHIEVEMENTS.length}
          </div>
        </div>
        <div className="profile-achievements-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(80px, 1fr))", gap: 12 }}>
          {ACHIEVEMENTS.map((achievement) => {
            const earned = achievement.earned(profileStats);
            const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Database;
            const progress = getAchievementProgress(achievement.id);
            return (
              <div
                key={achievement.id}
                title={earned ? achievement.desc : `Locked: ${achievement.desc}`}
                style={{
                  minWidth: 80,
                  textAlign: "center",
                  padding: "12px 8px",
                  borderRadius: 12,
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-elevated)",
                  opacity: earned ? 1 : 0.72,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: earned ? achievement.colour : "#D1D5DB",
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: earned ? "var(--text-primary)" : "var(--text-muted)", lineHeight: 1.25 }}>
                  {achievement.label}
                </div>
                {!earned && (
                  <div style={{ marginTop: 9, width: "100%", height: 4, borderRadius: 99, background: "var(--gray-300)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: "var(--green)", borderRadius: 99 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { key: "datasets", label: "My Datasets", icon: Database },
          { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
          { key: "history", label: "Download History", icon: Download },
          { key: "settings", label: "Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? "tab-pill active" : "tab-pill"}
              style={{ minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
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
                  style={{ borderRadius: 10, border: "1px solid var(--green)", background: "var(--surface-card)", color: "var(--green)", padding: "10px 18px", cursor: "pointer" }}
                >
                  Upload Your First Dataset
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {datasets.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 16,
                      borderRadius: 12,
                      background: "var(--surface-card)",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <MiniDatasetSparkline dataset={item} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <a
                        href={`/datasets/${item.id}`}
                        style={{
                          fontWeight: 800,
                          fontSize: 14,
                          color: "var(--text-primary)",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </a>
                      <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginTop: 4 }}>
                        {item.category?.name || "Uncategorized"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                        {truncate(item.description, 60)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div
                        title={`${item.download_count || 0} downloads`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          color: (item.download_count || 0) > 10 ? "var(--green)" : "var(--text-muted)",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <TrendingUp size={14} />
                        {item.download_count || 0}
                      </div>
                      <QualityBadge dataset={item} size="sm" />
                      <a href={`/datasets/${item.id}`} className="text-link" style={{ whiteSpace: "nowrap" }}>
                        <Edit3 size={14} /> Edit
                      </a>
                    </div>
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
                <div style={{ color: "var(--text-secondary)" }}>Bookmark datasets to keep them handy.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {bookmarks.map((item) => (
                  <div key={item.id} className="list-row">
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div className="file-icon">{item.file_type?.slice(0, 2).toUpperCase() || "DS"}</div>
                      <div>
                        <a href={`/datasets/${item.id}`} style={{ fontWeight: 800, color: "var(--text-primary)" }}>{item.title}</a>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
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
                        <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                          {item.title || "[Deleted dataset]"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
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
                <div style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}>
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
                    <label key={pref.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 14, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}>
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
                <div style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13 }}>
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
                  <div style={{ padding: 18, borderRadius: 14, background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.28)", marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Save this key now. You will never see it again.</div>
                    <div style={{ fontFamily: "monospace", background: "var(--surface-card)", padding: 12, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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
                    <div key={key.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{key.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{key.key_prefix}... · {key.is_active ? "Active" : "Revoked"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Last used {key.last_used_at ? formatDate(key.last_used_at) : "never"}</div>
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
      <style>{`
        .profile-stat-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .profile-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .profile-page .card {
          background: var(--surface-card);
          border-color: var(--border-subtle);
        }

        @media (max-width: 900px) {
          .profile-hero-inner {
            grid-template-columns: 1fr !important;
            text-align: left;
          }

          .profile-hero-actions {
            justify-content: flex-start !important;
          }

          .profile-hero-metrics,
          .profile-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .profile-insights-grid {
            grid-template-columns: 1fr !important;
          }

          .profile-achievements-grid {
            grid-template-columns: repeat(3, minmax(80px, 1fr)) !important;
          }
        }

        @media (max-width: 560px) {
          .profile-page {
            padding: 16px 12px 36px !important;
          }

          .profile-hero-inner {
            padding: 24px 20px !important;
          }

          .profile-hero-metrics,
          .profile-stats-grid {
            grid-template-columns: 1fr !important;
          }

          .profile-page .list-row {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .profile-achievements-grid {
            grid-template-columns: repeat(2, minmax(80px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
