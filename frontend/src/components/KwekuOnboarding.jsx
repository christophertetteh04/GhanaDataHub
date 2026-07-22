import { useState } from "react";
import { ArrowRight, X } from "lucide-react";

const steps = [
  {
    title: "Welcome to GhanaDataHub!",
    message:
      "Hi, I am Kweku, your data guide. GhanaDataHub is Ghana's first centralised data portal. Let me show you around in 30 seconds.",
    highlight: null,
  },
  {
    title: "Discover Ghana Data",
    message:
      "Browse hundreds of datasets covering Ghana economy, health, education, agriculture, and governance. All free to download.",
    highlight: "datasets",
  },
  {
    title: "Upload Your Own Data",
    message:
      "Have data to share? Upload it here. Your datasets will be searchable by researchers, journalists, and organisations across Ghana.",
    highlight: "upload",
  },
  {
    title: "Track What Matters",
    message:
      "Save datasets to get notified of updates. Follow categories for personalised recommendations. The platform learns what you care about.",
    highlight: null,
  },
];

function KwekuFace({ size = 48 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.2)" />
      <circle cx="14" cy="16" r="3" fill="white" />
      <circle cx="26" cy="16" r="3" fill="white" />
      <path
        d="M 12 24 Q 20 30 28 24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function readOnboardingComplete() {
  try {
    return localStorage.getItem("gdh_onboarding_complete") === "true";
  } catch {
    return true;
  }
}

function writeOnboardingComplete() {
  try {
    localStorage.setItem("gdh_onboarding_complete", "true");
  } catch {
    // Onboarding state is optional; storage failures should not break login.
  }
}

export default function KwekuOnboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(
    () => !readOnboardingComplete()
  );
  const [isExiting, setIsExiting] = useState(false);

  function dismiss() {
    writeOnboardingComplete();
    setIsExiting(true);
    window.setTimeout(() => setIsVisible(false), 300);
  }

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 500,
        width: 320,
        animation: isExiting
          ? "character-slide-out 0.3s ease forwards"
          : "character-slide-in 0.4s ease-out forwards",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "var(--surface-card, white)",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "visible",
          border: "1px solid var(--border-subtle, rgba(0,0,0,0.06))",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -36,
            left: "50%",
            transform: "translateX(-50%)",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--green), #00A35C)",
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,107,63,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KwekuFace />
        </div>

        <div style={{ padding: "48px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, index) => (
              <span
                key={index}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: index === step ? "var(--green)" : "var(--gray-300)",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss onboarding"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.06)",
              color: "var(--text-secondary, var(--gray-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, var(--dark))", marginBottom: 6 }}>
            {steps[step].title}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, var(--gray-600))", lineHeight: 1.6 }}>
            {steps[step].message}
          </div>
        </div>

        <div style={{ padding: "16px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={dismiss}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-muted, var(--gray-400))",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : dismiss())}
            style={{
              height: 32,
              borderRadius: 8,
              border: "none",
              padding: "0 16px",
              background: "var(--green)",
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            {step < steps.length - 1 ? "Next" : "Get Started!"}
            {step < steps.length - 1 && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
