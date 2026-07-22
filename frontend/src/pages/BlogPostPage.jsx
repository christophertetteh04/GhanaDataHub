import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Bot, Database, BookOpen, Lightbulb, Sparkles, Users, Vote, TrendingUp, Heart, Leaf, Wind, Share2 } from "lucide-react";
import { BLOG_POSTS, buildStoryFromDataset, normalizeInsightPost } from "./BlogPage";
import GhanaRegionMap from "../components/GhanaRegionMap";
import { datasetsApi } from "../services/api";

/* HOW TO EMBED A REGIONAL MAP IN A DATA STORY:
 *
 * 1. Import the component:
 *    import GhanaRegionMap from '../components/GhanaRegionMap';
 *
 * 2. Add regionMap data to the blog post object in BlogPage.jsx:
 *    regionMap: {
 *      rows: [['Region','Value'],['Ashanti',45.2],...],
 *      title: 'Literacy Rate by Region',
 *    }
 *
 * 3. Render inside the blog post body:
 *    {post.regionMap && (
 *      <div style={{ margin: '24px 0' }}>
 *        <GhanaRegionMap
 *          rows={post.regionMap.rows}
 *          datasetTitle={post.regionMap.title}
 *          datasetId=''
 *          height={380}
 *        />
 *      </div>
 *    )}
 */

const CATEGORY_ICON = {
  Economy: TrendingUp,
  Health: Heart,
  Agriculture: Leaf,
  Demographics: Users,
  Governance: Vote,
  Environment: Wind,
};

