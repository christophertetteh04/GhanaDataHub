import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const CATEGORIES = [
  "Economy",
  "Health",
  "Agriculture",
  "Demographics",
  "Governance",
  "Environment",
];

function getCategoryName(item) {
  return item?.category?.name || item?.category_name || item?.category || "";
}

export default function DataRadar({ datasets = [], downloadHistory = [] }) {
  const radarData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const uploadedCount = datasets.filter((dataset) => getCategoryName(dataset) === cat).length;
      const downloadedCount = downloadHistory.filter((item) => getCategoryName(item) === cat).length;
      const uploadScore = uploadedCount * 15;
      const downloadScore = downloadedCount * 5;
      return {
        cat,
        score: Math.min(100, uploadScore + downloadScore),
      };
    });
  }, [datasets, downloadHistory]);

  return (
    <div style={{ width: "100%", minHeight: 270 }}>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="var(--gray-300)" />
          <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: "var(--gray-500)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            stroke="var(--green)"
            fill="var(--green)"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
        Your data interests based on uploads and downloads.
      </div>
    </div>
  );
}
