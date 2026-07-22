import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, notifApi, categoriesApi } from "../services/api";
import TodayHighlight from "../components/TodayHighlight";
import EconomicPulse from "../components/EconomicPulse";
import ActivityFeed from "../components/ActivityFeed";
import GhanaRegionMap from "../components/GhanaRegionMap";
import SinceLastVisit from "../components/SinceLastVisit";
import EconomicCalendar from "../components/EconomicCalendar";
import PersonalisedRecs from "../components/PersonalisedRecs";
import ComparisonEngine from "../components/ComparisonEngine";
import KwekuOnboarding from "../components/KwekuOnboarding";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
} from "recharts";
import {
  Database,
  Users,
  Building2,
  HardDrive,
  TrendingUp,
  Heart,
  Leaf,
  Scale,
  Wind,
  GraduationCap,
  BarChart3,
  SlidersHorizontal,
  Eye,
  Download,
  ArrowRight,
  Map,
  FileText
} from "lucide-react";

import useCountUp from "../hooks/useCountUp";

// Format functions
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function clampTitle(s, max = 42) {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function greetingForHour(hour) {
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}

// Category mappings
const CATEGORY_MAP = {
  "Economy": { bg: "#EFF6FF", icon: TrendingUp, color: "#3B82F6" },
  "Health": { bg: "#FEF2F2", icon: Heart, color: "#EF4444" },
  "Agriculture": { bg: "#F0FDF4", icon: Leaf, color: "#22C55E" },
  "Demographics": { bg: "#FFF7ED", icon: Users, color: "#F97316" },
  "Governance": { bg: "#F5F3FF", icon: Scale, color: "#8B5CF6" },
  "Environment": { bg: "#ECFDF5", icon: Wind, color: "#10B981" },
  "Education": { bg: "#FFFBEB", icon: GraduationCap, color: "#F59E0B" },
  "Default": { bg: "var(--green-pale)", icon: BarChart3, color: "var(--green)" }
};

function getCategoryName(category) {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category.name || category.label || "";
}

function getCategoryStyles(category) {
  const name = getCategoryName(category);
  const match = Object.keys(CATEGORY_MAP).find(k => name.includes(k));
  return CATEGORY_MAP[match] || CATEGORY_MAP["Default"];
}

// File type mappings for gradients
function getFileTypeStyles(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("csv")) return { grad: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)", icon: Database };
  if (t.includes("json")) return { grad: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", icon: FileText };
  if (t.includes("excel") || t.includes("xls")) return { grad: "linear-gradient(135deg, #D97706 0%, #B45309 100%)", icon: BarChart3 };
  if (t.includes("pdf")) return { grad: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)", icon: FileText };
  return { grad: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)", icon: Database };
}

const CustomTooltip = ({ active, payload, label, chartColors }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: chartColors.tooltip.bg,
      border: `1px solid ${chartColors.tooltip.border}`,
      color: chartColors.tooltip.text,
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      fontSize: 12,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: chartColors.tooltip.text }}>{label}</p>
      <p style={{ color: 'var(--green)', margin: 0 }}>
        {payload[0].name}: <strong>{payload[0].value}</strong>
      </p>
    </div>
  );
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.getAttribute('data-theme') === 'dark'
      );
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = useDarkMode();

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Trending");
  const [activeCategory, setActiveCategory] = useState(null);
  const [period, setPeriod] = useState('month');

  const chartColors = {
    axis: isDark ? '#6B7280' : '#9CA3AF',
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltip: {
      bg: isDark ? '#1C2B21' : '#FFFFFF',
      border: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
      text: isDark ? '#F9FAFB' : '#111827',
    },
    line: '#00A35C',
    area: isDark ? 'rgba(0,163,92,0.15)' : 'rgba(0,107,63,0.1)',
    bar: '#00A35C',
  };

  useEffect(() => {
    Promise.all([
      dashboardApi.stats(),
      categoriesApi.list().catch(() => ({ data: [] }))
    ])
      .then(([statsRes, catRes]) => {
        setStats(statsRes.data);
        setCategories(catRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mostDownloaded = stats?.most_downloaded || [];
  const recentUploads = stats?.recent_uploads || [];
  const monthlyUploads = stats?.monthly_uploads || [];

  const filteredData = useMemo(() => {
    if (period === 'week') return monthlyUploads.slice(-4);
    if (period === 'year') {
      return monthlyUploads.reduce((acc, item) => {
        const year = item.month?.split('-')[0] || 'Unknown';
        const existing = acc.find(a => a.month === year);
        if (existing) existing.count += item.count;
        else acc.push({ month: year, count: item.count });
        return acc;
      }, []);
    }
    return monthlyUploads;
  }, [period, monthlyUploads]);

  const firstName = user?.full_name?.split(" ")?.[0] || "";
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const datasetCount = stats?.total_datasets ?? 0;
  const userCount = stats?.total_users ?? 0;
  const orgCount = stats?.total_organizations ?? 0;
  const storageBytes = stats?.total_storage_bytes ?? 0;

  const storageNumber = storageBytes / (1024 ** 3);

  const animateDatasets = useCountUp(datasetCount);
  const animateUsers = useCountUp(userCount);
  const animateOrgs = useCountUp(orgCount);
  const animateStorageGb = useCountUp(storageNumber);

  if (loading) {
    return (
      <div className="dashboard-v2 fade-in">
        <style>{dashboardStyles}</style>
        <div style={{ padding: "20px 28px" }}>
          <div className="dash-skeleton w-220 h-28 mb-4"></div>
          <div className="dash-skeleton w-160 h-20 mb-8"></div>
          <div className="dash-v2-grid-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="dash-skeleton w-full h-120 card-rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const TABS = ['Trending', 'New Uploads', 'Most Downloaded', 'Economy', 'Health'];

  // Pad categories to 8 minimum
  const displayCats = [...categories];
  while (displayCats.length < 8) {
    displayCats.push({ id: `skel-${displayCats.length}`, name: "More", isSkeleton: true });
  }

  // Pad most downloaded to 4 minimum
  const displayHeadlines = [...mostDownloaded];
  while (displayHeadlines.length < 4) {
    displayHeadlines.push({ id: `skel-${displayHeadlines.length}`, isSkeleton: true });
  }

  // Pad recent to 4 minimum
  const displayRecent = [...recentUploads];
  while (displayRecent.length < 4) {
    displayRecent.push({ id: `skel-${displayRecent.length}`, isSkeleton: true });
  }

  return (
    <div className="dashboard-v2 fade-in">
      <style>{dashboardStyles}</style>

      <div className="dash-v2-layout">
        <div className="dash-v2-main">

          {/* TODAY'S DATA HIGHLIGHT HERO */}
          <TodayHighlight />

          {/* SECTION 1 - GREETING BAND */}
          <section className="dash-v2-greet-band">
            <div className="greet-left">
              <div className="greet-time">{greeting}</div>
              <div className="greet-name">{firstName}</div>
              <div className="greet-sub">See what is happening in Ghana data today</div>
            </div>
            <div className="greet-right">
              <div className="dash-v2-tabs">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    className={`dash-v2-tab ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="greet-avatar">{initials}</div>
            </div>
          </section>

          {/* SINCE LAST VISIT PANEL */}
          <SinceLastVisit />

          {/* SECTION 2 - CATEGORY ICON STRIP */}
          {/*<section className="dash-v2-cat-strip">
            <div className="cat-strip-head">
              <div className="cat-strip-title">Topic Categories</div>
              <button className="cat-strip-link" onClick={() => navigate("/catalogue")}>View all</button>
            </div>
            <div className="cat-strip-scroll">
              {displayCats.map(cat => {
                const style = getCategoryStyles(cat.name);
                const Icon = style.icon;
                const isActive = activeCategory === cat.name || activeTab === cat.name;

                return (
                  <button
                    key={cat.id}
                    className={`cat-chip-wrap ${isActive ? "active" : ""}`}
                    onClick={() => !cat.isSkeleton && setActiveCategory(cat.name)}
                    disabled={cat.isSkeleton}
                  >
                    <div
                      className="cat-chip-icon-box"
                      style={{
                        background: style.bg,
                        color: isActive ? "var(--green)" : style.color,
                        borderColor: isActive ? "var(--green)" : "transparent"
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div className="cat-chip-label">{cat.name}</div>
                  </button>
                );
              })}
            </div>
          </section>*/}

          {/* ECONOMIC PULSE STRIP */}
          <EconomicPulse />

          {/* SECTION 3 - STAT CARDS ROW */}
          <section className="dash-v2-section">
            <div className="dash-v2-grid-4">
              <div className="dash-v2-stat-card">
                <div className="stat-icon-box" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                  <Database size={20} />
                </div>
                <div className="stat-value">{Math.round(animateDatasets).toLocaleString()}</div>
                <ComparisonEngine indicator="gdp" value={65} />
                {datasetCount > 0 && <div style={{ background: 'var(--green-pale, #DCFCE7)', color: 'var(--green)', fontSize: '11px', borderRadius: '99px', padding: '2px 8px', marginTop: '6px', display: 'inline-block' }}>+{datasetCount} total</div>}
                <div className="stat-label">Total Datasets</div>
              </div>
              <div className="dash-v2-stat-card">
                <div className="stat-icon-box" style={{ background: "#F5F3FF", color: "#8B5CF6" }}>
                  <Users size={20} />
                </div>
                <div className="stat-value">{Math.round(animateUsers).toLocaleString()}</div>
                {userCount > 0 && <div style={{ background: 'var(--green-pale, #DCFCE7)', color: 'var(--green)', fontSize: '11px', borderRadius: '99px', padding: '2px 8px', marginTop: '6px', display: 'inline-block' }}>{userCount} registered</div>}
                <div className="stat-label">Total Users</div>
              </div>
              <div className="dash-v2-stat-card">
                <div className="stat-icon-box" style={{ background: "#FFF7ED", color: "#F97316" }}>
                  <Building2 size={20} />
                </div>
                <div className="stat-value">{Math.round(animateOrgs).toLocaleString()}</div>
                {orgCount > 0 && <div style={{ background: 'var(--green-pale, #DCFCE7)', color: 'var(--green)', fontSize: '11px', borderRadius: '99px', padding: '2px 8px', marginTop: '6px', display: 'inline-block' }}>{orgCount} orgs</div>}
                <div className="stat-label">Organizations</div>
              </div>
              <div className="dash-v2-stat-card">
                <div className="stat-icon-box" style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <HardDrive size={20} />
                </div>
                <div className="stat-value">{animateStorageGb.toFixed(1)} GB</div>
                <div style={{ background: 'var(--green-pale, #DCFCE7)', color: 'var(--green)', fontSize: '11px', borderRadius: '99px', padding: '2px 8px', margin: '6px auto 0 0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <HardDrive size={10} /> {formatBytes(storageBytes)}
                </div>
                <div className="stat-label">Storage Used</div>
              </div>
            </div>
          </section>

          {/* PERSONALISED RECOMMENDATIONS */}
          <PersonalisedRecs
            recentUploads={stats?.recent_uploads}
            mostDownloaded={stats?.most_downloaded}
          />

          {/* SECTION 4 - TODAY HEADLINES */}
          <section className="dash-v2-section">
            <div className="section-head">
              <div className="section-title">Today on GhanaDataHub</div>
              <div className="section-filters">
                Filters <SlidersHorizontal size={14} />
              </div>
            </div>
            <div className="dash-v2-grid-4">
              {displayHeadlines.slice(0, 4).map(d => {
                if (d.isSkeleton) {
                  return (
                    <div key={d.id} className="headline-card skel">
                      <div className="headline-thumb dash-skeleton" />
                      <div className="dash-skeleton h-4 w-40 mt-2" />
                      <div className="dash-skeleton h-4 w-full mt-2" />
                    </div>
                  );
                }

                const fileStyle = getFileTypeStyles(d.file_type);
                const FileIcon = fileStyle.icon;
                const catStyle = getCategoryStyles(d.category);
                const categoryName = getCategoryName(d.category);
                const downloadCount = Number(d.download_count || 0);

                return (
                  <div key={d.id} className="headline-card" onClick={() => navigate(`/datasets/${d.id}`)}>
                    <div className="headline-thumb" style={{ background: fileStyle.grad }}>
                      <FileIcon size={24} color="#fff" />
                    </div>
                    {categoryName && (
                      <div className="headline-badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                        {categoryName}
                      </div>
                    )}
                    <div className="headline-title">{clampTitle(d.title, 60)}</div>
                    <div className="headline-stats">
                      <span><Eye size={12} /> {(downloadCount * 3).toLocaleString()}</span>
                      <span><Download size={12} /> {downloadCount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 5 - LATEST UPLOADS ROW */}
          <section className="dash-v2-section">
            <div className="section-head">
              <div className="section-title">Latest Datasets</div>
              <div className="section-filters">
                Filters <SlidersHorizontal size={14} />
              </div>
            </div>
            <div className="dash-v2-grid-4">
              {displayRecent.slice(0, 4).map(d => {
                if (d.isSkeleton) {
                  return (
                    <div key={d.id} className="latest-card skel">
                      <div className="latest-img dash-skeleton" />
                      <div className="latest-body">
                        <div className="dash-skeleton h-4 w-full" />
                        <div className="dash-skeleton h-4 w-60 mt-2" />
                      </div>
                    </div>
                  );
                }

                const fileStyle = getFileTypeStyles(d.file_type);
                const FileIcon = fileStyle.icon;

                return (
                  <div key={d.id} className="latest-card">
                    <div className="latest-img" style={{ background: fileStyle.grad }}>
                      <FileIcon size={42} color="rgba(255,255,255,0.9)" />
                      <button className="read-more-btn" onClick={() => navigate(`/datasets/${d.id}`)}>
                        Read more <ArrowRight size={12} />
                      </button>
                    </div>
                    <div className="latest-body">
                      <div className="latest-title">{clampTitle(d.title, 60)}</div>
                      <div className="latest-owner">
                        <div className="latest-avatar">{d.owner?.full_name?.[0]?.toUpperCase() || "U"}</div>
                        <span>{d.owner?.full_name || "Unknown"}</span>
                        <span className="dot">•</span>
                        <span>{timeAgo(d.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="dashboard-region-section">
            <div className="dashboard-region-header">
              <div>
                <div className="dashboard-region-title">
                  <Map size={16} color="var(--green)" />
                  <span>Regional Ghana Data</span>
                </div>
                <div className="dashboard-region-subtitle">
                  Electricity access across Ghana's 16 administrative regions
                </div>
              </div>
              <a href="/catalogue" className="dashboard-region-link">
                Browse regional datasets
              </a>
            </div>
            <div className="dashboard-region-card">
              <GhanaRegionMap
                rows={[
                  ["Region", "Electricity Access (%)"],
                  ["Greater Accra", 97], ["Ashanti", 88], ["Western", 82],
                  ["Western North", 71], ["Central", 79], ["Eastern", 77],
                  ["Volta", 68], ["Oti", 52], ["Bono", 74], ["Bono East", 69],
                  ["Ahafo", 72], ["Northern", 61], ["Savannah", 47],
                  ["North East", 53], ["Upper East", 58], ["Upper West", 55],
                ]}
                datasetTitle="Ghana Electricity Access by Region"
                datasetId=""
                height={360}
                compact
              />
              <div className="dashboard-region-note">
                Sample data: Electricity access by region. Source: Ghana Energy Commission.
                <a href="/datasets?search=electricity">
                  Find related datasets
                </a>
              </div>
            </div>
          </section>

          {/* SECTION 6 - MONTHLY UPLOADS CHART */}
          <section className="dash-v2-section pb-24">
            <div className="chart-card">
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {['week', 'month', 'year'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    style={{
                      background: period === p ? 'var(--green)' : 'transparent',
                      color: period === p ? '#fff' : 'var(--gray-500)',
                      borderRadius: '10px',
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="chart-head">
                <div className="chart-title">Upload Activity</div>
                <div className="chart-sub">Dataset activity over the last year</div>
              </div>
              {monthlyUploads.length === 0 ? (
                <div className="dash-empty" style={{ textAlign: "center", padding: "40px", color: "var(--gray-500)" }}>No monthly upload data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id='uploadGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor={chartColors.line} stopOpacity={isDark ? 0.28 : 0.3} />
                        <stop offset='95%' stopColor={chartColors.line} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={chartColors.grid} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartColors.axis }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip chartColors={chartColors} />} cursor={{ fill: chartColors.area }} />
                    <Area type="monotone" dataKey="count" fill="url(#uploadGradient)" stroke={chartColors.line} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: chartColors.line }} isAnimationActive={true} animationDuration={1000} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

        </div> {/* end dash-v2-main */}

        <aside className="dash-v2-sidebar">
          <ActivityFeed />
          <EconomicCalendar />
        </aside>
      </div> {/* end dash-v2-layout */}

      <KwekuOnboarding />
    </div>
  );
}

const dashboardStyles = `
  .dashboard-v2 {
    background: var(--surface-base);
    min-height: 100vh;
    padding-bottom: 40px;
  }

  /* SECTION 1 */
  .dash-v2-greet-band {
    background: var(--surface-card);
    border-bottom: 1px solid var(--border-default);
    padding: 20px 28px;
    margin-bottom: 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .greet-left {
    display: flex;
    flex-direction: column;
  }
  .greet-time {
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 500;
  }
  .greet-name {
    font-size: 28px;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    color: var(--gray-900);
    line-height: 1.2;
    margin: 2px 0;
  }
  .greet-sub {
    font-size: 13px;
    color: var(--gray-500);
  }
  .greet-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .dash-v2-tabs {
    display: flex;
    gap: 4px;
    background: var(--surface-base);
    padding: 4px;
    border-radius: 99px;
  }
  .dash-v2-tab {
    background: transparent;
    border: none;
    color: var(--gray-500);
    font-size: 13px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .dash-v2-tab:hover {
    color: var(--gray-900);
  }
  .dash-v2-tab.active {
    background: var(--green);
    color: #fff;
  }
  .greet-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--green);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  /* SECTION 2 */
  .dash-v2-cat-strip {
    background: var(--surface-card);
    border-bottom: 1px solid var(--border-default);
    padding: 16px 28px;
  }
  .cat-strip-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .cat-strip-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-900);
  }
  .cat-strip-link {
    background: none;
    border: none;
    color: var(--green);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .cat-strip-link:hover {
    text-decoration: underline;
  }
  .cat-strip-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .cat-strip-scroll::-webkit-scrollbar {
    display: none;
  }
  .cat-chip-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .cat-chip-wrap:hover {
    transform: scale(1.05);
  }
  .cat-chip-wrap:disabled {
    opacity: 0.5;
    cursor: default;
    transform: none;
  }
  .cat-chip-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }
  .cat-chip-label {
    font-size: 11px;
    color: var(--gray-900);
    font-weight: 500;
    text-align: center;
  }

  /* LAYOUT UTILS */
  .dash-v2-section {
    padding: 20px 28px 0;
  }
  .pb-24 {
    padding-bottom: 24px;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
  }
  .section-filters {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--gray-500);
    font-weight: 500;
    cursor: pointer;
  }
  .dash-v2-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  /* SECTION 3 - STATS */
  .dash-v2-stat-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .stat-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--green);
    font-family: 'Sora', sans-serif;
    line-height: 1.2;
  }
  .stat-label {
    font-size: 12px;
    color: var(--gray-500);
    font-weight: 500;
  }

  /* SECTION 4 - HEADLINES */
  .headline-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
  }
  .headline-card:hover:not(.skel) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  }
  .headline-thumb {
    width: 100%;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .headline-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 6px;
    align-self: flex-start;
  }
  .headline-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--gray-900);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
    flex-grow: 1;
  }
  .headline-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: var(--gray-500);
    font-weight: 500;
  }
  .headline-stats span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* SECTION 5 - LATEST UPLOADS */
  .latest-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: transform 0.2s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .latest-card:hover:not(.skel) {
    transform: translateY(-3px);
  }
  .latest-img {
    width: 100%;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .read-more-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: var(--surface-card);
    border: none;
    border-radius: 99px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .latest-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  .latest-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--gray-900);
  }
  .latest-owner {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--gray-500);
    font-weight: 500;
    margin-top: auto;
  }
  .latest-avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--green-pale);
    color: var(--green);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
  }
  .latest-owner .dot {
    opacity: 0.5;
  }

  /* DASHBOARD REGIONAL MAP */
  .dashboard-region-section {
    margin-bottom: 24px;
    padding: 20px 28px 0;
  }
  .dashboard-region-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }
  .dashboard-region-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 800;
  }
  .dashboard-region-subtitle {
    margin-top: 3px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
  .dashboard-region-link {
    color: var(--green);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  .dashboard-region-link:hover {
    text-decoration: underline;
  }
  .dashboard-region-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .dashboard-region-note {
    padding: 10px 16px;
    border-top: 1px solid var(--border-subtle);
    color: var(--text-muted);
    font-size: 11px;
    line-height: 1.5;
  }
  .dashboard-region-note a {
    color: var(--green);
    font-weight: 700;
    margin-left: 6px;
    text-decoration: none;
  }
  .dashboard-region-note a:hover {
    text-decoration: underline;
  }

  /* SECTION 6 - CHART */
  .chart-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .chart-head {
    margin-bottom: 16px;
  }
  .chart-title {
    font-size: 15px;
    font-weight: 700;
    font-family: 'Sora', sans-serif;
  }
  .chart-sub {
    font-size: 12px;
    color: var(--gray-500);
    margin-top: 2px;
  }

  /* SKELETONS */
  .dash-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: dash-shimmer 1.5s infinite;
    border-radius: 4px;
  }
  @keyframes dash-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .w-220 { width: 220px; }
  .w-160 { width: 160px; }
  .w-100 { width: 100%; }
  .h-28 { height: 28px; }
  .h-20 { height: 20px; }
  .h-120 { height: 120px; }
  .h-4 { height: 16px; }
  .w-40 { width: 40%; }
  .w-60 { width: 60%; }
  .w-full { width: 100%; }
  .mt-2 { margin-top: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-8 { margin-bottom: 32px; }
  .card-rounded { border-radius: 14px; }
  
  @media (max-width: 768px) {
    .dash-v2-grid-4 {
      grid-template-columns: 1fr;
    }
    .dash-v2-greet-band {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .greet-right {
      width: 100%;
      justify-content: space-between;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .dashboard-region-section {
      padding: 20px 16px 0;
    }
    .dashboard-region-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    .dashboard-region-link {
      align-self: flex-start;
    }
  }
`;
