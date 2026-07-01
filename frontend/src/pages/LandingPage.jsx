import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Menu,
  Search,
  Server,
  ShieldCheck,
  Share2,
  Users,
  X,
} from "lucide-react";
import { useInView } from "../hooks/useInView";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const FALLBACK_STATS = {
  total_datasets: 1240,
  total_users: 860,
  total_organizations: 74,
  total_storage_bytes: 2400000000,
};

const problemSolutions = [
  {
    icon: Database,
    problem: "Scattered spreadsheets",
    solution: "One searchable repository",
    text: "Bring department files, research data, and operational records into a governed workspace your team can actually find.",
  },
  {
    icon: ClipboardList,
    problem: "No audit trail",
    solution: "Full activity logs on every action",
    text: "Track uploads, edits, downloads, and sharing events with a clear record for compliance and internal review.",
  },
  {
    icon: ShieldCheck,
    problem: "Insecure sharing",
    solution: "Role-based access control",
    text: "Give the right people the right access while keeping sensitive datasets protected by organisation-level permissions.",
  },
];

const features = [
  {
    icon: GitBranch,
    title: "Dataset Versioning",
    text: "Preserve every update with clear version history, file metadata, and accountable changes.",
  },
  {
    icon: LockKeyhole,
    title: "Role-Based Access Control",
    text: "Manage who can upload, review, publish, and administer data across each organisation.",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    text: "Find datasets quickly by title, description, tags, category, owner, and relevant metadata.",
  },
  {
    icon: Share2,
    title: "Secure Sharing Links",
    text: "Share approved data with collaborators using controlled links and visibility settings.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    text: "Monitor data growth, user activity, storage, and organisational adoption in one place.",
  },
  {
    icon: Server,
    title: "REST API Access",
    text: "Connect GhanaDataHub to existing institutional systems through a clean API surface.",
  },
];

const plans = [
  {
    name: "Free",
    price: "GHS 0",
    period: "/month",
    features: ["Up to 3 users", "Public dataset catalogue", "Core upload tools"],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    recommended: true,
    features: ["Team workspace", "Private datasets", "Activity history"],
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    features: ["Advanced permissions", "API integrations", "Priority support"],
  },
];

