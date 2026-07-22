import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function triggerCelebration() {
  window.dispatchEvent(new CustomEvent("gdh:first-upload"));
}

function KwekuMiniFace() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.2)" />
      <circle cx="14" cy="16" r="3" fill="white" />
      <circle cx="26" cy="16" r="3" fill="white" />
      <path d="M 12 24 Q 20 30 28 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function CelebrationToast() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = () => {
    setIsExiting(true);
    window.setTimeout(() => {
      setShow(false);
      setIsExiting(false);
    }, 300);
  };

  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem("gdh_has_uploaded")) return;
      localStorage.setItem("gdh_has_uploaded", "true");
      setIsExiting(false);
      setShow(true);
    };
    window.addEventListener("gdh:first-upload", handler);
    return () => window.removeEventListener("gdh:first-upload", handler);
  }, []);

  useEffect(() => {
    if (!show) return undefined;
    const timer = window.setTimeout(dismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  const confetti = Array.from({ length: 12 }, (_, index) => {
    const colors = ["white", "var(--gold)", "rgba(255,255,255,0.6)"];
    return (
      <span
        key={index}
        style={{
          position: "absolute",
          top: `${8 + (index % 4) * 8}px`,
          left: `${18 + index * 20}px`,
          width: 4,
          height: 4,
          borderRadius: 2,
          background: colors[index % colors.length],
          animation: "confetti-fall 1.2s ease-out forwards",
          animationDelay: `${index * 0.1}s`,
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 900,
        width: 300,
        animation: isExiting
          ? "character-slide-out 0.3s ease forwards"
          : "character-slide-in 0.4s ease-out forwards",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, var(--green), #00A35C)",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 8px 32px rgba(0,107,63,0.35)",
          overflow: "hidden",
        }}
      >
        {confetti}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <KwekuMiniFace />
          </div>
          <div>
            <div style={{ color: "white", fontSize: 14, fontWeight: 800 }}>Congratulations!</div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
              You just uploaded your first dataset to GhanaDataHub. You are helping build Ghana data future.
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8, position: "relative", zIndex: 1 }}>
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate("/datasets");
            }}
            style={{
              height: 32,
              borderRadius: 8,
              border: "none",
              padding: "0 12px",
              background: "white",
              color: "var(--green)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            View Dataset
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{
              height: 32,
              borderRadius: 8,
              border: "none",
              padding: "0 12px",
              background: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
