import { useMemo, useState } from "react";

const CELL = 11;
const GAP = 3;
const LEFT_GUTTER = 30;
const TOP_GUTTER = 18;
const COLS = 53;
const ROWS = 7;
const WIDTH = LEFT_GUTTER + COLS * (CELL + GAP);
const HEIGHT = TOP_GUTTER + ROWS * (CELL + GAP) + 34;

const LEVELS = [
  "#EBEDF0",
  "#C6E48B",
  "#7BC96F",
  "#239A3B",
  "var(--green)",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-${pad(weekNo)}`;
}

function activityColour(count) {
  if (!count) return LEVELS[0];
  if (count === 1) return LEVELS[1];
  if (count <= 3) return LEVELS[2];
  if (count <= 5) return LEVELS[3];
  return LEVELS[4];
}

function formatTooltipDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ActivityHeatmap({ uploadWeeks = {}, downloadWeeks = {} }) {
  const [tooltip, setTooltip] = useState(null);

  const { days, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 364);

    const generatedDays = [];
    const labels = [];
    let lastMonth = null;

    for (let index = 0; index < COLS * ROWS; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      if (current > today) break;

      const col = Math.floor(index / ROWS);
      const row = current.getDay();
      const weekKey = getISOWeekKey(current);
      const count = (uploadWeeks[weekKey] || 0) + (downloadWeeks[weekKey] || 0);
      const month = current.getMonth();

      if (month !== lastMonth && row <= 2) {
        labels.push({
          label: current.toLocaleDateString(undefined, { month: "short" }),
          x: LEFT_GUTTER + col * (CELL + GAP),
        });
        lastMonth = month;
      }

      generatedDays.push({
        date: toDateKey(current),
        count,
        x: LEFT_GUTTER + col * (CELL + GAP),
        y: TOP_GUTTER + row * (CELL + GAP),
      });
    }

    return { days: generatedDays, monthLabels: labels };
  }, [uploadWeeks, downloadWeeks]);

  return (
    <div style={{ position: "relative", overflowX: "auto", paddingBottom: 4 }}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label="Activity heatmap for the last 52 weeks"
        style={{ display: "block" }}
      >
        {monthLabels.map((month) => (
          <text key={`${month.label}-${month.x}`} x={month.x} y={10} fontSize="10" fill="var(--text-muted)">
            {month.label}
          </text>
        ))}

        {[
          { label: "Mon", row: 1 },
          { label: "Wed", row: 3 },
          { label: "Fri", row: 5 },
        ].map((day) => (
          <text
            key={day.label}
            x={0}
            y={TOP_GUTTER + day.row * (CELL + GAP) + 9}
            fontSize="10"
            fill="var(--text-muted)"
          >
            {day.label}
          </text>
        ))}

        {days.map((day) => (
          <rect
            key={day.date}
            x={day.x}
            y={day.y}
            width={CELL}
            height={CELL}
            rx="2"
            fill={activityColour(day.count)}
            stroke="var(--border-subtle)"
            onMouseEnter={(event) => {
              setTooltip({
                x: event.clientX + 12,
                y: event.clientY - 42,
                date: day.date,
                count: day.count,
              });
            }}
            onMouseMove={(event) => {
              setTooltip((current) => current ? { ...current, x: event.clientX + 12, y: event.clientY - 42 } : null);
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        <text x={LEFT_GUTTER} y={HEIGHT - 10} fontSize="10" fill="var(--text-muted)">
          Less
        </text>
        {LEVELS.map((colour, index) => (
          <rect
            key={colour}
            x={LEFT_GUTTER + 28 + index * 15}
            y={HEIGHT - 20}
            width={CELL}
            height={CELL}
            rx="2"
            fill={colour}
            stroke="var(--border-subtle)"
          />
        ))}
        <text x={LEFT_GUTTER + 108} y={HEIGHT - 10} fontSize="10" fill="var(--text-muted)">
          More
        </text>
      </svg>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: "none",
            zIndex: 1000,
            background: "var(--surface-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontWeight: 800 }}>{formatTooltipDate(tooltip.date)}</div>
          <div style={{ color: tooltip.count ? "var(--green)" : "var(--text-muted)", marginTop: 2 }}>
            {tooltip.count ? `${tooltip.count} activities` : "No activity"}
          </div>
        </div>
      )}
    </div>
  );
}
