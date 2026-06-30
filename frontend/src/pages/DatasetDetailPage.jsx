import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { datasetsApi, shareApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { ArrowLeft, Download, Share2, Clock, User, Tag, FileText, History, X } from "lucide-react";

const VIS_LABELS = { public: "Public", private: "Private", organization: "Organization", shared_link: "Shared Link" };

function ShareModal({ datasetId, onClose }) {
  const [hours, setHours] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const payload = { dataset_id: datasetId };
      if (hours) payload.expires_in_hours = parseInt(hours);
      const { data } = await shareApi.create(payload);
      setResult(data);
    } catch (err) {
      toast.error("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const link = result ? `${window.location.origin}/shared/${result.token}` : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Share Dataset</div>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={18} /></button>
        </div>
        {!result ? (
          <>
            <div className="form-group">
              <label className="form-label">Expires in (hours) — leave blank for never</label>
              <input className="form-input" type="number" min="1" value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. 24" />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={create} disabled={loading}>
              {loading ? <span className="spinner" /> : "Generate Link"}
            </button>
          </>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 10 }}>Share this link:</p>
            <div style={{ background: "var(--gray-100)", borderRadius: 7, padding: "10px 12px", fontSize: 12, wordBreak: "break-all", marginBottom: 12 }}>
              {link}
            </div>
            {result.expires_at && <p style={{ fontSize: 12, color: "var(--gray-500)" }}>Expires: {new Date(result.expires_at).toLocaleString()}</p>}
            <button className="btn btn-secondary" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
              onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied!"); }}>
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [tab, setTab] = useState("info");

  useEffect(() => {
    datasetsApi.get(id).then(r => setDataset(r.data)).catch(() => navigate("/datasets"));
    datasetsApi.versions(id).then(r => setVersions(r.data)).catch(() => {});
  }, [id]);

  if (!dataset) return <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>;

  const isOwner = user?.id === dataset.owner_id;
  const canShare = isOwner || user?.role === "super_admin";
  const formatSize = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 ** 2).toFixed(1)} MB`;
  };

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate("/datasets")}>
        <ArrowLeft size={13} /> Back to Datasets
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{dataset.title}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <span className={`badge vis-${dataset.visibility}`}>{VIS_LABELS[dataset.visibility]}</span>
              {dataset.file_type && <span className="badge badge-gray">{dataset.file_type}</span>}
              {dataset.category && <span className="badge badge-blue">{dataset.category.name}</span>}
              <span className="badge badge-green">v{dataset.version}</span>
            </div>
            {dataset.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {dataset.tags.map(t => <span key={t.id} className="tag-chip"><Tag size={10} />{t.name}</span>)}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {canShare && (
              <button className="btn btn-secondary" onClick={() => setShowShare(true)}>
                <Share2 size={14} /> Share
              </button>
            )}
            {dataset.file_path && (
              <a href={`http://localhost:8000/uploads/${dataset.file_path.split("/").pop()}`} download
                className="btn btn-primary">
                <Download size={14} /> Download
              </a>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "var(--gray-500)", flexWrap: "wrap" }}>
          {dataset.owner && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <User size={13} /> {dataset.owner.full_name}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={13} /> {new Date(dataset.created_at).toLocaleDateString()}
          </span>
          <span><Download size={13} style={{ display: "inline", marginRight: 4 }} />{dataset.download_count} downloads</span>
          <span><FileText size={13} style={{ display: "inline", marginRight: 4 }} />{formatSize(dataset.file_size)}</span>
          {dataset.license && <span>License: {dataset.license}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["info", "versions"].map(t => (
          <button key={t} className={`btn ${tab === t ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setTab(t)}>
            {t === "info" ? "Information" : <><History size={13} /> Version History</>}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="card">
          <h4 style={{ fontFamily: "Sora", fontWeight: 600, marginBottom: 10 }}>Description</h4>
          <p style={{ fontSize: 14, color: "var(--gray-600)", lineHeight: 1.7 }}>
            {dataset.description || <em style={{ color: "var(--gray-400)" }}>No description provided.</em>}
          </p>
          {dataset.file_name && (
            <div style={{ marginTop: 20, padding: 14, background: "var(--gray-100)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 4 }}>File</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{dataset.file_name}</div>
              <div style={{ fontSize: 12, color: "var(--gray-400)" }}>{formatSize(dataset.file_size)}</div>
            </div>
          )}
        </div>
      )}

      {tab === "versions" && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Version</th><th>File</th><th>Change Summary</th><th>Date</th></tr>
              </thead>
              <tbody>
                {versions.map(v => (
                  <tr key={v.id}>
                    <td><span className="badge badge-green">v{v.version_number}</span></td>
                    <td style={{ fontSize: 12 }}>{v.file_name || "—"}</td>
                    <td style={{ color: "var(--gray-600)" }}>{v.change_summary || "—"}</td>
                    <td style={{ fontSize: 12 }}>{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showShare && <ShareModal datasetId={dataset.id} onClose={() => setShowShare(false)} />}
    </div>
  );
}
