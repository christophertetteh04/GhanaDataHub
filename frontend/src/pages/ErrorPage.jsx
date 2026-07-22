function CharacterFace({ character }) {
  const isAdjoa = character === "adjoa";
  return (
    <svg viewBox="0 0 64 64" width="78" height="78" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="rgba(255,255,255,0.22)" />
      {isAdjoa ? (
        <>
          <path d="M16 24 Q32 10 48 24" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="30" r="4" fill="white" />
          <circle cx="42" cy="28" r="4" fill="white" />
          <path d="M 22 43 Q 32 49 42 43" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="24" cy="27" r="4" fill="white" />
          <circle cx="42" cy="27" r="4" fill="white" />
          <path d="M 22 42 Q 32 36 42 42" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M45 47 L52 54" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

const ERROR_CONTENT = {
  404: {
    character: "adjoa",
    title: "This page does not exist yet",
    message: "The page you are looking for may have been moved or deleted. Adjoa looked everywhere - it is not here.",
    primaryLabel: "Back to Dashboard",
  },
  500: {
    character: "kweku",
    title: "Something went wrong on our end",
    message: "Kweku is investigating. Our team has been notified. Please try again in a few minutes.",
    primaryLabel: "Refresh the page",
    secondaryLabel: "Back to Dashboard",
  },
  network: {
    character: "kweku",
    title: "Connection problem",
    message: "Could not reach GhanaDataHub. Check your internet connection and try again.",
    primaryLabel: "Try again",
  },
};

export default function ErrorPage({ code = 404 }) {
  const content = ERROR_CONTENT[code] || ERROR_CONTENT[404];
  const isAdjoa = content.character === "adjoa";

  const primaryAction = () => {
    if (code === 404) window.location.href = "/dashboard";
    else window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface-base, var(--gray-100))",
        padding: 24,
        position: "relative",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            transform: "translateY(-28px)",
            fontSize: 80,
            fontWeight: 900,
            color: "var(--green)",
            opacity: 0.15,
            lineHeight: 1,
          }}
        >
          {code}
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: isAdjoa
              ? "linear-gradient(135deg, #FCD116, #E6AA00)"
              : "linear-gradient(135deg, var(--green), #00A35C)",
            border: "4px solid white",
            boxShadow: isAdjoa
              ? "0 8px 24px rgba(252,209,22,0.28)"
              : "0 8px 24px rgba(0,107,63,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "wobble 2s ease-in-out infinite",
          }}
        >
          <CharacterFace character={content.character} />
        </div>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary, var(--dark))", marginTop: 24, marginBottom: 0 }}>
        {content.title}
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary, var(--gray-500))", maxWidth: 380, lineHeight: 1.7, marginTop: 10, marginBottom: 0 }}>
        {content.message}
      </p>
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={primaryAction}
          style={{
            height: 44,
            borderRadius: 10,
            border: "none",
            background: "var(--green)",
            color: "white",
            padding: "0 18px",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {content.primaryLabel}
        </button>
        {code === 500 && (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            style={{
              height: 44,
              borderRadius: 10,
              border: "1.5px solid var(--green)",
              background: "transparent",
              color: "var(--green)",
              padding: "0 18px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {content.secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
