import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const MONTH_ABBR = [
  "JAN","FEB","MAR","APR","MAY","JUN",
  "JUL","AUG","SEP","OCT","NOV","DEC",
];

function getDaysUntil(dateStr) {
  const eventDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((eventDate - today) / 86400000);
}

function DaysUntilBadge({ daysUntil }) {
  let bg, color, text;
  if (daysUntil === 0) {
    bg = "var(--green)"; color = "#fff"; text = "Today";
  } else if (daysUntil === 1) {
    bg = "#fef08a"; color = "#854d0e"; text = "Tomorrow";
  } else if (daysUntil < 0) {
    bg = "var(--surface-base)"; color = "var(--text-muted)"; text = "Past";
  } else if (daysUntil <= 7) {
    bg = "#fed7aa"; color = "#9a3412"; text = `${daysUntil} days`;
  } else {
    bg = "#e5e7eb"; color = "#6b7280"; text = `${daysUntil} days`;
  }
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 20,
      padding: "2px 8px",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {text}
    </span>
  );
}

function ImportanceBadge({ importance }) {
  const map = {
    high: { bg: "#fee2e2", color: "#b91c1c", label: "HIGH" },
    medium: { bg: "#fef9c3", color: "#a16207", label: "MED" },
    low: { bg: "#dcfce7", color: "#15803d", label: "LOW" },
  };
  const { bg, color, label } = map[importance] || map.low;
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 9,
      fontWeight: 700,
      borderRadius: 20,
      padding: "2px 6px",
      letterSpacing: "0.04em",
    }}>
      {label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      padding: "12px 18px",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
      gap: 12,
    }}>
      <div style={{
        width: 40, height: 46, borderRadius: 8,
        background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "ec-shimmer 1.4s infinite",
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          height: 12, borderRadius: 4, width: "70%",
          background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "ec-shimmer 1.4s infinite",
        }} />
        <div style={{
          height: 10, borderRadius: 4, width: "45%",
          background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "ec-shimmer 1.4s infinite 0.1s",
        }} />
      </div>
    </div>
  );
}

export default function EconomicCalendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchEvents = async (upcomingOnly = true) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/calendar/events?upcoming_only=${upcomingOnly}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
  }, []);

  const handleViewAll = () => {
    setShowAll(true);
    fetchEvents(false);
  };

  const displayEvents = showAll ? events : events.slice(0, 5);

  return (
    <>
      <style>{`
        @keyframes ec-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ec-event-row:hover {
          background: var(--surface-base);
          cursor: pointer;
        }
        .ec-event-row:last-child {
          border-bottom: none;
        }
      `}</style>

      <div style={{
        background: "var(--surface-card)",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
        padding: 0,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid var(--gray-100)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CalendarDays size={16} color="var(--green)" strokeWidth={2.2} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--gray-900)" }}>
              Economic Calendar
            </span>
          </div>
          <button
            onClick={showAll ? undefined : handleViewAll}
            disabled={showAll}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: showAll ? "var(--gray-300)" : "var(--green)",
              cursor: showAll ? "default" : "pointer",
              fontWeight: 500,
            }}
          >
            {showAll ? "All events" : "View all"}
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : displayEvents.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 18px",
            gap: 10,
            color: "var(--gray-500)",
          }}>
            <CalendarDays size={32} color="var(--gray-300)" />
            <span style={{ fontSize: 12, textAlign: "center" }}>
              No upcoming events in the next 90 days.
            </span>
          </div>
        ) : (
          displayEvents.map((event) => {
            const d = new Date(event.date + "T00:00:00");
            const day = d.getDate();
            const month = MONTH_ABBR[d.getMonth()];
            const daysUntil = getDaysUntil(event.date);

            return (
              <div
                key={event.id}
                className="ec-event-row"
                onClick={() =>
                  navigate(`/datasets?search=${encodeURIComponent(event.search_term)}`)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                  gap: 0,
                  transition: "background 0.15s",
                }}
              >
                {/* Date block */}
                <div style={{
                  width: 40,
                  textAlign: "center",
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--gray-900)",
                    lineHeight: 1.1,
                  }}>
                    {day}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--green)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {month}
                  </div>
                </div>

                {/* Event details */}
                <div style={{
                  flex: 1,
                  paddingLeft: 12,
                  minWidth: 0,
                }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--gray-900)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                    marginBottom: 3,
                  }}>
                    {event.title}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: "var(--gray-500)",
                      whiteSpace: "nowrap",
                    }}>
                      {event.source}&nbsp;·&nbsp;{event.category}
                    </span>
                    <ImportanceBadge importance={event.importance} />
                  </div>
                </div>

                {/* Days until */}
                <div style={{ paddingLeft: 8, flexShrink: 0 }}>
                  <DaysUntilBadge daysUntil={daysUntil} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
