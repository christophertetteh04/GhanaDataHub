import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Database, BookOpen, Users, Vote, TrendingUp, Heart, Leaf, Wind, Share2 } from "lucide-react";
import { BLOG_POSTS } from "./BlogPage";

const CATEGORY_ICON = {
  Economy: TrendingUp,
  Health: Heart,
  Agriculture: Leaf,
  Demographics: Users,
  Governance: Vote,
  Environment: Wind,
};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BlogPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);

  const post = useMemo(
    () => BLOG_POSTS.find((item) => item.id === slug),
    [slug],
  );

  if (!post) {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", background: "var(--gray-100)", padding: 24, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 18 }}>Post not found</h2>
          <button onClick={() => navigate(-1)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--green)", background: "transparent", color: "var(--green)", cursor: "pointer" }}>Back</button>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICON[post.category] || BookOpen;

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${post.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "var(--gray-100)", padding: 24 }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, border: "none", background: "transparent", color: "var(--green)", cursor: "pointer", fontWeight: 700 }}
      >
        <ArrowLeft size={18} /> Back
      </button>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 24 }}>
        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: post.heroColor, minHeight: 320, display: "grid", placeItems: "center", padding: 24, color: "white" }}>
          <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: 999 }}>
            <Icon size={20} />
            <span style={{ fontWeight: 700 }}> {post.category}</span>
          </div>
          <div style={{ maxWidth: 680, textAlign: "center" }}>
            <h1 style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 800, marginBottom: 18 }}>{post.title}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
              <span>{post.author}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShare}
            style={{ position: "absolute", top: 24, right: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.12)", color: "white", cursor: "pointer" }}
          >
            <Share2 size={16} /> {copied ? "Copied" : "Share"}
          </button>
        </div>

        <div style={{ background: "white", borderRadius: 20, boxShadow: "var(--shadow-md)", padding: 28 }}>
          <div style={{ display: "grid", gap: 18 }}>
            {post.body.split("\n\n").map((paragraph, idx) => (
              <p key={idx} style={{ margin: 0, color: "#374151", fontSize: 16, lineHeight: 1.9 }}>{paragraph}</p>
            ))}
          </div>
          <div style={{ marginTop: 28, borderRadius: 16, padding: 22, background: "#f9fafb", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Database size={24} style={{ color: "var(--green)" }} />
              <div>
                <div style={{ fontWeight: 700, color: "var(--gray-900)" }}>Related Dataset</div>
                <div style={{ color: "var(--gray-500)", fontSize: 14 }}>Explore the data behind this story.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/datasets")}
              style={{ width: "fit-content", padding: "10px 16px", borderRadius: 12, border: "none", background: "var(--green)", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              View Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
