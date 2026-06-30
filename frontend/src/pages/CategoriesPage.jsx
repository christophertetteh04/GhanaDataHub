import { useState, useEffect } from "react";
import { categoriesApi } from "../services/api";
import toast from "react-hot-toast";
import { Plus, Tag } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    categoriesApi.list().then(r => setCategories(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await categoriesApi.create(form);
      toast.success("Category created");
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Categories</div>
          <div className="page-subtitle">Organize datasets by category</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <div className="card">
          <h4 style={{ fontFamily: "Sora", fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Add Category</h4>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Agriculture" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description..." style={{ minHeight: 60 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={creating}>
              {creating ? <span className="spinner" /> : <><Plus size={14} /> Create Category</>}
            </button>
          </form>
        </div>

        <div className="card">
          <h4 style={{ fontFamily: "Sora", fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
            All Categories ({categories.length})
          </h4>
          {loading ? (
            <div style={{ textAlign: "center", padding: 32 }}><span className="spinner" /></div>
          ) : categories.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon"><Tag size={20} /></div>
              <div style={{ fontSize: 13 }}>No categories yet</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {categories.map(c => (
                <div key={c.id} style={{ padding: "12px 14px", background: "var(--gray-100)",
                  borderRadius: 8, borderLeft: "3px solid var(--green)" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-400)" }}>/{c.slug}</div>
                  {c.description && (
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4, lineHeight: 1.4 }}>
                      {c.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
