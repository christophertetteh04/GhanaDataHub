import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { datasetsApi, shareApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import QualityBadge from "../components/QualityBadge";
import { trackDatasetView } from "../components/PersonalisedRecs";
import WatchButton from "../components/WatchButton";
import GhanaRegionMap from "../components/GhanaRegionMap";
import HealthInsightCard from "../components/HealthInsightCard";
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
  Clock,
  FileText,
  Shield,
  Code2,
  Dot,
  Database,
  Map,
  BarChart2,
  Bot,
  Send,
  Sparkles,
  Table,
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

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function hasNumericValueColumn(rows, regionColIdx) {
  const headers = rows?.[0] || [];
  const dataRows = rows?.slice(1) || [];

  return headers.some((_, index) => {
    if (index === regionColIdx) return false;
    const populated = dataRows.filter((row) => row[index] !== null && row[index] !== undefined && String(row[index]).trim() !== "");
    if (populated.length === 0) return false;
    const numericCount = populated.filter((row) => {
      const parsed = parseFloat(
        String(row[index])
          .replace(/[,%]/g, "")
          .replace(/[^\d.-]/g, "")
          .trim()
      );
      return !Number.isNaN(parsed);
    }).length;
    return numericCount / populated.length > 0.5;
  });
}

function getDatasetDownloadUrl(datasetId) {
  if (!datasetId) return null;
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
  return `${apiBase}/datasets/${datasetId}/download`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const INDICATOR_META = {
  "SP.URB.TOTL.IN.ZS": {
    title: "Urban Population (% of Total Population)",
    summary: "Tracks Ghana's annual urban population share and helps explain housing demand, city growth, transport pressure and regional development.",
    topic: "Population",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "line",
  },
  "SP.POP.TOTL": {
    title: "Total Population of Ghana",
    summary: "Shows Ghana's long-term population growth, useful for planning schools, clinics, housing, infrastructure and jobs.",
    topic: "Population",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "line",
  },
  "NY.GDP.MKTP.CD": {
    title: "Gross Domestic Product (Current US$)",
    summary: "Measures the size of Ghana's economy and supports macroeconomic analysis, investment research and policy decisions.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "area",
  },
  "NY.GDP.MKTP.KD.ZG": {
    title: "GDP Growth Rate",
    summary: "Tracks Ghana's annual economic growth rate, helping users compare expansions, slowdowns and recovery periods.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "area",
  },
  "FP.CPI.TOTL.ZG": {
    title: "Inflation Rate",
    summary: "Tracks consumer price inflation in Ghana and helps explain household purchasing power, food prices and monetary policy.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "line",
  },
  "SE.ADT.LITR.ZS": {
    title: "Adult Literacy Rate",
    summary: "Measures adult literacy in Ghana and supports education planning, regional equity analysis and human capital research.",
    topic: "Education",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "bar",
  },
  "SP.DYN.IMRT.IN": {
    title: "Infant Mortality Rate",
    summary: "Tracks infant deaths per 1,000 live births and helps users understand child health progress and remaining gaps.",
    topic: "Health",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "line",
  },
  "EG.ELC.ACCS.ZS": {
    title: "Access to Electricity (% of Population)",
    summary: "Shows electricity access in Ghana, useful for energy planning, infrastructure analysis and development work.",
    topic: "Energy",
    coverage: "1960-2025",
    records: "66 years",
    geography: "National",
    chart: "map",
  },
};

function getIndicatorCode(title = "") {
  const match = title.match(/([A-Z]{2,}(?:\.[A-Z0-9]+){2,})\s*$/);
  return match?.[1] || null;
}

function getPublisher(dataset) {
  const text = `${dataset?.title || ""} ${dataset?.description || ""}`.toLowerCase();
  if (text.includes("world bank")) return "World Bank";
  if (text.includes("bank of ghana") || text.includes("bog")) return "Bank of Ghana";
  if (text.includes("ghana statistical") || text.includes("statsghana") || text.includes("gss")) return "Ghana Statistical Service";
  if (text.includes("faostat") || text.includes("fao")) return "FAOSTAT";
  if (text.includes("who")) return "WHO";
  if (text.includes("ghana health service") || text.includes("ghs")) return "Ghana Health Service";
  return dataset?.owner?.full_name || dataset?.organization?.name || "DataGhana.io";
}

function getTopic(dataset) {
  const text = `${dataset?.category?.name || ""} ${dataset?.title || ""} ${dataset?.description || ""}`.toLowerCase();
  if (/inflation|gdp|forex|exchange|revenue|debt|bank|econom|trade|export/.test(text)) return "Economy";
  if (/cocoa|maize|cassava|crop|farm|agric/.test(text)) return "Agriculture";
  if (/health|hospital|mortality|malaria|maternal|hiv|disease/.test(text)) return "Health";
  if (/school|education|literacy|teacher/.test(text)) return "Education";
  if (/population|census|urban|demographic/.test(text)) return "Population";
  if (/road|rail|port|infrastructure/.test(text)) return "Infrastructure";
  if (/electricity|energy|power|oil/.test(text)) return "Energy";
  if (/climate|forest|co2|environment|rainfall/.test(text)) return "Environment";
  if (/job|employment|unemployment|labour/.test(text)) return "Employment";
  if (/internet|technology|digital|mobile/.test(text)) return "Technology";
  return dataset?.category?.name || "Ghana Data";
}

function getCleanTitle(dataset) {
  const rawTitle = dataset?.title || "Untitled Dataset";
  const code = getIndicatorCode(rawTitle);
  if (code && INDICATOR_META[code]) return INDICATOR_META[code].title;
  return rawTitle
    .replace(/^World Bank Open Data\s*[–-]\s*Ghana\s*:\s*/i, "")
    .replace(/\b[A-Z]{2,}(?:\.[A-Z0-9]+){2,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-—:]\s*$/, "")
    .trim() || rawTitle;
}

function getDatasetIntelligence(dataset) {
  const code = getIndicatorCode(dataset?.title || "");
  const mapped = code ? INDICATOR_META[code] : null;
  const analysis = dataset?.analysis_data || {};
  const aiSentence = analysis.ai_summary?.split(".")?.[0];
  const topic = mapped?.topic || getTopic(dataset);
  const summary = mapped?.summary
    || (aiSentence && aiSentence.length > 24 ? `${aiSentence}.` : null)
    || dataset?.description
    || `This ${topic.toLowerCase()} dataset is ready for exploration with charts, metadata, API access, quality checks and Ask Kweku.`;

  return {
    title: mapped?.title || getCleanTitle(dataset),
    code,
    topic,
    summary,
    publisher: getPublisher(dataset),
    coverage: mapped?.coverage || (dataset?.title?.toLowerCase().includes("regional") ? "Regional" : "Latest available"),
    records: mapped?.records || (analysis.total_rows ? `${Number(analysis.total_rows).toLocaleString()} rows` : "Metadata ready"),
    geography: mapped?.geography || (dataset?.title?.toLowerCase().includes("region") ? "Regional" : "National"),
    chart: mapped?.chart || (topic === "Health" || topic === "Environment" ? "map" : topic === "Agriculture" ? "bar" : "line"),
    verified: /world bank|ghana statistical service|bank of ghana|ministry|faostat|who|ghana health service/i.test(`${dataset?.title} ${dataset?.description || ""}`),
  };
}

function getPreviewRows(csvPreviewRows, mockData) {
  if (Array.isArray(csvPreviewRows) && csvPreviewRows.length > 1) return csvPreviewRows;
  return [mockData.columns, ...mockData.rows.map((row) => Object.values(row))];
}

function getChartSeries(dataset, previewRows) {
  const previewValues = Array.isArray(dataset?.preview_data)
    ? dataset.preview_data.map((value) => Number(value)).filter((value) => !Number.isNaN(value))
    : [];
  if (previewValues.length > 1) {
    return previewValues.slice(0, 18).map((value, index) => ({ label: `Point ${index + 1}`, value }));
  }

  const headers = previewRows?.[0] || [];
  const rows = previewRows?.slice(1) || [];
  const numericIndex = headers.findIndex((_, index) => {
    const values = rows.map((row) => Number(String(row[index] || "").replace(/[,%]/g, ""))).filter((value) => !Number.isNaN(value));
    return values.length >= Math.max(2, Math.ceil(rows.length * 0.5));
  });
  if (numericIndex !== -1) {
    return rows.slice(0, 18).map((row, index) => ({
      label: row[0] || `Row ${index + 1}`,
      value: Number(String(row[numericIndex] || "").replace(/[,%]/g, "")) || 0,
    }));
  }
  return [18, 24, 21, 35, 42, 48, 54, 63, 70, 76, 82, 88].map((value, index) => ({ label: `Point ${index + 1}`, value }));
}

function AutoChart({ series, type = "line" }) {
  const values = series.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="dataset-auto-chart" style={{ display: 'flex', alignItems: 'flex-end', padding: '24px', background: 'var(--surface-base)', borderRadius: '16px', height: '220px', gap: '8px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      {/* Background Grid Lines */}
      <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />
      <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '1px', background: 'var(--border-subtle)' }} />

      {type === "bar" ? (
        series.slice(0, 12).map((point, index) => {
          const heightPct = Math.max(10, ((point.value - min) / range) * 100);
          return (
            <div key={`${point.label}-${index}`} className="info-bar-container" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1, cursor: 'pointer' }}>
              <div className="info-bar-track" style={{ 
                width: '100%', 
                maxWidth: '32px',
                height: `${heightPct}%`, 
                background: 'var(--green-pale)', 
                borderRadius: '6px 6px 0 0', 
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}>
                <div className="info-bar-fill" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, #10B981, var(--green))', opacity: 0.85, transition: 'all 0.3s ease' }} />
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px', zIndex: 1 }}>
          {series.slice(0, 20).map((point, index) => {
            const heightPct = Math.max(10, ((point.value - min) / range) * 100);
            return (
              <div key={`${point.label}-${index}`} className="info-bar-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', cursor: 'pointer' }}>
                <div className="info-bar-track" style={{ 
                  width: '100%', 
                  height: `${heightPct}%`, 
                  background: `linear-gradient(to top, transparent, var(--green))`, 
                  opacity: 0.2,
                  borderRadius: '3px 3px 0 0',
                  transition: 'all 0.3s ease'
                }} />
                <div className="info-bar-fill" style={{ 
                  width: '100%', 
                  height: '4px', 
                  background: 'var(--green)', 
                  borderRadius: '2px',
                  marginTop: '-4px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        .info-bar-container:hover .info-bar-track { transform: translateY(-4px); }
        .info-bar-container:hover .info-bar-fill { opacity: 1; filter: brightness(1.1); }
      `}</style>
    </div>
  );
}

function getAnalysisIntro(dataset) {
  const summary = dataset?.analysis_data?.ai_summary;
  if (summary) {
    const firstParagraph = summary.split(/\n\n+/)[0]?.trim();
    if (firstParagraph) return firstParagraph;
  }
  return dataset?.description || "This dataset has metadata available, but no generated analysis summary yet.";
}

function buildKwekuAnswer(dataset, question) {
  const q = (question || "").toLowerCase();
  const title = dataset?.title || "this dataset";
  const category = dataset?.category?.name || "general";
  const analysis = dataset?.analysis_data || {};
  const rows = Number(analysis.total_rows || 0);
  const columns = Number(analysis.total_columns || 0);
  const completeness = analysis.completeness_pct;
  const numericColumns = (analysis.column_profiles || [])
    .filter((profile) => profile.type === "numeric")
    .map((profile) => profile.name)
    .slice(0, 4);

  if (q.includes("api")) {
    return `Use the API tab to fetch metadata, download the file, or check health insight availability for "${title}". The public metadata endpoint is GET /api/v1/datasets/${dataset.id}.`;
  }

  if (q.includes("map") || q.includes("region")) {
    return `The map view works best when the dataset contains a Ghana region, district, area, or zone column plus a numeric value column. If those fields are detected, DataGhana.io renders a choropleth map automatically; otherwise the Map tab explains what is missing.`;
  }

  if (q.includes("trend") || q.includes("chart")) {
    if (numericColumns.length > 0) {
      return `For "${title}", the strongest chart candidates are ${numericColumns.join(", ")}. A line chart is useful for time series data, while a bar chart or map is better if the rows describe categories or Ghana regions.`;
    }
    return `I do not see numeric column profiles for "${title}" yet. Download or re-upload a CSV version with numeric fields to unlock stronger chart recommendations.`;
  }

  if (q.includes("anomal")) {
    if (analysis.has_anomalies) {
      return `I found possible anomalies in this dataset. Check the Quality tab for columns marked with the warning icon; those values sit unusually far from the column average.`;
    }
    return `No major anomalies are currently flagged for this dataset. That means the local analyser did not find numeric values more than three standard deviations from their column average.`;
  }

  if (q.includes("quality") || q.includes("complete")) {
    return `This dataset has ${completeness ?? "unknown"}% completeness${rows ? ` across ${rows.toLocaleString()} rows` : ""}${columns ? ` and ${columns} columns` : ""}. Use the Quality tab for null rates, unique values, numeric ranges, and notable correlations.`;
  }

  return `${getAnalysisIntro(dataset)}\n\nIn plain terms: "${title}" is a ${category.toLowerCase()} dataset${rows ? ` with ${rows.toLocaleString()} rows` : ""}${columns ? ` and ${columns} columns` : ""}. Good next steps are to inspect the Quality tab, open the Map tab if it has regional data, or use the API tab to connect it to another tool.`;
}

export default function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [related, setRelated] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [csvRows, setCsvRows] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState(null);
  const [hasRegionData, setHasRegionData] = useState(false);
  
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [showAskKweku, setShowAskKweku] = useState(false);
  const [kwekuQuestion, setKwekuQuestion] = useState("Explain this dataset.");
  const [kwekuAnswer, setKwekuAnswer] = useState("");
  const [copiedApiSnippet, setCopiedApiSnippet] = useState(false);
  const [queryBootstrappedDatasetId, setQueryBootstrappedDatasetId] = useState(null);

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
      try {
        const recent = JSON.parse(localStorage.getItem('gdh_recently_viewed') || '[]');
        const entry = {
          id: dataset.id, 
          title: dataset.title,
          file_type: dataset.file_type, 
          updated_at: dataset.updated_at
        };
        const updated = [entry, ...recent.filter(r => r.id !== dataset.id)].slice(0, 10);
        localStorage.setItem('gdh_recently_viewed', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to track recently viewed", e);
      }
    }
  }, [dataset]);

  useEffect(() => {
    if (!dataset) return;
    if (queryBootstrappedDatasetId === dataset.id) return;

    const requestedTab = searchParams.get("tab");
    const requestedAsk = searchParams.get("ask");
    if (["overview", "charts", "map", "table", "analysis", "metadata", "api"].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
    if (requestedAsk === "kweku") {
      const defaultQuestion = "Explain this dataset.";
      setShowAskKweku(true);
      setKwekuQuestion(defaultQuestion);
      setKwekuAnswer(buildKwekuAnswer(dataset, defaultQuestion));
      window.requestAnimationFrame(() => {
        document.getElementById("ask-kweku-panel")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    setQueryBootstrappedDatasetId(dataset.id);
  }, [dataset, searchParams, queryBootstrappedDatasetId]);

  useEffect(() => {
    if (!dataset) return;

    let cancelled = false;
    setHasRegionData(false);
    setCsvRows(null);
    setCsvPreviewRows(null);

    const fileUrl = getDatasetDownloadUrl(dataset.id);
    const isCsv = dataset.file_type === "text/csv" || dataset.file_type === "application/csv" || dataset.file_name?.toLowerCase().endsWith(".csv");

    if (isCsv && dataset.file_path && fileUrl) {
      fetch(fileUrl, { headers: getAuthHeaders() })
        .then((response) => {
          if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
          return response.text();
        })
        .then((text) => {
          if (cancelled) return;
          const rows = parseCsvRows(text);
          setCsvPreviewRows(rows.slice(0, 101));
          const regionIdx = detectRegionColumn(rows[0] || []);
          if (regionIdx !== -1 && hasNumericValueColumn(rows, regionIdx)) {
            setCsvRows(rows);
            setHasRegionData(true);
          }
        })
        .catch((error) => {
          console.warn("Unable to load regional CSV data", error);
        });
    }

    const titleLower = (dataset.title || "").toLowerCase();
    const tagNames = (dataset.tags || []).map((t) => (t.name || t).toLowerCase());
    const regionSignals = [
      "region",
      "regional",
      "district",
      "area",
      "zone",
      "constituency",
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

    return () => {
      cancelled = true;
    };
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
  const hasAnalysisData = dataset.analysis_data && !dataset.analysis_data.error;
  const intelligence = getDatasetIntelligence(dataset);
  const previewRows = getPreviewRows(csvPreviewRows, mockData);
  const previewHeaders = previewRows[0] || [];
  const previewBodyRows = previewRows.slice(1, 9);
  const chartSeries = getChartSeries(dataset, previewRows);
  const chartValues = chartSeries.map((point) => point.value).filter((value) => !Number.isNaN(value));
  const highValue = chartValues.length ? Math.max(...chartValues) : null;
  const lowValue = chartValues.length ? Math.min(...chartValues) : null;
  const averageValue = chartValues.length ? chartValues.reduce((sum, value) => sum + value, 0) / chartValues.length : null;
  const firstValue = chartValues[0];
  const latestValue = chartValues[chartValues.length - 1];
  const changePct = firstValue ? ((latestValue - firstValue) / Math.abs(firstValue)) * 100 : null;
  const analysisCompleteness = Number(dataset.analysis_data?.completeness_pct || 0);
  const qualityScore = hasAnalysisData
    ? Math.round((analysisCompleteness * 0.55) + (dataset.analysis_data?.has_anomalies ? 18 : 30) + 12)
    : intelligence.verified ? 88 : 72;
  const insightBullets = [
    `${intelligence.publisher} is the detected publisher for this dataset.`,
    `${intelligence.geography} coverage with ${intelligence.coverage.toLowerCase()} availability.`,
    highValue !== null ? `Highest visible value is ${Number(highValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}.` : "A chart preview is ready when numeric values are available.",
    changePct !== null ? `Visible trend changes by ${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%.` : "Use Ask Kweku to generate interpretation questions.",
  ];
  const citationText = `${intelligence.publisher}. (${new Date(dataset.created_at).getFullYear()}). ${intelligence.title}. DataGhana.io. ${window.location.href}`;
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
  const datasetApiUrl = `${apiBase}/datasets/${dataset.id}`;
  const downloadApiUrl = `${datasetApiUrl}/download`;
  const healthInsightApiUrl = `${datasetApiUrl}/health-insight`;
  const apiSnippet = `curl "${datasetApiUrl}"\n\ncurl -L "${downloadApiUrl}"`;

  const selectTab = (tab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const openKweku = (question = "Explain this dataset.") => {
    setShowAskKweku(true);
    setKwekuQuestion(question);
    setKwekuAnswer(buildKwekuAnswer(dataset, question));
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("ask", "kweku");
    setSearchParams(nextParams, { replace: true });
    window.requestAnimationFrame(() => {
      document.getElementById("ask-kweku-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const submitKwekuQuestion = () => {
    setKwekuAnswer(buildKwekuAnswer(dataset, kwekuQuestion));
  };

  const copyApiSnippet = () => {
    navigator.clipboard.writeText(apiSnippet);
    setCopiedApiSnippet(true);
    setTimeout(() => setCopiedApiSnippet(false), 1800);
  };

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
        .dataset-report-card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .dataset-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }
        .dataset-kpi {
          background: var(--surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 14px;
        }
        .dataset-kpi-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .dataset-kpi-value {
          font-size: 20px;
          color: var(--text-primary);
          font-weight: 800;
        }
        .dataset-auto-chart {
          width: 100%;
          min-height: 220px;
          display: block;
          background:
            radial-gradient(circle at 20% 20%, rgba(0,163,92,0.10), transparent 28%),
            var(--surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
        }
        .dataset-action-btn {
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-primary);
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 13px;
          cursor: pointer;
        }
        .dataset-action-btn.primary {
          background: var(--green);
          border-color: var(--green);
          color: white;
        }
        @media (max-width: 720px) {
          .dataset-hero-title { font-size: 30px !important; }
          .dataset-hero-grid { grid-template-columns: 1fr !important; }
          .dataset-side-panel { position: static !important; }
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
               <button onClick={() => openKweku()} className="ghost-btn">
                 <Bot size={16}/> Ask Kweku
               </button>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#A7F3D0", textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800 }}>
              {intelligence.topic}
            </span>
            {intelligence.verified && (
              <span style={{ padding: "4px 9px", borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.24)", fontSize: 11, fontWeight: 800 }}>
                Verified source
              </span>
            )}
            {intelligence.code && (
              <span style={{ color: "rgba(255,255,255,0.62)", fontSize: 12 }}>Indicator code hidden from title: {intelligence.code}</span>
            )}
          </div>
          <h1 className="dataset-hero-title" style={{ fontSize: 42, fontWeight: 800, marginBottom: 14, lineHeight: 1.08, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {intelligence.title}
          </h1>
          <p style={{ maxWidth: 780, color: "rgba(255,255,255,0.82)", fontSize: 17, lineHeight: 1.7, margin: "0 0 18px" }}>
            {intelligence.summary}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <span>Publisher: {intelligence.publisher}</span>
            <Dot size={16} />
            <span>Updated {formatPrettyDate(dataset.updated_at || dataset.created_at)}</span>
            <Dot size={16} />
            <span>{intelligence.coverage}</span>
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
             <StatBubble icon={<Database />} label="Records" value={intelligence.records} />
             <StatBubble icon={<Map />} label="Regions" value={intelligence.geography} />
             <StatBubble icon={<History />} label="Coverage" value={intelligence.coverage} />
             <StatBubble icon={<Download />} label="Downloads" value={Number(dataset.download_count || 0).toLocaleString()} />
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
              {intelligence.title}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => openKweku()}><Bot size={14}/> Ask</button>
              <button className="btn btn-outline btn-sm" onClick={() => selectTab("charts")}><BarChart2 size={14}/> Charts</button>
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

          {showAskKweku && (
            <div
              id="ask-kweku-panel"
              className="card"
              style={{
                padding: 24,
                borderRadius: 18,
                marginBottom: 24,
                border: "1px solid rgba(0,163,92,0.18)",
                background: "var(--surface-card)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--green-pale)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Ask Kweku</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Dataset assistant powered by this page's metadata and analysis.</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAskKweku(false);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete("ask");
                    setSearchParams(nextParams, { replace: true });
                  }}
                  style={{ width: 30, height: 30, borderRadius: 999, border: "1px solid var(--border-default)", background: "var(--surface-elevated)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  aria-label="Close Ask Kweku"
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {["Explain this dataset.", "Show the trend.", "Can this be mapped?", "Check data quality.", "How do I use the API?"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => openKweku(prompt)}
                    style={{ border: "1px solid var(--border-default)", background: "var(--surface-elevated)", color: "var(--text-secondary)", borderRadius: 999, padding: "7px 11px", fontSize: 12, cursor: "pointer" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                <input
                  value={kwekuQuestion}
                  onChange={(e) => setKwekuQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitKwekuQuestion()}
                  placeholder="Ask about trends, maps, API access, quality..."
                  style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--surface-elevated)", color: "var(--text-primary)", padding: "0 12px", fontSize: 13 }}
                />
                <button
                  onClick={submitKwekuQuestion}
                  style={{ height: 42, padding: "0 14px", borderRadius: 10, border: "none", background: "var(--green)", color: "white", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                >
                  <Send size={15} /> Ask
                </button>
              </div>

              {kwekuAnswer && (
                <div style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {kwekuAnswer}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <button
                onClick={() => selectTab("overview")}
                className={activeTab === "overview" ? "tab-active" : "tab-inactive"}
              >
                <Database size={14} /> Overview
              </button>
              <button
                onClick={() => selectTab("charts")}
                className={activeTab === "charts" ? "tab-active" : "tab-inactive"}
              >
                <BarChart2 size={14} /> Charts
              </button>
              {(hasRegionData || activeTab === "map") && (
                <button
                  onClick={() => selectTab("map")}
                  className={activeTab === "map" ? "tab-active" : "tab-inactive"}
                >
                  <Map size={14} /> Regional Map
                </button>
              )}
              <button
                onClick={() => selectTab("table")}
                className={activeTab === "table" ? "tab-active" : "tab-inactive"}
              >
                <Table size={14} /> Table
              </button>
              {hasAnalysisData && (
                <button
                  onClick={() => selectTab("analysis")}
                  className={activeTab === "analysis" ? "tab-active" : "tab-inactive"}
                >
                  <Sparkles size={14} /> Quality
                </button>
              )}
              <button
                onClick={() => selectTab("metadata")}
                className={activeTab === "metadata" ? "tab-active" : "tab-inactive"}
              >
                <FileText size={14} /> Metadata
              </button>
              <button
                onClick={() => selectTab("api")}
                className={activeTab === "api" ? "tab-active" : "tab-inactive"}
              >
                <Code2 size={14} /> API Access
              </button>
            </div>

          {activeTab === "charts" && (
            <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="dataset-report-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
                  <div>
                    <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Automatic Visualisation</div>
                    <h2 style={{ margin: "6px 0 0", fontSize: 22, color: "var(--text-primary)" }}>{intelligence.title}</h2>
                    <p style={{ margin: "8px 0 0", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                      DataGhana.io selected a {intelligence.chart === "area" ? "trend area" : intelligence.chart} preview based on this dataset's title, topic and detected numeric values.
                    </p>
                  </div>
                  <span style={{ padding: "6px 10px", borderRadius: 999, background: "var(--green-pale)", color: "var(--green)", fontSize: 12, fontWeight: 800 }}>
                    {intelligence.chart === "map" ? "Map recommended" : `${intelligence.chart} chart`}
                  </span>
                </div>
                <AutoChart series={chartSeries} type={intelligence.chart === "bar" ? "bar" : "line"} />
              </div>

              <div className="dataset-kpi-grid">
                {[
                  { label: "Highest", value: highValue !== null ? Number(highValue).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—" },
                  { label: "Lowest", value: lowValue !== null ? Number(lowValue).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—" },
                  { label: "Average", value: averageValue !== null ? Number(averageValue).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—" },
                  { label: "Visible change", value: changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%` : "—" },
                ].map((item) => (
                  <div key={item.label} className="dataset-kpi">
                    <div className="dataset-kpi-label">{item.label}</div>
                    <div className="dataset-kpi-value">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="dataset-report-card">
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>Recommended next views</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {["Trend comparison", "Percentage change", "Regional ranking", "Quality report", "API export"].map((view) => (
                    <button
                      key={view}
                      onClick={() => view === "Regional ranking" ? selectTab("map") : view === "Quality report" ? selectTab("analysis") : view === "API export" ? selectTab("api") : openKweku(`Create a ${view.toLowerCase()} for this dataset.`)}
                      style={{ border: "1px solid var(--border-default)", background: "var(--surface-elevated)", color: "var(--text-secondary)", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "table" && (
            <div style={{ padding: "20px 0" }}>
              <div className="dataset-report-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Preview Table</div>
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                      {csvPreviewRows ? "First rows from the CSV" : "Sample preview"}
                    </div>
                  </div>
                  <button onClick={handleDownload} className="dataset-action-btn primary">
                    <Download size={15} /> Download full file
                  </button>
                </div>
                <div style={{ overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                    <thead>
                      <tr style={{ background: "var(--green)", color: "white" }}>
                        {previewHeaders.map((header, index) => (
                          <th key={`${header}-${index}`} style={{ padding: "11px 13px", textAlign: "left", fontSize: 12, fontWeight: 800 }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewBodyRows.map((row, rowIndex) => (
                        <tr key={rowIndex} style={{ background: rowIndex % 2 === 0 ? "var(--surface-card)" : "var(--surface-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
                          {previewHeaders.map((_, cellIndex) => (
                            <td key={cellIndex} style={{ padding: "10px 13px", fontSize: 13, color: "var(--text-secondary)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {row[cellIndex] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  {csvPreviewRows ? "Showing a limited browser preview only. Download or use the API for the full dataset." : "Sample preview only. Download the full dataset to inspect original rows."}
                </div>
              </div>
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
                <strong style={{ color: "var(--green)" }}>About this map:</strong> This map shows Ghana's 16 administrative regions. Download the full dataset and open it in Excel or Python to see regional values. Future versions of DataGhana.io will parse and display the actual regional values automatically.
              </div>
            </div>
          )}

          {activeTab === "map" && (!hasRegionData || !csvRows) && (
            <div className="card" style={{ padding: 32, borderRadius: 18, marginBottom: 24, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--green-pale)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Map size={26} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>No regional map available yet</div>
              <div style={{ maxWidth: 520, margin: "0 auto", color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
                DataGhana.io needs a Ghana region, district, area, or zone column plus a numeric value column to build a choropleth map for this dataset.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <button onClick={() => openKweku("Can this be mapped?")} className="btn btn-outline">
                  <Bot size={16} /> Ask Kweku
                </button>
                <button onClick={() => selectTab("overview")} className="btn btn-primary">
                  View Overview
                </button>
              </div>
            </div>
          )}

          {activeTab === "metadata" && (
            <div style={{ padding: "20px 0", display: "grid", gap: 18 }}>
              <div className="dataset-report-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <FileText size={18} color="var(--green)" />
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>Dataset Metadata</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                  {[
                    ["Publisher", intelligence.publisher],
                    ["Category", intelligence.topic],
                    ["Coverage", intelligence.coverage],
                    ["Geography", intelligence.geography],
                    ["Records", intelligence.records],
                    ["File format", dataset.file_type?.toUpperCase() || "Unknown"],
                    ["Licence", dataset.license || "Not specified"],
                    ["Source", dataset.source_attribution || intelligence.publisher],
                  ].map(([label, value]) => (
                    <div key={label} className="dataset-kpi">
                      <div className="dataset-kpi-label">{label}</div>
                      <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dataset-report-card">
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>Data Dictionary Snapshot</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(dataset.analysis_data?.column_profiles || previewHeaders.map((header) => ({ name: header, type: "unknown", null_rate_pct: "—", unique_count: "—" }))).slice(0, 8).map((profile) => (
                    <div key={profile.name} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                      <strong style={{ color: "var(--text-primary)" }}>{profile.name}</strong>
                      <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{profile.type}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{profile.null_rate_pct}% null</span>
                      <span style={{ color: "var(--text-secondary)" }}>{profile.unique_count} unique</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dataset-report-card">
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>Perfect for</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Students", "Researchers", "Journalists", "Government", "Businesses", "Developers"].map((useCase) => (
                    <span key={useCase} style={{ padding: "7px 11px", borderRadius: 999, background: "var(--green-pale)", color: "var(--green)", fontSize: 12, fontWeight: 800 }}>
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "overview" && <HealthInsightCard datasetId={dataset.id} datasetTitle={dataset.title} />}

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

          {activeTab === "api" && (
            <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="card" style={{ padding: 24, borderRadius: 18, background: "var(--surface-card)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: "var(--green-pale)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Code2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>API Access</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Use this dataset in dashboards, notebooks, and data apps.</div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Dataset metadata", method: "GET", url: datasetApiUrl },
                    { label: "Download file", method: "GET", url: downloadApiUrl },
                    { label: "Health insight", method: "GET", url: healthInsightApiUrl },
                  ].map((endpoint) => (
                    <div key={endpoint.label} style={{ border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 14, background: "var(--surface-elevated)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{endpoint.label}</div>
                        <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--green-pale)", color: "var(--green)", fontSize: 11, fontWeight: 800 }}>{endpoint.method}</span>
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all" }}>{endpoint.url}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, background: "#0A1410", color: "#D1FAE5", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowX: "auto" }}>
                  {apiSnippet}
                </div>
                <button
                  onClick={copyApiSnippet}
                  style={{ marginTop: 14, height: 38, borderRadius: 9, border: "1px solid var(--border-default)", background: "var(--surface-elevated)", color: "var(--green)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 12px", cursor: "pointer" }}
                >
                  <Copy size={15} /> {copiedApiSnippet ? "Copied!" : "Copy cURL"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
          <>
          <div className="dataset-report-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                  <Sparkles size={14} /> Dataset Intelligence Brief
                </div>
                <h2 style={{ margin: "8px 0 0", color: "var(--text-primary)", fontSize: 24, lineHeight: 1.25 }}>
                  {intelligence.title}
                </h2>
              </div>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: qualityScore >= 85 ? "var(--green-pale)" : "rgba(252,209,22,0.14)", color: qualityScore >= 85 ? "var(--green)" : "#92400E", fontSize: 12, fontWeight: 800 }}>
                {qualityScore}/100 quality
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.8 }}>
              {intelligence.summary}
            </p>
            <div className="dataset-kpi-grid" style={{ marginTop: 18 }}>
              {[
                ["Publisher", intelligence.publisher],
                ["Coverage", intelligence.coverage],
                ["Geography", intelligence.geography],
                ["Records", intelligence.records],
              ].map(([label, value]) => (
                <div key={label} className="dataset-kpi">
                  <div className="dataset-kpi-label">{label}</div>
                  <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 15 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              {insightBullets.map((insight) => (
                <div key={insight} style={{ display: "flex", gap: 9, alignItems: "flex-start", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
                  <TrendingUp size={15} color="var(--green)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => selectTab("charts")} className="dataset-action-btn primary"><BarChart2 size={15} /> Explore charts</button>
              {(hasRegionData || activeTab === "map") && <button onClick={() => selectTab("map")} className="dataset-action-btn"><Map size={15} /> View map</button>}
              <button onClick={() => openKweku("Summarize the main findings in this dataset.")} className="dataset-action-btn"><Bot size={15} /> Ask Kweku</button>
              <button onClick={() => selectTab("api")} className="dataset-action-btn"><Code2 size={15} /> API</button>
            </div>
          </div>

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
                     {previewHeaders.map((c, i) => (
                       <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>{c}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {previewBodyRows.slice(0, 5).map((row, i) => (
                     <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                       {previewHeaders.map((_, j) => (
                         <td key={j} style={{ padding: '12px 16px', fontSize: 14, color: 'var(--gray-800)' }}>{row[j] ?? "—"}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>
              {csvPreviewRows ? "Limited preview from the uploaded CSV." : "Sample preview only. Download for full dataset."}{" "}
              <button onClick={() => selectTab("table")} style={{ border: "none", background: "none", color: "var(--green)", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                Open table view
              </button>
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
        <div className="dataset-side-panel" style={{ flex: '1 1 28%', minWidth: 280, position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
          
          <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24, border: 'none', transition: 'transform 0.2s ease' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: "var(--text-primary)" }}>Explore Dataset</h3>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              Start with the visual and AI tools, then download the source file when you need the raw data.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => selectTab("charts")} className="dataset-action-btn primary" style={{ width: "100%" }}>
                <BarChart2 size={16} /> Charts
              </button>
              <button onClick={() => openKweku()} className="dataset-action-btn" style={{ width: "100%" }}>
                <Bot size={16} /> Ask
              </button>
              <button onClick={() => selectTab("map")} className="dataset-action-btn" style={{ width: "100%" }}>
                <Map size={16} /> Map
              </button>
              <button onClick={() => selectTab("api")} className="dataset-action-btn" style={{ width: "100%" }}>
                <Code2 size={16} /> API
              </button>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 }}>Source file</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, wordBreak: 'break-all' }}>{dataset.file_name || 'No file attached'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatSize(dataset.file_size)} · {dataset.file_type?.toUpperCase() || "Unknown format"}</div>
            </div>
            
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

            {dataset.file_path && (
              <button onClick={handleDownload} style={{ width: '100%', height: 44, background: 'rgba(0,107,63,0.08)', color: 'var(--green)', border: '1px solid rgba(0,107,63,0.18)', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', marginTop: 12 }}>
                <Download size={16} /> Download raw file
              </button>
            )}

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
            <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, wordBreak: 'break-word' }}>
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
