import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export default function WatchButton({ datasetId, datasetTitle }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isWatching, setIsWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!user || !datasetId) return;

    let isMounted = true;
    const token = localStorage.getItem("access_token");
    fetch(`${API_BASE}/watchlist/is-watching/${datasetId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!token) return { is_watching: false };
        return res.ok ? res.json() : { is_watching: false };
      })
      .catch(() => ({ is_watching: false }))
      .then((data) => {
        if (isMounted) {
          setIsWatching(Boolean(data.is_watching));
        }
      });

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

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        if (res.ok) {
          setIsWatching(true);
          setToastMsg("Added to watchlist");
        } else if (res.status === 401 || res.status === 403) {
          navigate("/login");
        } else {
          setToastMsg("Could not update watchlist");
        }
      } else {
        const res = await fetch(`${API_BASE}/watchlist/${datasetId}`, {
          method: "DELETE",
          headers: authHeaders(),
        });
        if (res.ok || res.status === 204 || res.status === 404) {
          setIsWatching(false);
          setToastMsg("Removed from watchlist");
        } else if (res.status === 401 || res.status === 403) {
          navigate("/login");
        } else {
          setToastMsg("Could not update watchlist");
        }
      }
    } catch (err) {
      console.error("Watch button error:", err);
      setToastMsg("Could not update watchlist");
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
      : "1.5px solid var(--border-default)",
    background: isWatching ? "var(--green-pale, #e8f5ef)" : "var(--surface-card)",
    color: isWatching ? "var(--green)" : "var(--text-secondary)",
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
            background: "var(--surface-elevated, #111827)",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.15))",
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
