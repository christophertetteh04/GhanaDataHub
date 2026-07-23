import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database, ExternalLink, Newspaper } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(value) {
  if (!value) return "recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function BriefSkeleton() {
  return (
    <div className="daily-brief-card" aria-label="Loading Ghana Data Brief">
      <style>{briefStyles}</style>
      <div className="daily-brief-header">
        <div className="brief-sk brief-sk-title" />
        <div className="brief-sk brief-sk-date" />
      </div>
      <div className="daily-brief-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="daily-brief-indicator">
            <div className="brief-sk brief-sk-label" />
            <div className="brief-sk brief-sk-link" />
            <div className="brief-sk brief-sk-small" />
          </div>
        ))}
      </div>
      <div className="daily-brief-platform-row">
        <div className="brief-sk brief-sk-platform" />
      </div>
    </div>
  );
}

export default function DailyBriefCard() {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchBrief() {
      try {
        const response = await fetch(`${API_BASE}/brief/daily`);
        if (!response.ok) throw new Error(`Brief request failed: ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setBrief(data);
          setError(false);
        }
      } catch (err) {
        console.error("Unable to load daily brief", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBrief();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <BriefSkeleton />;

  const indicators = brief?.indicators || [];
  const dateLabel = brief ? `${brief.day_of_week || ""}, ${formatDate(brief.date)}` : "Today";
  const newCount = Number(brief?.new_datasets_today || 0);
  const totalCount = Number(brief?.total_datasets || 0);

  return (
    <div className="daily-brief-card">
      <style>{briefStyles}</style>

      <div className="daily-brief-header">
        <div className="daily-brief-title">
          <Newspaper size={14} />
          <span>Ghana Data Brief</span>
        </div>
        <div className="daily-brief-date">{dateLabel}</div>
      </div>

      {error ? (
        <div className="daily-brief-error">
          Daily brief is temporarily unavailable. Run the briefing pipeline and refresh.
        </div>
      ) : (
        <>
          <div className="daily-brief-grid">
            {indicators.map((indicator) => (
              <div key={indicator.label} className="daily-brief-indicator">
                <div className="daily-brief-label">{indicator.label}</div>
                {indicator.status === "live" && indicator.dataset_id ? (
                  <>
                    <Link className="daily-brief-link" to={`/datasets/${indicator.dataset_id}`}>
                      View data <ExternalLink size={12} />
                    </Link>
                    <div className="daily-brief-muted">
                      Updated {timeAgo(indicator.updated_at)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="daily-brief-unavailable">No data today</div>
                    <div className="daily-brief-muted">Run pipeline.py to update</div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="daily-brief-platform-row">
            <div className="daily-brief-platform-left">
              <Database size={14} color="var(--green)" />
              <span>
                {newCount > 0
                  ? `${newCount} new dataset${newCount === 1 ? "" : "s"} added today`
                  : "No new datasets today - run pipeline.py"}
              </span>
            </div>
            <div className="daily-brief-total">{totalCount.toLocaleString()} total</div>
          </div>
        </>
      )}
    </div>
  );
}

const briefStyles = `
  .daily-brief-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
    overflow: hidden;
    margin: 20px 28px 0;
  }

  .daily-brief-header {
    background: var(--green);
    color: white;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .daily-brief-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 800;
  }

  .daily-brief-date {
    font-size: 11px;
    color: rgba(255,255,255,0.75);
    white-space: nowrap;
  }

  .daily-brief-grid {
    padding: 14px 18px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .daily-brief-indicator {
    min-width: 0;
    border-radius: 10px;
    background: var(--surface-base);
    border: 1px solid var(--border-subtle);
    padding: 10px 12px;
  }

  .daily-brief-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 900;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .daily-brief-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--green);
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  .daily-brief-unavailable {
    color: var(--text-secondary);
    font-size: 11px;
    font-style: italic;
  }

  .daily-brief-muted {
    margin-top: 5px;
    color: var(--text-muted);
    font-size: 10px;
  }

  .daily-brief-platform-row {
    border-top: 1px solid var(--gray-100);
    padding: 12px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: var(--text-primary);
    font-size: 13px;
  }

  .daily-brief-platform-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .daily-brief-total {
    color: var(--green);
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }

  .daily-brief-error {
    padding: 18px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .brief-sk {
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(255,255,255,0.22) 25%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.22) 75%);
    background-size: 200% 100%;
    animation: brief-shimmer 1.4s infinite;
  }

  .daily-brief-indicator .brief-sk {
    background: linear-gradient(90deg, var(--surface-elevated) 25%, var(--border-subtle) 50%, var(--surface-elevated) 75%);
    background-size: 200% 100%;
  }

  .brief-sk-title { width: 140px; height: 14px; }
  .brief-sk-date { width: 90px; height: 11px; }
  .brief-sk-label { width: 70px; height: 10px; margin-bottom: 10px; }
  .brief-sk-link { width: 84px; height: 13px; margin-bottom: 8px; }
  .brief-sk-small { width: 58px; height: 9px; }
  .brief-sk-platform { width: 230px; height: 13px; }

  @keyframes brief-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 768px) {
    .daily-brief-card {
      margin: 16px 16px 0;
    }
    .daily-brief-grid {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .daily-brief-grid::-webkit-scrollbar {
      display: none;
    }
    .daily-brief-indicator {
      min-width: 150px;
    }
    .daily-brief-platform-row {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
