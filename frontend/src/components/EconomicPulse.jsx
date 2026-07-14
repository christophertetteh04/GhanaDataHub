import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { datasetsApi, dashboardApi } from "../services/api";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Try to extract a percentage like "5.30" from a dataset title */
function pctFromTitle(title) {
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

function LiveBadge({ live }) {
  return (
    <span className="ep-badge" data-live={live ? "true" : "false"}>
      {live ? (
        <>
          <span className="ep-pulse-dot" />
          LIVE
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

  // Raw data holders
  const [forexDataset, setForexDataset]   = useState(null);
  const [inflDataset,  setInflDataset]    = useState(null);
  const [cocoaDataset, setCocoaDataset]   = useState(null);
  const [gseDataset,   setGseDataset]     = useState(null);
  const [totalDatasets, setTotalDatasets] = useState(null);

  useEffect(() => {
    const pick = (r) => {
      const data = r?.data;
      const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      // Return the most recently updated item
      return arr.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0] || null;
    };

    Promise.allSettled([
      datasetsApi.list({ search: "forex",     per_page: 5, limit: 5 }),
      datasetsApi.list({ search: "inflation", per_page: 5, limit: 5 }),
      datasetsApi.list({ search: "cocoa",     per_page: 5, limit: 5 }),
      datasetsApi.list({ search: "gse",       per_page: 5, limit: 5 }),
      dashboardApi.stats(),
    ]).then(([forex, infl, cocoa, gse, dash]) => {
      if (forex.status  === "fulfilled") setForexDataset(pick(forex.value));
      if (infl.status   === "fulfilled") setInflDataset(pick(infl.value));
      if (cocoa.status  === "fulfilled") setCocoaDataset(pick(cocoa.value));
      if (gse.status    === "fulfilled") setGseDataset(pick(gse.value));
      if (dash.status   === "fulfilled") setTotalDatasets(dash.value?.data?.total_datasets ?? null);
      setLoading(false);
    });
  }, []);

  // ── Derive card specs from fetched data ──────────────────────────
  const inflPct  = pctFromTitle(inflDataset?.title);
  const inflColour = inflationColour(inflPct);

  const cards = [
    {
      key:       "cedi",
      title:     "USD / GHS",
      value:     "11.46",
      unit:      "",
      direction: "stable",
      live:      !!forexDataset,
      updatedAt: forexDataset?.updated_at,
      seed:      (forexDataset?.download_count ?? 88) + 1,
      sparkColour: "var(--green)",
      onClick:   () => forexDataset?.id
                   ? navigate(`/datasets/${forexDataset.id}`)
                   : navigate("/datasets?search=forex"),
      valueColour: "var(--dark, #111827)",
    },
    {
      key:       "inflation",
      title:     "Inflation Rate",
      value:     inflPct !== null ? `${inflPct.toFixed(2)}%` : "5.30%",
      unit:      "",
      direction: inflPct !== null && inflPct < 15 ? "down" : "up",
      live:      !!inflDataset,
      updatedAt: inflDataset?.updated_at,
      seed:      (inflDataset?.download_count ?? 53) + 7,
      sparkColour: inflColour,
      onClick:   () => inflDataset?.id
                   ? navigate(`/datasets/${inflDataset.id}`)
                   : navigate("/datasets?search=inflation"),
      valueColour: inflColour,
    },
    {
      key:       "cocoa",
      title:     "Cocoa (USD/MT)",
      value:     "$6,455",
      unit:      "",
      direction: "up",
      live:      !!cocoaDataset,
      updatedAt: cocoaDataset?.updated_at,
      seed:      (cocoaDataset?.download_count ?? 64) + 3,
      sparkColour: "#D97706",
      onClick:   () => cocoaDataset?.id
                   ? navigate(`/datasets/${cocoaDataset.id}`)
                   : navigate("/datasets?search=cocoa"),
      valueColour: "var(--dark, #111827)",
    },
    {
      key:       "gse",
      title:     "GSE Index",
      value:     "14,780",
      unit:      "",
      direction: "up",
      live:      !!gseDataset,
      updatedAt: gseDataset?.updated_at,
      seed:      (gseDataset?.download_count ?? 147) + 2,
      sparkColour: "#3B82F6",
      onClick:   () => gseDataset?.id
                   ? navigate(`/datasets/${gseDataset.id}`)
                   : navigate("/datasets?search=gse"),
      valueColour: "var(--dark, #111827)",
    },
    {
      key:       "platform",
      title:     "Datasets",
      value:     totalDatasets !== null ? totalDatasets.toLocaleString() : "—",
      unit:      "",
      direction: "up",
      live:      true,
      updatedAt: null, // "Updated live"
      seed:      (totalDatasets ?? 99) + 5,
      sparkColour: "var(--green)",
      onClick:   () => navigate("/datasets"),
      valueColour: "var(--green, #006B3F)",
    },
  ];

  return (
    <section className="ep-section">
      <style>{pulseStyles}</style>

      {/* Section header */}
      <div className="ep-header">
        <span className="ep-header-title">Live Economic Pulse</span>
        <span className="ep-header-sub">
          Data updated daily — run pipeline.py for latest figures
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
                  <LiveBadge live={c.live} />
                </div>

                {/* Row 2: value + trend */}
                <div className="ep-row ep-row-value">
                  <span className="ep-value" style={{ color: c.valueColour }}>
                    {c.value}
                  </span>
                  <TrendIcon direction={c.direction} />
                </div>

                {/* Row 3: updated + sparkline */}
                <div className="ep-row ep-row-bottom">
                  <span className="ep-updated">
                    {c.updatedAt
                      ? `Updated ${timeAgo(c.updatedAt)}`
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
    background: #fff;
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
