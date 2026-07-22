import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { datasetsApi, shareApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import QualityBadge from "../components/QualityBadge";
import { trackDatasetView } from "../components/PersonalisedRecs";
import WatchButton from "../components/WatchButton";
import GhanaRegionMap from "../components/GhanaRegionMap";
import { detectRegionColumn } from "../utils/mapUtils";
import AttributionModal from "../components/AttributionModal";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  Share2,
  User,
  Tag,
  History,
  X,
  Copy,
  Link2,
  ChevronRight,
  Eye,
  Clock,
  FileText,
  Shield,
  Code2,
  Dot,
  Database,
  Map,
  BarChart2,
  Sparkles,
  TriangleAlert,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const VIS_LABELS = {
  public: "Public",
  private: "Private",
  organization: "Organization",
  shared_link: "Shared Link",
};

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

  const link = result
    ? `${window.location.origin}/shared/${result.token}`
    : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Share Dataset</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none" }}
          >
            <X size={18} />
          </button>
        </div>
        {!result ? (
          <>
            <div className="form-group">
              <label className="form-label">
                Expires in (hours) — leave blank for never
              </label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 24"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={create}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Generate Link"}
            </button>
          </>
        ) : (
          <div>
            <p
              style={{
                fontSize: 13,
                color: "var(--gray-600)",
                marginBottom: 10,
              }}
            >
              Share this link:
            </p>
            <div
              style={{
                background: "var(--gray-100)",
                borderRadius: 7,
                padding: "10px 12px",
                fontSize: 12,
                wordBreak: "break-all",
                marginBottom: 12,
              }}
            >
              {link}
            </div>
            {result.expires_at && (
              <p style={{ fontSize: 12, color: "var(--gray-500)" }}>
                Expires: {new Date(result.expires_at).toLocaleString()}
              </p>
            )}
            <button
              className="btn btn-secondary"
              style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast.success("Copied!");
              }}
            >
              Copy Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const generateMockData = (title = "", category = "", count = 8) => {
  const t = (title + " " + category).toLowerCase();
  
  if (t.includes('health') || t.includes('hospital')) {
    return {
      columns: ['ID', 'Region', 'Facility Name', 'Beds', 'Status', 'Last Inspected'],
      rows: Array.from({length: count}).map((_, i) => ({
        id: `H-${1000 + i}`,
        region: ['Greater Accra', 'Ashanti', 'Volta'][i % 3],
        facility: `General Hospital ${i + 1}`,
        beds: 50 + (i * 12),
        status: i % 4 === 0 ? 'Maintenance' : 'Active',
        inspected: `2024-0${1 + (i % 9)}-15`
      }))
    };
  } else if (t.includes('education') || t.includes('school')) {
     return {
      columns: ['School ID', 'District', 'Level', 'Students', 'Teachers', 'Ratio'],
      rows: Array.from({length: count}).map((_, i) => ({
        id: `EDU-${8000 + i}`,
        district: ['Ayawaso', 'Kumasi', 'Tamale'][i % 3],
        level: i % 2 === 0 ? 'Primary' : 'Secondary',
        students: 200 + (i * 45),
        teachers: 10 + (i * 2),
        ratio: ( (200 + (i * 45)) / (10 + (i * 2)) ).toFixed(1)
      }))
    };
  } else {
    return {
      columns: ['Record ID', 'Category', 'Value (GHS)', 'Date Logged', 'Status'],
      rows: Array.from({length: count}).map((_, i) => ({
        id: `REC-${500 + i}`,
        category: ['Type A', 'Type B', 'Type C'][i % 3],
        value: (1000.50 + i * 25.25).toFixed(2),
        date: `2024-03-0${1 + (i % 9)}`,
        status: i % 3 === 0 ? 'Pending' : 'Verified'
      }))
    };
  }
};

const StatBubble = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
       {React.cloneElement(icon, { size: 14 })}
       {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{value}</div>
  </div>
);

