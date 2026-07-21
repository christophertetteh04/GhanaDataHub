import React from "react";

const CONTEXT_MAP = {
  inflation: {
    thresholds: [
      { max: 5, label: "single digits", note: "the lowest level since early 2021" },
      { max: 10, label: "moderate", note: "better than the 2022 peak of 54.1%" },
      { max: 20, label: "elevated", note: "above the BOG target of 8%" },
      { max: 40, label: "high", note: "significantly above the BOG target" },
      { max: 999, label: "very high", note: "the 2022 crisis level was 54.1%" },
    ],
    unit: "%",
    direction: "lower_is_better",
  },
  gdp: {
    thresholds: [
      { min: 60, note: "stronger than most West African economies" },
      { min: 40, note: "above the sub-Saharan Africa average" },
      { min: 0, note: "reflects steady economic activity" },
    ],
    unit: "B USD",
    direction: "higher_is_better",
  },
  cedi: {
    thresholds: [
      { max: 5, note: "strong performance - cedi gaining vs dollar" },
      { max: 10, note: "moderate pressure - broadly stable" },
      { max: 20, note: "elevated pressure on import costs" },
      { max: 999, note: "significant depreciation affecting imports" },
    ],
    unit: "GHS/USD",
    direction: "lower_is_better",
  },
  cocoa: {
    thresholds: [
      { min: 6000, note: "near historic highs - major export revenue boost for Ghana" },
      { min: 4000, note: "strong - above 5-year average of $3,200/MT" },
      { min: 2000, note: "moderate - in line with long-run averages" },
      { min: 0, note: "below recent averages" },
    ],
    unit: "USD/MT",
    direction: "higher_is_better",
  },
  gse: {
    thresholds: [
      { min: 50, note: "exceptional year - one of Africa best performing markets" },
      { min: 20, note: "strong year-to-date gain" },
      { min: 0, note: "positive year-to-date performance" },
      { min: -999, note: "below year-start levels" },
    ],
    unit: "%",
    direction: "higher_is_better",
  },
};

function getContext(indicator, value) {
  const config = CONTEXT_MAP[indicator];
  if (!config) return null;
  const thresholds = config.thresholds;
  if (config.direction === "lower_is_better") {
    for (const t of thresholds) {
      if (value <= t.max) return t.note;
    }
  } else {
    for (const t of [...thresholds].reverse()) {
      if (value >= t.min) return t.note;
    }
  }
  return null;
}

export default function ComparisonEngine({ indicator, value, label }) {
  const contextNote = getContext(indicator, value);
  if (!contextNote) return null;

  return (
    <span
      style={{
        fontSize: 11,
        color: "var(--gray-400)",
        fontStyle: "italic",
        display: "block",
        marginTop: 4,
        lineHeight: 1.4,
      }}
    >
      {contextNote}
    </span>
  );
}
