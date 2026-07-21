import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api/v1";

export default function WatchButton({ datasetId, datasetTitle }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!user || !datasetId) return;

    let isMounted = true;
    fetch(`${API_BASE}/watchlist/is-watching/${datasetId}`)
      .then((res) => (res.ok ? res.json() : { is_watching: false }))
      .then((data) => {
        if (isMounted) {
          setIsWatching(Boolean(data.is_watching));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [datasetId, user]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg("");
    }, 2000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const handleClick = async (e) => {
    if (e) e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (loading || !datasetId) return;

    setLoading(true);
    try {
      if (!isWatching) {
        const res = await fetch(`${API_BASE}/watchlist/${datasetId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          setIsWatching(true);
          setToastMsg("Added to watchlist");
        }
      } else {
        const res = await fetch(`${API_BASE}/watchlist/${datasetId}`, {
          method: "DELETE",
        });
        if (res.ok || res.status === 204) {
          setIsWatching(false);
          setToastMsg("Removed from watchlist");
        }
      }
    } catch (err) {
      console.error("Watch button error:", err);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    height: 34,
    borderRadius: 8,
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    transition: "all 0.2s ease",
    border: isWatching
      ? "1.5px solid var(--green)"
      : "1.5px solid var(--gray-300)",
    background: isWatching ? "var(--green-pale, #e8f5ef)" : "#ffffff",
    color: isWatching ? "var(--green)" : "var(--gray-600)",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        style={buttonStyle}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isWatching ? (
          <EyeOff size={15} />
        ) : (
          <Eye size={15} />
        )}
        <span>{isWatching ? "Watching" : "Watch"}</span>
      </button>

      {/* Internal Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--gray-900, #111827)",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            animation: "wbFadeIn 0.2s ease-out",
          }}
        >
          {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes wbFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
