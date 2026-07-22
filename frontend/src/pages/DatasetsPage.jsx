import { useState, useEffect, useRef } from "react";
import { datasetsApi, categoriesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import QualityBadge from "../components/QualityBadge";
import AdjoaEmptyState from "../components/AdjoaEmptyState";
import CelebrationToast from "../components/CelebrationToast";
import toast from "react-hot-toast";
import { logInfo, logAction } from "../services/logger";

import {
  Plus,
  Upload,
  Trash2,
  Eye,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Tag,
  RefreshCw,
  ArrowRight,
  Share2,
  User,
  BarChart3,
  Bot,
  Building2,
  Link2,
  Map,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const VIS_LABELS = {
  public: "Public",
  private: "Private",
  organization: "Organization",
  shared_link: "Shared Link",
};
const ALLOWED_EXTS = ".csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.gif,.webp";

const WORLD_BANK_INDICATORS = {
  "SP.URB.TOTL.IN.ZS": {
    title: "Urban Population (% of Total Population)",
    summary: "Tracks Ghana's annual urban population share from 1960 to 2025. Ideal for analysing urbanisation, city growth, housing demand and regional development trends.",
    topic: "Population",
    trend: "Trending upward",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SP.POP.TOTL": {
    title: "Total Population of Ghana",
    summary: "Shows Ghana's population growth over time, useful for planning, market sizing, education, health, infrastructure and long-term development analysis.",
    topic: "Population",
    trend: "Long-term growth",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "NY.GDP.MKTP.CD": {
    title: "Gross Domestic Product (Current US$)",
    summary: "Measures the total value of goods and services produced in Ghana in current US dollars, useful for macroeconomic analysis and investment research.",
    topic: "Economy",
    trend: "Economic scale",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "NY.GDP.MKTP.KD.ZG": {
    title: "GDP Growth Rate",
    summary: "Tracks Ghana's annual economic growth rate, helping analysts compare expansions, slowdowns and recovery periods across the economy.",
    topic: "Economy",
    trend: "Growth indicator",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "FP.CPI.TOTL.ZG": {
    title: "Inflation Rate",
    summary: "Tracks annual consumer price inflation in Ghana, useful for understanding cost of living changes, monetary policy and household purchasing power.",
    topic: "Economy",
    trend: "Price pressure",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SL.UEM.TOTL.ZS": {
    title: "Unemployment Rate",
    summary: "Shows the share of Ghana's labour force that is unemployed, useful for employment, youth policy and economic opportunity analysis.",
    topic: "Employment",
    trend: "Labour market signal",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SE.ADT.LITR.ZS": {
    title: "Adult Literacy Rate",
    summary: "Measures adult literacy in Ghana and supports education planning, regional equity analysis and long-term human capital research.",
    topic: "Education",
    trend: "Human capital indicator",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SP.DYN.IMRT.IN": {
    title: "Infant Mortality Rate",
    summary: "Tracks infant deaths per 1,000 live births in Ghana, helping users understand child health outcomes and healthcare progress over time.",
    topic: "Health",
    trend: "Health outcome",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SH.STA.MMRT": {
    title: "Maternal Mortality Ratio",
    summary: "Measures maternal deaths per 100,000 live births in Ghana, useful for analysing maternal health, facility access and public health progress.",
    topic: "Health",
    trend: "Public health priority",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SH.MED.BEDS.ZS": {
    title: "Hospital Beds per 1,000 People",
    summary: "Tracks hospital bed availability in Ghana, useful for healthcare capacity planning, access analysis and public health system comparisons.",
    topic: "Health",
    trend: "Healthcare capacity",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "EG.ELC.ACCS.ZS": {
    title: "Access to Electricity (% of Population)",
    summary: "Shows the share of Ghanaians with access to electricity, useful for energy planning, infrastructure analysis and regional development work.",
    topic: "Energy",
    trend: "Access expanding",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "AG.PRD.CROP.XD": {
    title: "Crop Production Index",
    summary: "Tracks crop production trends in Ghana, useful for agriculture, food security, commodity planning and rural development analysis.",
    topic: "Agriculture",
    trend: "Agricultural output",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "TM.VAL.MRCH.CD.WT": {
    title: "Merchandise Imports",
    summary: "Shows the value of goods imported into Ghana, useful for trade, supply chain, currency demand and macroeconomic analysis.",
    topic: "Economy",
    trend: "Trade flow",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "TX.VAL.MRCH.CD.WT": {
    title: "Merchandise Exports",
    summary: "Shows the value of goods exported from Ghana, useful for trade analysis, commodity research, foreign exchange studies and export strategy.",
    topic: "Economy",
    trend: "Export signal",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "GC.REV.TOTL.GD.ZS": {
    title: "Government Revenue (% of GDP)",
    summary: "Measures Ghana government revenue as a share of GDP, useful for fiscal policy, public finance and debt sustainability analysis.",
    topic: "Economy",
    trend: "Fiscal indicator",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "GC.DOD.TOTL.GD.ZS": {
    title: "Government Debt (% of GDP)",
    summary: "Tracks Ghana government debt as a share of GDP, useful for public finance, sovereign risk and fiscal sustainability research.",
    topic: "Economy",
    trend: "Debt burden",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SH.XPD.CHEX.GD.ZS": {
    title: "Health Expenditure (% of GDP)",
    summary: "Shows Ghana's current health expenditure as a share of GDP, useful for healthcare financing and public budget analysis.",
    topic: "Health",
    trend: "Health spending",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "SE.XPD.TOTL.GD.ZS": {
    title: "Education Expenditure (% of GDP)",
    summary: "Shows Ghana's education expenditure as a share of GDP, useful for analysing human capital investment and public spending priorities.",
    topic: "Education",
    trend: "Education spending",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "IT.NET.USER.ZS": {
    title: "Internet Users (% of Population)",
    summary: "Tracks internet adoption in Ghana, useful for digital economy, telecoms, education technology and financial inclusion analysis.",
    topic: "Technology",
    trend: "Digital adoption",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
  "EN.ATM.CO2E.PC": {
    title: "CO2 Emissions per Person",
    summary: "Measures Ghana's carbon dioxide emissions per capita, useful for climate, energy transition and environmental policy analysis.",
    topic: "Environment",
    trend: "Climate indicator",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
  },
};

function getIndicatorCode(title = "") {
  const match = title.match(/([A-Z]{2,}(?:\.[A-Z0-9]+){2,})\s*$/);
  return match?.[1] || null;
}

function getPublisher(dataset) {
  const title = dataset.title || "";
  if (/world bank/i.test(title)) return "World Bank";
  if (/bank of ghana|bog/i.test(title)) return "Bank of Ghana";
  if (/ghana statistical service|gss/i.test(title)) return "Ghana Statistical Service";
  if (/faostat|food and agriculture/i.test(title)) return "FAOSTAT";
  if (/who|health service|ghs/i.test(title)) return "Ghana Health Service / WHO";
  return dataset.owner?.full_name || dataset.organization?.name || "GhanaDataHub";
}

function titleCaseWords(value = "") {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCleanTitle(dataset) {
  const rawTitle = dataset.title || "Untitled Dataset";
  const indicator = getIndicatorCode(rawTitle);
  if (indicator && WORLD_BANK_INDICATORS[indicator]) return WORLD_BANK_INDICATORS[indicator].title;
  if (indicator && /^World Bank Open Data/i.test(rawTitle)) return "Ghana Development Indicator";

  return rawTitle
    .replace(/^World Bank Open Data\s*[–-]\s*Ghana\s*:\s*/i, "")
    .replace(/^[^:]{3,80}:\s*([A-Z]{2,}(?:\.[A-Z0-9]+){2,})$/i, "$1")
    .replace(/\b[A-Z]{2,}(?:\.[A-Z0-9]+){2,}\b/g, "")
    .replace(/\s*[–-]\s*Ghana\s*$/i, "")
    .trim() || titleCaseWords(rawTitle);
}

function getTopic(dataset) {
  const text = `${dataset.category?.name || ""} ${dataset.title || ""} ${dataset.description || ""}`.toLowerCase();
  if (/inflation|gdp|forex|exchange|revenue|debt|bank|econom/.test(text)) return "Economy";
  if (/cocoa|maize|cassava|crop|farm|agric/.test(text)) return "Agriculture";
  if (/health|hospital|mortality|malaria|maternal|hiv|disease/.test(text)) return "Health";
  if (/school|education|literacy|teacher/.test(text)) return "Education";
  if (/population|census|urban|demographic/.test(text)) return "Population";
  if (/road|rail|port|electricity|energy|infrastructure/.test(text)) return "Infrastructure";
  if (/climate|forest|co2|environment|rainfall/.test(text)) return "Environment";
  if (/job|employment|unemployment|labour/.test(text)) return "Employment";
  if (/internet|technology|digital|mobile/.test(text)) return "Technology";
  return dataset.category?.name || "Ghana Data";
}

function getDatasetDisplay(dataset) {
  const indicator = getIndicatorCode(dataset.title || "");
  const mapped = indicator ? WORLD_BANK_INDICATORS[indicator] : null;
  const topic = mapped?.topic || getTopic(dataset);
  const summaryFromAI = dataset.analysis_data?.ai_summary?.split(".")?.[0];
  const summary = mapped?.summary
    || (summaryFromAI && summaryFromAI.length > 24 ? `${summaryFromAI}.` : null)
    || dataset.description
    || `Explore this ${topic.toLowerCase()} dataset for Ghana, with metadata, preview tools, API access and download options.`;

  return {
    title: mapped?.title || getCleanTitle(dataset),
    summary,
    publisher: getPublisher(dataset),
    topic,
    trend: mapped?.trend || (dataset.download_count > 50 ? "Popular with users" : "Ready to explore"),
    coverage: mapped?.coverage || (dataset.title?.toLowerCase().includes("regional") ? "Regional" : "Latest available"),
    records: mapped?.records || (dataset.analysis_data?.total_rows ? `${dataset.analysis_data.total_rows.toLocaleString()} rows` : "Metadata ready"),
    regions: mapped?.regions || (dataset.title?.toLowerCase().includes("region") ? "Regional" : "National"),
    verified: /world bank|ghana statistical service|bank of ghana|ministry|faostat|who/i.test(`${dataset.title} ${dataset.description || ""}`),
  };
}

function DatasetPreviewVisual({ dataset, display }) {
  const topic = display.topic.toLowerCase();
  const type = topic.includes("population") || topic.includes("economy") || topic.includes("technology")
    ? "line"
    : topic.includes("agriculture") || topic.includes("energy") || topic.includes("infrastructure")
      ? "bar"
      : topic.includes("health") || topic.includes("environment")
        ? "map"
        : "area";

  if (type === "map") {
    return (
      <div className="dataset-intel-map" aria-label="Map preview">
        <Map size={42} />
        <span>{display.regions}</span>
      </div>
    );
  }

  const values = Array.isArray(dataset.preview_data)
    ? dataset.preview_data.slice(0, 12).map((value) => Number(value)).filter((value) => !Number.isNaN(value))
    : [18, 24, 21, 35, 42, 48, 54, 63, 70, 76, 82, 88];
  const safeValues = values.length > 1 ? values : [18, 24, 21, 35, 42, 48, 54, 63, 70, 76, 82, 88];
  const max = Math.max(...safeValues);
  const min = Math.min(...safeValues);
  const range = max - min || 1;
  const points = safeValues.map((value, index) => {
    const x = 8 + (index / (safeValues.length - 1)) * 184;
    const y = 82 - ((value - min) / range) * 56;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="dataset-intel-chart" viewBox="0 0 200 96" role="img" aria-label={`${type} chart preview`}>
      <defs>
        <linearGradient id={`datasetPreviewFill-${dataset.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[24, 48, 72].map((y) => <line key={y} x1="8" x2="192" y1={y} y2={y} stroke="var(--border-subtle)" />)}
      {type === "bar" ? safeValues.slice(0, 8).map((value, index) => {
        const height = Math.max(8, ((value - min) / range) * 56 + 8);
        return <rect key={index} x={14 + index * 22} y={84 - height} width="12" height={height} rx="4" fill="var(--green)" opacity={0.82} />;
      }) : (
        <>
          {type === "area" && <polyline points={`8,88 ${points} 192,88`} fill={`url(#datasetPreviewFill-${dataset.id})`} />}
          <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function UploadModal({ onClose, onSuccess, categories }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    license: "",
    visibility: "private",
    category_id: "",
    tags: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (file) fd.append("file", file);
    setLoading(true);
    try {
      logAction("upload_started");
      const { data } = await datasetsApi.create(fd);
      toast.success("Dataset created!");
      logInfo("dataset_uploaded", {
        datasetId: data?.id,
        userId: user?.id,
        file_size_bytes: file?.size,
        title: form.title,
      });
      if (!localStorage.getItem("gdh_has_uploaded")) {
        window.dispatchEvent(new CustomEvent("gdh:first-upload"));
      }
      onSuccess();

      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Upload Dataset</div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--gray-500)",
            }}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Ghana GDP 2024"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe the dataset..."
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select
                className="form-select"
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value })
                }
              >
                {Object.entries(VIS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="form-group">
              <label className="form-label">License</label>
              <input
                className="form-input"
                value={form.license}
                onChange={(e) => setForm({ ...form, license: e.target.value })}
                placeholder="e.g. CC BY 4.0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                className="form-input"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="economy, ghana, 2024"
              />
            </div>
          </div>

          {/* File drop area */}
          <div
            className={`upload-area${dragging ? " dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED_EXTS}
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <Upload
              size={24}
              color="var(--gray-400)"
              style={{ marginBottom: 8 }}
            />
            {file ? (
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--green)",
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--gray-700)",
                  }}
                >
                  Drop file here or click to browse
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--gray-400)",
                    marginTop: 4,
                  }}
                >
                  CSV, Excel, JSON, PDF, Images — max 100MB
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <Upload size={14} /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DatasetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportLabel, setExportLabel] = useState("Export");
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    visibility: "",
    sort_by: "created_at",
    sort_dir: "desc",
  });

  const canUpload = ["super_admin", "org_admin", "data_manager"].includes(
    user?.role,
  );

  const load = () => {
    setLoading(true);
    const params = { page, per_page: 12, ...filters };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    datasetsApi
      .list(params)
      .then((r) => {
        setDatasets(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data));
  }, []);
  useEffect(() => {
    load();
  }, [page, filters]);

  const deleteDataset = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this dataset?")) return;
    try {
      await datasetsApi.delete(id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const formatSize = (b) => {
    if (!b) return "—";
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 ** 2).toFixed(1)} MB`;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getSampleTable = (dataset) => {
    const title = dataset.title.toLowerCase();
    if (title.includes("gdp") || title.includes("economy") || title.includes("inflation")) {
      return {
        headers: ["Year", "Value (USD)", "Growth Rate %", "Region", "Source"],
        rows: [
          ["2022", "72,537,045,100", "3.2%", "National", "World Bank"],
          ["2021", "77,594,256,000", "5.4%", "National", "World Bank"],
          ["2020", "67,356,000,000", "0.5%", "National", "World Bank"],
        ],
      };
    }
    if (title.includes("population") || title.includes("demographic")) {
      return {
        headers: ["Year", "Total Population", "Urban %", "Rural %", "Growth %"],
        rows: [
          ["2021", "32,070,000", "57%", "43%", "2.4%"],
          ["2016", "29,586,000", "55%", "45%", "2.2%"],
          ["2011", "24,658,000", "51%", "49%", "2.4%"],
        ],
      };
    }
    if (title.includes("health") || title.includes("mortality") || title.includes("immunization")) {
      return {
        headers: ["Year", "Indicator", "Value", "Unit", "Source"],
        rows: [
          ["2023", "Maternal Mortality", "310", "per 100k", "GHS"],
          ["2022", "Immunization Rate", "89%", "%", "WHO"],
          ["2021", "Skilled Births", "82%", "%", "GHS"],
        ],
      };
    }
    return {
      headers: ["Year", "Metric", "Value", "Category", "Country"],
      rows: [
        ["2023", "Rows", "3,200", "Preview", "Ghana"],
        ["2022", "Coverage", "78%", "Preview", "Ghana"],
        ["2021", "Growth", "4.1%", "Preview", "Ghana"],
      ],
    };
  };

  const handleDownload = async (dataset) => {
    setIsDownloading(true);
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const downloadUrl = `${apiBase}/datasets/${dataset.id}/download`;
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setIsDownloading(false), 600);
  };

  const handleExport = async (dataset) => {
    await navigator.clipboard.writeText(`${window.location.origin}/datasets/${dataset.id}`);
    setExportLabel("Copied!");
    window.setTimeout(() => setExportLabel("Export"), 2000);
  };

  const closeModal = () => {
    setSelectedDataset(null);
    setShowDescription(false);
    setExportLabel("Export");
  };

  const selectedSampleTable = selectedDataset ? getSampleTable(selectedDataset) : null;
  const selectedDisplay = selectedDataset ? getDatasetDisplay(selectedDataset) : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (selectedDataset) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDataset]);

  return (
    <div>
      <style>{`
        @keyframes datasetPreviewBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes datasetPreviewPanelSlide {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }

        @keyframes datasetPreviewSheetSlide {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dataset-intel-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-card);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          min-height: 460px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .dataset-intel-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 163, 92, 0.28);
          box-shadow: var(--shadow-md);
        }

        .dataset-intel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .dataset-intel-topic {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 5px 10px;
          background: var(--green-pale);
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
        }

        .dataset-intel-badges {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .dataset-intel-verified {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 3px 8px;
          background: rgba(0, 163, 92, 0.10);
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
        }

        .dataset-intel-chart,
        .dataset-intel-map {
          width: 100%;
          height: 112px;
          border-radius: 14px;
          background: linear-gradient(180deg, var(--surface-elevated), var(--surface-card));
          border: 1px solid var(--border-subtle);
          overflow: hidden;
        }

        .dataset-intel-map {
          display: grid;
          place-items: center;
          color: var(--green);
          font-size: 11px;
          font-weight: 800;
          gap: 4px;
        }

        .dataset-intel-title {
          color: var(--text-primary);
          font-size: 17px;
          font-weight: 900;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dataset-intel-summary {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.55;
          min-height: 58px;
        }

        .dataset-intel-summary svg {
          color: var(--green);
          flex-shrink: 0;
          margin-top: 3px;
        }

        .dataset-intel-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 10px;
          border-radius: 12px;
          background: var(--surface-elevated);
        }

        .dataset-intel-meta span {
          display: block;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dataset-intel-meta strong {
          display: block;
          margin-top: 2px;
          color: var(--text-primary);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dataset-intel-trend {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--green);
          font-size: 12px;
          font-weight: 900;
        }

        .dataset-intel-downloads {
          margin-left: auto;
          color: var(--text-muted);
          font-weight: 700;
        }

        .dataset-intel-actions {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 6px;
          margin-top: auto;
        }

        .dataset-intel-actions button {
          min-width: 0;
          height: 34px;
          border-radius: 9px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }

        .dataset-intel-actions button:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-pale);
        }

        .dataset-intel-actions button.danger {
          color: #DC2626;
          border-color: rgba(220, 38, 38, 0.25);
        }

        .dataset-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: datasetPreviewBackdropFade 0.25s ease forwards;
        }

        .dataset-modal-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          width: min(680px, 92vw);
          max-height: 88vh;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 32px;
          animation: datasetPreviewPanelSlide 0.3s ease forwards;
        }

        [data-theme='dark'] .dataset-modal-panel {
          background: rgba(22, 32, 25, 0.88);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .dataset-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .dataset-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.06);
          color: var(--text-primary, var(--dark));
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .dataset-modal-close:hover {
          background: rgba(0, 0, 0, 0.12);
          transform: scale(1.04);
        }

        [data-theme='dark'] .dataset-modal-close {
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme='dark'] .dataset-modal-close:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .dataset-modal-title {
          margin-top: 12px;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary, var(--dark));
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dataset-modal-subtitle {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .dataset-modal-metadata {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: center;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          padding: 12px 16px;
        }

        [data-theme='dark'] .dataset-modal-metadata {
          background: rgba(255, 255, 255, 0.05);
        }

        .dataset-modal-meta-block {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
        }

        .dataset-modal-meta-block:first-child {
          padding-left: 0;
        }

        .dataset-modal-meta-block:last-child {
          border-right: none;
          padding-right: 0;
        }

        [data-theme='dark'] .dataset-modal-meta-block {
          border-right-color: rgba(255, 255, 255, 0.10);
        }

        .dataset-modal-meta-icon {
          color: var(--green);
          flex-shrink: 0;
        }

        .dataset-modal-meta-label {
          font-size: 12px;
          color: var(--text-muted, var(--gray-500));
          line-height: 1.2;
        }

        .dataset-modal-meta-value {
          margin-top: 3px;
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary, var(--dark));
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dataset-modal-description {
          margin-top: 22px;
          color: var(--text-primary, var(--dark));
          font-size: 14px;
          line-height: 1.7;
        }

        .dataset-description-text {
          position: relative;
          white-space: pre-wrap;
        }

        .dataset-description-text.collapsed {
          max-height: 95px;
          overflow: hidden;
        }

        .dataset-description-text.collapsed::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 36px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.88));
          pointer-events: none;
        }

        [data-theme='dark'] .dataset-description-text.collapsed::after {
          background: linear-gradient(to bottom, rgba(22, 32, 25, 0), rgba(22, 32, 25, 0.92));
        }

        .dataset-description-toggle {
          margin-top: 8px;
          padding: 0;
          border: none;
          background: transparent;
          color: var(--green);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .dataset-no-description {
          color: var(--text-muted, var(--gray-500));
          font-style: italic;
        }

        .dataset-modal-tags {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
          color: var(--green);
        }

        .dataset-tag-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 99px;
          background: var(--green-pale);
          color: var(--green);
          font-size: 12px;
          font-weight: 700;
        }

        .dataset-modal-preview {
          margin-top: 24px;
        }

        .dataset-preview-title {
          margin-bottom: 10px;
          color: var(--green);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .dataset-preview-table-wrap {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.7);
        }

        [data-theme='dark'] .dataset-preview-table-wrap {
          border-color: rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.04);
        }

        .dataset-preview-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .dataset-preview-table th {
          background: var(--green);
          color: white;
          padding: 8px 12px;
          text-align: left;
          font-weight: 800;
        }

        .dataset-preview-table td {
          padding: 7px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          color: var(--text-primary, var(--dark));
        }

        [data-theme='dark'] .dataset-preview-table td {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .dataset-preview-table tbody tr:nth-child(odd) {
          background: rgba(0, 107, 63, 0.03);
        }

        .dataset-preview-table tbody tr:nth-child(even) {
          background: white;
        }

        [data-theme='dark'] .dataset-preview-table tbody tr:nth-child(even) {
          background: rgba(255, 255, 255, 0.03);
        }

        .dataset-preview-note {
          padding: 9px 12px;
          color: var(--text-muted, var(--gray-500));
          font-size: 11px;
          font-style: italic;
        }

        .dataset-preview-unavailable {
          border-radius: 10px;
          padding: 26px;
          background: rgba(0, 0, 0, 0.03);
          color: var(--text-secondary, var(--gray-600));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
        }

        [data-theme='dark'] .dataset-preview-unavailable {
          background: rgba(255, 255, 255, 0.05);
        }

        .dataset-modal-actions {
          position: sticky;
          bottom: -32px;
          display: flex;
          gap: 10px;
          margin: 26px -32px -32px;
          padding: 16px 32px 24px;
          background: linear-gradient(to top, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.78));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        [data-theme='dark'] .dataset-modal-actions {
          background: linear-gradient(to top, rgba(22, 32, 25, 0.98), rgba(22, 32, 25, 0.82));
          border-top-color: rgba(255, 255, 255, 0.10);
        }

        .dataset-modal-btn {
          height: 44px;
          border-radius: 10px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
        }

        .dataset-modal-btn:hover {
          transform: translateY(-1px);
        }

        .dataset-modal-btn.primary {
          width: 40%;
          background: var(--green);
          color: white;
        }

        .dataset-modal-btn.secondary {
          width: 28%;
          background: white;
          border: 1.5px solid var(--green);
          color: var(--green);
        }

        [data-theme='dark'] .dataset-modal-btn.secondary {
          background: rgba(255, 255, 255, 0.06);
        }

        .dataset-modal-btn.ghost {
          width: 28%;
          background: rgba(0, 107, 63, 0.08);
          color: var(--green);
        }

        @media (max-width: 640px) {
          @keyframes datasetPreviewPanelSlide {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .dataset-modal-panel {
            top: auto;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            max-height: 88vh;
            border-radius: 20px 20px 0 0;
            padding: 24px;
            animation: datasetPreviewSheetSlide 0.3s ease forwards;
          }

          .dataset-modal-metadata {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px 0;
          }

          .dataset-modal-meta-block {
            border-right: none;
            padding: 0 8px;
          }

          .dataset-modal-actions {
            flex-direction: column;
            margin: 24px -24px -24px;
            padding: 14px 24px 20px;
          }

          .dataset-modal-btn.primary,
          .dataset-modal-btn.secondary,
          .dataset-modal-btn.ghost {
            width: 100%;
          }

          .dataset-intel-actions {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
      <div className="page-header">
        <div>
          <div className="page-title">Datasets</div>
          <div className="page-subtitle">{total} datasets found</div>
        </div>
        {canUpload && (
          <button
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
          >
            <Plus size={15} /> Upload Dataset
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Eye size={14} color="var(--gray-400)" />
          <input
            placeholder="Search datasets..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={filters.category_id}
          onChange={(e) => {
            setFilters({ ...filters, category_id: e.target.value });
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 140 }}
          value={filters.visibility}
          onChange={(e) => {
            setFilters({ ...filters, visibility: e.target.value });
            setPage(1);
          }}
        >
          <option value="">All visibility</option>
          {Object.entries(VIS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: 150 }}
          value={`${filters.sort_by}_${filters.sort_dir}`}
          onChange={(e) => {
            const [sort_by, sort_dir] = e.target.value.split("_");
            setFilters({ ...filters, sort_by, sort_dir });
          }}
        >
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="download_count_desc">Most downloaded</option>
          <option value="title_asc">Title A–Z</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : datasets.length === 0 ? (
        <AdjoaEmptyState
          message="No datasets found. Try a different search or filter."
          actionLabel="Clear filters"
          onAction={() => {
            setFilters({
              search: "",
              category_id: "",
              visibility: "",
              sort_by: "created_at",
              sort_dir: "desc",
            });
            setPage(1);
          }}
        />
      ) : (
        <div className="dataset-grid">
          {datasets.map((d) => {
            const display = getDatasetDisplay(d);
            return (
              <div
                key={d.id}
                className="dataset-card dataset-intel-card"
                onClick={() => setSelectedDataset(d)}
              >
                <div className="dataset-intel-top">
                  <span className="dataset-intel-topic">{display.topic}</span>
                  <div className="dataset-intel-badges">
                    {display.verified && (
                      <span className="dataset-intel-verified">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                    <QualityBadge dataset={d} size="sm" />
                  </div>
                </div>

                <DatasetPreviewVisual dataset={d} display={display} />

                <div className="dataset-intel-title">{display.title}</div>
                <div className="dataset-intel-summary">
                  <Sparkles size={13} />
                  <span>{display.summary}</span>
                </div>

                <div className="dataset-intel-meta">
                  <div>
                    <span>Publisher</span>
                    <strong>{display.publisher}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>{formatDate(d.updated_at || d.created_at)}</strong>
                  </div>
                  <div>
                    <span>Coverage</span>
                    <strong>{display.coverage}</strong>
                  </div>
                  <div>
                    <span>Regions</span>
                    <strong>{display.regions}</strong>
                  </div>
                </div>

                <div className="dataset-intel-trend">
                  <TrendingUp size={14} />
                  <span>{display.trend}</span>
                  <span className="dataset-intel-downloads">{d.download_count || 0} downloads</span>
                </div>

                <div className="dataset-intel-actions">
                  <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedDataset(d); }}>
                    <BarChart3 size={14} /> Explore
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${d.id}?ask=kweku`); }}>
                    <Bot size={14} /> Ask Kweku
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${d.id}?tab=map`); }}>
                    <Map size={14} /> Map
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${d.id}?tab=api`); }}>
                    <Link2 size={14} /> API
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleDownload(d); }}>
                    <Download size={14} /> Download
                  </button>
                  {(user?.role === "super_admin" || d.owner_id === user?.id) && (
                    <button
                      type="button"
                      className="danger"
                      onClick={(event) => deleteDataset(d.id, event)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(7, pages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i;
            if (p < 1 || p > pages) return null;
            return (
              <button
                key={p}
                className={`page-btn${page === p ? " active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {selectedDataset && (
        <div
          className="dataset-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="dataset-modal-panel">
            <div className="dataset-modal-header">
              <span className="badge badge-blue">
                {selectedDataset.category?.name || "Uncategorized"}
              </span>
              <button className="dataset-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>
            <div className="dataset-modal-title">{selectedDisplay.title}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 13, flexWrap: "wrap" }}>
              <Building2 size={14} color="var(--green)" />
              <span>Publisher: {selectedDisplay.publisher}</span>
              {selectedDisplay.verified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--green)", fontWeight: 800 }}>
                  <ShieldCheck size={13} /> Verified source
                </span>
              )}
            </div>
            <div className="dataset-modal-subtitle">
              <span className={`badge vis-${selectedDataset.visibility}`}>
                {VIS_LABELS[selectedDataset.visibility] || "Unknown"}
              </span>
              {selectedDataset.file_type && (
                <span className="badge badge-gray">
                  {selectedDataset.file_type.split("/")[1]?.toUpperCase()}
                </span>
              )}
              <span className="badge badge-gray">v{selectedDataset.version}</span>
            </div>
            <div className="dataset-modal-metadata">
              <div className="dataset-modal-meta-block">
                <Upload className="dataset-modal-meta-icon" size={16} />
                <div style={{ minWidth: 0 }}>
                  <div className="dataset-modal-meta-label">File size</div>
                  <div className="dataset-modal-meta-value">{formatSize(selectedDataset.file_size)}</div>
                </div>
              </div>
              <div className="dataset-modal-meta-block">
                <Calendar className="dataset-modal-meta-icon" size={16} />
                <div style={{ minWidth: 0 }}>
                  <div className="dataset-modal-meta-label">Uploaded</div>
                  <div className="dataset-modal-meta-value">{formatDate(selectedDataset.created_at)}</div>
                </div>
              </div>
              <div className="dataset-modal-meta-block">
                <Download className="dataset-modal-meta-icon" size={16} />
                <div style={{ minWidth: 0 }}>
                  <div className="dataset-modal-meta-label">Downloads</div>
                  <div className="dataset-modal-meta-value">{selectedDataset.download_count ?? 0} downloads</div>
                </div>
              </div>
              <div className="dataset-modal-meta-block">
                <User className="dataset-modal-meta-icon" size={16} />
                <div style={{ minWidth: 0 }}>
                  <div className="dataset-modal-meta-label">Owner</div>
                  <div className="dataset-modal-meta-value">{selectedDataset.owner?.full_name || "Unknown"}</div>
                </div>
              </div>
            </div>
            <div className="dataset-modal-description">
              {selectedDisplay.summary ? (
                <>
                  <div className={`dataset-description-text ${showDescription ? "expanded" : "collapsed"}`}>
                    {selectedDisplay.summary}
                  </div>
                  {selectedDisplay.summary.length > 180 && (
                    <button
                      type="button"
                      className="dataset-description-toggle"
                      onClick={() => setShowDescription((prev) => !prev)}
                    >
                      {showDescription ? "Show less" : "Show more"}
                    </button>
                  )}
                </>
              ) : (
                <div className="dataset-no-description">No description provided.</div>
              )}
            </div>
            {selectedDataset.tags?.length > 0 && (
              <div className="dataset-modal-tags">
                <Tag size={12} />
                {selectedDataset.tags.map((tag) => (
                  <span key={tag.id || tag} className="dataset-tag-pill">
                    {tag.name || tag}
                  </span>
                ))}
              </div>
            )}
            <div className="dataset-modal-preview">
              <div className="dataset-preview-title">Data Preview</div>
              {selectedDataset.file_type === "text/csv" ? (
                <div className="dataset-preview-table-wrap">
                  <table className="dataset-preview-table">
                    <thead>
                      <tr>
                        {selectedSampleTable.headers.map((head) => (
                          <th key={head}>{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSampleTable.rows.map((row, idx) => (
                        <tr key={idx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="dataset-preview-note">
                    Sample preview only. Download the full dataset to see all rows.
                  </div>
                </div>
              ) : (
                <div className="dataset-preview-unavailable">
                  <FileText size={24} />
                  Preview not available for this file type.
                </div>
              )}
            </div>
            <div className="dataset-modal-actions">
              <button
                type="button"
                className="dataset-modal-btn primary"
                onClick={() => handleDownload(selectedDataset)}
                disabled={isDownloading}
              >
                <Download size={16} />
                {isDownloading ? "Downloading..." : "Download"}
              </button>
              <button
                type="button"
                className="dataset-modal-btn secondary"
                onClick={() => handleExport(selectedDataset)}
              >
                <Share2 size={16} />
                {exportLabel}
              </button>
              <button
                type="button"
                className="dataset-modal-btn ghost"
                onClick={() => {
                  closeModal();
                  navigate(`/datasets/${selectedDataset.id}`);
                }}
              >
                Read More
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpload && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSuccess={load}
        />
      )}
      <CelebrationToast />
    </div>
  );
}
