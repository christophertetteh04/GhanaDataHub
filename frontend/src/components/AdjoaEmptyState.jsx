import { Sparkles } from "lucide-react";

function AdjoaFace() {
  return (
    <svg viewBox="0 0 48 48" width="58" height="58" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="rgba(255,255,255,0.24)" />
      <path d="M12 17 Q24 6 36 17" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="17" cy="22" r="3" fill="white" />
      <circle cx="31" cy="22" r="3" fill="white" />
      <path d="M 16 31 Q 24 36 32 31" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function AdjoaEmptyState({
  message = "No datasets yet - be the first to upload Ghana data.",
  actionLabel = "Upload a Dataset",
  onAction = null,
}) {
  return (
    <div style={{ padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FCD116, #E6AA00)",
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(252,209,22,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AdjoaFace />
        </div>
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "var(--surface-card, white)",
            borderRadius: "12px 12px 0 12px",
            padding: "4px 8px",
            fontSize: 10,
            fontWeight: 800,
            color: "var(--green)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Sparkles size={10} />
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, var(--dark))", marginTop: 16 }}>
        Nothing here yet
      </div>
      <div style={{ fontSize: 14, color: "var(--text-secondary, var(--gray-500))", maxWidth: 320, lineHeight: 1.6, marginTop: 8 }}>
        {message}
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            height: 44,
            borderRadius: 10,
            border: "none",
            background: "var(--green)",
            color: "white",
            padding: "0 18px",
            marginTop: 20,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
