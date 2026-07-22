import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ExternalLink, Scale, Search } from "lucide-react";
import DarkModeToggle from "../components/DarkModeToggle";

const SOURCE_LIST = [
  {
    key: "godi_ckan",
    name: "Ghana Open Data Initiative",
    url: "https://data.gov.gh",
    licence: "Open Data Commons Attribution Licence (ODC-By 1.0)",
    licence_url: "https://opendatacommons.org/licenses/by/1.0/",
    description: "Government of Ghana open data catalogue covering multiple sectors.",
    what_we_scrape: "CKAN package metadata and downloadable CSV, Excel, JSON resources from data.gov.gh.",
    update_frequency: "Irregular, based on publisher uploads",
    tier: "ghana_government",
    logo_initial: "GODI",
    logo_colour: "#006B3F",
  },
  {
    key: "gss_statsbank",
    name: "Ghana Statistical Service",
    url: "https://www.statsghana.gov.gh",
    licence: "Open Government Licence - Ghana",
    licence_url: "https://statsghana.gov.gh/terms",
    description: "Official national statistics office of Ghana.",
    what_we_scrape: "CPI inflation data, population statistics, StatsBank time-series, census and microdata publications.",
    update_frequency: "Monthly (CPI), Quarterly (GDP), Annual (Census)",
    tier: "ghana_government",
    logo_initial: "GSS",
    logo_colour: "#006B3F",
  },
  {
    key: "bog_statistical",
    name: "Bank of Ghana",
    url: "https://www.bog.gov.gh",
    licence: "Open for public use under BOG Act 2002 Section 55",
    licence_url: "https://www.bog.gov.gh/legal-notices",
    description: "Central bank of Ghana - macroeconomic and financial data.",
    what_we_scrape: "Monthly Statistical Bulletin, Summary of Economic and Financial Data, forex rates, treasury bill rates, monetary policy data.",
    update_frequency: "Monthly Statistical Bulletin, weekly forex and treasury updates",
    tier: "financial",
    logo_initial: "BOG",
    logo_colour: "#1D4ED8",
  },
  {
    key: "hdx_ghana_health",
    name: "Humanitarian Data Exchange - Ghana Health",
    url: "https://data.humdata.org",
    licence: "Creative Commons Attribution for Intergovernmental Organisations",
    licence_url: "https://data.humdata.org/about/license",
    description: "Humanitarian and public-health data portal used by UN and partner organisations.",
    what_we_scrape: "Ghana health datasets from WHO and partner organisations published through HDX CKAN resources.",
    update_frequency: "Varies by emergency and publisher",
    tier: "international",
    logo_initial: "HDX",
    logo_colour: "#007CE0",
  },
  {
    key: "ec_voter",
    name: "Electoral Commission of Ghana",
    url: "https://www.ec.gov.gh",
    licence: "Public domain - EC publications are public records",
    licence_url: "https://www.ec.gov.gh",
    description: "Official electoral management body of Ghana.",
    what_we_scrape: "Voter registration reports, election results, constituency data and downloadable public publications.",
    update_frequency: "After registration periods and election cycles",
    tier: "ghana_government",
    logo_initial: "EC",
    logo_colour: "#7C3AED",
  },
  {
    key: "energy_commission",
    name: "Ghana Energy Commission",
    url: "https://www.energycom.gov.gh",
    licence: "Open for public use",
    licence_url: "https://www.energycom.gov.gh",
    description: "Government agency responsible for energy statistics and planning.",
    what_we_scrape: "National energy statistics, electricity access, energy balance, renewable energy and sector reports.",
    update_frequency: "Annual",
    tier: "ghana_government",
    logo_initial: "ECOM",
    logo_colour: "#059669",
  },
  {
    key: "gra_revenue",
    name: "Ghana Revenue Authority",
    url: "https://www.gra.gov.gh",
    licence: "Public domain",
    licence_url: "https://www.gra.gov.gh",
    description: "Government authority responsible for tax administration and revenue reporting.",
    what_we_scrape: "Revenue statistics, tax publications, domestic revenue reports, quarterly and annual publications.",
    update_frequency: "Quarterly and annual",
    tier: "financial",
    logo_initial: "GRA",
    logo_colour: "#92400E",
  },
  {
    key: "mofep_budget",
    name: "Ministry of Finance",
    url: "https://www.mofep.gov.gh",
    licence: "Public domain - government publications",
    licence_url: "https://www.mofep.gov.gh",
    description: "Government ministry responsible for fiscal policy, budget and public finance.",
    what_we_scrape: "Budget statements, fiscal policy documents, mid-year reviews, debt reports and quarterly bulletins.",
    update_frequency: "Annual budget cycle with quarterly bulletins",
    tier: "financial",
    logo_initial: "MOF",
    logo_colour: "#D97706",
  },
  {
    key: "cocobod",
    name: "Ghana Cocoa Board",
    url: "https://www.cocobod.gh",
    licence: "Public domain",
    licence_url: "https://www.cocobod.gh",
    description: "Government institution overseeing Ghana's cocoa sector.",
    what_we_scrape: "Cocoa production, purchases, export, producer price and seasonal public reports.",
    update_frequency: "Seasonal",
    tier: "ghana_government",
    logo_initial: "COCO",
    logo_colour: "#7C2D12",
  },
  {
    key: "ppa_procurement",
    name: "Public Procurement Authority",
    url: "https://www.ppaghana.org",
    licence: "Public domain",
    licence_url: "https://www.ppaghana.org",
    description: "Government authority for public procurement oversight and reporting.",
    what_we_scrape: "Procurement statistics, contract award publications, annual reports and public procurement datasets.",
    update_frequency: "Annual with periodic updates",
    tier: "ghana_government",
    logo_initial: "PPA",
    logo_colour: "#5B21B6",
  },
  {
    key: "ghanaports",
    name: "Ghana Ports and Harbours Authority",
    url: "https://www.ghanaports.com.gh",
    licence: "Public domain",
    licence_url: "https://www.ghanaports.com.gh",
    description: "Government authority managing Ghana's seaports and port statistics.",
    what_we_scrape: "Port throughput, cargo, container, vessel and trade statistics.",
    update_frequency: "Monthly",
    tier: "ghana_government",
    logo_initial: "GPHA",
    logo_colour: "#0E7490",
  },
  {
    key: "nic_insurance",
    name: "National Insurance Commission",
    url: "https://www.nicgh.org",
    licence: "Public domain",
    licence_url: "https://www.nicgh.org",
    description: "Regulator of Ghana's insurance industry.",
    what_we_scrape: "Insurance sector statistics, market reports, premium data, annual reports and regulatory publications.",
    update_frequency: "Annual",
    tier: "financial",
    logo_initial: "NIC",
    logo_colour: "#7C3AED",
  },
  {
    key: "ghana_health_service",
    name: "Ghana Health Service",
    url: "https://ghs.gov.gh",
    licence: "Public domain - government health publications",
    licence_url: "https://ghs.gov.gh",
    description: "Government health service responsible for public-health delivery and reporting.",
    what_we_scrape: "Health reports, disease surveillance publications, public-health guidelines and resource-hub documents.",
    update_frequency: "Irregular",
    tier: "ghana_government",
    logo_initial: "GHS",
    logo_colour: "#DC2626",
  },
  {
    key: "who_ghana",
    name: "World Health Organisation - Ghana",
    url: "https://www.who.int/countries/gha",
    licence: "CC BY-NC-SA 3.0 IGO",
    licence_url: "https://www.who.int/about/policies/publishing/copyright",
    description: "UN specialised agency for global public health.",
    what_we_scrape: "Ghana health indicators, mortality, disease burden and country profile data.",
    update_frequency: "Varies",
    tier: "international",
    logo_initial: "WHO",
    logo_colour: "#2563EB",
  },
  {
    key: "faostat_ghana",
    name: "FAOSTAT",
    url: "https://www.fao.org/faostat",
    licence: "CC BY-NC-SA 3.0 IGO",
    licence_url: "https://www.fao.org/contact-us/terms/en/",
    description: "FAO statistical database for food and agriculture.",
    what_we_scrape: "Ghana crop production, agricultural land, livestock, food supply and commodity statistics.",
    update_frequency: "Annual",
    tier: "international",
    logo_initial: "FAO",
    logo_colour: "#16A34A",
  },
  {
    key: "comtrade_ghana",
    name: "UN Comtrade",
    url: "https://comtrade.un.org",
    licence: "CC BY 4.0",
    licence_url: "https://creativecommons.org/licenses/by/4.0/",
    description: "United Nations international trade statistics database.",
    what_we_scrape: "Ghana imports, exports, commodity trade values, partner-country trade and annual merchandise data.",
    update_frequency: "Annual",
    tier: "international",
    logo_initial: "UN",
    logo_colour: "#1D4ED8",
  },
  {
    key: "world_bank_ghana",
    name: "World Bank Open Data",
    url: "https://data.worldbank.org/country/ghana",
    licence: "CC BY 4.0",
    licence_url: "https://datacatalog.worldbank.org/public-licenses",
    description: "Global development indicators from the World Bank.",
    what_we_scrape: "GDP, inflation, population, unemployment, literacy, health, energy, trade, revenue and urbanisation indicators.",
    update_frequency: "Annual",
    tier: "international",
    logo_initial: "WB",
    logo_colour: "#0F766E",
  },
  {
    key: "unicef_ghana",
    name: "UNICEF Data",
    url: "https://data.unicef.org",
    licence: "CC BY 4.0",
    licence_url: "https://creativecommons.org/licenses/by/4.0/",
    description: "UNICEF global data portal for child and adolescent wellbeing.",
    what_we_scrape: "Ghana child health, nutrition, education, immunisation and welfare indicators.",
    update_frequency: "Annual",
    tier: "international",
    logo_initial: "UNICEF",
    logo_colour: "#0099FF",
  },
];

