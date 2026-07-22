import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Bot,
  Braces,
  Code2,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Info,
  Map,
  Share2,
  Table,
} from "lucide-react";
import { usersApi } from "../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const AVATAR_COLORS = [
  "#D1FAE5",
  "#E0F2FE",
  "#FEF3C7",
  "#FEE2E2",
  "#E9D5FF",
  "#DCFCE7",
];

const FILE_TYPE_STYLES = {
  csv: { bg: "var(--green-pale)", color: "var(--green)", icon: FileSpreadsheet },
  json: { bg: "#EFF6FF", color: "#2563EB", icon: Braces },
  pdf: { bg: "#FEF2F2", color: "#DC2626", icon: FileText },
  excel: { bg: "#F0FDF4", color: "var(--green)", icon: Table },
  image: { bg: "#FFF7ED", color: "#F97316", icon: Image },
  default: { bg: "var(--surface-elevated)", color: "var(--text-secondary)", icon: File },
};

const INDICATOR_META = {
  "SP.URB.TOTL.IN.ZS": {
    title: "Ghana's Urban Population Keeps Rising",
    why: "Urbanisation affects housing, jobs, transport, school places and local government planning.",
    visual: "line",
    source: "World Bank",
  },
  "SP.POP.TOTL": {
    title: "Ghana Population Data Signals Changing Demand",
    why: "Population change helps explain pressure on housing, education, health services and jobs.",
    visual: "line",
    source: "World Bank",
  },
  "NY.GDP.MKTP.CD": {
    title: "Ghana GDP Data Points to the Economy's Direction",
    why: "GDP tells investors, policymakers and researchers how the size of the economy is changing.",
    visual: "area",
    source: "World Bank",
  },
  "NY.GDP.MKTP.KD.ZG": {
    title: "Ghana Growth Data Shows Economic Momentum",
    why: "Growth trends reveal whether output is expanding fast enough to support jobs and investment.",
    visual: "area",
    source: "World Bank",
  },
  "FP.CPI.TOTL.ZG": {
    title: "Inflation Data Shows Pressure on Ghanaian Households",
    why: "Inflation affects food prices, transport costs, wages and household purchasing power.",
    visual: "line",
    source: "World Bank",
  },
  "EG.ELC.ACCS.ZS": {
    title: "Electricity Access Data Highlights Ghana's Infrastructure Gap",
    why: "Power access shapes education, business growth, health delivery and rural opportunity.",
    visual: "map",
    source: "World Bank",
  },
  "SE.ADT.LITR.ZS": {
    title: "Literacy Data Reveals Ghana's Human Capital Story",
    why: "Literacy is a foundation for jobs, learning outcomes and long-term economic mobility.",
    visual: "bar",
    source: "World Bank",
  },
  "SP.DYN.IMRT.IN": {
    title: "Child Health Data Shows Progress and Remaining Gaps",
    why: "Infant mortality trends help identify where health access, prevention and nutrition need attention.",
    visual: "line",
    source: "World Bank",
  },
};

function getIndicatorMeta(dataset) {
  const text = `${dataset.title || ""} ${dataset.description || ""}`;
  return Object.entries(INDICATOR_META).find(([code]) => text.includes(code))?.[1] || null;
}

function humaniseTitle(dataset) {
  const meta = getIndicatorMeta(dataset);
  if (meta) return meta.title;
  return (dataset.title || "Ghana data update")
    .replace(/^World Bank Open Data\s*[-—]\s*Ghana:\s*/i, "")
    .replace(/\b[A-Z]{2,}\.[A-Z0-9.]{4,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-—:]\s*$/, "")
    .trim() || dataset.title || "Ghana data update";
}

function computeHeadline(dataset) {
  const title = humaniseTitle(dataset);
  const rawTitle = dataset.title || "";
  const text = `${rawTitle} ${dataset.description || ""}`.toLowerCase();
  const cat = dataset.category?.name || "";
  const downloads = dataset.download_count || 0;
  const meta = getIndicatorMeta(dataset);
  if (meta) return meta.title;

  if (text.includes("forex") || text.includes("exchange rate")) {
    return `Ghana forex rates move into focus`;
  }
  if (text.includes("inflation") || text.includes("cpi")) {
    return "Inflation data gives a fresh read on household pressure";
  }
  if (text.includes("cocoa")) {
    return "Cocoa data reveals what's changing in Ghana's export economy";
  }
  if (text.includes("gse") || text.includes("stock")) {
    return `Market pulse: ${title}`;
  }
  if (text.includes("population") || text.includes("census") || text.includes("urban")) {
    return `Population pulse: ${title}`;
  }
  if (text.includes("health") || text.includes("malaria") || text.includes("hospital") || text.includes("mortality")) {
    return `Health pulse: ${title}`;
  }
  if (text.includes("region") || text.includes("district")) {
    return `Regional pulse: ${title}`;
  }
  if (downloads > 100) {
    return `Trending in Ghana data: ${title}`;
  }
  if (cat) {
    return `${cat} pulse: ${title}`;
  }
  return title;
}

