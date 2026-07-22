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
  if (Number.isNaN(eventDate.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((eventDate - today) / 86400000);
}

function DaysUntilBadge({ daysUntil }) {
  let bg, color, text;
  if (daysUntil === null) {
    bg = "var(--surface-elevated)"; color = "var(--text-muted)"; text = "TBA";
  } else if (daysUntil === 0) {
    bg = "var(--green)"; color = "#fff"; text = "Today";
  } else if (daysUntil === 1) {
    bg = "rgba(252, 209, 22, 0.18)"; color = "var(--gold, #D97706)"; text = "Tomorrow";
  } else if (daysUntil < 0) {
    bg = "var(--surface-base)"; color = "var(--text-muted)"; text = "Past";
  } else if (daysUntil <= 7) {
    bg = "rgba(217, 119, 6, 0.14)"; color = "#D97706"; text = `${daysUntil} days`;
  } else {
    bg = "var(--surface-elevated)"; color = "var(--text-secondary)"; text = `${daysUntil} days`;
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
    high: { bg: "rgba(220, 38, 38, 0.12)", color: "#DC2626", label: "HIGH" },
    medium: { bg: "rgba(217, 119, 6, 0.14)", color: "#D97706", label: "MED" },
    low: { bg: "rgba(0, 163, 92, 0.12)", color: "var(--green)", label: "LOW" },
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
      borderBottom: "1px solid var(--border-subtle)",
      gap: 12,
    }}>
      <div style={{
        width: 40, height: 46, borderRadius: 8,
        background: "linear-gradient(90deg,var(--surface-base) 25%,var(--surface-elevated) 50%,var(--surface-base) 75%)",
        backgroundSize: "200% 100%",
        animation: "ec-shimmer 1.4s infinite",
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          height: 12, borderRadius: 4, width: "70%",
          background: "linear-gradient(90deg,var(--surface-base) 25%,var(--surface-elevated) 50%,var(--surface-base) 75%)",
          backgroundSize: "200% 100%",
          animation: "ec-shimmer 1.4s infinite",
        }} />
        <div style={{
          height: 10, borderRadius: 4, width: "45%",
          background: "linear-gradient(90deg,var(--surface-base) 25%,var(--surface-elevated) 50%,var(--surface-base) 75%)",
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

  const fetchEvents = async (upcomingOnly = true, { silent = false } = {}) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
  }, []);

  useEffect(() => {
    const refreshId = window.setInterval(() => {
      fetchEvents(!showAll, { silent: true });
    }, 30 * 60 * 1000);

    const handleFocus = () => fetchEvents(!showAll, { silent: true });
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [showAll]);

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
        border: "1px solid var(--border-subtle)",
        padding: 0,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CalendarDays size={16} color="var(--green)" strokeWidth={2.2} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
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
              color: showAll ? "var(--text-muted)" : "var(--green)",
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
            color: "var(--text-secondary)",
          }}>
            <CalendarDays size={32} color="var(--text-muted)" />
            <span style={{ fontSize: 12, textAlign: "center" }}>
              No scheduled economic events available.
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
                  borderBottom: "1px solid var(--border-subtle)",
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
                    color: "var(--text-primary)",
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
                    color: "var(--text-primary)",
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
                      color: "var(--text-secondary)",
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
