import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Heart } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function ResourceLink({ href, children }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--border-default)",
        borderRadius: 999,
        padding: "7px 11px",
        color: "var(--green)",
        fontSize: 13,
        fontWeight: 700,
        textDecoration: "none",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "var(--green)";
        event.currentTarget.style.background = "var(--green-pale)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = "var(--border-default)";
        event.currentTarget.style.background = "transparent";
      }}
    >
      {children}
      <ExternalLink size={12} />
    </a>
  );
}

export default function HealthInsightCard({ datasetId, datasetTitle }) {
  const [insight, setInsight] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!datasetId) {
      setInsight(null);
      setIsLoaded(true);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoaded(false);

    fetch(`${API_BASE}/datasets/${datasetId}/health-insight`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Health insight request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setInsight(data || null);
        setIsLoaded(true);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.warn("Unable to load health insight", error);
        setInsight(null);
        setIsLoaded(true);
      });

    return () => controller.abort();
  }, [datasetId, datasetTitle]);

  if (!isLoaded || !insight) return null;

  const colour = insight.category_colour || "#DC2626";

  return (
    <section
      aria-label={`Health insight for ${datasetTitle || "dataset"}`}
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${colour}33`,
        borderLeft: `4px solid ${colour}`,
        borderRadius: 14,
        padding: "20px 24px",
        margin: "20px 0",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Heart size={16} color={colour} />
          <h3
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {insight.title}
          </h3>
        </div>
        <span
          style={{
            borderRadius: 999,
            background: `${colour}1F`,
            color: colour,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.4,
            padding: "5px 9px",
            textTransform: "uppercase",
          }}
        >
          Health Awareness
        </span>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          color: "var(--text-secondary)",
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        {insight.data_context}
      </p>

      {Array.isArray(insight.actions) && insight.actions.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            What you can do
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            {insight.actions.map((action) => (
              <div
                key={action}
                style={{
                  display: "grid",
                  gridTemplateColumns: "14px 1fr",
                  gap: 9,
                  alignItems: "start",
                }}
              >
                <CheckCircle2 size={14} color={colour} style={{ marginTop: 2 }} />
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 16,
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 12,
        }}
      >
        <ResourceLink href={insight.resource_url}>
          {insight.resource_label || "Ghana Health Service"}
        </ResourceLink>
        <ResourceLink href={insight.who_url}>WHO Ghana</ResourceLink>
      </div>

      <div
        style={{
          marginTop: 12,
          color: "var(--text-muted)",
          fontSize: 11,
          fontStyle: "italic",
          lineHeight: 1.5,
        }}
      >
        This awareness note is for general information only and does not constitute medical advice.
        Consult a qualified health professional for personal medical decisions.
      </div>
    </section>
  );
}