const orgs = [
  "Ghana Statistical Service",
  "University of Ghana",
  "GIZ Ghana",
  "Bank of Ghana",
  "UNICEF Ghana",
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

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatStorage(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function RevealSection({ as: Component = "section", className = "", children, ...props }) {
  const [ref, isInView] = useInView();

  return (
    <Component ref={ref} className={`${className} landing-reveal${isInView ? " is-visible" : ""}`} {...props}>
      {children}
    </Component>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [menuOpen, setMenuOpen] = useState(false);
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
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setStats(FALLBACK_STATS);
        }
      }
    }

    loadStats();

    return () => controller.abort();
  }, []);

  const statItems = useMemo(
    () => [
      { label: "Datasets", value: formatCompactNumber(stats.total_datasets), icon: Database },
      { label: "Organisations", value: formatCompactNumber(stats.total_organizations), icon: Building2 },
      { label: "Users", value: formatCompactNumber(stats.total_users), icon: Users },
      { label: "Storage", value: formatStorage(stats.total_storage_bytes), icon: Activity },
    ],
    [stats]
  );

  const navLinks = [
    { label: "Home", to: "#top" },
    { label: "Datasets", to: "/datasets" },
    { label: "Pricing", to: "#pricing" },
    { label: "API Docs", to: "#api" },
    { label: "About", to: "#about" },
  ];

  return (
    <div className="landing-page" id="top">
      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--white);
          color: var(--gray-900);
          overflow-x: hidden;
        }

        .landing-shell {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .landing-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .landing-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 80;
          background: rgba(255, 255, 255, 0.86);
          border-bottom: 1px solid rgba(209, 213, 219, 0.72);
          backdrop-filter: blur(18px);
        }

        .landing-nav-inner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .landing-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .landing-logo-mark {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--green);
          color: var(--white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(0, 107, 63, 0.18);
        }

        .landing-brand-name {
          display: block;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 16px;
          line-height: 1.1;
        }

        .landing-brand-sub {
          display: block;
          color: var(--gray-500);
          font-size: 11px;
          margin-top: 2px;
        }

        .landing-nav-links,
        .landing-nav-actions,
        .landing-hero-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .landing-nav-links {
          margin-left: auto;
        }

        .landing-nav-link,
        .landing-footer-link {
          color: var(--gray-700);
          font-weight: 600;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .landing-nav-link {
          padding: 10px 11px;
          border-radius: 8px;
          font-size: 13.5px;
        }

        .landing-nav-link:hover,
        .landing-footer-link:hover {
          color: var(--green);
        }

        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 11px 18px;
          border-radius: 10px;
          border: 1px solid transparent;
          font-weight: 700;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }

        .landing-btn:hover {
          transform: translateY(-2px);
        }

        .landing-btn-primary {
          background: var(--green);
          color: var(--white);
          box-shadow: 0 12px 24px rgba(0, 107, 63, 0.2);
        }

        .landing-btn-primary:hover {
          background: var(--green-light);
          box-shadow: 0 16px 30px rgba(0, 107, 63, 0.25);
        }

        .landing-btn-secondary {
          background: var(--white);
          border-color: var(--gray-300);
          color: var(--green);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .landing-btn-secondary:hover {
          border-color: rgba(0, 107, 63, 0.28);
          background: var(--green-pale);
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.08);
        }

        .landing-btn-light {
          background: var(--white);
          color: var(--green);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.16);
        }

        .landing-btn-light:hover {
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
        }

        .landing-nav-toggle {
          display: none;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid var(--gray-300);
          background: var(--white);
          color: var(--green);
          align-items: center;
          justify-content: center;
        }

        .landing-page a:focus-visible,
        .landing-page button:focus-visible {
          outline: 3px solid rgba(0, 107, 63, 0.24);
          outline-offset: 3px;
        }

        .landing-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, var(--white) 0%, var(--gray-100) 100%);
          padding: 92px 0 108px;
        }

        .landing-hero::before {
          content: "";
          position: absolute;
          top: -180px;
          left: 50%;
          width: 760px;
          height: 520px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(0, 163, 92, 0.2) 0%, rgba(232, 245, 239, 0.72) 38%, rgba(255, 255, 255, 0) 72%);
          filter: blur(34px);
          transform: translateX(-50%);
          pointer-events: none;
        }

        .landing-hero-content {
          position: relative;
          z-index: 1;
          max-width: 880px;
          margin: 0 auto;
          text-align: center;
        }

        .landing-eyebrow,
        .landing-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--green);
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .landing-kicker {
          background: rgba(232, 245, 239, 0.9);
          border: 1px solid rgba(0, 107, 63, 0.12);
          border-radius: 999px;
          padding: 8px 13px;
          margin-bottom: 24px;
          letter-spacing: 0.08em;
        }

        .landing-hero h1 {
          font-size: clamp(48px, 6vw, 64px);
          line-height: 1.02;
          letter-spacing: 0;
          color: var(--dark, var(--gray-900));
          max-width: 860px;
          margin: 0 auto;
        }

        .landing-hero-text {
          max-width: 690px;
          color: var(--gray-500);
          font-size: 18px;
          line-height: 1.72;
          margin: 24px auto 30px;
        }

        .landing-hero-actions {
          justify-content: center;
          flex-wrap: wrap;
        }

        .landing-trust-note {
          color: var(--gray-500);
          font-size: 13px;
          font-weight: 600;
          margin-top: 16px;
        }

        .landing-product-preview {
          position: relative;
          z-index: 1;
          max-width: 980px;
          margin: 58px auto 0;
          border: 1px solid rgba(209, 213, 219, 0.9);
          border-radius: 16px;
          background: var(--white);
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 30px 80px rgba(17, 24, 39, 0.12);
        }

        .landing-browser-bar {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 18px;
          border-bottom: 1px solid var(--gray-100);
          background: rgba(243, 244, 246, 0.6);
        }

        .landing-browser-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--gray-300);
        }

        .landing-preview-body {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 22px;
          padding: 24px;
          background:
            linear-gradient(rgba(0, 107, 63, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.045) 1px, transparent 1px),
            var(--white);
          background-size: 34px 34px;
        }

        .landing-preview-sidebar,
        .landing-preview-chart {
          border: 1px solid var(--gray-100);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .landing-preview-sidebar {
          display: grid;
          gap: 12px;
          padding: 16px;
        }

        .landing-preview-stat {
          border-radius: 12px;
          padding: 16px;
          background: var(--gray-100);
        }

        .landing-preview-stat strong {
          display: block;
          color: var(--green);
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          line-height: 1;
          margin-bottom: 7px;
        }

        .landing-preview-stat span,
        .landing-chart-label {
          color: var(--gray-500);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .landing-preview-chart {
          padding: 20px;
        }

        .landing-chart-top {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 30px;
        }

        .landing-chart-title {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }

        .landing-data-pill {
          color: var(--green);
          background: var(--green-pale);
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 800;
        }

        .landing-bars {
          height: 220px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          align-items: end;
          gap: 14px;
          padding: 0 4px 18px;
          border-bottom: 1px solid var(--gray-300);
        }

        .landing-bar {
          min-height: 42px;
          border-radius: 8px 8px 0 0;
          background: var(--green);
          box-shadow: inset 0 8px 0 rgba(255, 255, 255, 0.14);
        }

        .landing-section {
          padding: 112px 0;
        }

        .landing-section-alt {
          background: linear-gradient(180deg, rgba(232, 245, 239, 0.55), rgba(243, 244, 246, 0.68));
          border-top: 1px solid rgba(209, 213, 219, 0.45);
          border-bottom: 1px solid rgba(209, 213, 219, 0.45);
        }

        .landing-section-heading {
          max-width: 760px;
          margin-bottom: 44px;
        }

        .landing-section-heading.centered {
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }

        .landing-section-heading h2 {
          font-size: clamp(32px, 4vw, 46px);
          line-height: 1.12;
          margin: 10px 0 14px;
          letter-spacing: 0;
        }

        .landing-section-heading p {
          color: var(--gray-500);
          font-size: 16px;
          line-height: 1.72;
        }

        .landing-stat-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          overflow: hidden;
          border: 1px solid var(--gray-300);
          border-radius: 16px;
          background: var(--white);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
        }

        .landing-stat-item {
          min-height: 148px;
          padding: 30px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 12px;
          position: relative;
        }

        .landing-stat-item + .landing-stat-item::before {
          content: "";
          position: absolute;
          left: 0;
          top: 28px;
          bottom: 28px;
          width: 1px;
          background: var(--gray-300);
        }

        .landing-stat-icon,
        .landing-card-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: var(--green-pale);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .landing-stat-value {
          font-family: 'Sora', sans-serif;
          color: var(--green);
          font-size: clamp(32px, 3vw, 42px);
          font-weight: 700;
          line-height: 1;
        }

        .landing-stat-label {
          color: var(--gray-500);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .landing-three-grid,
        .landing-feature-grid,
        .landing-pricing-grid {
          display: grid;
          gap: 22px;
        }

        .landing-three-grid,
        .landing-feature-grid,
        .landing-pricing-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .landing-info-card,
        .landing-feature-card,
        .landing-plan-card {
          background: var(--white);
          border: 1px solid rgba(209, 213, 219, 0.86);
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .landing-info-card:hover,
        .landing-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 107, 63, 0.2);
          box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 18px 38px rgba(0,0,0,0.08);
        }

        .landing-info-card h3,
        .landing-feature-card h3,
        .landing-plan-card h3 {
          font-size: 18px;
          margin-top: 18px;
          margin-bottom: 9px;
          letter-spacing: 0;
        }

        .landing-problem {
          color: var(--green);
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-top: 18px;
        }

        .landing-info-card p,
        .landing-feature-card p,
        .landing-plan-card li,
        .landing-faq-answer {
          color: var(--gray-500);
          line-height: 1.68;
        }

        .landing-feature-card {
          min-height: 236px;
        }

        .landing-logo-strip {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: center;
          gap: 20px;
        }

        .landing-logo-name {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
          color: var(--gray-500);
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.5;
          transition: opacity 0.2s ease, color 0.2s ease;
        }

        .landing-logo-name:hover {
          color: var(--green);
          opacity: 1;
        }

        .landing-plan-card {
          display: flex;
          flex-direction: column;
          min-height: 340px;
          position: relative;
        }

        .landing-plan-card.is-recommended {
          transform: translateY(-10px) scale(1.02);
          border: 2px solid var(--green);
          box-shadow: 0 2px 10px rgba(0,0,0,0.08), 0 26px 60px rgba(0, 107, 63, 0.14);
        }

        .landing-plan-card.is-recommended:hover {
          transform: translateY(-14px) scale(1.02);
        }

        .landing-plan-badge {
          position: absolute;
          top: 18px;
          right: 18px;
          border-radius: 999px;
          background: var(--green);
          color: var(--white);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 7px 10px;
        }

        .landing-price {
          display: flex;
          align-items: baseline;
          gap: 7px;
          font-family: 'Sora', sans-serif;
          color: var(--green);
          font-size: 42px;
          font-weight: 700;
          margin: 10px 0 22px;
        }

        .landing-price span {
          color: var(--gray-500);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
        }

        .landing-plan-card ul {
          list-style: none;
          display: grid;
          gap: 12px;
          margin-bottom: 28px;
        }

        .landing-plan-card li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .landing-plan-card li svg {
          color: var(--green);
          margin-top: 3px;
          flex-shrink: 0;
        }

        .landing-pricing-link {
          margin-top: auto;
          color: var(--green);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 800;
        }

        .landing-faq-list {
          max-width: 860px;
          margin: 0 auto;
          display: grid;
          gap: 12px;
        }

        .landing-faq-item {
          border: 1px solid rgba(209, 213, 219, 0.88);
          border-radius: 16px;
          background: var(--white);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          overflow: hidden;
        }

        .landing-faq-question {
          width: 100%;
          min-height: 58px;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 18px 20px;
          color: var(--gray-900);
          text-align: left;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }

        .landing-faq-question svg {
          color: var(--green);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .landing-faq-question[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }

        .landing-faq-panel {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease;
        }

        .landing-faq-panel.is-open {
          grid-template-rows: 1fr;
        }

        .landing-faq-answer-wrap {
          overflow: hidden;
        }

        .landing-faq-answer {
          padding: 0 20px 20px;
        }

        .landing-cta-section {
          padding: 112px 0;
          background: var(--white);
        }

        .landing-cta-band {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: var(--green);
          color: var(--white);
          padding: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          box-shadow: 0 26px 70px rgba(0, 107, 63, 0.22);
        }

        .landing-cta-band::before {
          content: "";
          position: absolute;
          right: -130px;
          top: -190px;
          width: 460px;
          height: 460px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(0, 163, 92, 0.75), rgba(232, 245, 239, 0.18) 48%, rgba(255, 255, 255, 0) 70%);
          filter: blur(18px);
        }

        .landing-cta-content,
        .landing-cta-band .landing-btn {
          position: relative;
          z-index: 1;
        }

        .landing-cta-band h2 {
          font-size: clamp(32px, 4vw, 46px);
          line-height: 1.1;
          max-width: 720px;
          letter-spacing: 0;
          margin: 8px 0 12px;
        }

        .landing-cta-band p {
          color: rgba(255, 255, 255, 0.78);
          font-size: 16px;
          line-height: 1.7;
          max-width: 580px;
        }

        .landing-cta-band .landing-eyebrow {
          color: rgba(255, 255, 255, 0.82);
        }

        .landing-footer {
          background: var(--gray-900);
          color: rgba(255, 255, 255, 0.76);
          padding: 66px 0 26px;
        }

        .landing-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(4, 1fr);
          gap: 32px;
        }

        .landing-footer h3,
        .landing-footer h4 {
          color: var(--white);
          margin-bottom: 14px;
          letter-spacing: 0;
        }

        .landing-footer-brand p {
          max-width: 300px;
          line-height: 1.7;
        }

        .landing-footer-links {
          display: grid;
          gap: 10px;
        }

        .landing-footer-link {
          color: rgba(255, 255, 255, 0.7);
        }

        .landing-footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          margin-top: 38px;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          color: rgba(255, 255, 255, 0.56);
        }

        .landing-auth-links {
          display: flex;
          gap: 16px;
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-reveal,
          .landing-btn,
          .landing-info-card,
          .landing-feature-card,
          .landing-plan-card,
          .landing-logo-name,
          .landing-faq-panel,
          .landing-faq-question svg {
            transition: none;
          }

          .landing-reveal {
            opacity: 1;
            transform: none;
          }
        }

        @media (max-width: 980px) {
          .landing-nav-inner {
            flex-wrap: wrap;
            padding: 12px 0;
          }

          .landing-nav-toggle {
            display: inline-flex;
            order: 2;
          }

          .landing-nav-actions {
            margin-left: auto;
            order: 1;
          }

          .landing-nav-links {
            order: 3;
            width: 100%;
            display: none;
            margin-left: 0;
            padding: 8px 0 4px;
            border-top: 1px solid var(--gray-100);
          }

          .landing-nav-links.is-open {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }

          .landing-nav-link {
            text-align: center;
          }

          .landing-preview-body {
            grid-template-columns: 1fr;
          }

          .landing-stat-strip,
          .landing-three-grid,
          .landing-feature-grid,
          .landing-pricing-grid,
          .landing-logo-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .landing-stat-item:nth-child(3)::before {
            display: none;
          }

          .landing-plan-card.is-recommended {
            transform: none;
          }

          .landing-plan-card.is-recommended:hover {
            transform: translateY(-4px);
          }

          .landing-cta-band {
            align-items: flex-start;
            flex-direction: column;
          }

          .landing-footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .landing-shell {
            width: min(100% - 28px, 1160px);
          }

          .landing-brand-sub {
            display: none;
          }

          .landing-nav-actions {
            gap: 6px;
          }

          .landing-nav-actions .landing-btn {
            min-height: 44px;
            padding: 9px 10px;
            font-size: 12px;
          }

          .landing-nav-links.is-open {
            grid-template-columns: 1fr;
          }

          .landing-hero {
            padding: 66px 0 78px;
          }

          .landing-hero h1 {
            font-size: 42px;
          }

          .landing-hero-text {
            font-size: 16px;
          }

          .landing-product-preview {
            margin-top: 42px;
          }

          .landing-preview-body {
            padding: 16px;
          }

          .landing-bars {
            height: 170px;
            gap: 8px;
          }

          .landing-section,
          .landing-cta-section {
            padding: 78px 0;
          }

          .landing-stat-strip,
          .landing-three-grid,
          .landing-feature-grid,
          .landing-pricing-grid,
          .landing-logo-strip,
          .landing-footer-grid {
            grid-template-columns: 1fr;
          }

          .landing-stat-item + .landing-stat-item::before {
            display: none;
          }

          .landing-stat-item {
            min-height: 132px;
            padding: 24px;
            border-top: 1px solid var(--gray-100);
          }

          .landing-stat-item:first-child {
            border-top: 0;
          }

          .landing-logo-strip {
            gap: 6px;
          }

          .landing-logo-name {
            min-height: 54px;
          }

          .landing-cta-band {
            padding: 36px 22px;
            border-radius: 20px;
          }
        }
      `}</style>

      <header className="landing-nav" aria-label="Primary navigation">
        <div className="landing-shell landing-nav-inner">
          <a className="landing-brand" href="#top" aria-label="GhanaDataHub home">
            <span className="landing-logo-mark">GD</span>
            <span>
              <span className="landing-brand-name">GhanaDataHub</span>
              <span className="landing-brand-sub">Data Management Platform</span>
            </span>
          </a>

          <nav className={`landing-nav-links${menuOpen ? " is-open" : ""}`} aria-label="Marketing">
            {navLinks.map((link) =>
              link.to.startsWith("/") ? (
                <Link key={link.label} className="landing-nav-link" to={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.label} className="landing-nav-link" href={link.to} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              )
            )}
          </nav>

          <div className="landing-nav-actions">
            <Link className="landing-btn landing-btn-secondary" to="/login">
              Log In
            </Link>
            <Link className="landing-btn landing-btn-primary" to="/register">
              Sign Up
            </Link>
          </div>

          <button
            className="landing-nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell">
            <div className="landing-hero-content">
              <div className="landing-kicker">
                <KeyRound size={15} />
                Trusted institutional data infrastructure
              </div>
              <h1 id="landing-hero-title">Ghana's Data Management Platform</h1>
              <p className="landing-hero-text">
                Upload, organise, search, and securely share datasets across your organisation. Built for government
                agencies, NGOs, universities, and researchers across Ghana.
              </p>
              <div className="landing-hero-actions">
                <Link className="landing-btn landing-btn-primary" to="/register">
                  Get Started Free
                  <ChevronRight size={17} />
                </Link>
                <Link className="landing-btn landing-btn-secondary" to="/datasets">
                  Browse Datasets
                </Link>
              </div>
              <p className="landing-trust-note">No credit card required - Free forever plan available</p>
            </div>

            <div className="landing-product-preview" aria-label="GhanaDataHub dashboard preview">
              <div className="landing-browser-bar" aria-hidden="true">
                <span className="landing-browser-dot" />
                <span className="landing-browser-dot" />
                <span className="landing-browser-dot" />
              </div>
              <div className="landing-preview-body">
                <div className="landing-preview-sidebar">
                  <div className="landing-preview-stat">
                    <strong>{formatCompactNumber(stats.total_datasets)}</strong>
                    <span>Datasets managed</span>
                  </div>
                  <div className="landing-preview-stat">
                    <strong>{formatCompactNumber(stats.total_organizations)}</strong>
                    <span>Organisations</span>
                  </div>
                  <div className="landing-preview-stat">
                    <strong>{formatStorage(stats.total_storage_bytes)}</strong>
                    <span>Storage tracked</span>
                  </div>
                </div>
                <div className="landing-preview-chart">
                  <div className="landing-chart-top">
                    <div>
                      <div className="landing-chart-label">Dashboard</div>
                      <div className="landing-chart-title">Catalogue activity</div>
                    </div>
                    <div className="landing-data-pill">Live</div>
                  </div>
                  <div className="landing-bars" aria-hidden="true">
                    <div className="landing-bar" style={{ height: "48%" }} />
                    <div className="landing-bar" style={{ height: "72%" }} />
                    <div className="landing-bar" style={{ height: "58%" }} />
                    <div className="landing-bar" style={{ height: "86%" }} />
                    <div className="landing-bar" style={{ height: "64%" }} />
                    <div className="landing-bar" style={{ height: "94%" }} />
                    <div className="landing-bar" style={{ height: "76%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <RevealSection className="landing-section" aria-labelledby="stats-title">
          <div className="landing-shell">
            <div className="landing-section-heading centered">
              <div className="landing-eyebrow">Live Stats</div>
              <h2 id="stats-title">Platform momentum at a glance</h2>
              <p>Public-facing indicators from the platform, with graceful fallback figures when live stats require authentication.</p>
            </div>
            <div className="landing-stat-strip">
              {statItems.map(({ label, value, icon: Icon }) => (
                <div className="landing-stat-item" key={label}>
                  <div className="landing-stat-icon">
                    <Icon size={20} />
                  </div>
                  <div className="landing-stat-value">{value}</div>
                  <div className="landing-stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-section landing-section-alt" id="about" aria-labelledby="solution-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <div className="landing-eyebrow">Solutions</div>
              <h2 id="solution-title">From fragmented files to governed data operations</h2>
              <p>GhanaDataHub turns everyday data management challenges into repeatable workflows institutions can trust.</p>
            </div>
            <div className="landing-three-grid">
              {problemSolutions.map(({ icon: Icon, problem, solution, text }) => (
                <article className="landing-info-card" key={solution}>
                  <div className="landing-card-icon">
                    <Icon size={21} />
                  </div>
                  <div className="landing-problem">{problem}</div>
                  <h3>{solution}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-section" id="api" aria-labelledby="features-title">
          <div className="landing-shell">
            <div className="landing-section-heading centered">
              <div className="landing-eyebrow">Features</div>
              <h2 id="features-title">Everything needed to manage institutional datasets</h2>
              <p>Core tools for upload governance, discovery, sharing, analytics, and integration.</p>
            </div>
            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, title, text }) => (
                <article className="landing-feature-card" key={title}>
                  <div className="landing-card-icon">
                    <Icon size={21} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-section landing-section-alt" aria-labelledby="trust-title">
          <div className="landing-shell">
            <div className="landing-section-heading centered">
              <div className="landing-eyebrow">Trusted By</div>
              <h2 id="trust-title">Built for institutions across Ghana</h2>
              <p>Designed for the data stewardship expectations of public agencies, development partners, universities, and research teams.</p>
            </div>
            <div className="landing-logo-strip" aria-label="Example institution types">
              {orgs.map((org) => (
                <div className="landing-logo-name" key={org}>
                  {org}
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-section" id="pricing" aria-labelledby="pricing-title">
          <div className="landing-shell">
            <div className="landing-section-heading centered">
              <div className="landing-eyebrow">Pricing</div>
              <h2 id="pricing-title">Start small, scale with your organisation</h2>
              <p>Simple plans for teams moving from spreadsheet folders to structured data operations.</p>
            </div>
            <div className="landing-pricing-grid">
              {plans.map((plan) => (
                <article className={`landing-plan-card${plan.recommended ? " is-recommended" : ""}`} key={plan.name}>
                  {plan.recommended ? <div className="landing-plan-badge">Most Popular</div> : null}
                  <h3>{plan.name}</h3>
                  <div className="landing-price">
                    {plan.price}
                    <span>{plan.period}</span>
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link className="landing-pricing-link" to="/register">
                    See full pricing
                    <ChevronRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-section landing-section-alt" aria-labelledby="faq-title">
          <div className="landing-shell">
            <div className="landing-section-heading centered">
              <div className="landing-eyebrow">FAQ</div>
              <h2 id="faq-title">Questions teams ask before they start</h2>
              <p>Clear answers for organisations moving from informal folders into a governed data workspace.</p>
            </div>
            <div className="landing-faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div className="landing-faq-item" key={faq.question}>
                    <button
                      className="landing-faq-question"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`landing-faq-panel-${index}`}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown size={20} />
                    </button>
                    <div
                      id={`landing-faq-panel-${index}`}
                      className={`landing-faq-panel${isOpen ? " is-open" : ""}`}
                    >
                      <div className="landing-faq-answer-wrap">
                        <p className="landing-faq-answer">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="landing-cta-section" aria-labelledby="cta-title">
          <div className="landing-shell">
            <div className="landing-cta-band">
              <div className="landing-cta-content">
                <div className="landing-eyebrow">Get Started</div>
                <h2 id="cta-title">Ready to organise your organisation's data?</h2>
                <p>Launch a secure workspace for datasets, permissions, search, analytics, and accountable collaboration.</p>
              </div>
              <Link className="landing-btn landing-btn-light" to="/register">
                Create Your Free Account
              </Link>
            </div>
          </div>
        </RevealSection>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <h3>GhanaDataHub</h3>
              <p>Secure data management for organisations building evidence, policy, and research across Ghana.</p>
            </div>
            <div>
              <h4>Product</h4>
              <div className="landing-footer-links">
                <Link className="landing-footer-link" to="/datasets">Datasets</Link>
                <Link className="landing-footer-link" to="/search">Search</Link>
                <a className="landing-footer-link" href="#pricing">Pricing</a>
                <a className="landing-footer-link" href="#api">API Docs</a>
              </div>
            </div>
            <div>
              <h4>Company</h4>
              <div className="landing-footer-links">
                <a className="landing-footer-link" href="#about">About</a>
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
                <a className="landing-footer-link" href="https://github.com" target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <a className="landing-footer-link" href="mailto:hello@ghanadatahub.org">
                  hello@ghanadatahub.org
                </a>
                <Link className="landing-footer-link" to="/login">Log In</Link>
                <Link className="landing-footer-link" to="/register">Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <span>(c) 2024 GhanaDataHub. Built for Ghana.</span>
            <div className="landing-auth-links">
              <Link className="landing-footer-link" to="/login">Log In</Link>
              <Link className="landing-footer-link" to="/register">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
