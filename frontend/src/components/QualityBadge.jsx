import React from "react";

export function computeQuality(dataset) {
  if (!dataset) return { score: 0, grade: "D" };
  
  let score = 0;

  // COMPLETENESS (30 points)
  if (dataset.title && dataset.title.length > 10) score += 10;
  if (dataset.description && dataset.description.length > 50) score += 10;
  if (dataset.tags && dataset.tags.length > 0) score += 5;
  if (dataset.category) score += 5;

  // FRESHNESS (25 points)
  const updatedAt = dataset.updated_at ? new Date(dataset.updated_at) : new Date();
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / 86400000;
  if (daysSinceUpdate < 30) score += 25;
  else if (daysSinceUpdate < 90) score += 18;
  else if (daysSinceUpdate < 365) score += 10;
  else score += 3;

  // ENGAGEMENT (25 points)
  const downloads = dataset.download_count ?? 0;
  if (downloads > 100) score += 25;
  else if (downloads > 50) score += 18;
  else if (downloads > 10) score += 12;
  else if (downloads > 0) score += 6;

  // VERSIONING (10 points)
  const version = dataset.version ?? 1;
  if (version > 3) score += 10;
  else if (version > 1) score += 6;

  // LICENSE (10 points)
  const license = dataset.license || "";
  if (license && license.toLowerCase().includes("cc")) score += 10;
  else if (license) score += 5;

  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  return { score, grade };
}

const GRADE_STYLES = {
  A: { bg: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" },
  B: { bg: "#DBEAFE", color: "#1E40AF", border: "1px solid #93C5FD" },
  C: { bg: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE047" },
  D: { bg: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
};

export default function QualityBadge({ dataset, size = "sm" }) {
  const { score, grade } = computeQuality(dataset);
  const styles = GRADE_STYLES[grade] || GRADE_STYLES.D;

  const tooltip = size === "lg"
    ? `Score: ${score}/100. Completeness, freshness, engagement, versioning.`
    : `Quality score: ${score}/100`;

  const isSmall = size === "sm";

  const badgeStyle = {
    background: styles.bg,
    color: styles.color,
    border: styles.border,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "help",
    // size-specific adjustments
    borderRadius: isSmall ? "6px" : "8px",
    padding: isSmall ? "2px 7px" : "4px 10px",
    fontSize: isSmall ? "11px" : "13px",
  };

  return (
    <span style={badgeStyle} title={tooltip}>
      {isSmall ? grade : `Quality: ${grade} (${score}/100)`}
    </span>
  );
}