function getBadge(dataset) {
  const ageMs = Date.now() - new Date(dataset.created_at).getTime();
  const ageHours = ageMs / 3600000;
  if (ageHours < 2) return { label: "Critical", colour: "#DC2626", bg: "rgba(220,38,38,0.10)" };
  if (dataset.download_count > 50) return { label: "Trending", colour: "#059669", bg: "rgba(5,150,105,0.10)" };
  if (dataset.version > 1) return { label: "Important", colour: "#D97706", bg: "rgba(217,119,6,0.12)" };
  if (dataset.analysis_data?.ai_summary) return { label: "AI Discovery", colour: "#7C3AED", bg: "rgba(124,58,237,0.12)" };
  return { label: "Research", colour: "#1D4ED8", bg: "rgba(29,78,216,0.10)" };
}

function getContextLine(dataset) {
  const meta = getIndicatorMeta(dataset);
  if (meta) return meta.why;
  if (dataset.analysis_data?.ai_summary) {
    const firstSentence = dataset.analysis_data.ai_summary.split(".")[0];
    if (firstSentence.length > 20 && firstSentence.length < 200) return `${firstSentence}.`;
  }
  if (dataset.description) {
    const first = dataset.description.split(".")[0];
    if (first.length > 20) return `${first}.`;
  }
  return null;
}

function getPublisher(dataset) {
  const meta = getIndicatorMeta(dataset);
  if (meta?.source) return meta.source;
  const text = `${dataset.title || ""} ${dataset.description || ""}`.toLowerCase();
  if (text.includes("world bank")) return "World Bank";
  if (text.includes("bank of ghana") || text.includes("bog")) return "Bank of Ghana";
  if (text.includes("ghana statistical") || text.includes("statsghana")) return "Ghana Statistical Service";
  if (text.includes("faostat") || text.includes("fao")) return "FAOSTAT";
  if (text.includes("who")) return "WHO";
  return dataset.owner?.full_name || "GhanaDataHub";
}

function getVisualType(dataset) {
  const meta = getIndicatorMeta(dataset);
  if (meta) return meta.visual;
  const text = `${dataset.title || ""} ${dataset.description || ""} ${dataset.category?.name || ""}`.toLowerCase();
  if (/region|district|map|health|hospital|mortality/.test(text)) return "map";
  if (/crop|cocoa|agriculture|export|trade/.test(text)) return "bar";
  return "line";
}

function getHashIndex(value, length) {
  return (
    value?.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % length || 0
  );
}

function getAvatarColor(name) {
  return AVATAR_COLORS[getHashIndex(name || "Unknown", AVATAR_COLORS.length)];
}

