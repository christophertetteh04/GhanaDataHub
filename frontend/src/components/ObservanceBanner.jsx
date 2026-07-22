import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Database,
  FileText,
  GraduationCap,
  Heart,
  Leaf,
  Scale,
  TrendingUp,
  Wind,
  X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const CATEGORY_STYLES = {
  Agriculture: {
    color: "#006B3F",
    gradient: "linear-gradient(135deg, #006B3F, #00A35C)",
    tint: "rgba(0,107,63,0.03)",
    bannerTint: "rgba(0,107,63,0.08)",
    icon: Leaf,
  },
  Health: {
    color: "#DC2626",
    gradient: "linear-gradient(135deg, #DC2626, #EF4444)",
    tint: "rgba(220,38,38,0.03)",
    bannerTint: "rgba(220,38,38,0.08)",
    icon: Heart,
  },
  Education: {
    color: "#1D4ED8",
    gradient: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
    tint: "rgba(29,78,216,0.03)",
    bannerTint: "rgba(29,78,216,0.08)",
    icon: GraduationCap,
  },
  Economy: {
    color: "#92400E",
    gradient: "linear-gradient(135deg, #92400E, #D97706)",
    tint: "rgba(146,64,14,0.03)",
    bannerTint: "rgba(146,64,14,0.08)",
    icon: TrendingUp,
  },
  Governance: {
    color: "#5B21B6",
    gradient: "linear-gradient(135deg, #5B21B6, #7C3AED)",
    tint: "rgba(91,33,182,0.03)",
    bannerTint: "rgba(91,33,182,0.08)",
    icon: Scale,
  },
  Environment: {
    color: "#065F46",
    gradient: "linear-gradient(135deg, #065F46, #059669)",
    tint: "rgba(6,95,70,0.03)",
    bannerTint: "rgba(6,95,70,0.08)",
    icon: Wind,
  },
};

const DEFAULT_STYLE = {
  color: "var(--green)",
  gradient: "linear-gradient(135deg, var(--green), #00A35C)",
  tint: "rgba(0,107,63,0.03)",
  bannerTint: "rgba(0,107,63,0.08)",
  icon: Database,
};

function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}

function formatHeroDate(value) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

function getDatasetLink(observance) {
  const dataset = observance?.related_datasets?.[0];
  if (dataset?.id) return `/datasets/${dataset.id}`;
  return `/datasets?search=${encodeURIComponent(observance?.observance_name || "")}`;
}

