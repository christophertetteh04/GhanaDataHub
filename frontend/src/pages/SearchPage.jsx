import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchApi, categoriesApi } from "../services/api";
import { Search, Tag, ChevronLeft, ChevronRight } from "lucide-react";

const VIS_LABELS = { public: "Public", private: "Private", organization: "Organization", shared_link: "Shared Link" };

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category_id: "", sort_by: "created_at", sort_dir: "desc" });

  useEffect(() => { categoriesApi.list().then(r => setCategories(r.data)); }, []);

  const doSearch = (q = query, p = page) => {
    if (!q.trim()) return;
    setLoading(true);
    const params = { q, page: p, per_page: 12, ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    searchApi.search(params)
      .then(r => { setResults(r.data.items); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); doSearch(q, 1); }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ q: query });
    doSearch(query, 1);
  };

  const formatSize = (b) => {
    if (!b) return "—";
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 ** 2).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Search</div>
          <div className="page-subtitle">Search across all accessible datasets</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={15} color="var(--gray-400)" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search datasets by title, description..."
              autoFocus
            />
          </div>
          <select className="form-select" style={{ width: 160 }}
            value={filters.category_id}
            onChange={e => setFilters({ ...filters, category_id: e.target.value })}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 160 }}
            value={`${filters.sort_by}_${filters.sort_dir}`}
            onChange={e => {
              const [sort_by, sort_dir] = e.target.value.split("_");
              setFilters({ ...filters, sort_by, sort_dir });
            }}>
            <option value="created_at_desc">Newest first</option>
            <option value="created_at_asc">Oldest first</option>
            <option value="download_count_desc">Most downloaded</option>
            <option value="title_asc">Title A–Z</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <Search size={14} /> Search
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : results.length > 0 ? (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: "var(--gray-500)" }}>
            {total} result{total !== 1 ? "s" : ""} for <strong>"{searchParams.get("q")}"</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map(d => (
              <div key={d.id} className="card" style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                onClick={() => navigate(`/datasets/${d.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                      {d.title}
                    </div>
                    {d.description && (
                      <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 8, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {d.description}
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <span className={`badge vis-${d.visibility}`}>{VIS_LABELS[d.visibility]}</span>
                      {d.category && <span className="badge badge-blue">{d.category.name}</span>}
                      {d.file_type && <span className="badge badge-gray">{d.file_type.split("/")[1]?.toUpperCase()}</span>}
                      {d.tags?.slice(0, 3).map(t => (
                        <span key={t.id} className="tag-chip"><Tag size={10} />{t.name}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "var(--gray-400)", flexShrink: 0 }}>
                    <div>{formatSize(d.file_size)}</div>
                    <div style={{ marginTop: 4 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                    <div style={{ marginTop: 4 }}>v{d.version}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => { const p = page - 1; setPage(p); doSearch(query, p); }} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} className={`page-btn${page === p ? " active" : ""}`}
                    onClick={() => { setPage(p); doSearch(query, p); }}>{p}</button>
                );
              })}
              <button className="page-btn" onClick={() => { const p = page + 1; setPage(p); doSearch(query, p); }} disabled={page === pages}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : searchParams.get("q") && !loading ? (
        <div className="empty-state">
          <div className="empty-icon"><Search size={24} /></div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
          <div style={{ fontSize: 13 }}>Try different keywords or filters</div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon"><Search size={24} /></div>
          <div style={{ fontWeight: 600 }}>Start searching</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Enter a keyword above to find datasets</div>
        </div>
      )}
    </div>
  );
}
