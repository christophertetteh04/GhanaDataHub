import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Database,
  RefreshCw,
  FileSpreadsheet,
  Braces,
  FileText,
  Table,
  Image,
  File,
} from "lucide-react";
import { datasetsApi, categoriesApi, dashboardApi } from "../services/api";
import ObservanceBanner from "../components/ObservanceBanner";
import TodayHighlight from "../components/TodayHighlight";
import FeedCard from "../components/FeedCard";
import AdjoaEmptyState from "../components/AdjoaEmptyState";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const FILTERS = [
  { key: "all", label: "All Updates", icon: Layers },
  { key: "new", label: "New Datasets", icon: Database },
  { key: "updated", label: "Updated", icon: RefreshCw },
];

const THUMBNAIL_STYLES = {
  csv: { bg: "var(--green-pale)", color: "var(--green)", icon: FileSpreadsheet },
  json: { bg: "#EFF6FF", color: "#2563EB", icon: Braces },
  pdf: { bg: "#FEF2F2", color: "#DC2626", icon: FileText },
  excel: { bg: "#F0FDF4", color: "var(--green)", icon: Table },
  image: { bg: "#FFF7ED", color: "#F97316", icon: Image },
  default: { bg: "var(--surface-elevated)", color: "var(--text-secondary)", icon: File },
};

const CATEGORY_COLOURS = {
  Economy: "#3B82F6",
  Health: "#EF4444",
  Agriculture: "#22C55E",
  Demographics: "#F97316",
  Governance: "#8B5CF6",
  Environment: "#10B981",
  Education: "#F59E0B",
  Multiple: "#006B3F",
  Default: "#006B3F",
};