const TABS = [
  { key: "all", label: "All" },
  { key: "ghana_government", label: "Ghana Government" },
  { key: "international", label: "International" },
  { key: "financial", label: "Financial" },
];

const TIER_LABELS = {
  ghana_government: { label: "GHANA GOV", color: "#006B3F" },
  international: { label: "INTERNATIONAL", color: "#1D4ED8" },
  financial: { label: "FINANCIAL", color: "#7C3AED" },
};

function truncateLicence(value) {
  return value.length > 20 ? `${value.slice(0, 20)}...` : value;
}

export default function SourcesPage() {
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredSources = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return SOURCE_LIST.filter((source) => {
      const matchesTab = activeTab === "all" || source.tier === activeTab;
      const haystack = `${source.name} ${source.description} ${source.what_we_scrape} ${source.licence}`.toLowerCase();
      return matchesTab && (!query || haystack.includes(query));
    });
  }, [filter, activeTab]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-base)", color: "var(--text-primary)", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        .sources-nav {
          position: sticky;
          top: 0;
          z-index: 80;
          background: rgba(15,26,20,0.78);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid var(--border-subtle);
        }
        .sources-nav-inner {
          max-width: 1200px;
          height: 60px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .sources-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 800;
        }
        .sources-logo-mark {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--green);
          color: white;
          display: grid;
          place-items: center;
          font-size: 13px;
        }
        .sources-nav-links {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .sources-nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
        }
        .sources-nav-links a:hover { color: var(--text-primary); }
        .sources-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
        }
        .sources-card {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .sources-card:hover {
          border-color: var(--border-default);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .sources-nav-links { display: none; }
          .sources-card-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="sources-nav">
        <div className="sources-nav-inner">
          <Link to="/" className="sources-logo">
            <span className="sources-logo-mark">GD</span>
            <span>GhanaDataHub</span>
          </Link>
          <div className="sources-nav-links">
            <Link to="/sources">Sources</Link>
            <Link to="/login">Log in</Link>
            <DarkModeToggle />
          </div>
        </div>
      </nav>

      <section style={{ position: "relative", overflow: "hidden", padding: "80px 24px 60px", background: "var(--surface-base)" }}>
        <div className="dark-hero-glow" style={{ top: "-140px", left: "-180px" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", border: "1px solid rgba(0,163,92,0.3)", background: "rgba(0,163,92,0.08)", color: "var(--green)", borderRadius: 999, padding: "5px 13px", fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>
            Data Transparency
          </div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", lineHeight: 1.08, fontWeight: 900, color: "var(--text-primary)", margin: "18px 0 0" }}>
            Where Our Data Comes From
          </h1>
          <p style={{ maxWidth: 620, fontSize: 18, lineHeight: 1.6, color: "var(--text-secondary)", margin: "18px 0 0" }}>
            GhanaDataHub aggregates data from 18 official government, international, and research sources. Every dataset is attributed to its original publisher in compliance with open data licences.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            {["18 official sources", "100% attributed", "Open licence only"].map((item) => (
              <span key={item} style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", borderRadius: 999, padding: "6px 14px", fontSize: 13 }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 800, margin: "0 auto 48px", padding: "0 24px" }}>
        <div style={{ background: "var(--surface-card)", border: "1px solid rgba(0,163,92,0.2)", borderLeft: "4px solid var(--green)", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
            <Scale size={16} color="var(--green)" /> Attribution Requirement
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.75, margin: "12px 0 0" }}>
            All Ghana Government data on this platform is published under the Open Data Commons Attribution Licence (ODC-By 1.0). This licence requires that all reusers attribute the publisher listed in the dataset metadata. GhanaDataHub attributes every dataset to its source organisation. You must also attribute the source if you use this data in your own work.
          </p>
          <a href="https://opendatacommons.org/licenses/by/1.0/" target="_blank" rel="noreferrer" style={{ display: "inline-flex", marginTop: 12, color: "var(--green)", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
            Read the full ODC-By licence →
          </a>
        </div>
      </section>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>All Data Sources</h2>
          <div style={{ position: "relative", minWidth: 260, flex: "0 1 360px" }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)" }} />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search sources..."
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "var(--surface-elevated)",
                color: "var(--text-primary)",
                padding: "0 12px 0 36px",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                height: 34,
                borderRadius: 999,
                border: activeTab === tab.key ? "1px solid var(--green)" : "1px solid var(--border-default)",
                background: activeTab === tab.key ? "var(--green)" : "var(--surface-elevated)",
                color: activeTab === tab.key ? "white" : "var(--text-secondary)",
                padding: "0 14px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="sources-card-grid">
          {filteredSources.map((source) => {
            const tier = TIER_LABELS[source.tier];
            return (
              <article key={source.key} className="sources-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: source.logo_colour, color: "white", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 900 }}>
                    {source.logo_initial}
                  </div>
                  <span style={{ background: tier.color, color: "white", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 900, letterSpacing: 0.4 }}>
                    {tier.label}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: "14px 0 0" }}>{source.name}</h3>
                <a href={source.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--green)", fontSize: 12, textDecoration: "none", marginTop: 4 }}>
                  <ExternalLink size={12} /> {source.url}
                </a>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "10px 0 0" }}>{source.description}</p>
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5 }}>Data collected:</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>{source.what_we_scrape}</div>
                </div>
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-muted)", fontSize: 12, minWidth: 0 }}>
                    <Calendar size={12} /> <span>{source.update_frequency}</span>
                  </div>
                  <a href={source.licence_url} target="_blank" rel="noreferrer" title={source.licence} style={{ flexShrink: 0, border: "1px solid var(--border-default)", borderRadius: 6, padding: "3px 8px", color: "var(--text-secondary)", fontSize: 12, textDecoration: "none" }}>
                    {truncateLicence(source.licence)}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "32px 24px", color: "var(--text-muted)", fontSize: 13 }}>
        If you believe any attribution is incorrect or a source licence has changed, please contact sources@ghanadatahub.com. We review all attribution claims within 5 business days.
      </footer>
    </div>
  );
}
