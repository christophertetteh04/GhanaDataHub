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
} from "lucide-react";

const VIS_LABELS = {
  public: "Public",
  private: "Private",
  organization: "Organization",
  shared_link: "Shared Link",
};
const ALLOWED_EXTS = ".csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.gif,.webp";

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
          {datasets.map((d) => (
            <div
              key={d.id}
              className="dataset-card"
              onClick={() => setSelectedDataset(d)}
            >
              <div className="dataset-card-title">{d.title}</div>
              <div className="dataset-card-meta">
                <span className={`badge vis-${d.visibility}`}>
                  {VIS_LABELS[d.visibility]}
                </span>
                <QualityBadge dataset={d} size="sm" />
                {d.file_type && (
                  <span className="badge badge-gray">
                    {d.file_type.split("/")[1]?.toUpperCase()}
                  </span>
                )}
                {d.category && (
                  <span className="badge badge-blue">{d.category.name}</span>
                )}
              </div>
              {d.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {d.tags.slice(0, 3).map((t) => (
                    <span key={t.id} className="tag-chip">
                      <Tag size={10} />
                      {t.name}
                    </span>
                  ))}
                  {d.tags.length > 3 && (
                    <span className="tag-chip">+{d.tags.length - 3}</span>
                  )}
                </div>
              )}
              <div className="dataset-card-footer">
                <span>
                  {formatSize(d.file_size)} · v{d.version}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Download size={11} />
                    {d.download_count}
                  </span>
                  {(user?.role === "super_admin" ||
                    d.owner_id === user?.id) && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: "2px 6px" }}
                      onClick={(e) => deleteDataset(d.id, e)}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
            <div className="dataset-modal-title">{selectedDataset.title}</div>
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
              {selectedDataset.description ? (
                <>
                  <div className={`dataset-description-text ${showDescription ? "expanded" : "collapsed"}`}>
                    {selectedDataset.description}
                  </div>
                  <button
                    type="button"
                    className="dataset-description-toggle"
                    onClick={() => setShowDescription((prev) => !prev)}
                  >
                    {showDescription ? "Show less" : "Show more"}
                  </button>
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