function extractNumericDisplay(value) {
  if (!value) return null;
  const match = String(value).match(/(-?[\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  const raw = match[1];
  return {
    target: Number(raw.replace(/,/g, "")),
    decimals: (raw.split(".")[1] || "").length,
    prefix: String(value).slice(0, match.index),
    suffix: String(value).slice(match.index + raw.length),
  };
}

function useCountUpValue(value) {
  const parsed = useMemo(() => extractNumericDisplay(value), [value]);
  const [current, setCurrent] = useState(parsed?.target || 0);

  useEffect(() => {
    if (!parsed) return;
    let frameId;
    const startedAt = performance.now();

    function step(timestamp) {
      const progress = Math.min((timestamp - startedAt) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(parsed.target * eased);
      if (progress < 1) frameId = requestAnimationFrame(step);
    }

    setCurrent(0);
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [parsed]);

  if (!parsed) return value;
  return `${parsed.prefix}${current.toFixed(parsed.decimals)}${parsed.suffix}`;
}

function FileTypeIcon() {
  return <FileText size={16} color="var(--text-muted)" />;
}

export default function ObservanceBanner({ observance, variant = "dashboard", totalDatasets }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [fallbackTotal, setFallbackTotal] = useState(null);
  const animatedValue = useCountUpValue(observance?.key_datapoint);

  useEffect(() => {
    if (!observance || observance.key_datapoint || totalDatasets != null) return;
    const controller = new AbortController();

    fetch(`${API_BASE}/dashboard/`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFallbackTotal(data?.total_datasets ?? null))
      .catch((error) => {
        if (error.name !== "AbortError") setFallbackTotal(null);
      });

    return () => controller.abort();
  }, [observance, totalDatasets]);

  if (!observance || isDismissed) return null;

  const style = getCategoryStyle(observance.category);
  const Icon = style.icon;
  const relatedDatasets = observance.related_datasets || [];
  const primaryLink = getDatasetLink(observance);
  const datasetTotal = totalDatasets ?? fallbackTotal ?? relatedDatasets.length ?? 0;

  if (variant === "feed") {
    return (
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "6px 36px minmax(0, 1fr) auto",
          gap: 14,
          alignItems: "center",
          background: style.tint,
          borderRadius: 14,
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
          padding: "16px 16px 16px 0",
        }}
      >
        <div style={{ alignSelf: "stretch", background: style.color }} />
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${style.color}14`, display: "grid", placeItems: "center" }}>
          <Icon size={20} color={style.color} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 800, letterSpacing: 0.4 }}>
            {observance.observance_name}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {observance.headline}
          </div>
          {relatedDatasets[0]?.title && (
            <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {relatedDatasets[0].title}
            </div>
          )}
        </div>
        <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
          <span style={{ position: "absolute", top: 8, right: 10, fontSize: 10, fontWeight: 900, color: "#fff", background: style.color, borderRadius: 4, padding: "2px 6px" }}>
            OBSERVANCE
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>Today</span>
          <Link
            to={primaryLink}
            aria-label="View observance data"
            style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${style.color}`, color: style.color, display: "grid", placeItems: "center" }}
          >
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "landing") {
    return (
      <div
        style={{
          minHeight: 44,
          background: style.bannerTint,
          borderBottom: `2px solid ${style.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, color: "var(--text-primary)" }}>
          <Icon size={16} color={style.color} />
          <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>{observance.observance_name}</span>
          <span style={{ color: "var(--text-muted)" }}>-</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {(observance.headline || "").slice(0, 60)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <Link to={primaryLink} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: style.color, fontSize: 12, fontWeight: 800 }}>
            View data <ArrowRight size={13} />
          </Link>
          <button
            type="button"
            aria-label="Dismiss observance banner"
            onClick={() => setIsDismissed(true)}
            style={{ border: 0, background: "transparent", color: "var(--text-muted)", width: 24, height: 24, display: "grid", placeItems: "center", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60fr 40fr",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        minHeight: 300,
      }}
    >
      <div style={{ position: "relative", background: style.gradient, padding: "32px 36px", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.13)", right: -48, top: -52 }} />
        <div style={{ position: "absolute", width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.12)", left: -24, bottom: -26 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 800, letterSpacing: 1.5 }}>
            {formatHeroDate(observance.observance_date)}
          </div>
          <div style={{ display: "inline-flex", border: "1px solid rgba(255,255,255,0.6)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800, marginTop: 14 }}>
            {observance.category || "Observance"}
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {observance.observance_name}
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: 22, lineHeight: 1.3, color: "#fff", fontWeight: 900 }}>
            {observance.headline}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
            {observance.narrative}
          </p>
          <Link to={primaryLink} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 22, color: "#fff", fontWeight: 800, fontSize: 14 }}>
            Explore the data <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ background: "var(--surface-card)", padding: "32px 28px" }}>
        <Icon size={36} color={style.color} />

        {observance.key_datapoint ? (
          <>
            <div style={{ marginTop: 18, fontSize: 48, lineHeight: 1, fontWeight: 900, color: "var(--dark)" }}>
              {animatedValue}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-secondary)" }}>
              {observance.key_datapoint_label}
            </div>
          </>
        ) : (
          <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.2, fontWeight: 900, color: "var(--dark)" }}>
            {datasetTotal} datasets available
          </div>
        )}

        <div style={{ height: 1, background: "var(--border-subtle)", margin: "24px 0 18px" }} />
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
          Related datasets
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {relatedDatasets.slice(0, 2).map((dataset) => (
            <Link
              key={dataset.id}
              to={`/datasets/${dataset.id}`}
              style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 8, alignItems: "center", color: "inherit" }}
            >
              <FileTypeIcon />
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {dataset.title}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {dataset.download_count || 0}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