function getInitials(name) {
  return (name || "Unknown")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function formatTimeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const delta = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  const days = Math.floor(delta / 86400);
  return days <= 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

function formatLargeNumber(value) {
  const safeValue = Number(value) || 0;
  if (safeValue >= 1000000) return `${(safeValue / 1000000).toFixed(1)}M`;
  if (safeValue >= 1000) return `${(safeValue / 1000).toFixed(1)}K`;
  return `${safeValue}`;
}

function SparklinePreview({ data }) {
  const gradientId = useId().replace(/:/g, "");
  const dataPoints = Array.isArray(data)
    ? data.map((v) => (typeof v === "number" ? v : parseFloat(v) || 0))
    : Array.isArray(data?.values)
      ? data.values.map((v) => (typeof v === "number" ? v : parseFloat(v) || 0))
      : [];

  if (dataPoints.length < 2) return null;

  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;
  const points = dataPoints
    .map((value, index) => {
      const x = (index / (dataPoints.length - 1)) * 92;
      const y = 28 - ((value - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="96" height="32" viewBox="0 0 96 32" aria-label="Dataset sparkline">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,32 ${points} 96,32`}
        fill={`url(#${gradientId})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FallbackFilePreview({ fileType }) {
  const style = FILE_TYPE_STYLES[getFileTypeKey(fileType)] || FILE_TYPE_STYLES.default;
  const Icon = style.icon;
  return (
    <div
      style={{
        width: 64,
        height: 24,
        borderRadius: 7,
        background: style.bg,
        color: style.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="File type preview"
    >
      <Icon size={14} />
    </div>
  );
}

function PulseVisual({ dataset }) {
  const type = getVisualType(dataset);
  if (dataset.preview_data && type !== "map") {
    return <SparklinePreview data={dataset.preview_data} />;
  }

  if (type === "map") {
    return (
      <svg width="96" height="54" viewBox="0 0 96 54" aria-label="Ghana map preview">
        <path d="M42 5 65 9 82 23 75 43 54 50 31 46 16 34 22 14Z" fill="var(--green-pale)" stroke="var(--green)" strokeWidth="1.5" />
        <path d="M42 5 44 25 22 14Z" fill="rgba(0,163,92,0.45)" />
        <path d="M44 25 65 9 82 23 58 31Z" fill="rgba(0,163,92,0.28)" />
        <path d="M44 25 58 31 54 50 31 46Z" fill="rgba(0,163,92,0.62)" />
      </svg>
    );
  }

  if (type === "bar") {
    return (
      <svg width="96" height="36" viewBox="0 0 96 36" aria-label="Bar chart preview">
        {[14, 22, 17, 29, 24, 32].map((height, index) => (
          <rect key={`${height}-${index}`} x={8 + index * 14} y={34 - height} width="8" height={height} rx="3" fill="var(--green)" opacity={0.35 + index * 0.09} />
        ))}
      </svg>
    );
  }

  return <FallbackFilePreview fileType={dataset.file_type} />;
}

export default function FeedCard({ dataset, categoryColours = {}, onCategoryClick }) {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const categoryName = dataset.category?.name || "Uncategorized";
  const categoryColour = categoryColours[categoryName] || categoryColours.Default || "var(--green)";
  const publisher = getPublisher(dataset);
  const ownerName = publisher;
  const badge = getBadge(dataset);
  const contextLine = getContextLine(dataset);
  const tags = Array.isArray(dataset.tags) ? dataset.tags : [];
  const headline = computeHeadline(dataset);
  const confidence = publisher === "GhanaDataHub" || publisher === "Unknown" ? 4 : 5;

  const handleBookmark = async () => {
    if (!localStorage.getItem("access_token")) {
      navigate("/login");
      return;
    }

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      if (nextState) await usersApi.bookmarks.add(dataset.id);
      else await usersApi.bookmarks.remove(dataset.id);
    } catch (error) {
      console.warn("Bookmark API unavailable; keeping local state only.", error);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/datasets/${dataset.id}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    window.open(`${API_BASE}/datasets/${dataset.id}/download`, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      className="feed-card"
      style={{
        background: "var(--surface-card)",
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        padding: 18,
        marginBottom: 12,
        border: "1px solid var(--border-subtle)",
        borderLeft: `4px solid ${categoryColour}`,
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: getAvatarColor(ownerName),
              color: "#111827",
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {getInitials(ownerName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {publisher}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {formatTimeAgo(dataset.created_at)}
            </div>
          </div>
        </div>
        {badge && (
          <span
            style={{
              color: badge.colour,
              background: badge.bg,
              borderRadius: 999,
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ float: "right", marginLeft: 12, marginBottom: 4, minWidth: 96, minHeight: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)" }}>
          <PulseVisual dataset={dataset} />
        </div>
        <button
          type="button"
          onClick={() => navigate(`/datasets/${dataset.id}`)}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            color: "var(--text-primary)",
            textAlign: "left",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.4,
            margin: "0 0 4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {headline}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", clear: "left", marginTop: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--green)", fontSize: 11, fontWeight: 900 }}>
            <BadgeCheck size={12} /> {"★".repeat(confidence)}{"☆".repeat(5 - confidence)} Verified
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>· {dataset.analysis_data?.ai_summary ? "AI summary ready" : "Metadata intelligence"}</span>
        </div>
      </div>

      {contextLine && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 10, marginBottom: 10, clear: "both", background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 12 }}>
          <Info size={12} color="var(--text-muted)" style={{ marginTop: 3, flexShrink: 0 }} />
          <span><strong style={{ color: "var(--text-primary)" }}>Why it matters:</strong> {contextLine}</span>
        </div>
      )}

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id || tag.name || tag}
              style={{
                background: "var(--green-pale)",
                color: "var(--green)",
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tag.name || tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ background: "var(--surface-elevated)", color: "var(--text-muted)", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
              +{tags.length - 2} more
            </span>
          )}
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--gray-100)",
          marginTop: 10,
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={handleDownload} className="feed-card-action">
          <Download size={14} />
          <span>{formatLargeNumber(dataset.download_count || 0)}</span>
        </button>
        <button type="button" onClick={handleBookmark} className="feed-card-action">
          <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
          <span>{isBookmarked ? "Saved" : "Save"}</span>
        </button>
        <button type="button" onClick={handleShare} className="feed-card-action">
          <Share2 size={14} />
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>
        <button type="button" onClick={() => navigate(`/datasets/${dataset.id}`)} className="feed-card-action">
          <ArrowRight size={14} />
          <span>Explore</span>
        </button>
        <button type="button" onClick={() => navigate(`/datasets/${dataset.id}?ask=kweku`)} className="feed-card-action">
          <Bot size={14} />
          <span>Kweku</span>
        </button>
        <button type="button" onClick={() => navigate(`/datasets/${dataset.id}?tab=map`)} className="feed-card-action">
          <Map size={14} />
          <span>Map</span>
        </button>
        <button type="button" onClick={() => navigate(`/datasets/${dataset.id}?tab=api`)} className="feed-card-action">
          <Code2 size={14} />
          <span>API</span>
        </button>
        {categoryName && (
          <button
            type="button"
            onClick={() => onCategoryClick?.(dataset.category?.id || categoryName)}
            style={{
              marginLeft: "auto",
              border: "none",
              background: categoryColour,
              color: "white",
              borderRadius: 999,
              padding: "3px 9px",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {categoryName}
          </button>
        )}
      </div>
    </article>
  );
}
