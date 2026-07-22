import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Bot,
  Clock,
  Layers,
  RefreshCw,
  Flame,
  Lightbulb,
  Sparkles,
  FileSpreadsheet,
  Braces,
  FileText,
  Table,
  Image,
  File,
  TrendingUp,
} from "lucide-react";
import { datasetsApi, categoriesApi, dashboardApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ObservanceBanner from "../components/ObservanceBanner";
import TodayHighlight from "../components/TodayHighlight";
import FeedCard from "../components/FeedCard";
import AdjoaEmptyState from "../components/AdjoaEmptyState";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const FILTERS = [
  { key: "all", label: "Today in Ghana", icon: Layers },
  { key: "new", label: "Fresh Signals", icon: Flame },
  { key: "updated", label: "Changed Indicators", icon: RefreshCw },
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

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function inferTopic(dataset) {
  const text = `${dataset?.title || ""} ${dataset?.description || ""} ${dataset?.category?.name || ""}`.toLowerCase();
  if (/inflation|gdp|forex|bank|stock|revenue|trade|econom/.test(text)) return "Economic";
  if (/cocoa|crop|food|agriculture|maize|cassava/.test(text)) return "Agriculture";
  if (/health|malaria|maternal|hospital|mortality|hiv/.test(text)) return "Health";
  if (/population|urban|census|demographic/.test(text)) return "Population";
  if (/electricity|energy|power|oil|gold/.test(text)) return "Infrastructure";
  if (/education|school|teacher|literacy/.test(text)) return "Education";
  return dataset?.category?.name || "Data";
}

function buildPulseIndicators(datasets, dashboardStats) {
  const totalDownloads = dashboardStats?.total_downloads ?? datasets.reduce((acc, item) => acc + (item.download_count || 0), 0);
  const topicCounts = datasets.reduce((acc, dataset) => {
    const topic = inferTopic(dataset);
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});

  return [
    { label: "GDP", value: topicCounts.Economic ? "Updated" : "Watch", trend: topicCounts.Economic ? "Live economic data" : "No new signal", colour: "#1D4ED8" },
    { label: "Inflation", value: datasets.some((d) => /inflation|cpi/i.test(`${d.title} ${d.description}`)) ? "Changed" : "Stable", trend: "Household pressure", colour: "#DC2626" },
    { label: "Cocoa", value: datasets.some((d) => /cocoa/i.test(`${d.title} ${d.description}`)) ? "New" : "Watch", trend: "Export signal", colour: "#059669" },
    { label: "Health", value: topicCounts.Health || 0, trend: "health signals", colour: "#EF4444" },
    { label: "Population", value: topicCounts.Population || 0, trend: "demographic signals", colour: "#7C3AED" },
    { label: "Downloads", value: formatLargeNumber(totalDownloads), trend: "platform demand", colour: "#D97706" },
  ];
}

function getAdjoaDiscovery(datasets) {
  const hasInflation = datasets.some((d) => /inflation|cpi|price/i.test(`${d.title} ${d.description}`));
  const hasCocoa = datasets.some((d) => /cocoa|agriculture|food/i.test(`${d.title} ${d.description}`));
  const hasRegional = datasets.some((d) => /region|district|area|zone/i.test(`${d.title} ${d.description}`));
  const hasHealth = datasets.some((d) => /health|malaria|hospital|mortality/i.test(`${d.title} ${d.description}`));

  if (hasInflation && hasCocoa) {
    return "Adjoa noticed food and inflation signals appearing together. Compare cocoa, food prices, and CPI before drawing conclusions.";
  }
  if (hasRegional) {
    return "Adjoa found regional signals in today's data. A Ghana map may reveal which regions deserve attention first.";
  }
  if (hasHealth) {
    return "Adjoa found health-related updates. Look for regional gaps, service access patterns, and prevention indicators.";
  }
  return "Adjoa is watching for hidden connections across economy, health, agriculture, population and infrastructure data.";
}

export default function NewsFeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setLoadError("Unable to load Ghana Pulse. Please try again.");
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
      setLoadError("Unable to load more pulse items.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const totalDownloads = dashboardStats?.total_downloads ?? datasets.reduce((acc, item) => acc + (item.download_count || 0), 0);
  const pulseIndicators = useMemo(() => buildPulseIndicators(datasets, dashboardStats), [datasets, dashboardStats]);
  const todayCount = datasets.filter((item) => new Date(item.created_at).toDateString() === now.toDateString()).length;
  const aiDiscoveryCount = datasets.filter((item) => item.analysis_data?.ai_summary).length;
  const changedCount = datasets.filter(isUpdatedDataset).length;
  const adjoaDiscovery = getAdjoaDiscovery(datasets);
  const firstName = user?.full_name?.split(" ")?.[0] || user?.username || "there";

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
                <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Pulse Filters</div>
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
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Follow Topics</div>
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>Timeline</div>
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
                    {inferTopic(item)} · {formatTimeAgoFrom(item.created_at, now)}
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 999, background: "var(--green-pale)", color: "var(--green)", fontSize: 11, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
                  <Activity size={13} /> Ghana Pulse
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  {getGreeting(now)}, {firstName}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.6 }}>
                  Kweku found <strong style={{ color: "var(--green)" }}>{todayCount || datasets.length}</strong> current Ghana data signal{(todayCount || datasets.length) === 1 ? "" : "s"}.
                  {" "}Adjoa discovered <strong style={{ color: "var(--green)" }}>{aiDiscoveryCount || changedCount || 1}</strong> trend{(aiDiscoveryCount || changedCount || 1) === 1 ? "" : "s"} worth watching.
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
                  <option value="latest">Latest Signals</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="discussed">Highest Attention</option>
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
              <section className="pulse-briefing-card">
                <div className="pulse-briefing-main">
                  <div className="pulse-briefing-kicker">
                    <Sparkles size={14} /> Today's Ghana Briefing
                  </div>
                  <h1>What changed in Ghana data today?</h1>
                  <p>
                    Kweku is tracking new economic, regional, health, agriculture and public data signals.
                    This pulse refreshes automatically from GhanaDataHub datasets and analysis.
                  </p>
                  <div className="pulse-briefing-stats">
                    <span>{datasets.length} live updates</span>
                    <span>{aiDiscoveryCount} AI discoveries</span>
                    <span>{changedCount} changed indicators</span>
                  </div>
                </div>
                <div className="pulse-adjoa-card">
                  <div className="pulse-adjoa-icon">
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <strong>Adjoa's Discovery</strong>
                    <p>{adjoaDiscovery}</p>
                  </div>
                </div>
              </section>

              <div className="pulse-indicator-strip" aria-label="Live Ghana indicators">
                {pulseIndicators.map((indicator) => (
                  <div className="pulse-indicator" key={indicator.label} style={{ borderTopColor: indicator.colour }}>
                    <span>{indicator.label}</span>
                    <strong style={{ color: indicator.colour }}>{indicator.value}</strong>
                    <small>{indicator.trend}</small>
                  </div>
                ))}
              </div>

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
                  {isLoadingMore ? "Loading..." : hasMore ? "Load more pulse items" : "You're all caught up"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="news-feed-right" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Most Important</div>
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{inferTopic(item)} signal worth watching</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{item.category?.name || "Uncategorized"} · {item.download_count || 0} downloads</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatTimeAgoFrom(item.created_at, now)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 700 }}>Pulse Summary</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={statItemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 700, color: "var(--green)" }}><Clock size={20} /> {todayCount}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Signals today</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 700, color: "var(--green)" }}><Bot size={20} /> {aiDiscoveryCount}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>AI-ready updates</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 700, color: "var(--green)" }}><TrendingUp size={20} /> {formatLargeNumber(totalDownloads)}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Evidence downloads</div>
                </div>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, var(--green), #004D2C)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 18, color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <BadgeCheck size={18} />
                <strong>Morning Briefing</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
                Ghana Pulse watches datasets, indicators and AI summaries so you can focus on the updates that may affect policy, business, research and households.
              </p>
              <button
                type="button"
                onClick={() => navigate("/insights")}
                style={{ marginTop: 14, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.12)", color: "white", fontWeight: 800, padding: "0 12px", cursor: "pointer" }}
              >
                Open Insights
              </button>
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

        .pulse-briefing-card {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(240px, 0.75fr);
          gap: 14px;
          padding: 20px;
          border-radius: 18px;
          border: 1px solid rgba(0,163,92,0.18);
          background:
            radial-gradient(circle at top left, rgba(0,163,92,0.12), transparent 34%),
            var(--surface-card);
          box-shadow: var(--shadow-md);
        }

        .pulse-briefing-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .pulse-briefing-main h1 {
          margin: 0;
          color: var(--text-primary);
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .pulse-briefing-main p {
          margin: 12px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.7;
          max-width: 620px;
        }

        .pulse-briefing-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .pulse-briefing-stats span {
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 800;
          padding: 6px 10px;
        }

        .pulse-adjoa-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-radius: 16px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-elevated);
          padding: 16px;
        }

        .pulse-adjoa-icon {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: rgba(252,209,22,0.18);
          color: #D97706;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .pulse-adjoa-card strong {
          display: block;
          color: var(--text-primary);
          font-size: 13px;
          margin-bottom: 5px;
        }

        .pulse-adjoa-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.6;
        }

        .pulse-indicator-strip {
          display: grid;
          grid-template-columns: repeat(6, minmax(120px, 1fr));
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .pulse-indicator-strip::-webkit-scrollbar {
          display: none;
        }

        .pulse-indicator {
          min-width: 120px;
          border-top: 3px solid var(--green);
          border-radius: 14px;
          border-left: 1px solid var(--border-subtle);
          border-right: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          background: var(--surface-card);
          box-shadow: var(--shadow-sm);
          padding: 12px;
        }

        .pulse-indicator span,
        .pulse-indicator small {
          display: block;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .pulse-indicator strong {
          display: block;
          margin: 6px 0 3px;
          font-size: 18px;
          font-weight: 900;
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

          .pulse-briefing-card {
            grid-template-columns: 1fr;
          }

          .pulse-indicator-strip {
            grid-template-columns: repeat(6, 140px);
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
