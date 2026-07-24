import { useEffect, useState } from "react";

/**
 * GhanaDataHub chart theme — Kente Spectrum.
 * Import from here for all Recharts components.
 * Uses a useDarkMode hook to switch between light/dark values.
 */

export const KENTE_COLOURS = [
  "#006B3F",  // Ghana flag green
  "#FCD116",  // Ghana flag gold
  "#CE1126",  // Ghana flag red
  "#1A56DB",  // Kente royal blue
  "#92400E",  // Kente earth brown
  "#0891B2",  // Kente sky blue
];

export function getChartTheme(isDark) {
  return {
    colours: KENTE_COLOURS,
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    axis: isDark ? "#5A7366" : "#6B8A7A",
    tooltip: {
      bg: isDark ? "#1A2B22" : "#FFFFFF",
      border: isDark ? "rgba(255,255,255,0.10)" : "#D4E6DC",
      text: isDark ? "#F0F4F2" : "#0D1F16",
    },
    area: isDark ? "rgba(0,179,96,0.15)" : "rgba(0,107,63,0.10)",
    positive: "#10B981",
    negative: "#EF4444",
    neutral: "#64748B",
  };
}

// Convenience hook — use this in every chart component
export function useChartTheme() {
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return getChartTheme(isDark);
}
