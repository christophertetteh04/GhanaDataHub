import { Link } from "react-router-dom";
import { Download, ExternalLink, Scale, X } from "lucide-react";

function truncateTitle(value = "") {
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}

export default function AttributionModal({ isOpen, onClose, onConfirmDownload, dataset }) {
  if (!isOpen || !dataset?.source_attribution) return null;

  const sourceUrl = dataset.source_url || dataset.source_url_original || dataset.url;
  const licenceName = dataset.licence || dataset.license || "Open Data Commons Attribution Licence";
  const licenceUrl = dataset.licence_url || dataset.license_url || "https://opendatacommons.org/licenses/by/1.0/";

  return (
    <div
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "attributionModalFade 0.2s ease forwards",
      }}
    >
      <style>{`
        @keyframes attributionModalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attribution-modal-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, 94vw)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 20 }}>
          <div id="attribution-modal-title" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 900 }}>
            <Scale size={20} color="var(--green)" /> Data Attribution
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close attribution modal"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.06)",
              color: "var(--text-secondary)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {truncateTitle(dataset.title)}
          </div>
          {dataset.category && (
            <span className="badge badge-blue" style={{ flexShrink: 0 }}>
              {dataset.category?.name || dataset.category}
            </span>
          )}
        </div>

        <div style={{ background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 16, marginTop: 12 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase" }}>
            Source Organisation
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", marginTop: 5 }}>
            {dataset.source_attribution}
          </div>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, color: "var(--green)", fontSize: 12, textDecoration: "none" }}>
              <ExternalLink size={12} /> Source URL
            </a>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)" }}>
            Licence:{" "}
            <a href={licenceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 800 }}>
              {licenceName}
            </a>
          </div>
        </div>

        <p style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
          By downloading this dataset you agree to acknowledge the source in any work that uses this data. This is required by the Open Data Commons Attribution Licence.
        </p>

        <Link to="/sources" style={{ color: "var(--green)", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
          View all our data sources →
        </Link>

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid var(--border-default)",
              background: "transparent",
              color: "var(--text-secondary)",
              padding: "0 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDownload}
            style={{
              height: 44,
              borderRadius: 10,
              border: "none",
              background: "var(--green)",
              color: "white",
              padding: "0 16px",
              fontWeight: 900,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <Download size={16} /> Download with Attribution
          </button>
        </div>
      </div>
    </div>
  );
}
