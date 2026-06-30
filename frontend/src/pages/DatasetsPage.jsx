import { useState, useEffect, useRef } from "react";
import { datasetsApi, categoriesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus, Upload, Trash2, Eye, Download, ChevronLeft,
  ChevronRight, FileText, X, Tag, RefreshCw
} from "lucide-react";

const VIS_LABELS = { public: "Public", private: "Private", organization: "Organization", shared_link: "Shared Link" };
const ALLOWED_EXTS = ".csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.gif,.webp";

function UploadModal({ onClose, onSuccess, categories }) {
  const [form, setForm] = useState({ title: "", description: "", license: "", visibility: "private", category_id: "", tags: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (file) fd.append("file", file);
    setLoading(true);
    try {
      await datasetsApi.create(fd);
      toast.success("Dataset created!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Upload Dataset</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--gray-500)" }}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Ghana GDP 2024" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the dataset..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select className="form-select" value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                {Object.entries(VIS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">License</label>
              <input className="form-input" value={form.license} onChange={e => setForm({ ...form, license: e.target.value })} placeholder="e.g. CC BY 4.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="economy, ghana, 2024" />
            </div>
          </div>

          {/* File drop area */}
          <div
            className={`upload-area${dragging ? " dragging" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept={ALLOWED_EXTS} style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            <Upload size={24} color="var(--gray-400)" style={{ marginBottom: 8 }} />
            {file ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--green)" }}>{file.name}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-700)" }}>Drop file here or click to browse</div>
                <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 4 }}>CSV, Excel, JSON, PDF, Images — max 100MB</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Upload size={14} /> Upload</>}
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
  const [filters, setFilters] = useState({ search: "", category_id: "", visibility: "", sort_by: "created_at", sort_dir: "desc" });

  const canUpload = ["super_admin", "org_admin", "data_manager"].includes(user?.role);

  const load = () => {
    setLoading(true);
    const params = { page, per_page: 12, ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    datasetsApi.list(params)
      .then(r => { setDatasets(r.data.items); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { categoriesApi.list().then(r => setCategories(r.data)); }, []);
  useEffect(() => { load(); }, [page, filters]);

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

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Datasets</div>
          <div className="page-subtitle">{total} datasets found</div>
        </div>
        {canUpload && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <Plus size={15} /> Upload Dataset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Eye size={14} color="var(--gray-400)" />
          <input
            placeholder="Search datasets..."
            value={filters.search}
            onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filters.category_id} onChange={e => { setFilters({ ...filters, category_id: e.target.value }); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filters.visibility} onChange={e => { setFilters({ ...filters, visibility: e.target.value }); setPage(1); }}>
          <option value="">All visibility</option>
          {Object.entries(VIS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-select" style={{ width: 150 }} value={`${filters.sort_by}_${filters.sort_dir}`}
          onChange={e => { const [sort_by, sort_dir] = e.target.value.split("_"); setFilters({ ...filters, sort_by, sort_dir }); }}>
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="download_count_desc">Most downloaded</option>
          <option value="title_asc">Title A–Z</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /></button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : datasets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={24} /></div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No datasets found</div>
          <div style={{ fontSize: 13 }}>Try adjusting your filters or upload a new dataset</div>
          {canUpload && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowUpload(true)}><Plus size={14} /> Upload Dataset</button>}
        </div>
      ) : (
        <div className="dataset-grid">
          {datasets.map(d => (
            <div key={d.id} className="dataset-card" onClick={() => navigate(`/datasets/${d.id}`)}>
              <div className="dataset-card-title">{d.title}</div>
              <div className="dataset-card-meta">
                <span className={`badge vis-${d.visibility}`}>{VIS_LABELS[d.visibility]}</span>
                {d.file_type && <span className="badge badge-gray">{d.file_type.split("/")[1]?.toUpperCase()}</span>}
                {d.category && <span className="badge badge-blue">{d.category.name}</span>}
              </div>
              {d.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {d.tags.slice(0, 3).map(t => <span key={t.id} className="tag-chip"><Tag size={10} />{t.name}</span>)}
                  {d.tags.length > 3 && <span className="tag-chip">+{d.tags.length - 3}</span>}
                </div>
              )}
              <div className="dataset-card-footer">
                <span>{formatSize(d.file_size)} · v{d.version}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Download size={11} />{d.download_count}</span>
                  {(user?.role === "super_admin" || d.owner_id === user?.id) && (
                    <button className="btn btn-danger btn-sm" style={{ padding: "2px 6px" }}
                      onClick={e => deleteDataset(d.id, e)}>
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
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(7, pages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i;
            if (p < 1 || p > pages) return null;
            return (
              <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
            );
          })}
          <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {showUpload && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
