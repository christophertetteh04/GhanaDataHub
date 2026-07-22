import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("gdh_theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("gdh_theme", theme);
    } catch {
      // Ignore storage failures; the applied data-theme still works.
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid var(--border-default)",
        background: "var(--surface-elevated)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        transition: "all 0.2s ease",
      }}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
