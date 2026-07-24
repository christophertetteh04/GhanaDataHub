import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Database,
  Download,
  Menu,
  Search,
  Users,
  X,
} from "lucide-react";
import ObservanceBanner from "../components/ObservanceBanner";
import DarkModeToggle from "../components/DarkModeToggle";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const FALLBACK_STATS = {
  total_datasets: 1240,
  total_users: 860,
  total_organizations: 74,
  total_storage_bytes: 2400000000,
  total_downloads_all_time: 18400,
};

const trustPills = [
  "Ghana Statistical Service",
  "World Bank",
  "UNICEF Ghana",
  "FAOSTAT",
  "Bank of Ghana",
  "Electoral Commission Ghana",
  "Ministry of Finance",
  "University of Ghana",
  "Joy FM",
  "Graphic Business",
];

const faqs = [
  {
    question: "Can we start without moving every dataset at once?",
    answer:
      "Yes. Most teams begin with a focused workspace, publish a few high-value datasets, and expand governance rules as adoption grows.",
  },
  {
    question: "Does GhanaDataHub support private institutional datasets?",
    answer:
      "Yes. Role-based access control helps teams keep sensitive datasets private while publishing approved records for wider discovery.",
  },
  {
    question: "Can technical teams connect existing systems?",
    answer:
      "Yes. REST API access gives teams a clean integration path for institutional portals, reporting tools, and internal workflows.",
  },
];

const testimonials = [
  {
    initials: "AM",
    name: "Ama Mensah",
    role: "Researcher, University of Ghana",
    quote:
      "GhanaDataHub saved me three weeks of data collection for my thesis on cocoa farmer income. Every dataset I needed was already there and downloadable in one click.",
  },
  {
    initials: "KA",
    name: "Kwame Adu",
    role: "Data Journalist",
    quote:
      "I use it every time I need to fact-check a government statistic. The daily forex rates alone are worth bookmarking the site.",
  },
  {
    initials: "EN",
    name: "Esi Nkrumah",
    role: "NGO Data Officer",
    quote:
      "The choropleth maps automatically generated from our uploaded regional health data saved our team an entire day of GIS work.",
  },
];

