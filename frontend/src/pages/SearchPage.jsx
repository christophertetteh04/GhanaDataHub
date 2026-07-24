import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { searchApi, categoriesApi } from "../services/api";
import { Search, Tag, ChevronLeft, ChevronRight, TrendingUp, Heart, Leaf, Users as UsersIcon, X, BookText } from "lucide-react";
import { BLOG_POSTS } from "./BlogPage";

const VIS_LABELS = { public: "Public", private: "Private", organization: "Organization", shared_link: "Shared Link" };

const TRENDING = [
  'cocoa production', 'Ghana inflation 2024', 'voter registration', 
  'forex rates', 'population census 2021', 'electricity access', 
  'maternal mortality', 'GSE stock prices'
];

function isQuestion(q) {
  return /^(what|why|how|when|where|which|who|is|are|does|did)\b/i.test(q.trim());
}

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
  
  // Server-side filters
  const [filters, setFilters] = useState({ category_id: "", sort_by: "created_at", sort_dir: "desc" });
  
  // Client-side progressive filters
  const [clientFilters, setClientFilters] = useState({
    fileType: '',
    dateRange: ''
  });

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    categoriesApi.list().then(r => setCategories(r.data));
    
    try {
      const recent = JSON.parse(localStorage.getItem('gdh_recently_viewed') || '[]');
      setRecentlyViewed(recent);
    } catch (e) {
      console.error(e);
    }
  }, []);

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
    if (q) { 
      setQuery(q); 
      doSearch(q, 1); 
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ q: query });
    // doSearch is triggered by the useEffect on searchParams change
  };

  const handleTopicClick = (topic) => {
    setQuery(topic);
    setSearchParams({ q: topic });
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem('gdh_recently_viewed');
    setRecentlyViewed([]);
  };

  const formatSize = (b) => {
    if (!b) return "—";
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 ** 2).toFixed(1)} MB`;
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (clientFilters.fileType && !r.file_type?.toLowerCase().includes(clientFilters.fileType.toLowerCase())) {
        return false;
      }
      if (clientFilters.dateRange) {
        const d = new Date(r.created_at);
        const now = new Date();
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (clientFilters.dateRange === 'week' && diffDays > 7) return false;
        if (clientFilters.dateRange === 'month' && diffDays > 30) return false;
        if (clientFilters.dateRange === 'year' && diffDays > 365) return false;
      }
      return true;
    });
  }, [results, clientFilters]);

  const storyResults = useMemo(() => {
    const activeQ = searchParams.get("q") || "";
    if (!isQuestion(activeQ)) return [];
    const searchTerms = activeQ.toLowerCase().split(' ').filter(w => w.length > 2);
    return BLOG_POSTS.filter(post => {
      const text = (post.title + ' ' + post.body).toLowerCase();
      return searchTerms.some(term => text.includes(term));
    }).slice(0, 3);
  }, [searchParams]);

  const isZeroState = !searchParams.get("q") && results.length === 0 && !loading;

  return (
    <div>
      {isZeroState ? (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>What are you looking for?</h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 15 }}>Search Ghana's most comprehensive open data platform.</p>
            
            <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <div className="search-bar" style={{ width: '100%', maxWidth: 500 }}>
                <Search size={18} color="var(--gray-400)" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Try 'cocoa production' or 'maternal health'..."
                  autoFocus
                  style={{ fontSize: 15, padding: '12px 0' }}
                />
              </div>
            </form>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 12, textTransform: 'uppercase' }}>Trending Searches</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {TRENDING.map(t => (
                <button
                  key={t}
                  onClick={() => handleTopicClick(t)}
                  style={{
                    background: 'var(--green-pale)',
                    color: 'var(--green)',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 12, textTransform: 'uppercase' }}>Topic Clusters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { name: 'Economy', icon: TrendingUp, color: '#006B3F', desc: 'GDP, inflation, forex, banking' },
                { name: 'Health', icon: Heart, color: '#DC2626', desc: 'Mortality, vaccination, facilities' },
                { name: 'Agriculture', icon: Leaf, color: '#92400E', desc: 'Cocoa, cassava, food prices' },
                { name: 'Demographics', icon: UsersIcon, color: '#1D4ED8', desc: 'Census, population, regions' },
              ].map(topic => (
                <div
                  key={topic.name}
                  onClick={() => handleTopicClick(topic.name)}
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: 20,
                    height: 120,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                  }}
                >
                  <topic.icon size={24} color={topic.color} style={{ marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{topic.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{topic.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {recentlyViewed.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', margin: 0 }}>Recently Viewed</h3>
                <button onClick={clearRecentlyViewed} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--gray-400)', cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {recentlyViewed.map(r => (
                  <Link
                    key={r.id}
                    to={`/datasets/${r.id}`}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid var(--gray-100)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                    </div>
                    {r.file_type && <span className="badge badge-gray" style={{ fontSize: 10 }}>{r.file_type.split("/")[1]?.toUpperCase()}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="page-header">
            <div>
              <div className="page-title">Search Results</div>
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
                onChange={e => {
                  const newFilters = { ...filters, category_id: e.target.value };
                  setFilters(newFilters);
                  setPage(1);
                  doSearch(query, 1);
                }}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="form-select" style={{ width: 160 }}
                value={`${filters.sort_by}_${filters.sort_dir}`}
                onChange={e => {
                  const [sort_by, sort_dir] = e.target.value.split("_");
                  const newFilters = { ...filters, sort_by, sort_dir };
                  setFilters(newFilters);
                  setPage(1);
                  doSearch(query, 1);
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
              <div style={{ 
                marginBottom: 20, 
                padding: '12px 16px',
                background: 'var(--gray-50)',
                borderRadius: 12,
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                animation: 'fadeInDown 0.3s ease'
              }}>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Filter results:</span>
                
                <select 
                  className="form-select" 
                  style={{ padding: '6px 12px', fontSize: 12, height: 32 }}
                  value={clientFilters.fileType}
                  onChange={e => setClientFilters({ ...clientFilters, fileType: e.target.value })}
                >
                  <option value="">Any File Type</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>

                <select 
                  className="form-select" 
                  style={{ padding: '6px 12px', fontSize: 12, height: 32 }}
                  value={clientFilters.dateRange}
                  onChange={e => setClientFilters({ ...clientFilters, dateRange: e.target.value })}
                >
                  <option value="">Any Time</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>

              <div style={{ marginBottom: 12, fontSize: 13, color: "var(--gray-500)" }}>
                {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} for <strong>"{searchParams.get("q")}"</strong>
              </div>

              {storyResults.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookText size={16} color="var(--green)" /> Data Stories about this topic:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {storyResults.map(post => (
                      <div 
                        key={post.id}
                        onClick={() => navigate(`/insights/${post.id}`)}
                        style={{
                          background: 'white',
                          borderRadius: 12,
                          padding: 16,
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--gray-900)' }}>{post.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--gray-500)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                          {post.excerpt}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{post.readingTime} min read &bull; {new Date(post.publishedAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredResults.map(d => (
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
                  <button className="page-btn" onClick={() => { const p = page - 1; setPage(p); doSearch(searchParams.get("q") || query, p); }} disabled={page === 1}>
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                    const p = page <= 4 ? i + 1 : page - 3 + i;
                    if (p < 1 || p > pages) return null;
                    return (
                      <button key={p} className={`page-btn${page === p ? " active" : ""}`}
                        onClick={() => { setPage(p); doSearch(searchParams.get("q") || query, p); }}>{p}</button>
                    );
                  })}
                  <button className="page-btn" onClick={() => { const p = page + 1; setPage(p); doSearch(searchParams.get("q") || query, p); }} disabled={page === pages}>
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
          ) : null}
        </>
      )}
    </div>
  );
}
