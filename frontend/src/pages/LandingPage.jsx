import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  Check,
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
    features: ["Up to 3 users", "Public dataset catalogue", "Core upload tools"],
  },
  {
    name: "Starter",
    price: "$29/mo",
    features: ["Team workspace", "Private datasets", "Activity history"],
  },
  {
    name: "Pro",
    price: "$99/mo",
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

export default function LandingPage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [menuOpen, setMenuOpen] = useState(false);

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
        }

        .landing-shell {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .landing-nav {
          position: sticky;
          top: 0;
          z-index: 80;
          background: rgba(255, 255, 255, 0.94);
          border-bottom: 1px solid rgba(209, 213, 219, 0.8);
          backdrop-filter: blur(16px);
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
          border-radius: 8px;
          background: var(--gold);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
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
        .landing-nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .landing-nav-links {
          margin-left: auto;
        }

        .landing-nav-link,
        .landing-footer-link {
          color: var(--gray-700);
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .landing-nav-link {
          padding: 9px 10px;
          border-radius: 7px;
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
          min-height: 42px;
          padding: 10px 16px;
          border-radius: 7px;
          border: 1px solid transparent;
          font-weight: 700;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        .landing-btn:hover {
          transform: translateY(-1px);
        }

        .landing-btn-primary {
          background: var(--green);
          color: var(--white);
        }

        .landing-btn-primary:hover {
          background: var(--green-light);
        }

        .landing-btn-secondary {
          background: var(--white);
          border-color: var(--gray-300);
          color: var(--green);
        }

        .landing-btn-secondary:hover {
          border-color: var(--green);
          background: var(--green-pale);
        }

        .landing-btn-gold {
          background: var(--gold);
          color: var(--green);
        }

        .landing-btn-gold:hover {
          background: var(--gold-dark);
        }

        .landing-nav-toggle {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 7px;
          border: 1px solid var(--gray-300);
          background: var(--white);
          color: var(--green);
          align-items: center;
          justify-content: center;
        }

        .landing-page a:focus-visible,
        .landing-page button:focus-visible {
          outline: 3px solid rgba(252, 209, 22, 0.82);
          outline-offset: 3px;
        }

        .landing-hero {
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--gray-100);
          background:
            linear-gradient(90deg, rgba(232, 245, 239, 0.88) 0%, rgba(255, 255, 255, 0.8) 48%, rgba(254, 249, 195, 0.5) 100%),
            var(--white);
        }

        .landing-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.03fr) minmax(320px, 0.97fr);
          align-items: center;
          gap: 54px;
          min-height: 660px;
          padding: 74px 0 56px;
        }

        .landing-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--green);
          background: var(--green-pale);
          border: 1px solid rgba(0, 107, 63, 0.12);
          border-radius: 999px;
          padding: 7px 12px;
          font-weight: 700;
          font-size: 12px;
          margin-bottom: 22px;
        }

        .landing-hero h1 {
          font-size: clamp(44px, 7vw, 72px);
          line-height: 1.02;
          letter-spacing: 0;
          max-width: 760px;
          color: var(--dark, var(--gray-900));
        }

        .landing-hero-text {
          max-width: 650px;
          color: var(--gray-700);
          font-size: 18px;
          line-height: 1.75;
          margin: 24px 0 30px;
        }

        .landing-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .landing-data-panel {
          position: relative;
          min-height: 430px;
          border: 1px solid rgba(0, 107, 63, 0.14);
          border-radius: 8px;
          background:
            linear-gradient(rgba(0, 107, 63, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 107, 63, 0.06) 1px, transparent 1px),
            linear-gradient(145deg, var(--white), #F9FAFB);
          background-size: 28px 28px, 28px 28px, auto;
          box-shadow: 0 24px 80px rgba(17, 24, 39, 0.12);
          padding: 28px;
        }

        .landing-data-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 36px;
        }

        .landing-data-title {
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          color: var(--gray-900);
        }

        .landing-data-pill {
          color: var(--green);
          background: var(--green-pale);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .landing-bars {
          height: 210px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          align-items: end;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--gray-300);
        }

        .landing-bar {
          min-height: 44px;
          border-radius: 7px 7px 0 0;
          background: var(--green);
          box-shadow: inset 0 8px 0 rgba(255, 255, 255, 0.16);
        }

        .landing-bar:nth-child(2),
        .landing-bar:nth-child(5) {
          background: var(--gold);
        }

        .landing-bar:nth-child(3),
        .landing-bar:nth-child(6) {
          background: var(--green-light);
        }

        .landing-data-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .landing-data-chip {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--gray-300);
          border-radius: 7px;
          padding: 14px;
        }

        .landing-data-chip strong {
          display: block;
          font-family: 'Sora', sans-serif;
          color: var(--green);
          font-size: 20px;
        }

        .landing-data-chip span {
          color: var(--gray-500);
          font-size: 12px;
        }

        .landing-section {
          padding: 86px 0;
        }

        .landing-section-alt {
          background: #FAFAFA;
          border-top: 1px solid var(--gray-100);
          border-bottom: 1px solid var(--gray-100);
        }

        .landing-section-heading {
          max-width: 760px;
          margin-bottom: 34px;
        }

        .landing-section-heading h2 {
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          margin-bottom: 12px;
        }

        .landing-section-heading p {
          color: var(--gray-700);
          font-size: 16px;
          line-height: 1.7;
        }

        .landing-stat-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          overflow: hidden;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          background: var(--gray-300);
          box-shadow: var(--shadow-md);
        }

        .landing-stat-item {
          background: var(--white);
          padding: 26px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .landing-stat-icon,
        .landing-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
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
          font-size: 28px;
          font-weight: 700;
          line-height: 1;
        }

        .landing-stat-label {
          color: var(--gray-500);
          font-weight: 600;
          margin-top: 5px;
        }

        .landing-three-grid,
        .landing-feature-grid,
        .landing-pricing-grid {
          display: grid;
          gap: 18px;
        }

        .landing-three-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .landing-feature-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .landing-pricing-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .landing-info-card,
        .landing-feature-card,
        .landing-plan-card {
          background: var(--white);
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .landing-info-card h3,
        .landing-feature-card h3,
        .landing-plan-card h3 {
          font-size: 17px;
          margin-top: 16px;
          margin-bottom: 8px;
        }

        .landing-problem {
          color: var(--gray-500);
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 18px;
        }

        .landing-info-card p,
        .landing-feature-card p,
        .landing-plan-card li {
          color: var(--gray-700);
          line-height: 1.65;
        }

        .landing-feature-card {
          min-height: 210px;
        }

        .landing-logo-strip {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          overflow: hidden;
          border: 1px solid var(--gray-300);
          border-radius: 8px;
          background: var(--gray-300);
        }

        .landing-logo-name {
          min-height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 18px;
          background: var(--white);
          color: var(--gray-500);
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }

        .landing-plan-card {
          display: flex;
          flex-direction: column;
          min-height: 280px;
        }

        .landing-price {
          font-family: 'Sora', sans-serif;
          color: var(--green);
          font-size: 30px;
          font-weight: 700;
          margin: 8px 0 18px;
        }

        .landing-plan-card ul {
          list-style: none;
          display: grid;
          gap: 10px;
          margin-bottom: 24px;
        }

        .landing-plan-card li {
          display: flex;
          gap: 9px;
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
          gap: 4px;
          font-weight: 700;
        }

        .landing-cta-band {
          background: var(--green);
          color: var(--white);
          padding: 58px 0;
        }

        .landing-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .landing-cta-band h2 {
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.15;
          max-width: 720px;
        }

        .landing-footer {
          background: var(--gray-900);
          color: rgba(255, 255, 255, 0.76);
          padding: 60px 0 24px;
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
          margin-top: 36px;
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

          .landing-hero-grid {
            grid-template-columns: 1fr;
            min-height: auto;
            gap: 34px;
          }

          .landing-stat-strip,
          .landing-three-grid,
          .landing-feature-grid,
          .landing-pricing-grid,
          .landing-logo-strip {
            grid-template-columns: repeat(2, 1fr);
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
            min-height: 38px;
            padding: 8px 10px;
            font-size: 12px;
          }

          .landing-nav-links.is-open {
            grid-template-columns: 1fr;
          }

          .landing-hero-grid {
            padding: 48px 0 38px;
          }

          .landing-hero h1 {
            font-size: 42px;
          }

          .landing-hero-text {
            font-size: 16px;
          }

          .landing-data-panel {
            min-height: auto;
            padding: 18px;
          }

          .landing-bars {
            height: 170px;
            gap: 8px;
          }

          .landing-section {
            padding: 64px 0;
          }

          .landing-stat-strip,
          .landing-three-grid,
          .landing-feature-grid,
          .landing-pricing-grid,
          .landing-logo-strip,
          .landing-footer-grid {
            grid-template-columns: 1fr;
          }

          .landing-stat-item {
            padding: 22px;
          }

          .landing-cta-inner {
            align-items: flex-start;
            flex-direction: column;
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
          <div className="landing-shell landing-hero-grid">
            <div>
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
            </div>

            <div className="landing-data-panel" aria-label="Abstract data dashboard graphic">
              <div className="landing-data-header">
                <div>
                  <div className="landing-data-title">National Data Workspace</div>
                  <div className="landing-brand-sub">Live catalogue overview</div>
                </div>
                <div className="landing-data-pill">Secure</div>
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
              <div className="landing-data-footer">
                <div className="landing-data-chip">
                  <strong>99.9%</strong>
                  <span>platform availability</span>
                </div>
                <div className="landing-data-chip">
                  <strong>24/7</strong>
                  <span>controlled access</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="stats-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <h2 id="stats-title">Live platform stats</h2>
              <p>Public-facing indicators from the platform, with graceful fallback figures when live stats require authentication.</p>
            </div>
            <div className="landing-stat-strip">
              {statItems.map(({ label, value, icon: Icon }) => (
                <div className="landing-stat-item" key={label}>
                  <div className="landing-stat-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="landing-stat-value">{value}</div>
                    <div className="landing-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-alt" id="about" aria-labelledby="solution-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
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
        </section>

        <section className="landing-section" id="api" aria-labelledby="features-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
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
        </section>

        <section className="landing-section landing-section-alt" aria-labelledby="trust-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
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
        </section>

        <section className="landing-section" id="pricing" aria-labelledby="pricing-title">
          <div className="landing-shell">
            <div className="landing-section-heading">
              <h2 id="pricing-title">Start small, scale with your organisation</h2>
              <p>Simple plans for teams moving from spreadsheet folders to structured data operations.</p>
            </div>
            <div className="landing-pricing-grid">
              {plans.map((plan) => (
                <article className="landing-plan-card" key={plan.name}>
                  <h3>{plan.name}</h3>
                  <div className="landing-price">{plan.price}</div>
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
        </section>

        <section className="landing-cta-band" aria-labelledby="cta-title">
          <div className="landing-shell landing-cta-inner">
            <h2 id="cta-title">Ready to organise your organisation's data?</h2>
            <Link className="landing-btn landing-btn-gold" to="/register">
              Create Your Free Account
            </Link>
          </div>
        </section>
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