function formatTimeAgoFrom(value, now) {
  const date = new Date(value);
  const delta = Math.max(0, Math.floor((now - date) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  const days = Math.floor(delta / 86400);
  return days <= 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function mergeDatasets(existing, incoming) {
  const seen = new Set();
  return [...existing, ...incoming].filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function isUpdatedDataset(item) {
  if (!item.updated_at || !item.created_at) return false;
  return new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 60000;
}

function getFileTypeKey(type) {
  if (!type) return "default";
  const normalized = type.toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("json")) return "json";
  if (normalized.includes("pdf")) return "pdf";
  if (normalized.includes("xls") || normalized.includes("excel")) return "excel";
  if (normalized.includes("png") || normalized.includes("jpg") || normalized.includes("jpeg") || normalized.includes("image")) return "image";
  return "default";
}

function formatLargeNumber(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
}

function sortItems(items, sortKey) {
  if (sortKey === "downloads") {
    return [...items].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
  }
  if (sortKey === "discussed") {
    return [...items].sort((a, b) => ((b.download_count || 0) * 0.8) - ((a.download_count || 0) * 0.8));
  }
  return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export default function NewsFeedPage() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [isSticky, setIsSticky] = useState(false);
  const [observanceData, setObservanceData] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const topbarRef = useRef(null);

  const loadFeed = async ({ silent = false } = {}) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);

    try {
      const [datasetsRes, categoriesRes, statsRes, observanceRes] = await Promise.all([
        datasetsApi.list({ page: 1, per_page: 20, sort_by: "created_at", sort_dir: "desc" }),
        categoriesApi.list(),
        dashboardApi.stats(),
        fetch(`${API_BASE}/observances/today`).then((res) => (res.ok ? res.json() : null)).catch(() => null),
      ]);
      const payload = datasetsRes.data || {};
      const items = payload.items || payload || [];
      setDatasets(items);
      setCategories(categoriesRes.data || []);
      setDashboardStats(statsRes.data || null);
      setObservanceData(observanceRes || null);
      setPage(1);
      setHasMore(payload.pages ? payload.page < payload.pages : items.length >= 20);
      setNow(new Date());
    } catch (error) {
      console.error(error);
      setLoadError("Unable to load the news feed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const refreshId = window.setInterval(() => loadFeed({ silent: true }), 5 * 60 * 1000);
    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const tickId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const rect = topbarRef.current?.getBoundingClientRect();
      setIsSticky(rect ? rect.top <= 84 : false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredDatasets = useMemo(() => {
    const active = datasets.filter((item) => {
      if (activeCategory && item.category?.id !== activeCategory && item.category?.name !== activeCategory) return false;
      if (filter === "new") {
        return new Date(item.created_at) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
      }
      if (filter === "updated") {
        return isUpdatedDataset(item);
      }
      return true;
    });
    return sortItems(active, sortBy);
  }, [datasets, filter, activeCategory, sortBy]);

  const recentActivity = useMemo(() => datasets.slice(0, 5), [datasets]);
  const recentPosts = useMemo(() => datasets.slice(0, 6), [datasets]);
  const activeCategoryName = useMemo(
    () => categories.find((category) => category.id === activeCategory)?.name || (typeof activeCategory === "string" ? activeCategory : ""),
    [categories, activeCategory],
  );

  const handleClearFilters = () => {
    setFilter("all");
    setActiveCategory(null);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await datasetsApi.list({ per_page: 20, sort_by: "created_at", sort_dir: "desc", page: nextPage });
      const payload = res.data || {};
      const items = payload.items || payload || [];
      setDatasets((prev) => mergeDatasets(prev, items));
      setPage(nextPage);
      setHasMore(payload.pages ? payload.page < payload.pages : items.length >= 20);
    } catch (error) {
      console.error(error);
      setLoadError("Unable to load more updates.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const totalDownloads = dashboardStats?.total_downloads ?? datasets.reduce((acc, item) => acc + (item.download_count || 0), 0);

  return (
    <div className="news-feed-page" style={{ padding: 24, minHeight: "100vh", background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <div
        className="news-feed-shell"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gap: 20,
        }}
      >
        <div className="news-feed-left" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div style={{ marginBottom: 12, padding: 16, borderRadius: 14, background: "var(--surface-card)", boxShadow: "var(--shadow-md)" }}>
                <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Feed Filters</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {FILTERS.map(({ key, label, icon: Icon }) => {
                    const active = filter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: active ? "var(--green)" : "transparent",
                          color: active ? "white" : "var(--text-secondary)",
                          border: "1px solid transparent",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <Icon size={16} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Topics</div>
              <div style={{ display: "grid", gap: 10 }}>
                {categories.map((category) => {
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(isActive ? null : category.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "11px 12px",
                        borderRadius: 10,
                        background: "transparent",
                        color: isActive ? "var(--green)" : "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                        fontWeight: isActive ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--green)" }} />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Recent</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {recentActivity.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/datasets/${item.id}`)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      textAlign: "left",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      background: "var(--surface-elevated)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="news-feed-main">
          <div
            ref={topbarRef}
            className="news-feed-topbar"
            style={{
              position: isSticky ? "sticky" : "relative",
              top: isSticky ? 80 : "unset",
              zIndex: 10,
              background: isSticky ? "var(--surface-card)" : "var(--surface-card)",
              backdropFilter: isSticky ? "blur(12px)" : "none",
              borderRadius: 14,
              boxShadow: "var(--shadow-md)",
              padding: 20,
              marginBottom: 20,
              transition: "background 0.2s ease, backdrop-filter 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Data Feed</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  Latest updates from GhanaDataHub
                  {isRefreshing && <span style={{ color: "var(--green)", marginLeft: 8 }}>Refreshing...</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => loadFeed({ silent: true })}
                  disabled={isRefreshing}
                  style={{
                    height: 40,
                    borderRadius: 10,
                    border: "1px solid var(--border-default)",
                    background: "var(--surface-elevated)",
                    color: "var(--green)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: isRefreshing ? "not-allowed" : "pointer",
                    opacity: isRefreshing ? 0.65 : 1,
                  }}
                >
                  <RefreshCw size={14} style={{ animation: isRefreshing ? "newsFeedSpin 0.8s linear infinite" : "none" }} />
                  Refresh
                </button>
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    minWidth: 160,
                    borderRadius: 10,
                    border: "1px solid var(--border-default)",
                    padding: "10px 12px",
                    background: "var(--surface-card)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="latest">Latest</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="discussed">Most Discussed</option>
                </select>
              </div>
            </div>
          </div>

          {loadError && !isLoading && (
            <div className="feed-notice">
              <span>{loadError}</span>
              <button type="button" onClick={() => loadFeed({ silent: true })}>Retry</button>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: "grid", gap: 14 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="skeleton-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="skeleton-line" style={{ width: "60%", height: 16, marginBottom: 14 }} />
                  <div className="skeleton-line" style={{ width: "100%", height: 110, marginBottom: 14 }} />
                  <div className="skeleton-line" style={{ width: "40%", height: 14, marginBottom: 12 }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <div className="skeleton-line" style={{ width: "20%", height: 12 }} />
                    <div className="skeleton-line" style={{ width: "20%", height: 12 }} />
                    <div className="skeleton-line" style={{ width: "20%", height: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <TodayHighlight />

              <div className="feed-category-strip" aria-label="Category filters">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`feed-category-pill ${!activeCategory ? "active" : ""}`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`feed-category-pill ${activeCategory === category.id ? "active" : ""}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {observanceData && (
                <ObservanceBanner variant="feed" observance={observanceData} />
              )}

              {filteredDatasets.length === 0 && (
                <AdjoaEmptyState
                  message={
                    activeCategoryName
                      ? `No ${activeCategoryName} found yet. Be the first to upload ${activeCategoryName} data for Ghana.`
                      : "No datasets found yet. Be the first to upload Ghana data."
                  }
                  actionLabel="Upload a Dataset"
                  onAction={() => navigate("/datasets")}
                />
              )}

              {filteredDatasets.map((item) => (
                <FeedCard
                  key={item.id}
                  dataset={item}
                  categoryColours={CATEGORY_COLOURS}
                  onCategoryClick={(cat) => setActiveCategory(cat)}
                />
              ))}
              {filteredDatasets.length > 0 && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore || !hasMore}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--green)",
                    background: "transparent",
                    color: "var(--green)",
                    fontWeight: 700,
                    cursor: isLoadingMore || !hasMore ? "not-allowed" : "pointer",
                    opacity: isLoadingMore || !hasMore ? 0.6 : 1,
                  }}
                >
                  {isLoadingMore ? "Loading..." : hasMore ? "Load more updates" : "You're all caught up"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="news-feed-right" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Recent Updates</div>
                <button onClick={handleClearFilters} style={{ border: "none", background: "transparent", color: "var(--green)", fontSize: 12, cursor: "pointer" }}>
                  Clear
                </button>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {recentPosts.map((item) => {
                  const fileStyle = THUMBNAIL_STYLES[getFileTypeKey(item.file_type)] || THUMBNAIL_STYLES.default;
                  const FileIcon = fileStyle.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/datasets/${item.id}`)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "50px 1fr",
                        gap: 12,
                        alignItems: "center",
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid var(--border-subtle)",
                        background: "var(--surface-elevated)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 12, background: fileStyle.bg, display: "grid", placeItems: "center" }}>
                        <FileIcon size={18} color={fileStyle.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{item.category?.name || "Uncategorized"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatTimeAgoFrom(item.created_at, now)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 700 }}>Platform Stats</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{dashboardStats?.total_datasets ?? 0}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Datasets</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{dashboardStats?.total_users ?? 0}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Users</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{formatLargeNumber(totalDownloads)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Downloads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .news-feed-shell {
          grid-template-columns: minmax(190px, 220px) minmax(0, 1fr) minmax(240px, 280px);
        }

        .news-feed-left,
        .news-feed-right {
          min-width: 0;
        }

        .news-feed-topbar {
          border: 1px solid var(--border-subtle);
        }

        .feed-card {
          opacity: 0;
          transform: translateY(12px);
          animation: feedFadeUp 0.35s ease forwards;
        }

        .feed-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md) !important;
        }

        .feed-card-action {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .feed-card-action:hover {
          color: var(--green);
        }

        .feed-category-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0 0 12px;
          margin-bottom: 4px;
        }

        .feed-category-strip::-webkit-scrollbar {
          display: none;
        }

        .feed-category-pill {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 6px 14px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .feed-category-pill.active {
          background: var(--green);
          color: white;
          border-color: var(--green);
        }

        .skeleton-card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: grid;
          gap: 12px;
          animation: shimmerFade 0.8s ease forwards;
        }

        .skeleton-line {
          background: linear-gradient(90deg, var(--surface-base) 0%, var(--surface-elevated) 50%, var(--surface-base) 100%);
          background-size: 200% 100%;
          border-radius: 8px;
          animation: shimmer 1.2s infinite;
        }

        .feed-notice,
        .feed-empty-state {
          border: 1px solid var(--border-subtle);
          background: var(--surface-card);
          color: var(--text-secondary);
          border-radius: 14px;
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }

        .feed-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .feed-notice button,
        .feed-empty-actions button {
          border: 1px solid var(--green);
          background: transparent;
          color: var(--green);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .feed-empty-state {
          min-height: 320px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          text-align: center;
        }

        .feed-empty-title {
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 800;
        }

        .feed-empty-copy {
          max-width: 340px;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .feed-empty-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 8px;
        }

        .feed-empty-actions button:first-child {
          background: var(--green);
          color: white;
        }

        @keyframes newsFeedSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes feedFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes shimmerFade {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        @media (max-width: 1180px) {
          .news-feed-shell {
            grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
          }

          .news-feed-right {
            display: none;
          }
        }

        @media (max-width: 820px) {
          .news-feed-page {
            padding: 16px !important;
          }

          .news-feed-shell {
            grid-template-columns: 1fr;
          }

          .news-feed-left,
          .news-feed-right {
            position: static !important;
          }

          .news-feed-left > div {
            grid-template-columns: 1fr;
          }

          .news-feed-topbar {
            position: relative !important;
            top: unset !important;
          }

        }

        @media (max-width: 520px) {
          .feed-card {
            padding: 16px;
          }

          .feed-notice {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

const statItemStyle = {
  background: "var(--surface-elevated)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: 14,
};
