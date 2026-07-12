import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Database,
  RefreshCw,
  Newspaper,
  FileSpreadsheet,
  Braces,
  FileText,
  Table,
  Image,
  File,
  Download,
  Eye,
  Share2,
  Bookmark,
  Plus,
} from "lucide-react";
import { datasetsApi, categoriesApi, dashboardApi } from "../services/api";

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
  default: { bg: "var(--gray-100)", color: "var(--gray-500)", icon: File },
};

const AVATAR_COLORS = [
  "#D1FAE5",
  "#E0F2FE",
  "#FEF3C7",
  "#FEE2E2",
  "#E9D5FF",
  "#DCFCE7",
];

function formatTimeAgo(value) {
  const date = new Date(value);
  const now = new Date();
  const delta = Math.max(0, Math.floor((now - date) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  const days = Math.floor(delta / 86400);
  return days <= 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function getAvatarColor(name) {
  const hash = name
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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

function clampText(text, max) {
  return text?.length > max ? `${text.slice(0, max)}...` : text || "";
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
  const [filter, setFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [activeFeed, setActiveFeed] = useState({});
  const [subscribedCards, setSubscribedCards] = useState({});
  const [bookmarkedCards, setBookmarkedCards] = useState({});
  const [isSticky, setIsSticky] = useState(false);
  const topbarRef = useRef(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [datasetsRes, categoriesRes, statsRes] = await Promise.all([
          datasetsApi.list({ per_page: 20, sort_by: "created_at", sort_dir: "desc" }),
          categoriesApi.list(),
          dashboardApi.stats(),
        ]);
        setDatasets(datasetsRes.data?.items || datasetsRes.data || []);
        setCategories(categoriesRes.data || []);
        setDashboardStats(statsRes.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
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
      if (activeCategory && item.category?.id !== activeCategory) return false;
      if (filter === "new") {
        return new Date(item.created_at) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
      }
      if (filter === "updated") {
        return item.updated_at && item.updated_at !== item.created_at;
      }
      return true;
    });
    return sortItems(active, sortBy);
  }, [datasets, filter, activeCategory, sortBy]);

  const recentActivity = useMemo(() => datasets.slice(0, 5), [datasets]);
  const recentPosts = useMemo(() => datasets.slice(0, 6), [datasets]);

  const handleSubscribeToggle = (id) => {
    setSubscribedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBookmarkToggle = (id) => {
    setBookmarkedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearFilters = () => {
    setFilter("all");
    setActiveCategory(null);
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    try {
      const res = await datasetsApi.list({ per_page: 20, sort_by: "created_at", sort_dir: "desc", page: nextPage });
      const items = res.data?.items || res.data || [];
      setDatasets((prev) => [...prev, ...items]);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    }
  };

  const totalDownloads = dashboardStats?.total_downloads ?? datasets.reduce((acc, item) => acc + (item.download_count || 0), 0);

  const renderThumbnail = (fileType) => {
    const key = getFileTypeKey(fileType);
    const style = THUMBNAIL_STYLES[key] || THUMBNAIL_STYLES.default;
    const Icon = style.icon;
    return (
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 10,
          background: style.bg,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon size={24} color={style.color} />
      </div>
    );
  };

  return (
    <div className="news-feed-page" style={{ padding: 24, minHeight: "100vh", background: "var(--gray-100)" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gap: 20,
          gridTemplateColumns: "220px 1fr 280px",
        }}
      >
        <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div>
              <div style={{ marginBottom: 12, padding: 16, borderRadius: 14, background: "white", boxShadow: "var(--shadow-md)" }}>
                <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gray-500)", marginBottom: 10 }}>Feed Filters</div>
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
                          color: active ? "white" : "var(--gray-700)",
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
            <div style={{ background: "white", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gray-500)", marginBottom: 12 }}>Topics</div>
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
                        color: isActive ? "var(--green)" : "var(--gray-700)",
                        border: "1px solid var(--gray-200)",
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
            <div style={{ background: "white", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
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
                      border: "1px solid var(--gray-200)",
                      color: "var(--gray-700)",
                      background: "var(--gray-50)",
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

        <div>
          <div
            ref={topbarRef}
            style={{
              position: isSticky ? "sticky" : "relative",
              top: isSticky ? 80 : "unset",
              zIndex: 10,
              background: isSticky ? "rgba(255,255,255,0.85)" : "white",
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
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gray-900)" }}>Data Feed</div>
                <div style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 4 }}>Latest updates from GhanaDataHub</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 12, color: "var(--gray-600)" }}>Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    minWidth: 160,
                    borderRadius: 10,
                    border: "1px solid var(--gray-300)",
                    padding: "10px 12px",
                    background: "white",
                    color: "var(--gray-900)",
                  }}
                >
                  <option value="latest">Latest</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="discussed">Most Discussed</option>
                </select>
              </div>
            </div>
          </div>

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
              {filteredDatasets.map((item, index) => {
                const ownerName = item.owner?.full_name || "Unknown";
                const initials = ownerName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const thumbKey = getFileTypeKey(item.file_type);
                const thumbStyle = THUMBNAIL_STYLES[thumbKey] || THUMBNAIL_STYLES.default;
                const ThumbIcon = thumbStyle.icon;
                const subscribed = !!subscribedCards[item.id];
                const bookmarked = !!bookmarkedCards[item.id];

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="feed-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      onClick={(event) => {
                        if (event.target.closest(".feed-card-actions")) return;
                        navigate(`/datasets/${item.id}`);
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18, alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: getAvatarColor(ownerName), display: "grid", placeItems: "center", color: "var(--gray-900)", fontWeight: 700, fontSize: 12 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)" }}>{ownerName}</div>
                            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{item.category?.name || "Uncategorized"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{formatTimeAgo(item.created_at)}</div>
                          <button
                            type="button"
                            onClick={() => handleSubscribeToggle(item.id)}
                            className="subscribe-button"
                            style={{
                              height: 28,
                              padding: "0 14px",
                              borderRadius: 99,
                              border: "1px solid var(--green)",
                              background: subscribed ? "var(--green)" : "transparent",
                              color: subscribed ? "white" : "var(--green)",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            {subscribed ? "Subscribed" : "Subscribe"}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: item.file_type ? "1fr 120px" : "1fr", gap: 18, alignItems: "start" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
                          {item.description && (
                            <div style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.6 }}>{clampText(item.description, 80)}</div>
                          )}
                        </div>
                        {item.file_type && (
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>{renderThumbnail(item.file_type)}</div>
                        )}
                      </div>
                      {item.tags?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                          {item.tags.slice(0, 3).map((tag) => (
                            <span key={tag.id || tag} style={{ display: "inline-flex", alignItems: "center", fontSize: 11, color: "var(--green)", background: "var(--green-pale)", borderRadius: 99, padding: "2px 8px" }}>
                              {tag.name || tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="feed-card-actions" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--gray-100)", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, alignItems: "center" }}>
                      <button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/datasets/${item.id}`)} style={actionButtonStyle}>
                        <Download size={14} />
                        <span>{formatLargeNumber(item.download_count || 0)}</span>
                      </button>
                      <button type="button" style={actionButtonStyle}>
                        <Eye size={14} />
                        <span>{formatLargeNumber((item.download_count || 0) * 3)} views</span>
                      </button>
                      <button type="button" style={actionButtonStyle}>
                        <Share2 size={14} />
                        <span>Share</span>
                      </button>
                      <button type="button" onClick={() => handleBookmarkToggle(item.id)} style={actionButtonStyle}>
                        <Bookmark size={14} fill={bookmarked ? "currentColor" : "none"} />
                        <span>{bookmarked ? "Saved" : "Bookmark"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={loadMore}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--green)",
                  background: "transparent",
                  color: "var(--green)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Load more updates
              </button>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
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
                        border: "1px solid var(--gray-100)",
                        background: "var(--gray-50)",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 12, background: fileStyle.bg, display: "grid", placeItems: "center" }}>
                        <FileIcon size={18} color={fileStyle.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gray-900)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 4 }}>{item.category?.name || "Uncategorized"}</div>
                        <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 2 }}>{formatTimeAgo(item.created_at)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
              <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 700 }}>Platform Stats</div>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{dashboardStats?.total_datasets ?? 0}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Total Datasets</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{dashboardStats?.total_users ?? 0}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Total Users</div>
                </div>
                <div style={statItemStyle}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{formatLargeNumber(totalDownloads)}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Total Downloads</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .feed-card {
          background: white;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          padding: 20px;
          opacity: 0;
          transform: translateY(12px);
          animation: feedFadeUp 0.35s ease forwards;
        }

        .feed-card-actions button {
          border: none;
          background: transparent;
          color: var(--gray-500);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
        }

        .skeleton-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          display: grid;
          gap: 12px;
          animation: shimmerFade 0.8s ease forwards;
        }

        .skeleton-line {
          background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
          background-size: 200% 100%;
          border-radius: 8px;
          animation: shimmer 1.2s infinite;
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
      `}</style>
    </div>
  );
}

const actionButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  width: "100%",
  border: "none",
  background: "transparent",
  color: "var(--gray-500)",
  fontSize: 12,
  cursor: "pointer",
  justifyContent: "flex-start",
};

const statItemStyle = {
  background: "var(--gray-50)",
  borderRadius: 12,
  padding: 14,
};
