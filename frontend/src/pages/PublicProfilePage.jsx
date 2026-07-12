import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usersApi } from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Database, Download, User } from "lucide-react";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    setLoading(true);
    usersApi.publicProfile(username)
      .then((res) => {
        setProfile(res.data);
        return fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/datasets/?owner_id=${res.data.id}&visibility=public&per_page=100`);
      })
      .then((response) => response.json())
      .then((body) => {
        setDatasets(body.items || body);
      })
      .catch((err) => {
        console.error(err);
        toast.error("User not found");
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return <div className="page-spinner" />;
  }

  if (!profile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Profile not found</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--green)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 }}>
            {profile.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{profile.full_name}</div>
            <div style={{ fontSize: 14, color: "var(--gray-500)" }}>@{profile.username}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", color: "var(--gray-500)", fontSize: 13 }}>
              <span>{profile.role.replace("_", " ")}</span>
              <span>Member since {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <div className="profile-stat-card">
            <Database size={18} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{profile.public_dataset_count}</div>
            <div style={{ color: "var(--gray-500)" }}>Public datasets</div>
          </div>
          <div className="profile-stat-card">
            <Download size={18} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{profile.public_downloads_received}</div>
            <div style={{ color: "var(--gray-500)" }}>Downloads received</div>
          </div>
          <div className="profile-stat-card">
            <User size={18} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{formatDate(profile.created_at)}</div>
            <div style={{ color: "var(--gray-500)" }}>Member since</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Public datasets</div>
            <div style={{ color: "var(--gray-500)", marginTop: 4 }}>A read-only view of this user’s shared datasets.</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{datasets.length} items</div>
        </div>
        {datasets.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--gray-500)" }}>
            No public datasets found.
          </div>
        ) : (
          <div className="grid-list">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="dataset-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>{dataset.title}</div>
                    <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{dataset.file_type || "Dataset"}</div>
                  </div>
                  <span className="badge badge-green">{dataset.visibility}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: "var(--gray-500)" }}>
                  <span>{dataset.download_count} downloads</span>
                  <Link to={`/datasets/${dataset.id}`} className="text-link">View dataset <ExternalLink size={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
