import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoriesApi } from "../services/api";
import {
  BarChart2,
  Building2,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  LayoutGrid,
  Leaf,
  Scale,
  TrendingUp,
  Users,
  Wind,
  Zap,
} from "lucide-react";

const ICONS = {
  BarChart2,
  Building2,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  Leaf,
  Scale,
  TrendingUp,
  Users,
  Wind,
  Zap,
};

function hexToRgba(hex, alpha = 0.09) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(0,107,63,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoriesApi
      .list()
      .then((response) => {
        if (!cancelled) setCategories(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (b.dataset_count || 0) - (a.dataset_count || 0));
  }, [categories]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 16px 56px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          padding: "38px 32px",
          marginBottom: 24,
          background:
            "linear-gradient(135deg, var(--surface-card) 0%, var(--surface-elevated) 62%, rgba(0,163,92,0.10) 100%)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            right: -90,
            top: -110,
            background: "radial-gradient(circle, rgba(0,163,92,0.16), transparent 68%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 11px",
              borderRadius: 999,
              background: "var(--green-pale)",
              color: "var(--green)",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            <LayoutGrid size={13} /> Data Discovery
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Browse by Category
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 620 }}>
            Explore Ghana data organised by topic.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: "center", borderRadius: 18 }}>
          <span className="spinner" />
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", borderRadius: 18 }}>
          <LayoutGrid size={42} color="var(--text-muted)" />
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
            No categories yet
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
            Seed the official categories to start browsing Ghana data by topic.
          </div>
        </div>
      ) : (
        <div
          className="categories-icon-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {sortedCategories.map((category) => {
            const colour = category.colour || "#006B3F";
            const Icon = ICONS[category.icon] || LayoutGrid;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => navigate(`/catalogue?category=${category.id}`)}
                style={{
                  minHeight: 238,
                  background: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 16,
                  boxShadow: "var(--shadow-sm)",
                  padding: "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  color: "inherit",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-4px)";
                  event.currentTarget.style.boxShadow = "var(--shadow-md)";
                  event.currentTarget.style.borderColor = hexToRgba(colour, 0.35);
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "none";
                  event.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  event.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: hexToRgba(colour, 0.09),
                    color: colour,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={28} />
                </div>
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 900, color: "var(--dark)", lineHeight: 1.3 }}>
                  {category.name}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {category.description || "Explore datasets in this topic area."}
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: "var(--green)", fontWeight: 900 }}>
                  {Number(category.dataset_count || 0).toLocaleString()} datasets
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .categories-icon-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
