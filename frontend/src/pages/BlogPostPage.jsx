import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Database, BookOpen, Users, Vote, TrendingUp, Heart, Leaf, Wind, Share2 } from "lucide-react";
import { BLOG_POSTS, buildStoryFromDataset } from "./BlogPage";
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
  const post = staticPost || livePost;

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
    const url = `${window.location.origin}/blog/${post.id}`;
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
      <div className="blog-post-shell" style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 24 }}>
        <div className="blog-post-hero" style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: post.heroColor, minHeight: 320, display: "grid", placeItems: "center", padding: 24, color: "white" }}>
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
            className="blog-post-share"
            style={{ position: "absolute", top: 24, right: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.12)", color: "white", cursor: "pointer" }}
          >
            <Share2 size={16} /> {copied ? "Copied" : "Share"}
          </button>
        </div>

        <div className="blog-post-card" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: 20, boxShadow: "var(--shadow-md)", padding: 28 }}>
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
          <div style={{ marginTop: 28, borderRadius: 16, padding: 22, background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Database size={24} style={{ color: "var(--green)" }} />
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Related Dataset</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Explore the data behind this story.</div>
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
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .blog-post-page {
            padding: 16px !important;
          }
          .blog-post-hero {
            min-height: 280px !important;
            padding: 80px 18px 24px !important;
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
        }
      `}</style>
    </div>
  );
}