function EvidenceVisual({ type = "line" }) {
  if (type === "map") {
    return (
      <svg viewBox="0 0 260 150" className="post-evidence-visual" aria-label="Ghana map preview">
        <path d="M122 12 181 25 224 64 207 119 153 139 93 130 48 98 63 45Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.72)" strokeWidth="4" />
        <path d="M122 12 126 70 63 45Z" fill="rgba(255,255,255,0.36)" />
        <path d="M126 70 181 25 224 64 166 85Z" fill="rgba(255,255,255,0.25)" />
        <path d="M126 70 166 85 153 139 93 130Z" fill="rgba(255,255,255,0.48)" />
      </svg>
    );
  }

  if (type === "bar") {
    return (
      <svg viewBox="0 0 260 150" className="post-evidence-visual" aria-label="Bar chart preview">
        {[44, 74, 54, 96, 82, 118, 101].map((height, index) => (
          <rect key={height + index} x={32 + index * 28} y={132 - height} width="15" height={height} rx="6" fill="rgba(255,255,255,0.7)" />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 150" className="post-evidence-visual" aria-label="Trend chart preview">
      <path d="M18 119 C48 102 66 110 91 83 C115 58 136 72 161 45 C190 14 211 31 241 18" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="7" strokeLinecap="round" />
      <path d="M18 126 C48 109 66 117 91 90 C115 65 136 79 161 52 C190 21 211 38 241 25 L241 142 L18 142Z" fill="rgba(255,255,255,0.16)" />
      <circle cx="161" cy="45" r="8" fill="white" />
    </svg>
  );
}

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
  const [livePost, setLivePost] = useState(null);
  const [loadingLivePost, setLoadingLivePost] = useState(false);
  const [livePostError, setLivePostError] = useState(null);

  const staticPost = useMemo(
    () => BLOG_POSTS.find((item) => item.id === slug),
    [slug],
  );
  const post = normalizeInsightPost(staticPost || livePost);

  useEffect(() => {
    let cancelled = false;

    async function fetchDatasetStory(datasetId) {
      setLoadingLivePost(true);
      setLivePostError(null);
      try {
        const { data } = await datasetsApi.get(datasetId);
        if (!cancelled) setLivePost(buildStoryFromDataset(data));
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load dataset story", error);
          setLivePost(null);
          setLivePostError("Unable to load this dataset story.");
        }
      } finally {
        if (!cancelled) setLoadingLivePost(false);
      }
    }

    setLivePost(null);
    setLivePostError(null);

    if (staticPost) {
      setLoadingLivePost(false);
      return () => {
        cancelled = true;
      };
    }

    if (slug?.startsWith("dataset-")) {
      fetchDatasetStory(slug.replace(/^dataset-/, ""));
    }

    return () => {
      cancelled = true;
    };
  }, [slug, staticPost]);

  if (loadingLivePost) {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", background: "var(--surface-base)", color: "var(--text-primary)", padding: 24, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          <BookOpen size={32} color="var(--green)" />
          <div style={{ marginTop: 12, fontWeight: 800, color: "var(--text-primary)" }}>Loading current data story...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "calc(100vh - 56px)", background: "var(--surface-base)", color: "var(--text-primary)", padding: 24, display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>Post not found</h2>
          {livePostError && <p style={{ color: "var(--text-secondary)", marginBottom: 18 }}>{livePostError}</p>}
          <button onClick={() => navigate(-1)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--green)", background: "transparent", color: "var(--green)", cursor: "pointer" }}>Back</button>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICON[post.category] || BookOpen;

  const handleShare = async () => {
    const url = `${window.location.origin}/insights/${post.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="blog-post-page" style={{ minHeight: "calc(100vh - 56px)", background: "var(--surface-base)", color: "var(--text-primary)", padding: 24 }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, border: "none", background: "transparent", color: "var(--green)", cursor: "pointer", fontWeight: 700 }}
      >
        <ArrowLeft size={18} /> Back
      </button>
      <div className="blog-post-shell" style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 24 }}>
        <div className="blog-post-hero" style={{ position: "relative", borderRadius: 24, overflow: "hidden", background: post.heroColor, minHeight: 420, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", alignItems: "center", gap: 24, padding: 36, color: "white" }}>
          <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", padding: "8px 12px", borderRadius: 999 }}>
            <Icon size={20} />
            <span style={{ fontWeight: 700 }}> {post.category}</span>
          </div>
          <div style={{ maxWidth: 620, position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 11px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", marginBottom: 16, fontSize: 12, fontWeight: 800 }}>
              <Sparkles size={14} /> DataGhana Insight
            </div>
            <h1 style={{ fontSize: 42, lineHeight: 1.02, fontWeight: 900, marginBottom: 18, letterSpacing: "-0.02em" }}>{post.title}</h1>
            <p style={{ color: "rgba(255,255,255,0.86)", fontSize: 17, lineHeight: 1.7, margin: "0 0 18px" }}>{post.excerpt}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
              <span>{post.publisher || post.author}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </div>
          <div className="post-hero-visual-card">
            <EvidenceVisual type={post.visualType} />
            <div className="post-hero-visual-caption">
              <BadgeCheck size={15} />
              <span>{"★".repeat(post.sourceConfidence)}{"☆".repeat(5 - post.sourceConfidence)} verified source confidence</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="blog-post-share"
            style={{ position: "absolute", top: 24, right: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.12)", color: "white", cursor: "pointer" }}
          >
            <Share2 size={16} /> {copied ? "Copied" : "Share"}
          </button>
        </div>

        <div className="blog-post-card" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: 20, boxShadow: "var(--shadow-md)", padding: 28 }}>
          <div className="post-takeaways">
            <div className="post-section-kicker">
              <Sparkles size={15} /> Key takeaways
            </div>
            <div className="post-takeaway-grid">
              {post.keyTakeaways.map((takeaway, index) => (
                <div className="post-takeaway-card" key={`${takeaway}-${index}`}>
                  <span>{index + 1}</span>
                  <p>{takeaway}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {post.body.split("\n\n").map((paragraph, idx) => (
              <p key={idx} style={{ margin: 0, color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.9 }}>{paragraph}</p>
            ))}
          </div>

          {post.regionMap && (
            <div style={{ margin: "24px 0" }}>
              <GhanaRegionMap
                rows={post.regionMap.rows}
                datasetTitle={post.regionMap.title}
                datasetId=""
                height={380}
              />
            </div>
          )}

          <div className="post-intelligence-grid">
            <div className="post-kweku-card">
              <div className="post-section-kicker">
                <Bot size={15} /> Ask Kweku about this insight
              </div>
              <p>Turn this story into an explanation, chart idea, presentation outline, or dataset exploration.</p>
              <div className="post-prompt-row">
                {["Explain this graph", "Show the raw data", "Simplify for students", "Create a chart"].map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => navigate(post.relatedDatasetId ? `/datasets/${post.relatedDatasetId}?ask=kweku` : "/datasets")}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <div className="post-adjoa-card">
              <div className="post-section-kicker">
                <Lightbulb size={15} /> Adjoa's Discovery
              </div>
              <p>{post.adjoaDiscovery}</p>
            </div>
          </div>

          <div style={{ marginTop: 28, borderRadius: 16, padding: 22, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Database size={24} style={{ color: "var(--green)" }} />
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Evidence Dataset</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Inspect the source data, open the API, map it, or download the file.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(post.relatedDatasetId ? `/datasets/${post.relatedDatasetId}` : "/datasets")}
              style={{ width: "fit-content", padding: "10px 16px", borderRadius: 12, border: "none", background: "var(--green)", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              {post.relatedDatasetId ? "Open Dataset" : "View Dataset"}
            </button>
          </div>

          <div className="post-related-box">
            <div className="post-section-kicker">
              <BookOpen size={15} /> Related paths
            </div>
            {["Compare with inflation", "Find regional datasets", "Use in a student assignment"].map((item) => (
              <button key={item} type="button" onClick={() => navigate(`/datasets?search=${encodeURIComponent(item.replace("Compare with ", ""))}`)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .post-hero-visual-card {
          position: relative;
          z-index: 1;
          min-height: 260px;
          border-radius: 22px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.24);
          display: grid;
          place-items: center;
          padding: 24px;
          backdrop-filter: blur(16px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 24px 60px rgba(0,0,0,0.22);
        }
        .post-evidence-visual {
          width: 100%;
          max-width: 300px;
          height: auto;
          display: block;
        }
        .post-hero-visual-caption {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 9px 12px;
          background: rgba(0,0,0,0.18);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-weight: 800;
        }
        .post-section-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .post-takeaways {
          margin-bottom: 28px;
        }
        .post-takeaway-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .post-takeaway-card,
        .post-kweku-card,
        .post-adjoa-card,
        .post-related-box {
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          background: var(--surface-elevated);
          padding: 16px;
        }
        .post-takeaway-card {
          display: grid;
          grid-template-columns: 30px 1fr;
          gap: 12px;
          align-items: start;
        }
        .post-takeaway-card span {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--green-pale);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }
        .post-takeaway-card p,
        .post-kweku-card p,
        .post-adjoa-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.7;
        }
        .post-intelligence-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 14px;
          margin-top: 28px;
        }
        .post-prompt-row,
        .post-related-box {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .post-prompt-row {
          margin-top: 14px;
        }
        .post-prompt-row button,
        .post-related-box button {
          border: 1px solid var(--border-default);
          border-radius: 999px;
          background: var(--surface-card);
          color: var(--green);
          padding: 8px 11px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .post-related-box {
          margin-top: 18px;
          display: flex;
          align-items: center;
        }
        @media (max-width: 640px) {
          .blog-post-page {
            padding: 16px !important;
          }
          .blog-post-hero {
            min-height: 280px !important;
            padding: 80px 18px 24px !important;
            grid-template-columns: 1fr !important;
          }
          .blog-post-hero h1 {
            font-size: 26px !important;
          }
          .blog-post-share {
            top: 18px !important;
            right: 18px !important;
          }
          .blog-post-card {
            padding: 20px !important;
          }
          .post-takeaway-grid,
          .post-intelligence-grid {
            grid-template-columns: 1fr !important;
          }
          .post-hero-visual-card {
            min-height: 190px !important;
          }
        }
      `}</style>
    </div>
  );
}