const InfoRow = ({ label, value, isLast }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid var(--gray-200)' }}>
    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-800)', textAlign: 'right' }}>{value}</span>
  </div>
);

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [related, setRelated] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [csvRows, setCsvRows] = useState(null);
  const [hasRegionData, setHasRegionData] = useState(false);
  
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);

  useEffect(() => {
    datasetsApi
      .get(id)
      .then((r) => setDataset(r.data))
      .catch(() => navigate("/datasets"));
    datasetsApi
      .versions(id)
      .then((r) => setVersions(r.data))
      .catch(() => {});
      
    datasetsApi
      .list({ per_page: 4 })
      .then(r => {
         const items = r.data.items || r.data;
         const filtered = (Array.isArray(items) ? items : []).filter(d => d.id.toString() !== id.toString()).slice(0, 3);
         setRelated(filtered);
      })
      .catch(() => {});
  }, [id, navigate]);
  
  useEffect(() => {
    if (dataset) {
      trackDatasetView(dataset);
    }
  }, [dataset]);

  useEffect(() => {
    if (!dataset) return;
    // Check if preview_data exists and try to detect region column.
    // preview_data is an array of numbers from the first numeric column.
    // We cannot detect region column from preview_data alone since it
    // is just numbers. Instead, check the dataset title and tags.
    const titleLower = (dataset.title || "").toLowerCase();
    const tagNames = (dataset.tags || []).map((t) => (t.name || t).toLowerCase());
    const regionSignals = [
      "region",
      "regional",
      "district",
      "area",
      "zone",
      "constituency",
      "northern",
      "southern",
      "ghana",
    ];
    const titleHasRegion = regionSignals.some((s) => titleLower.includes(s));
    const tagsHaveRegion = tagNames.some((t) => regionSignals.some((s) => t.includes(s)));
    const previewHeaders = Array.isArray(dataset.preview_data?.[0]) ? dataset.preview_data[0] : [];
    const previewHasRegion = detectRegionColumn(previewHeaders) !== -1;
    if (titleHasRegion || tagsHaveRegion || previewHasRegion) {
      setHasRegionData(true);
      // Build a sample rows array from dataset metadata for the map.
      // For the MVP: show a placeholder map with Ghana regions coloured
      // by a uniform value.
      setCsvRows([
        ["Region", "Download to view"],
        ["Greater Accra", 1], ["Ashanti", 1], ["Western", 1],
        ["Western North", 1], ["Central", 1], ["Eastern", 1],
        ["Volta", 1], ["Oti", 1], ["Bono", 1], ["Bono East", 1],
        ["Ahafo", 1], ["Northern", 1], ["Savannah", 1],
        ["North East", 1], ["Upper East", 1], ["Upper West", 1],
      ]);
    }
  }, [dataset]);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastHero(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const triggerDownload = () => {
    if (dataset?.file_path) {
      const filename = dataset.file_path.split("/").pop();
      const url = `http://localhost:8000/uploads/${filename}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownload = () => {
    if (dataset?.source_attribution) {
      setShowAttributionModal(true);
      return;
    }
    triggerDownload();
  };

  if (!dataset) {
    return (
      <div style={{ background: "var(--gray-100)", minHeight: "100vh" }}>
         <style>{`
           @keyframes shimmer {
             0% { background-position: -1000px 0; }
             100% { background-position: 1000px 0; }
           }
           .shimmer {
             animation: shimmer 2s infinite linear;
             background: linear-gradient(to right, #e2e8f0 4%, #f1f5f9 25%, #e2e8f0 36%);
             background-size: 1000px 100%;
           }
         `}</style>
         <div style={{ height: 300, width: '100%' }} className="shimmer" />
         <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: '4%', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 68%', minWidth: 0 }}>
               <div className="shimmer" style={{ height: 250, borderRadius: 20, marginBottom: 24 }} />
               <div className="shimmer" style={{ height: 400, borderRadius: 20 }} />
            </div>
            <div style={{ flex: '1 1 28%', minWidth: 280 }}>
               <div className="shimmer" style={{ height: 350, borderRadius: 20, marginBottom: 24 }} />
               <div className="shimmer" style={{ height: 300, borderRadius: 20 }} />
            </div>
         </div>
      </div>
    );
  }

  const isOwner = user?.id === dataset.owner_id;
  const canShare = isOwner || user?.role === "super_admin";
  
  const formatSize = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 ** 2).toFixed(1)} MB`;
  };

  const formatShortDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatPrettyDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const descText = dataset.description || "No description provided.";
  const isLong = descText.length > 300;
  const displayDesc = (isLong && !expandedDesc) ? descText.substring(0, 300) + '...' : descText;

  const mockData = generateMockData(dataset.title, dataset.category?.name, 8);
  const citationText = `${dataset.owner?.full_name || 'GhanaDataHub'}. (${new Date(dataset.created_at).getFullYear()}). ${dataset.title}. GhanaDataHub. ${window.location.href}`;
  const hasAnalysisData = dataset.analysis_data && !dataset.analysis_data.error;

  return (
    <div style={{ background: "var(--gray-100)", minHeight: "100vh", paddingBottom: 64 }} className="fade-in">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .ghost-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.4);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ghost-btn:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
      
      {/* SECTION 1 — HERO BAND */}
      <div style={{
        background: "linear-gradient(to right, var(--green) 0%, #004D2C 100%)",
        padding: "32px 20px 40px",
        color: "white"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
             <button onClick={() => navigate(-1)} className="ghost-btn">
               <ArrowLeft size={16}/> Back
             </button>
             <div style={{ display: 'flex', gap: 8 }}>
               {canShare && (
                 <button onClick={() => setShowShare(true)} className="ghost-btn">
                   <Share2 size={16}/> Share
                 </button>
               )}
               {dataset.file_path && (
                 <button onClick={handleDownload} className="ghost-btn">
                   <Download size={16}/> Download
                 </button>
               )}
             </div>
          </div>
          <div style={{ fontSize: 13, color: "#A7F3D0", textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
             {dataset.category?.name || 'Dataset'}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dataset.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <span>Uploaded {formatPrettyDate(dataset.created_at)}</span>
            <Dot size={16} />
            <span>By {dataset.owner?.full_name || 'Unknown'}</span>
            <Dot size={16} />
            <span>Version {dataset.version}</span>
          </div>
          {dataset.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
               {dataset.tags.map(t => (
                 <span key={t.id} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                   <Tag size={12} /> {t.name}
                 </span>
               ))}
            </div>
          )}
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', borderRadius: 12, padding: '16px 24px', gap: 48, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
             <StatBubble icon={<Database />} label="File Size" value={formatSize(dataset.file_size)} />
             <StatBubble icon={<FileText />} label="File Type" value={dataset.file_type?.toUpperCase() || 'CSV'} />
             <StatBubble icon={<Download />} label="Downloads" value={dataset.download_count} />
             <StatBubble icon={<History />} label="Version" value={`v${dataset.version}`} />
             <QualityBadge dataset={dataset} size='md' />
          </div>
        </div>
      </div>

      {/* SECTION 2 — QUICK ACTIONS BAR */}
      <div 
         style={{
           position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
           background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--gray-300)',
           padding: '12px 20px',
           transform: isScrolledPastHero ? 'translateY(0)' : 'translateY(-100%)',
           opacity: isScrolledPastHero ? 1 : 0,
           transition: 'all 0.3s ease',
           pointerEvents: isScrolledPastHero ? 'auto' : 'none'
         }}>
         <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50%', fontWeight: 500 }}>
              {dataset.title}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {canShare && (
                <button className="btn btn-outline btn-sm" onClick={() => setShowShare(true)}><Share2 size={14}/> Share</button>
              )}
              {dataset.file_path && (
                <button className="btn btn-primary btn-sm" onClick={handleDownload}><Download size={14}/> Download</button>
              )}
            </div>
         </div>
      </div>

      {/* SECTION 3 — TWO COLUMN CONTENT AREA */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", display: 'flex', flexWrap: 'wrap', gap: '4%' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ flex: '1 1 68%', minWidth: 0 }}>

          {(hasRegionData || hasAnalysisData) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveTab("overview")}
                className={activeTab === "overview" ? "tab-active" : "tab-inactive"}
              >
                <Database size={14} /> Overview
              </button>
              {hasRegionData && (
                <button
                  onClick={() => setActiveTab("map")}
                  className={activeTab === "map" ? "tab-active" : "tab-inactive"}
                >
                  <Map size={14} /> Regional Map
                </button>
              )}
              {hasAnalysisData && (
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={activeTab === "analysis" ? "tab-active" : "tab-inactive"}
                >
                  <BarChart2 size={14} /> Analysis
                </button>
              )}
            </div>
          )}

          {activeTab === "map" && hasRegionData && csvRows && (
            <div style={{ padding: "20px 0" }}>
              <GhanaRegionMap
                rows={csvRows}
                datasetTitle={dataset.title}
                datasetId={dataset.id}
                height={480}
              />
              <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--green-pale)", borderRadius: 10, fontSize: 13, color: "var(--dark)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--green)" }}>About this map:</strong> This map shows Ghana's 16 administrative regions. Download the full dataset and open it in Excel or Python to see regional values. Future versions of GhanaDataHub will parse and display the actual regional values automatically.
              </div>
            </div>
          )}

          {activeTab === "analysis" && hasAnalysisData && (() => {
            const analysis = dataset.analysis_data;
            const completeness = Number(analysis.completeness_pct || 0);
            const completenessColor = completeness >= 90 ? "var(--green)" : completeness >= 70 ? "var(--gold)" : "#DC2626";
            const cardStyle = {
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
              padding: 20,
              boxShadow: "var(--shadow-sm)",
            };
            const typeBadge = (type) => ({
              display: "inline-flex",
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: type === "numeric" ? "var(--green)" : type === "categorical" ? "#2563EB" : "var(--text-secondary)",
              background: type === "numeric" ? "var(--green-pale)" : type === "categorical" ? "rgba(37,99,235,0.10)" : "var(--surface-base)",
            });
            const nullBadge = (rate) => ({
              display: "inline-flex",
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: rate === 0 ? "var(--green)" : rate < 10 ? "#92400E" : "#DC2626",
              background: rate === 0 ? "var(--green-pale)" : rate < 10 ? "rgba(252,209,22,0.14)" : "rgba(220,38,38,0.10)",
            });
            const displayNumber = (value) => value === null || value === undefined ? "—" : value;

            return (
              <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
                  <div style={cardStyle}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Total Rows</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{Number(analysis.total_rows || 0).toLocaleString()}</div>
                  </div>
                  <div style={cardStyle}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Total Columns</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{analysis.total_columns}</div>
                  </div>
                  <div style={cardStyle}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Completeness</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: completenessColor }}>{completeness}%</div>
                  </div>
                  <div style={cardStyle}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Anomalies</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: analysis.has_anomalies ? "#D97706" : "var(--green)" }}>
                      {analysis.has_anomalies ? "Detected" : "None found"}
                    </div>
                  </div>
                </div>

                {analysis.ai_summary ? (
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--text-primary)", fontWeight: 800 }}>
                      <Sparkles size={16} color="var(--green)" /> AI Analysis
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {analysis.ai_summary.split(/\n\n+/).map((paragraph, index) => (
                        <p key={index} style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Generated by Gemini AI
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.18)", color: "var(--text-secondary)", fontSize: 14 }}>
                    AI-powered summary not available. Add a GEMINI_API_KEY to your backend .env file to enable it.
                  </div>
                )}

                <div style={cardStyle}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>Column Profiles</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                          {["Column Name", "Type", "Null Rate", "Unique Values", "Min", "Max", "Mean"].map((header) => (
                            <th key={header} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(analysis.column_profiles || []).map((profile) => (
                          <tr key={profile.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                {profile.name}
                                {profile.has_anomalies && <TriangleAlert size={14} color="#D97706" />}
                              </span>
                            </td>
                            <td style={{ padding: "12px" }}><span style={typeBadge(profile.type)}>{profile.type}</span></td>
                            <td style={{ padding: "12px" }}><span style={nullBadge(profile.null_rate_pct)}>{profile.null_rate_pct}%</span></td>
                            <td style={{ padding: "12px", fontSize: 13, color: "var(--text-secondary)" }}>{profile.unique_count}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "var(--text-secondary)" }}>{profile.type === "numeric" ? displayNumber(profile.min) : "—"}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "var(--text-secondary)" }}>{profile.type === "numeric" ? displayNumber(profile.max) : "—"}</td>
                            <td style={{ padding: "12px", fontSize: 13, color: "var(--text-secondary)" }}>{profile.type === "numeric" ? displayNumber(profile.mean) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {(analysis.correlations || []).length > 0 && (
                  <div style={cardStyle}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>Notable Correlations</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {analysis.correlations.map((correlation, index) => {
                        const positive = correlation.direction === "positive";
                        return (
                          <div key={`${correlation.col_a}-${correlation.col_b}-${index}`} style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: 12, background: "var(--surface-base)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>
                              <span>{correlation.col_a}</span>
                              {positive ? <TrendingUp size={16} color="var(--green)" /> : <TrendingDown size={16} color="#DC2626" />}
                              <span>{correlation.col_b}</span>
                              <span style={{ padding: "3px 8px", borderRadius: 999, background: "var(--green-pale)", color: "var(--green)", fontSize: 11, textTransform: "capitalize" }}>
                                {correlation.strength}
                              </span>
                              <span style={{ color: "var(--text-secondary)" }}>r={correlation.r}</span>
                            </div>
                            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                              When {correlation.col_a} increases, {correlation.col_b} tends to {positive ? "increase" : "decrease"} as well (r={correlation.r}).
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {activeTab !== "analysis" && (
          <>
          <div className="card" style={{ padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ color: 'var(--green)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>About This Dataset</div>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>
              {displayDesc}
            </div>
            {isLong && (
              <button onClick={() => setExpandedDesc(!expandedDesc)} style={{ marginTop: 12, color: 'var(--green)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {expandedDesc ? 'Show less' : '... Read more'}
              </button>
            )}
          </div>

          <div className="card" style={{ padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ color: 'var(--green)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontWeight: 700 }}>Data Preview</div>
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                 <thead>
                   <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                     {mockData.columns.map((c, i) => (
                       <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>{c}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {mockData.rows.map((row, i) => (
                     <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                       {Object.values(row).map((val, j) => (
                         <td key={j} style={{ padding: '12px 16px', fontSize: 14, color: 'var(--gray-800)' }}>{val}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>
              Sample preview only. Download for full dataset.
            </div>
          </div>

          <div className="card" style={{ padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <div style={{ color: 'var(--green)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24, fontWeight: 700 }}>Version History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {versions.length > 0 ? versions.map((v, i) => (
                 <div key={v.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    {i !== versions.length - 1 && (
                       <div style={{ position: 'absolute', left: 11, top: 28, bottom: -24, width: 2, background: 'var(--gray-200)' }} />
                    )}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--green)' : 'var(--gray-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--surface-card)' }} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: i !== versions.length - 1 ? 16 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                         <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>v{v.version_number}</span>
                         <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{formatPrettyDate(v.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>{v.change_summary || "Initial release"}</div>
                    </div>
                 </div>
              )) : (
                 <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>No version history available.</div>
              )}
            </div>
          </div>
          </>
          )}
          
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ flex: '1 1 28%', minWidth: 280, position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
          
          <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Download Dataset</h3>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gray-600)', marginBottom: 4, wordBreak: 'break-all' }}>{dataset.file_name || 'No file attached'}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>{formatSize(dataset.file_size)}</div>
            
            {dataset.file_path && (
              <button onClick={handleDownload} style={{ width: '100%', height: 48, background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                <Download size={18} /> Download
              </button>
            )}
            
            {canShare && (
              <button onClick={() => setShowShare(true)} style={{ width: '100%', height: 44, background: 'transparent', color: 'var(--gray-700)', border: '1px solid var(--gray-200)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Share2 size={16} /> Share
              </button>
            )}
            
            <div style={{ marginTop: 12 }}>
              <WatchButton datasetId={dataset.id} datasetTitle={dataset.title} />
            </div>

            <div style={{ height: 1, background: 'var(--gray-200)', margin: '20px 0' }} />
            
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Copied!");
            }} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
              <Link2 size={16} /> Copy link
            </button>
          </div>

          <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Dataset Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <InfoRow label="License" value={dataset.license || 'Not specified'} />
              <InfoRow label="Visibility" value={<span className={`badge vis-${dataset.visibility}`}>{VIS_LABELS[dataset.visibility]}</span>} />
              <InfoRow label="Uploaded" value={formatPrettyDate(dataset.created_at)} />
              <InfoRow label="Last Updated" value={formatPrettyDate(dataset.updated_at || dataset.created_at)} />
              <InfoRow label="Version" value={`v${dataset.version}`} />
              <InfoRow label="Format" value={dataset.file_type?.toUpperCase() || '—'} isLast />
            </div>
          </div>

          <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Cite This Dataset</h3>
            <div style={{ background: '#F1F5F1', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-800)', lineHeight: 1.6, marginBottom: 16, wordBreak: 'break-word' }}>
              {citationText}
            </div>
            <button onClick={() => {
              navigator.clipboard.writeText(citationText);
              toast.success("Citation copied!");
            }} style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
              <Copy size={16} /> Copy Citation
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 4 — RELATED DATASETS */}
      {related.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 48px" }}>
          <div style={{ color: 'var(--gray-500)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>You Might Also Like</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Related Datasets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {related.map(d => (
               <div key={d.id} className="card dataset-card" onClick={() => navigate(`/datasets/${d.id}`)} style={{ cursor: 'pointer', padding: 24, borderRadius: 16, transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--gray-200)', background: 'var(--surface-card)', display: 'flex', flexDirection: 'column' }} 
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}>
                 <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span className={`badge vis-${d.visibility}`}>{VIS_LABELS[d.visibility] || d.visibility}</span>
                    {d.category && <span className="badge badge-blue">{d.category.name}</span>}
                 </div>
                 <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title}</h4>
                 <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.description || 'No description'}</p>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-500)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> {d.download_count || 0}</div>
                    <div>{formatShortDate(d.created_at)}</div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {showShare && (
        <ShareModal
          datasetId={dataset.id}
          onClose={() => setShowShare(false)}
        />
      )}
      <AttributionModal
        isOpen={showAttributionModal}
        onClose={() => setShowAttributionModal(false)}
        onConfirmDownload={() => {
          setShowAttributionModal(false);
          triggerDownload();
        }}
        dataset={dataset}
      />
    </div>
  );
}