const academyTracks = [
  { name: "Data Foundations", lessons: "12 lessons", color: "#2563EB" },
  { name: "Excel for Analysts", lessons: "18 lessons", color: "#06B6D4" },
  { name: "Python + CSVs", lessons: "16 lessons", color: "#3B82F6" },
  { name: "Policy Dashboards", lessons: "10 lessons", color: "#A78BFA" },
];

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export default function LandingPage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [observanceData, setObservanceData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStats() {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_BASE}/dashboard/`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) return;

        const data = await response.json();
        setStats({
          total_datasets: data.total_datasets ?? FALLBACK_STATS.total_datasets,
          total_users: data.total_users ?? FALLBACK_STATS.total_users,
          total_organizations: data.total_organizations ?? FALLBACK_STATS.total_organizations,
          total_storage_bytes: data.total_storage_bytes ?? FALLBACK_STATS.total_storage_bytes,
          total_downloads_all_time:
            data.total_downloads_all_time ?? data.total_downloads ?? FALLBACK_STATS.total_downloads_all_time,
        });
      } catch (error) {
        if (error.name !== "AbortError") setStats(FALLBACK_STATS);
      }
    }

    loadStats();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/observances/today`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setObservanceData(data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setObservanceData(null);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const metricTiles = useMemo(
    () => [
      { label: "Total Datasets", value: formatCompactNumber(stats.total_datasets), icon: Database },
      { label: "Downloads", value: formatCompactNumber(stats.total_downloads_all_time), icon: Download },
      { label: "Users", value: formatCompactNumber(stats.total_users), icon: Users },
      { label: "Categories", value: "7+", icon: BarChart3 },
    ],
    [stats]
  );

  const navLinks = [
    { label: "Explore", to: "/datasets" },
    { label: "Learn", to: "#learn" },
    { label: "API", to: "/developers" },
    { label: "Roadmap", to: "#roadmap" },
  ];

  return (
    <div className="landing-page" id="top">
      <style>{`
        .landing-page {
          --landing-nav-top: rgba(255,255,255,0.72);
          --landing-nav-scrolled: rgba(255,255,255,0.9);
          --landing-nav-top-filter: blur(12px) saturate(160%);
          --landing-nav-border: rgba(17,24,39,0.08);
          --landing-nav-top-border: rgba(17,24,39,0.05);
          --landing-preview-bg:
            rgba(255,255,255,0.98);
          --landing-preview-border: rgba(37,99,235,0.14);
          --landing-preview-shadow:
            inset 0 1px 0 rgba(255,255,255,0.92),
            0 0 0 1px rgba(37,99,235,0.08),
            0 24px 64px rgba(17,24,39,0.12);
          --landing-preview-stroke: rgba(37,99,235,0.42);
          --landing-metric-bg: rgba(255,255,255,0.92);
          --landing-metric-border: rgba(17,24,39,0.08);
          --landing-inner-card-bg: rgba(255,255,255,0.72);
          --landing-academy-bg: #FFFFFF;
          --landing-academy-border: rgba(37,99,235,0.14);
          min-height: 100vh;
          background-color: var(--surface-base);
          color: var(--text-primary);
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }

        [data-theme='dark'] .landing-page {
          --landing-nav-top: transparent;
          --landing-nav-scrolled: rgba(17,24,39,0.88);
          --landing-nav-top-filter: none;
          --landing-nav-border: var(--border-subtle);
          --landing-nav-top-border: transparent;
          --landing-preview-bg:
            rgba(22,32,25,0.86);
          --landing-preview-border: rgba(255,255,255,0.08);
          --landing-preview-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px rgba(37,99,235,0.12),
            0 24px 64px rgba(0,0,0,0.45);
          --landing-preview-stroke: rgba(37,99,235,0.48);
          --landing-metric-bg: rgba(255,255,255,0.04);
          --landing-metric-border: rgba(255,255,255,0.06);
          --landing-inner-card-bg: rgba(255,255,255,0.035);
          --landing-academy-bg: var(--surface-card);
          --landing-academy-border: rgba(37,99,235,0.18);
        }

        .landing-shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: ${isScrolled ? "var(--landing-nav-scrolled)" : "var(--landing-nav-top)"};
          backdrop-filter: ${isScrolled ? "blur(16px) saturate(180%)" : "var(--landing-nav-top-filter)"};
          -webkit-backdrop-filter: ${isScrolled ? "blur(16px) saturate(180%)" : "var(--landing-nav-top-filter)"};
          border-bottom: 1px solid ${isScrolled ? "var(--landing-nav-border)" : "var(--landing-nav-top-border)"};
          transition: all 0.3s ease;
        }

        .landing-nav-inner {
          height: 60px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 28px;
        }

        .landing-brand,
        .landing-nav-links,
        .landing-nav-actions,
        .landing-cta-row,
        .landing-proof-row,
        .landing-mobile-actions {
          display: flex;
          align-items: center;
        }

        .landing-brand {
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .landing-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--green);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow: 0 10px 24px rgba(37,99,235,0.22);
        }

        .landing-nav-links {
          justify-content: center;
          gap: 26px;
        }

        .landing-nav-link {
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          transition: color 0.15s ease;
        }

        .landing-nav-link:hover {
          color: var(--text-primary);
        }

        .landing-nav-actions {
          justify-content: flex-end;
          gap: 10px;
        }

        .landing-btn {
          height: 36px;
          border-radius: 8px;
          border: 1px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease, filter 0.15s ease;
        }

        .landing-btn-ghost {
          background: transparent;
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .landing-btn-ghost:hover,
        .landing-btn-secondary:hover {
          background: var(--surface-elevated);
        }

        .landing-btn-primary {
          background: var(--green);
          color: white;
        }

        .landing-btn-primary:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }

        .landing-menu-button {
          display: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-primary);
          align-items: center;
          justify-content: center;
        }

        .landing-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          background: var(--surface-base);
          padding: 24px;
          display: grid;
          align-content: start;
          gap: 42px;
        }

        .landing-mobile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .landing-mobile-nav {
          display: grid;
          gap: 22px;
        }

        .landing-mobile-nav a {
          font-size: 20px;
          color: var(--text-primary);
          font-weight: 800;
        }

        .landing-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .landing-gold-glow {
          display: none;
        }

        .landing-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .landing-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(37,99,235,0.28);
          background: rgba(37,99,235,0.08);
          border-radius: 99px;
          padding: 4px 14px;
          color: var(--green);
          font-size: 12px;
          font-weight: 600;
        }

        .landing-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 0 rgba(37,99,235,0.45);
          animation: pulse-dot 1.8s ease infinite;
        }

        @keyframes pulse-dot {
          70% { box-shadow: 0 0 0 9px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }

        .landing-hero-title {
          margin: 22px auto 0;
          color: var(--text-primary);
          font-size: 64px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 900;
          max-width: 800px;
        }

        .landing-gradient-text {
          color: var(--green);
        }

        .landing-hero-sub {
          max-width: 600px;
          margin: 24px auto 0;
          color: var(--text-secondary);
          font-size: 20px;
          line-height: 1.6;
        }

        .landing-cta-row {
          justify-content: center;
          gap: 12px;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .landing-cta-row .landing-btn {
          height: 48px;
          padding: 0 28px;
          border-radius: 10px;
          font-size: 15px;
        }

        .landing-btn-secondary {
          background: transparent;
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .landing-proof-row {
          justify-content: center;
          gap: 14px;
          margin-top: 32px;
          color: var(--text-muted);
          font-size: 13px;
        }

        .landing-avatars {
          display: flex;
        }

        .landing-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #0A1410;
          font-size: 11px;
          font-weight: 900;
          border: 2px solid var(--surface-base);
          margin-left: -8px;
        }

        .landing-avatar:first-child {
          margin-left: 0;
        }

        .landing-preview-card {
          position: relative;
          max-width: 700px;
          margin: 48px auto 0;
          background: var(--landing-preview-bg);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid var(--landing-preview-border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--landing-preview-shadow);
          overflow: hidden;
          z-index: 1;
        }

        .landing-preview-card::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 1px;
          border-radius: 17px;
          background: var(--landing-preview-stroke);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.8;
          pointer-events: none;
          animation: none;
          z-index: 0;
        }

        .landing-preview-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .landing-metric-tile {
          border-radius: 12px;
          background: var(--landing-metric-bg);
          border: 1px solid var(--landing-metric-border);
          padding: 16px;
          text-align: left;
          box-shadow: 0 10px 28px rgba(17,24,39,0.06);
        }

        .landing-metric-tile svg {
          color: var(--green);
          margin-bottom: 18px;
        }

        .landing-metric-value {
          font-size: 24px;
          font-weight: 900;
          color: var(--text-primary);
        }

        .landing-metric-label {
          color: var(--text-muted);
          font-size: 11px;
          margin-top: 4px;
        }

        .landing-trust-strip {
          background: var(--surface-card);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          padding: 32px 24px;
          overflow: hidden;
        }

        .landing-strip-label {
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-align: center;
          font-weight: 800;
        }

        .landing-marquee-outer {
          max-width: 1200px;
          margin: 18px auto 0;
          overflow: hidden;
        }

        .landing-marquee-track {
          display: flex;
          width: max-content;
          gap: 10px;
          animation: marquee 20s linear infinite;
        }

        .landing-trust-pill {
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 13px;
          white-space: nowrap;
        }

        .landing-section {
          padding: 80px 24px;
        }

        .landing-section-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .landing-section-label {
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .landing-section-heading {
          color: var(--text-primary);
          font-size: 40px;
          line-height: 1.15;
          font-weight: 900;
          max-width: 600px;
          margin: 0 0 34px;
          letter-spacing: -0.02em;
        }

        .landing-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }

        .landing-bento-card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.2s ease, transform 0.2s ease;
          overflow: hidden;
        }

        .landing-bento-card:hover {
          border-color: rgba(37,99,235,0.24);
          transform: translateY(-2px);
        }

        .bento-wide { grid-column: span 8; }
        .bento-narrow { grid-column: span 4; }
        .bento-full { grid-column: span 12; }

        .landing-bento-card h3 {
          font-size: 22px;
          color: var(--text-primary);
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }

        .landing-bento-card p {
          color: var(--text-secondary);
          line-height: 1.65;
          margin: 0;
        }

        .mock-search {
          margin-top: 24px;
          border-radius: 14px;
          background: var(--surface-elevated);
          border: 1px solid var(--border-default);
          padding: 14px;
        }

        .mock-search-input,
        .mock-result-row,
        .ai-summary-card,
        .track-card {
          border: 1px solid var(--border-subtle);
          background: var(--landing-inner-card-bg);
          border-radius: 10px;
        }

        .mock-search-input {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 38px;
          padding: 0 12px;
          color: var(--text-muted);
          font-size: 13px;
        }

        .mock-result-row {
          margin-top: 10px;
          padding: 10px 12px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .landing-green-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--green);
          font-weight: 900;
          margin-top: 22px;
        }

        .daily-card {
          background: rgba(37,99,235,0.08);
          border-color: rgba(37,99,235,0.16);
        }

        .daily-card h3 {
          color: var(--green);
        }

        .daily-badges {
          display: grid;
          gap: 10px;
          margin-top: 24px;
        }

        .daily-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          border-radius: 99px;
          border: 1px solid rgba(37,99,235,0.18);
          padding: 7px 12px;
          color: var(--text-primary);
          font-size: 12px;
          background: rgba(37,99,235,0.08);
        }

        .tiny-map {
          margin-top: 26px;
          width: 100%;
          height: 160px;
        }

        .ai-summary-card {
          margin-top: 24px;
          padding: 18px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .ai-summary-card strong {
          color: var(--text-primary);
        }

        .academy-card {
          background: var(--landing-academy-bg);
          border: 1px solid var(--landing-academy-border);
          display: grid;
          grid-template-columns: 1fr 0.85fr;
          gap: 28px;
          align-items: center;
        }

        .academy-badge {
          display: inline-flex;
          width: fit-content;
          border-radius: 99px;
          padding: 6px 12px;
          background: rgba(37,99,235,0.10);
          color: var(--green);
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .track-stack {
          display: grid;
          gap: 10px;
        }

        .track-card {
          display: grid;
          grid-template-columns: 5px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
        }

        .track-band {
          width: 5px;
          height: 42px;
          border-radius: 999px;
        }

        .social-proof {
          background: var(--surface-card);
          border-top: 1px solid var(--border-subtle);
          padding: 64px 24px;
        }

        .social-proof h2 {
          text-align: center;
          font-size: 32px;
          color: var(--text-primary);
          margin-bottom: 28px;
        }

        .testimonial-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .testimonial-card {
          background: var(--surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 24px;
        }

        .testimonial-card blockquote {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.7;
          font-style: italic;
          margin: 0 0 22px;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .testimonial-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--green);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
        }

        .faq-section {
          background: var(--surface-base);
        }

        .faq-list {
          max-width: 820px;
          margin: 0 auto;
          display: grid;
          gap: 12px;
        }

        .faq-item {
          border: 1px solid var(--border-subtle);
          background: var(--surface-card);
          border-radius: 14px;
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          min-height: 58px;
          background: transparent;
          border: 0;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          text-align: left;
          font-weight: 800;
        }

        .faq-answer {
          color: var(--text-secondary);
          line-height: 1.7;
          padding: 0 20px 20px;
        }

        .final-cta {
          position: relative;
          overflow: hidden;
          background: #0F172A;
          padding: 80px 24px;
          text-align: center;
          color: white;
        }

        .final-cta h2 {
          position: relative;
          z-index: 1;
          font-size: 40px;
          margin: 0 0 12px;
          color: white;
        }

        .final-cta p {
          position: relative;
          z-index: 1;
          color: rgba(255,255,255,0.78);
          font-size: 16px;
          margin: 0 0 28px;
        }

        .final-cta-actions {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .final-cta .landing-btn {
          height: 48px;
          padding: 0 24px;
          background: var(--surface-card);
          color: var(--green);
        }

        .final-cta-link {
          color: rgba(255,255,255,0.75);
          font-weight: 800;
        }

        .newsletter-card {
          max-width: 1100px;
          margin: 0 auto 42px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-elevated);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .newsletter-card h3 {
          margin: 0 0 6px;
          color: var(--text-primary);
        }

        .newsletter-card p {
          margin: 0;
          color: var(--text-secondary);
        }

        .newsletter-form {
          display: flex;
          gap: 10px;
          min-width: min(420px, 100%);
        }

        .newsletter-form input {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--text-primary);
          padding: 0 12px;
        }

        .landing-footer {
          background: var(--surface-sidebar);
          border-top: 1px solid var(--border-subtle);
          padding: 56px 24px 28px;
        }

        .landing-footer-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.4fr repeat(4, 1fr);
          gap: 32px;
        }

        .landing-footer h3,
        .landing-footer h4 {
          color: var(--text-primary);
          margin: 0 0 14px;
        }

        .landing-footer p,
        .landing-footer-link,
        .landing-footer-bottom {
          color: var(--text-secondary);
        }

        .landing-footer-links {
          display: grid;
          gap: 10px;
        }

        .landing-footer-link:hover {
          color: var(--green);
        }

        .landing-footer-bottom {
          max-width: 1100px;
          margin: 36px auto 0;
          padding-top: 22px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
        }

        @media (max-width: 768px) {
          .landing-nav-inner {
            grid-template-columns: 1fr auto;
          }

          .landing-nav-links,
          .desktop-login {
            display: none;
          }

          .landing-menu-button {
            display: inline-flex;
          }

          .landing-nav-actions {
            gap: 8px;
          }

          .landing-hero {
            padding: 110px 18px 70px;
          }

          .landing-hero-title {
            font-size: 36px;
          }

          .landing-hero-sub {
            font-size: 16px;
          }

          .landing-preview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .landing-proof-row {
            flex-direction: column;
          }

          .landing-bento-grid {
            grid-template-columns: repeat(12, 1fr);
          }

          .bento-wide,
          .bento-narrow,
          .bento-full {
            grid-column: span 12;
          }

          .academy-card {
            grid-template-columns: 1fr;
          }

          .testimonial-grid {
            display: flex;
            overflow-x: auto;
            padding-bottom: 8px;
          }

          .testimonial-card {
            min-width: 280px;
            flex-shrink: 0;
          }

          .newsletter-card,
          .newsletter-form {
            flex-direction: column;
            align-items: stretch;
          }

          .landing-footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 560px) {
          .landing-btn-primary.nav-register {
            padding: 0 12px;
          }

          .landing-preview-grid,
          .landing-footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {observanceData && <ObservanceBanner variant="landing" observance={observanceData} />}

      <header className="landing-nav" aria-label="Primary navigation">
        <div className="landing-nav-inner">
          <a className="landing-brand" href="#top" aria-label="GhanaDataHub home">
            <span className="landing-logo-mark">GD</span>
            <span>GhanaDataHub</span>
          </a>

          <nav className="landing-nav-links" aria-label="Marketing">
            {navLinks.map((link) =>
              link.to.startsWith("/") ? (
                <Link key={link.label} className="landing-nav-link" to={link.to}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} className="landing-nav-link" href={link.to}>
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="landing-nav-actions">
            <DarkModeToggle />
            <Link className="landing-btn landing-btn-ghost desktop-login" to="/login">
              Log in
            </Link>
            <Link className="landing-btn landing-btn-primary nav-register" to="/register">
              Get Started
            </Link>
            <button
              className="landing-menu-button"
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="landing-mobile-overlay">
          <div className="landing-mobile-top">
            <a className="landing-brand" href="#top" onClick={() => setMenuOpen(false)}>
              <span className="landing-logo-mark">GD</span>
              <span>GhanaDataHub</span>
            </a>
            <button className="landing-menu-button" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="landing-mobile-nav" aria-label="Mobile marketing navigation">
            {navLinks.map((link) =>
              link.to.startsWith("/") ? (
                <Link key={link.label} to={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} href={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              )
            )}
            <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>Get Started</Link>
          </nav>
        </div>
      )}

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="dark-hero-glow" style={{ top: "10%", left: "-5%" }} />
          <div className="landing-gold-glow" />

          <div className="landing-hero-content">
            <div className="landing-eyebrow-pill">
              <span className="landing-pulse-dot" />
              Now indexing {formatCompactNumber(stats.total_datasets)} Ghana datasets
            </div>
            <h1 className="landing-hero-title" id="landing-hero-title">
              Ghana's <span className="landing-gradient-text">Open Data</span>, Finally Organised.
            </h1>
            <p className="landing-hero-sub">
              GhanaDataHub brings together datasets from government, international organisations, and researchers into one searchable, downloadable, and analysable platform - free for everyone.
            </p>
            <div className="landing-cta-row">
              <Link className="landing-btn landing-btn-primary" to="/datasets">
                Explore Datasets <ArrowRight size={16} />
              </Link>
              <a className="landing-btn landing-btn-secondary" href="#api">
                View the API
              </a>
            </div>
            <div className="landing-proof-row">
              <div className="landing-avatars" aria-hidden="true">
                {[
                  ["AM", "#D1FAE5"],
                  ["KO", "#E0F2FE"],
                  ["EK", "#FEF3C7"],
                  ["NK", "#E9D5FF"],
                ].map(([initials, color]) => (
                  <span className="landing-avatar" style={{ background: color }} key={initials}>
                    {initials}
                  </span>
                ))}
              </div>
              <span>500+ researchers, journalists, and analysts trust GhanaDataHub</span>
            </div>

            <div className="landing-preview-card" aria-label="Dashboard preview">
              <div className="landing-preview-grid">
                {metricTiles.map(({ label, value, icon: Icon }) => (
                  <div className="landing-metric-tile" key={label}>
                    <Icon size={18} />
                    <div className="landing-metric-value">{value}</div>
                    <div className="landing-metric-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-trust-strip" aria-label="Trusted by">
          <div className="landing-strip-label">Trusted by researchers, journalists, and government agencies</div>
          <div className="landing-marquee-outer">
            <div className="landing-marquee-track">
              {[...trustPills, ...trustPills].map((pill, index) => (
                <span className="landing-trust-pill" key={`${pill}-${index}`}>
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="api">
          <div className="landing-section-inner">
            <div className="landing-section-label">What you get</div>
            <h2 className="landing-section-heading">Everything you need to work with Ghana data</h2>

            <div className="landing-bento-grid">
              <article className="landing-bento-card bento-wide">
                <h3>Search across {formatCompactNumber(stats.total_datasets)} datasets instantly</h3>
                <p>Full-text search, category filters, freshness indicators, and quality scores on every dataset.</p>
                <div className="mock-search">
                  <div className="mock-search-input">
                    <Search size={15} />
                    Search "inflation", "cocoa exports", "malaria"
                  </div>
                  {["Ghana CPI and Inflation Series", "Cocoa Production by Region", "Health Facilities Registry"].map((item) => (
                    <div className="mock-result-row" key={item}>{item}</div>
                  ))}
                </div>
                <Link className="landing-green-link" to="/datasets">
                  Explore Datasets <ArrowRight size={15} />
                </Link>
              </article>

              <article className="landing-bento-card bento-narrow daily-card">
                <h3>Updated Daily</h3>
                <p>8 financial datasets updated every morning from the Ghana market briefing.</p>
                <div className="daily-badges">
                  {["Forex Rates", "GSE Stocks", "Cocoa Price"].map((badge) => (
                    <span className="daily-badge" key={badge}>
                      <span className="landing-pulse-dot" /> {badge}
                    </span>
                  ))}
                </div>
              </article>

              <article className="landing-bento-card bento-narrow">
                <h3>Regional Visualisation</h3>
                <p>Auto-generated choropleth maps for any regional dataset.</p>
                <svg className="tiny-map" viewBox="0 0 180 200" role="img" aria-label="Simplified Ghana region map">
                  <path d="M67 7 113 12 147 48 136 94 160 130 132 188 83 194 52 160 27 112 39 57Z" fill="#1E293B" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
                  <path d="M67 7 113 12 109 58 65 62 39 57Z" fill="#004D2C" />
                  <path d="M65 62 109 58 136 94 94 111 52 94Z" fill="#1D4ED8" />
                  <path d="M52 94 94 111 83 194 52 160 27 112Z" fill="#2563EB" />
                  <path d="M94 111 160 130 132 188 83 194Z" fill="#06B6D4" opacity="0.75" />
                </svg>
              </article>

              <article className="landing-bento-card bento-wide">
                <h3>AI-Powered Insights on Every Dataset</h3>
                <p>Upload a CSV or PDF and get an instant plain-language summary, column profiles, anomaly detection, and key findings.</p>
                <div className="ai-summary-card">
                  <p><strong>Summary:</strong> This dataset shows regional differences in service access, with Greater Accra and Ashanti leading the national average while northern regions show the largest improvement opportunity.</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 12 }}>Generated by Gemini AI</p>
                </div>
              </article>

              <article className="landing-bento-card bento-full academy-card" id="learn">
                <div>
                  <span className="academy-badge">Analytics Academy</span>
                  <h3>Learn data analytics with real Ghana data</h3>
                  <p>4 tracks from complete beginner to advanced analyst. Free certificate on completion.</p>
                  <Link className="landing-green-link" to="/insights">
                    Start Learning Free <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="track-stack">
                  {academyTracks.map((track) => (
                    <div className="track-card" key={track.name}>
                      <span className="track-band" style={{ background: track.color }} />
                      <span style={{ color: "var(--text-primary)", fontWeight: 800 }}>{track.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{track.lessons}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="social-proof">
          <h2>What the community says</h2>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article className="testimonial-card" key={item.name}>
                <blockquote>"{item.quote}"</blockquote>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{item.initials}</span>
                  <div>
                    <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 900 }}>{item.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.role}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section faq-section">
          <div className="landing-section-inner">
            <div className="landing-section-label" style={{ textAlign: "center" }}>FAQ</div>
            <h2 className="landing-section-heading" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
              Questions teams ask before they start
            </h2>
            <div className="faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div className="faq-item" key={faq.question}>
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                    </button>
                    {isOpen && <p className="faq-answer">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="final-cta" id="roadmap">
          <h2>Start exploring Ghana data today</h2>
          <p>Free forever. No credit card. No account required to browse.</p>
          <div className="final-cta-actions">
            <Link className="landing-btn" to="/datasets">Explore Datasets</Link>
            <Link className="final-cta-link" to="/register">Create a free account</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="newsletter-card">
          <div>
            <h3>Get GhanaDataHub updates</h3>
            <p>New datasets, insights, and product notes in your inbox.</p>
          </div>
          <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="you@example.com" aria-label="Email address" />
            <button className="landing-btn landing-btn-primary" type="submit">Subscribe</button>
          </form>
        </div>

        <div className="landing-footer-grid">
          <div>
            <h3>GhanaDataHub</h3>
            <p>Secure data management for organisations building evidence, policy, and research across Ghana.</p>
          </div>
          <div>
            <h4>Product</h4>
            <div className="landing-footer-links">
              <Link className="landing-footer-link" to="/datasets">Datasets</Link>
              <Link className="landing-footer-link" to="/sources">Data Sources</Link>
              <Link className="landing-footer-link" to="/search">Search</Link>
              <a className="landing-footer-link" href="#learn">Learn</a>
              <Link className="landing-footer-link" to="/developers">API Docs</Link>
            </div>
          </div>
          <div>
            <h4>Company</h4>
            <div className="landing-footer-links">
              <a className="landing-footer-link" href="#top">About</a>
              <a className="landing-footer-link" href="mailto:hello@ghanadatahub.org">Contact</a>
            </div>
          </div>
          <div>
            <h4>Legal</h4>
            <div className="landing-footer-links">
              <Link className="landing-footer-link" to="/register">Privacy</Link>
              <Link className="landing-footer-link" to="/register">Terms</Link>
            </div>
          </div>
          <div>
            <h4>Connect</h4>
            <div className="landing-footer-links">
              <a className="landing-footer-link" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
              <a className="landing-footer-link" href="mailto:hello@ghanadatahub.org">hello@ghanadatahub.org</a>
              <Link className="landing-footer-link" to="/login">Log In</Link>
              <Link className="landing-footer-link" to="/register">Sign Up</Link>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>(c) 2024 GhanaDataHub. Built for Ghana.</span>
          <span>Open data, better decisions.</span>
        </div>
      </footer>
    </div>
  );
}
