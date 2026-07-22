import React, { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Download, FileText, Database, BarChart3, FileCode, ArrowUpRight } from "lucide-react";
import QualityBadge from "./QualityBadge";

/**
 * Track dataset view in localStorage for recommendation profiling.
 * Exported so DatasetDetailPage.jsx can trigger it on mount.
 */
export function trackDatasetView(dataset) {
  if (!dataset) return;
  try {
    const cats = JSON.parse(localStorage.getItem("gdh_viewed_categories") || "[]");
    const tags = JSON.parse(localStorage.getItem("gdh_viewed_tags") || "[]");
    
    const catName = dataset.category?.name || (typeof dataset.category === "string" ? dataset.category : null);
    if (catName && !cats.includes(catName)) {
      cats.unshift(catName);
    }

    if (Array.isArray(dataset.tags)) {
      dataset.tags.forEach((t) => {
        const tagName = typeof t === "string" ? t : t?.name;
        if (tagName && !tags.includes(tagName)) {
          tags.unshift(tagName);
        }
      });
    }

    localStorage.setItem("gdh_viewed_categories", JSON.stringify(cats.slice(0, 20)));
    localStorage.setItem("gdh_viewed_tags", JSON.stringify(tags.slice(0, 40)));
  } catch (err) {
    console.error("Error updating viewed dataset profile:", err);
  }
}

const CATEGORY_COLORS = [
  "#006B3F", "#1D4ED8", "#7C3AED", "#B45309", "#0F766E", "#BE185D",
  "#D97706", "#2563EB", "#059669", "#DC2626", "#4F46E5", "#0891B2"
];

function getCategoryColor(name) {
  if (!name) return "#006B3F";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function getFileTypeIconAndGradient(fileType) {
  const t = (fileType || "").toLowerCase();
  if (t.includes("csv")) return { icon: Database, bg: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)" };
  if (t.includes("json")) return { icon: FileCode, bg: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" };
  if (t.includes("excel") || t.includes("xls")) return { icon: BarChart3, bg: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" };
  if (t.includes("pdf")) return { icon: FileText, bg: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)" };
  return { icon: Database, bg: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)" };
}

function scoreDataset(dataset, viewedCategories, viewedTags) {
  let score = 0;
  const catName = dataset.category?.name || (typeof dataset.category === "string" ? dataset.category : null);
  if (catName && viewedCategories.includes(catName)) {
    score += 30;
  }
  
  const datasetTags = Array.isArray(dataset.tags)
    ? dataset.tags.map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean)
    : [];
  const overlap = datasetTags.filter((t) => viewedTags.includes(t));
  score += overlap.length * 15;

  score += Math.min((dataset.download_count || 0) * 0.5, 20);

  const createdAt = dataset.created_at ? new Date(dataset.created_at).getTime() : Date.now();
  const ageDays = (Date.now() - createdAt) / 86400000;
  score += Math.max(0, 10 - ageDays * 0.1);

  return score;
}

function DatasetSparkline({ dataset }) {
  if (!dataset?.preview_data) return null;
  let dataPoints = [];
  if (Array.isArray(dataset.preview_data)) {
    dataPoints = dataset.preview_data.map((v) => (typeof v === "number" ? v : parseFloat(v) || 0));
  } else if (dataset.preview_data?.values && Array.isArray(dataset.preview_data.values)) {
    dataPoints = dataset.preview_data.values;
  }
  if (dataPoints.length < 2) return null;

  const max = Math.max(...dataPoints, 1);
  const min = Math.min(...dataPoints, 0);
  const range = max - min || 1;
  const points = dataPoints
    .map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * 36;
      const y = 16 - ((val - min) / range) * 12;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="40" height="18" style={{ overflow: "visible" }} aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function PersonalisedRecs({ recentUploads = [], mostDownloaded = [] }) {
  const navigate = useNavigate();

  const { recommendations, isPersonalized, scores } = useMemo(() => {
    let viewedCategories = [];
    let viewedTags = [];
    try {
      viewedCategories = JSON.parse(localStorage.getItem("gdh_viewed_categories") || "[]");
      viewedTags = JSON.parse(localStorage.getItem("gdh_viewed_tags") || "[]");
    } catch {
      viewedCategories = [];
      viewedTags = [];
    }

    const combined = [...(mostDownloaded || []), ...(recentUploads || [])];
    const uniqueMap = new Map();
    combined.forEach((item) => {
      if (item && item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    const uniqueList = Array.from(uniqueMap.values());

    const isUserPersonalized = viewedCategories.length > 0 || viewedTags.length > 0;
    const scoresMap = {};

    uniqueList.forEach((d) => {
      scoresMap[d.id] = scoreDataset(d, viewedCategories, viewedTags);
    });

    let sorted = [];
    if (isUserPersonalized) {
      sorted = uniqueList.sort((a, b) => scoresMap[b.id] - scoresMap[a.id]);
    } else {
      sorted = [...mostDownloaded];
    }

    return {
      recommendations: sorted.slice(0, 4),
      isPersonalized: isUserPersonalized,
      scores: scoresMap,
    };
  }, [recentUploads, mostDownloaded]);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const sectionTitle = isPersonalized ? "Recommended for You" : "Popular on GhanaDataHub";

  return (
    <div className="dash-v2-section" style={{ marginBottom: 28 }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} color="var(--gold)" fill="var(--gold)" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)", margin: 0 }}>
            {sectionTitle}
          </h3>
        </div>
        <Link to="/datasets" style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
          View all datasets
        </Link>
      </div>

      {/* Recommendations Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 16,
        }}
      >
        {recommendations.map((dataset) => {
          const catName = dataset.category?.name || (typeof dataset.category === "string" ? dataset.category : "General");
          const catColor = getCategoryColor(catName);
          const { icon: FileIcon, bg: fileBg } = getFileTypeIconAndGradient(dataset.file_type);
          const score = scores[dataset.id] || 0;
          const isInterestsMatch = score > 30;

          return (
            <div
              key={dataset.id}
              onClick={() => navigate(`/datasets/${dataset.id}`)}
              className="rec-card-item"
              style={{
                position: "relative",
                background: "var(--surface-card)",
                borderRadius: 14,
                boxShadow: "var(--shadow)",
                padding: "16px",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              {/* Category Colour Strip */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: catColor,
                  borderRadius: "14px 14px 0 0",
                }}
              />

              {/* Hover Why Recommended Badge */}
              <div
                className="rec-card-why-badge"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0,107,63,0.92)",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: "2px 7px",
                  pointerEvents: "none",
                  opacity: 0,
                  transition: "opacity 0.2s ease",
                  zIndex: 2,
                }}
              >
                {isInterestsMatch ? "Matches your interests" : "Popular"}
              </div>

              {/* Card Main Body */}
              <div style={{ marginTop: 4 }}>
                {/* Header row with Icon and Sparkline */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: fileBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                    }}
                  >
                    <FileIcon size={18} />
                  </div>
                  <DatasetSparkline dataset={dataset} />
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--gray-900)",
                    lineHeight: 1.35,
                    marginBottom: 6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: 35,
                  }}
                  title={dataset.title}
                >
                  {dataset.title}
                </div>

                {/* Category name */}
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--green)", marginBottom: 12 }}>
                  {catName}
                </div>
              </div>

              {/* Bottom Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid var(--gray-100)",
                  marginTop: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--gray-500)", fontWeight: 500 }}>
                  <Download size={13} />
                  <span>{(dataset.download_count || 0).toLocaleString()}</span>
                </div>
                <QualityBadge dataset={dataset} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .rec-card-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
        }
        .rec-card-item:hover .rec-card-why-badge {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
