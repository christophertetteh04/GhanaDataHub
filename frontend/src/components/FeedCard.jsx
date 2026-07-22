import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bookmark,
  Braces,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Info,
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

function computeHeadline(dataset) {
  const title = dataset.title || "";
  const cat = dataset.category?.name || "";
  const downloads = dataset.download_count || 0;

  if (title.toLowerCase().includes("forex") || title.toLowerCase().includes("exchange rate")) {
    return `New Ghana forex data published — ${title}`;
  }
  if (title.toLowerCase().includes("inflation")) {
    return "Ghana inflation data updated — explore the latest figures";
  }
  if (title.toLowerCase().includes("cocoa")) {
    return `Cocoa data: ${title} now available for download`;
  }
  if (title.toLowerCase().includes("gse") || title.toLowerCase().includes("stock")) {
    return `Stock market data: ${title}`;
  }
  if (title.toLowerCase().includes("population") || title.toLowerCase().includes("census")) {
    return `Population & demographics: ${title}`;
  }
  if (downloads > 100) {
    return `Trending: ${title} — downloaded ${downloads} times`;
  }
  if (cat) {
    return `New ${cat} data: ${title}`;
  }
  return title;
}

function getBadge(dataset) {
  const ageMs = Date.now() - new Date(dataset.created_at).getTime();
  const ageHours = ageMs / 3600000;
  if (ageHours < 2) return { label: "BREAKING", colour: "#DC2626", bg: "#FEF2F2" };
  if (dataset.version > 1) return { label: "UPDATED", colour: "#1D4ED8", bg: "#EFF6FF" };
  if (dataset.download_count > 50) return { label: "TRENDING", colour: "#059669", bg: "#ECFDF5" };
  return null;
}

function getContextLine(dataset) {
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

export default function FeedCard({ dataset, categoryColours = {}, onCategoryClick }) {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const categoryName = dataset.category?.name || "Uncategorized";
  const categoryColour = categoryColours[categoryName] || categoryColours.Default || "var(--green)";
  const ownerName = dataset.owner?.full_name || "Unknown";
  const badge = getBadge(dataset);
  const contextLine = getContextLine(dataset);
  const tags = Array.isArray(dataset.tags) ? dataset.tags : [];

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
              {ownerName}
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
        {dataset.preview_data ? (
          <div style={{ float: "right", marginLeft: 12, marginBottom: 4 }}>
            <SparklinePreview data={dataset.preview_data} />
          </div>
        ) : (
          <div style={{ float: "right", marginLeft: 12, marginBottom: 4 }}>
            <FallbackFilePreview fileType={dataset.file_type} />
          </div>
        )}
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
          {computeHeadline(dataset)}
        </button>
      </div>

      {contextLine && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, fontStyle: "italic", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10, clear: "both" }}>
          <Info size={12} color="var(--text-muted)" style={{ marginTop: 3, flexShrink: 0 }} />
          <span>{contextLine}</span>
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
          <span>{isBookmarked ? "Saved" : "Bookmark"}</span>
        </button>
        <button type="button" onClick={handleShare} className="feed-card-action">
          <Share2 size={14} />
          <span>{copied ? "Copied!" : "Share"}</span>
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
