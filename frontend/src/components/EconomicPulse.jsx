import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import api from "../services/api";
import ComparisonEngine from "./ComparisonEngine";

const REFRESH_MS = 60 * 1000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeAgo(iso, now = new Date()) {
  if (!iso) return "—";
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function pctFromText(title) {
  if (!title) return null;
  const m = title.match(/([\d]+\.?\d*)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

/** Stable pseudo-random sparkline heights seeded on download_count */
function sparklineValues(seed = 1, count = 6) {
  let s = Math.abs(seed) || 42;
  return Array.from({ length: count }, () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return 5 + ((s >>> 0) % 16); // values 5–20
  });
}

/** Inflation colour: green <10, amber 10-20, red >20 */
function inflationColour(pct) {
  if (pct === null || pct === undefined) return "var(--gray-500)";
  if (pct < 10) return "#22C55E";
  if (pct <= 20) return "#F59E0B";
  return "#EF4444";
}

function Sparkline({ seed, colour = "var(--green)" }) {
  const vals = sparklineValues(seed);
  return (
    <svg width="40" height="20" aria-hidden="true">
      {vals.map((v, i) => (
        <rect
          key={i}
          x={i * 7}
          y={20 - v}
          width={5}
          height={v}
          fill={colour}
          opacity={0.3 + (i / vals.length) * 0.7}
          rx="1"
        />
      ))}
    </svg>
  );
}

function LiveBadge({ live, refreshing }) {
  return (
    <span className="ep-badge" data-live={live ? "true" : "false"}>
      {live ? (
        <>
          <span className="ep-pulse-dot" />
          {refreshing ? "SYNC" : "LIVE"}
        </>
      ) : (
        "STATIC"
      )}
    </span>
  );
}

function TrendIcon({ direction }) {
  if (direction === "up") return <TrendingUp size={16} color="#22C55E" />;
  if (direction === "down") return <TrendingDown size={16} color="#EF4444" />;
  return <Minus size={16} color="#9CA3AF" />;
}

function SkeletonCard() {
  return (
    <div className="ep-card ep-skeleton-card">
      <div className="ep-sk ep-sk-sm" />
      <div className="ep-sk ep-sk-lg" />
      <div className="ep-sk ep-sk-sm" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function EconomicPulse() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pulseItems, setPulseItems] = useState([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const refreshPulse = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get("/dashboard/economic-pulse");
      setPulseItems(data?.items || []);
      setLastRefreshedAt(data?.refreshed_at || new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error("Unable to refresh economic pulse", err);
      setError("Live pulse temporarily unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setNow(new Date());
    }
  }, []);

  useEffect(() => {
    refreshPulse();
    const intervalId = window.setInterval(() => refreshPulse({ silent: true }), REFRESH_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshPulse({ silent: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshPulse]);

  useEffect(() => {
    const tickId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(tickId);
  }, []);

  const fallbackCards = useMemo(() => [
    {
      key:       "cedi",
      title:     "USD / GHS",
      value:     "11.46",
      unit:      "",
      direction: "stable",
      live:      false,
      updatedAt: null,
      seed:      89,
      sparkColour: "var(--green)",
      onClick:   () => navigate("/datasets?search=forex"),
      valueColour: "var(--dark, #111827)",
      indicator: "cedi",
      compValue: 11.46,
    },
    {
      key:       "inflation",
      title:     "Inflation Rate",
      value:     "5.30%",
      unit:      "",
      direction: "down",
      live:      false,
      updatedAt: null,
      seed:      60,
      sparkColour: "#22C55E",
      onClick:   () => navigate("/datasets?search=inflation"),
      valueColour: "#22C55E",
      indicator: "inflation",
      compValue: 5.3,
    },
    {
      key:       "cocoa",
      title:     "Cocoa (USD/MT)",
      value:     "$6,455",
      unit:      "",
      direction: "up",
      live:      false,
      updatedAt: null,
      seed:      67,
      sparkColour: "#D97706",
      onClick:   () => navigate("/datasets?search=cocoa"),
      valueColour: "var(--dark, #111827)",
      indicator: "cocoa",
      compValue: 6455,
    },
    {
      key:       "gse",
      title:     "GSE Index",
      value:     "14,780",
      unit:      "",
      direction: "up",
      live:      false,
      updatedAt: null,
      seed:      149,
      sparkColour: "#3B82F6",
      onClick:   () => navigate("/datasets?search=gse"),
      valueColour: "var(--dark, #111827)",
      indicator: "gse",
      compValue: 25,
    },
    {
      key:       "platform",
      title:     "Datasets",
      value:     "—",
      unit:      "",
      direction: "up",
      live:      true,
      updatedAt: null, // "Updated live"
      seed:      104,
      sparkColour: "var(--green)",
      onClick:   () => navigate("/datasets"),
      valueColour: "var(--green, #006B3F)",
    },
  ], [navigate]);

  const cards = useMemo(() => {
    if (!pulseItems.length) return fallbackCards;

    return pulseItems.map((item) => {
      const numericValue = pctFromText(item.value) ?? Number(item.comp_value);
      const valueColour =
        item.key === "inflation"
          ? inflationColour(numericValue)
          : item.key === "platform"
            ? "var(--green, #006B3F)"
            : "var(--dark, #111827)";

      const sparkColour =
        item.key === "inflation"
          ? inflationColour(numericValue)
          : item.key === "cocoa"
            ? "#D97706"
            : item.key === "gse"
              ? "#3B82F6"
              : "var(--green)";

      return {
        key: item.key,
        title: item.title,
        value: item.value || "—",
        direction: item.direction || "stable",
        live: item.live,
        updatedAt: item.updated_at,
        seed: (item.download_count ?? 99) + item.key.length,
        sparkColour,
        valueColour,
        indicator: item.indicator,
        compValue: item.comp_value,
        onClick: () => item.dataset_id
          ? navigate(`/datasets/${item.dataset_id}`)
          : navigate(item.key === "platform" ? "/datasets" : `/datasets?search=${item.key}`),
      };
    });
  }, [fallbackCards, navigate, pulseItems]);

  return (
    <section className="ep-section">
      <style>{pulseStyles}</style>

      {/* Section header */}
      <div className="ep-header">
        <span className="ep-header-title">Live Economic Pulse</span>
        <span className="ep-header-sub">
          {error || `Auto-refreshes every ${REFRESH_MS / 1000}s`}
          {lastRefreshedAt ? ` · Synced ${timeAgo(lastRefreshedAt, now)}` : ""}
        </span>
      </div>

      {/* Card strip */}
      <div className="ep-strip">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map((c) => (
              <button
                key={c.key}
                className="ep-card"
                onClick={c.onClick}
                type="button"
                aria-label={`${c.title}: ${c.value}`}
              >
                {/* Row 1: title + badge */}
                <div className="ep-row">
                  <span className="ep-indicator-title">{c.title}</span>
                  <LiveBadge live={c.live} refreshing={refreshing} />
                </div>

                {/* Row 2: value + trend */}
                <div className="ep-row ep-row-value">
                  <span className="ep-value" style={{ color: c.valueColour }}>
                    {c.value}
                  </span>
                  <TrendIcon direction={c.direction} />
                </div>
                {c.indicator && c.compValue !== null && c.compValue !== undefined && (
                  <ComparisonEngine indicator={c.indicator} value={Number(c.compValue)} />
                )}

                {/* Row 3: updated + sparkline */}
                <div className="ep-row ep-row-bottom">
                  <span className="ep-updated">
                    {c.updatedAt
                      ? `Updated ${timeAgo(c.updatedAt)}`
                      : refreshing
                      ? "Syncing now"
                      : c.live
                      ? "Updated live"
                      : "Static fallback"}
                  </span>
                  <Sparkline seed={c.seed} colour={c.sparkColour} />
                </div>
              </button>
            ))}
      </div>
    </section>
  );
}

const pulseStyles = `
  .ep-section {
    padding: 20px 28px 0;
  }

  .ep-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }
  .ep-header-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-900, #111827);
    font-family: 'Sora', sans-serif;
  }
  .ep-header-sub {
    font-size: 11px;
    color: var(--gray-500, #6B7280);
    font-style: italic;
    white-space: nowrap;
  }

  /* STRIP */
  .ep-strip {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    scrollbar-width: none;
  }
  .ep-strip::-webkit-scrollbar { display: none; }

  /* CARD */
  .ep-card {
    background: var(--surface-card);
    border-radius: 14px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    text-align: left;
    border: 1px solid rgba(0,0,0,0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    flex-shrink: 0;
  }
  .ep-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  }

  /* ROWS */
  .ep-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .ep-row-value {
    align-items: flex-end;
  }
  .ep-row-bottom {
    align-items: flex-end;
  }

  /* TEXT */
  .ep-indicator-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gray-500, #6B7280);
    font-weight: 600;
  }
  .ep-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    font-family: 'Sora', sans-serif;
  }
  .ep-updated {
    font-size: 11px;
    color: var(--gray-400, #9CA3AF);
    font-weight: 400;
    white-space: nowrap;
  }

  /* BADGE */
  .ep-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ep-badge[data-live="true"] {
    background: #DCFCE7;
    color: #15803D;
  }
  .ep-badge[data-live="false"] {
    background: var(--gray-100, #F3F4F6);
    color: var(--gray-400, #9CA3AF);
  }

  /* PULSING DOT */
  .ep-pulse-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #16A34A;
    animation: ep-pulse-dot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes ep-pulse-dot {
    0%, 100% { opacity: 1;   transform: scale(1);   }
    50%       { opacity: 0.5; transform: scale(1.4); }
  }

  /* SKELETON */
  .ep-skeleton-card {
    cursor: default;
    pointer-events: none;
  }
  .ep-sk {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: ep-shimmer 1.5s infinite;
  }
  .ep-sk-sm  { height: 12px; width: 70%;  }
  .ep-sk-lg  { height: 26px; width: 90%;  margin: 4px 0; }
  @keyframes ep-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }

  @media (max-width: 768px) {
    .ep-header-sub { display: none; }
    .ep-section { padding: 16px 16px 0; }
  }
`;
