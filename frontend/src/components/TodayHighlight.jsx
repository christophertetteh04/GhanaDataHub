import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Minus, ArrowRight, Share2,
  BarChart3, Leaf, Users, Building2, Zap, Wifi, Droplets,
  Globe, ShieldCheck, Activity, Heart, BookOpen, Banknote,
  PiggyBank, Truck, Radio, Wind, Sun, Vote, MapPin, Baby,
  Briefcase, Scale
} from "lucide-react";
import { datasetsApi } from "../services/api";

// ─────────────────────────────────────────────
// 30 Daily Highlights
// ─────────────────────────────────────────────
const HIGHLIGHTS = [
  // Days 1-5: Economic Indicators
  {
    headline: "Ghana inflation fell to 5.3% — the lowest in over 3 years",
    context:
      "After peaking at 54.1% in December 2022, Ghana's inflation has declined steadily. The 5.3% figure represents a dramatic stabilisation driven by tight monetary policy and a recovering cedi.",
    searchTerm: "inflation",
    category: "Economy",
    colour: "linear-gradient(135deg, #006B3F 0%, #00A35C 100%)",
    icon: "TrendingDown",
    dataPoint: "5.3%",
    dataLabel: "Current Inflation Rate",
    trend: "down",
  },
  {
    headline: "Ghana's GDP growth forecast raised to 4.5% for 2025",
    context:
      "The IMF revised Ghana's GDP growth upward following strong performance in the services and agribusiness sectors. Oil production recovery and gold exports underpinned the revision.",
    searchTerm: "GDP Ghana",
    category: "Economy",
    colour: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)",
    icon: "TrendingUp",
    dataPoint: "4.5%",
    dataLabel: "GDP Growth Forecast 2025",
    trend: "up",
  },
  {
    headline: "The cedi has strengthened 18% against the dollar since its 2022 low",
    context:
      "Ghana's cedi, which crashed to over GH¢16.5 per dollar in 2022, has staged a sustained recovery. The Bank of Ghana's reserve rebuilding and IMF programme have been key drivers.",
    searchTerm: "cedi exchange rate",
    category: "Economy",
    colour: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
    icon: "TrendingUp",
    dataPoint: "GH¢11.46",
    dataLabel: "USD/GHS Rate",
    trend: "up",
  },
  {
    headline: "Ghana 91-Day Treasury Bill rate dips to 15.6% — bond market easing",
    context:
      "T-bill yields have fallen from highs above 35% in 2023 as fiscal consolidation progresses under the IMF-supported programme. Declining yields signal improving investor confidence.",
    searchTerm: "treasury bill Ghana",
    category: "Economy",
    colour: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
    icon: "TrendingDown",
    dataPoint: "15.6%",
    dataLabel: "91-Day T-Bill Rate",
    trend: "down",
  },
  {
    headline: "Bank of Ghana holds monetary policy rate at 27% for third consecutive meeting",
    context:
      "The Monetary Policy Committee maintained the policy rate, signalling confidence that inflation is on a sustained downward path. Analysts expect cuts to begin in Q3 2025 if inflation stays below 10%.",
    searchTerm: "monetary policy Ghana",
    category: "Economy",
    colour: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
    icon: "Minus",
    dataPoint: "27%",
    dataLabel: "MPR Policy Rate",
    trend: "stable",
  },

  // Days 6-10: Agriculture and Commodities
  {
    headline: "Ghana cocoa output expected to rebound to 700,000 MT in 2024/25",
    context:
      "After two consecutive seasons of disease-linked shortfalls, Ghana's cocoa output is forecast to recover. The COCOBOD's mass spraying and fertiliser subsidy programmes are showing results.",
    searchTerm: "cocoa Ghana production",
    category: "Agriculture",
    colour: "linear-gradient(135deg, #92400E 0%, #D97706 100%)",
    icon: "Leaf",
    dataPoint: "700k MT",
    dataLabel: "Forecast Cocoa Output",
    trend: "up",
  },
  {
    headline: "Cassava remains Ghana's most-produced food crop at 23 million MT annually",
    context:
      "Cassava dominates Ghana's food agriculture, providing staple nutrition for over 50% of households. Value-added processing remains underdeveloped, representing a significant economic opportunity.",
    searchTerm: "cassava Ghana",
    category: "Agriculture",
    colour: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
    icon: "Leaf",
    dataPoint: "23M MT",
    dataLabel: "Annual Cassava Output",
    trend: "stable",
  },
  {
    headline: "Maize prices rose 12% this quarter, affecting food security in northern Ghana",
    context:
      "Seasonal rainfall deficits in the Upper East and Upper West regions have pushed maize prices higher. WFP and government agencies have activated food assistance programmes ahead of the lean season.",
    searchTerm: "maize prices Ghana",
    category: "Agriculture",
    colour: "linear-gradient(135deg, #78350F 0%, #F59E0B 100%)",
    icon: "TrendingUp",
    dataPoint: "+12%",
    dataLabel: "Maize Price Rise (Qtr)",
    trend: "up",
  },
  {
    headline: "Palm oil production in Ghana reaches 490,000 MT, driven by Brong-Ahafo expansion",
    context:
      "Ghana's palm oil sector is growing with new plantations in the Brong-Ahafo and Ashanti regions. The government's oil palm development programme has attracted significant private investment.",
    searchTerm: "palm oil Ghana",
    category: "Agriculture",
    colour: "linear-gradient(135deg, #B45309 0%, #FBBF24 100%)",
    icon: "TrendingUp",
    dataPoint: "490k MT",
    dataLabel: "Annual Palm Oil Output",
    trend: "up",
  },
  {
    headline: "Ghana exports $620M in rubber annually — a crop with significant upside potential",
    context:
      "Natural rubber is one of Ghana's fastest growing agricultural exports. Investment in improved planting material and processing capacity could triple output by 2030 according to MIDA projections.",
    searchTerm: "rubber Ghana exports",
    category: "Agriculture",
    colour: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    icon: "TrendingUp",
    dataPoint: "$620M",
    dataLabel: "Annual Rubber Exports",
    trend: "up",
  },

  // Days 11-15: Social Indicators
  {
    headline: "Ghana adult literacy rate reaches 80.7% — a 10-point gain in a decade",
    context:
      "Literacy has improved significantly following the implementation of the Free Senior High School policy. Gender parity in literacy is closing, with female literacy now at 76.8%.",
    searchTerm: "literacy Ghana education",
    category: "Education",
    colour: "linear-gradient(135deg, #4338CA 0%, #818CF8 100%)",
    icon: "BookOpen",
    dataPoint: "80.7%",
    dataLabel: "Adult Literacy Rate",
    trend: "up",
  },
  {
    headline: "Maternal mortality falls to 310 per 100,000 births — but the target is 70",
    context:
      "Ghana has made measurable progress on maternal health, but the UN SDG target of 70 deaths per 100,000 remains distant. Rural-urban disparities in skilled birth attendance are the key challenge.",
    searchTerm: "maternal mortality Ghana",
    category: "Health",
    colour: "linear-gradient(135deg, #9D174D 0%, #F472B6 100%)",
    icon: "Heart",
    dataPoint: "310",
    dataLabel: "Deaths per 100k Births",
    trend: "down",
  },
  {
    headline: "Ghana's childhood vaccination rate hits 88% — one of West Africa's highest",
    context:
      "Ghana's Expanded Programme on Immunisation has achieved near-universal coverage for DPT3, measles, and polio vaccines. Community health worker networks in rural areas have been central to this success.",
    searchTerm: "vaccination Ghana",
    category: "Health",
    colour: "linear-gradient(135deg, #065F46 0%, #34D399 100%)",
    icon: "Activity",
    dataPoint: "88%",
    dataLabel: "Childhood Vaccination Rate",
    trend: "up",
  },
  {
    headline: "Infant mortality in Ghana has dropped to 36 per 1,000 live births",
    context:
      "Ghana has more than halved its infant mortality rate since 2000. Improved access to community health workers, oral rehydration therapy, and bed nets have driven reductions in child death.",
    searchTerm: "infant mortality Ghana",
    category: "Health",
    colour: "linear-gradient(135deg, #0C4A6E 0%, #38BDF8 100%)",
    icon: "Baby",
    dataPoint: "36",
    dataLabel: "Infant Deaths per 1,000",
    trend: "down",
  },
  {
    headline: "Life expectancy in Ghana reaches 64.7 years — up from 56 in 2000",
    context:
      "Improved healthcare access, declining infectious disease burden, and better nutrition have extended Ghanaian lifespans significantly. Urban residents live on average 6 years longer than rural counterparts.",
    searchTerm: "life expectancy Ghana",
    category: "Health",
    colour: "linear-gradient(135deg, #134E4A 0%, #2DD4BF 100%)",
    icon: "Users",
    dataPoint: "64.7 yrs",
    dataLabel: "Average Life Expectancy",
    trend: "up",
  },

  // Days 16-20: Financial Sector
  {
    headline: "GSE Composite Index returns to positive territory with 18% YTD gain",
    context:
      "After a difficult 2022-2023 period marked by debt restructuring concerns, the Ghana Stock Exchange has recovered strongly. MTN Ghana and GCB Bank have been the leading contributors.",
    searchTerm: "GSE stock exchange Ghana",
    category: "Finance",
    colour: "linear-gradient(135deg, #006B3F 0%, #059669 100%)",
    icon: "TrendingUp",
    dataPoint: "+18%",
    dataLabel: "GSE Composite YTD",
    trend: "up",
  },
  {
    headline: "Ghana banking sector total assets grow to GH¢285 billion",
    context:
      "The banking sector has recovered from the 2019 cleanup, with aggregate assets, capital adequacy, and loan growth all showing positive trajectories. Non-performing loans remain a watch point at 22%.",
    searchTerm: "banking sector Ghana assets",
    category: "Finance",
    colour: "linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%)",
    icon: "Banknote",
    dataPoint: "GH¢285B",
    dataLabel: "Banking Sector Assets",
    trend: "up",
  },
  {
    headline: "Insurance penetration in Ghana remains very low at just 1.1% of GDP",
    context:
      "Despite a large formal economy, Ghana's insurance sector is underdeveloped. Mobile-linked micro-insurance products are growing rapidly but from a very low base, presenting a substantial market opportunity.",
    searchTerm: "insurance Ghana",
    category: "Finance",
    colour: "linear-gradient(135deg, #6B21A8 0%, #C084FC 100%)",
    icon: "ShieldCheck",
    dataPoint: "1.1%",
    dataLabel: "Insurance Penetration / GDP",
    trend: "up",
  },
  {
    headline: "Mobile money transactions in Ghana exceed GH¢1.5 trillion in 2024",
    context:
      "Ghana's fintech ecosystem is one of the most advanced in Africa. MoMo interoperability, agent banking, and QR payments have driven massive adoption, with MoMo accounts exceeding 55 million.",
    searchTerm: "mobile money Ghana fintech",
    category: "Finance",
    colour: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)",
    icon: "PiggyBank",
    dataPoint: "GH¢1.5T",
    dataLabel: "MoMo Transactions 2024",
    trend: "up",
  },
  {
    headline: "Diaspora remittances to Ghana reach $4.7 billion — 7% of GDP",
    context:
      "Ghana is consistently among Africa's top remittance recipients. The US, UK, and Germany are the largest source countries. Digital transfer platforms have reduced average costs from 9% to under 5%.",
    searchTerm: "remittances Ghana diaspora",
    category: "Finance",
    colour: "linear-gradient(135deg, #0F4C81 0%, #3B82F6 100%)",
    icon: "Globe",
    dataPoint: "$4.7B",
    dataLabel: "Annual Remittances",
    trend: "up",
  },

  // Days 21-25: Infrastructure and Energy
  {
    headline: "Ghana electricity access reaches 85% — but reliability remains a challenge",
    context:
      "Ghana has extended grid connections substantially, but load shedding (dumsor) continues to affect productivity. The government's infrastructure investment plan targets 95% access by 2028.",
    searchTerm: "electricity access Ghana",
    category: "Infrastructure",
    colour: "linear-gradient(135deg, #854D0E 0%, #EAB308 100%)",
    icon: "Zap",
    dataPoint: "85%",
    dataLabel: "Electricity Access Rate",
    trend: "up",
  },
  {
    headline: "Ghana has 78,000 km of roads but only 38% are paved",
    context:
      "Road infrastructure remains a critical constraint on Ghana's agricultural and economic development. The Ghana Road Fund and PPP concession models are being used to accelerate paving of key corridors.",
    searchTerm: "roads infrastructure Ghana",
    category: "Infrastructure",
    colour: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
    icon: "Truck",
    dataPoint: "38%",
    dataLabel: "Paved Road Coverage",
    trend: "up",
  },
  {
    headline: "Mobile phone penetration in Ghana surpasses 100%, with 41M active SIMs",
    context:
      "Ghana's telecoms market is one of West Africa's most competitive, with four active networks. Data usage is growing at 30% per year as smartphone prices decline and 4G coverage expands.",
    searchTerm: "telecoms mobile Ghana",
    category: "Infrastructure",
    colour: "linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)",
    icon: "Radio",
    dataPoint: "100%+",
    dataLabel: "Mobile Penetration Rate",
    trend: "up",
  },
  {
    headline: "Only 62% of Ghanaians have access to safely managed drinking water",
    context:
      "Despite progress, a significant share of Ghana's population relies on unimproved water sources. The rural-urban gap is stark — 80% access in cities versus 48% in rural areas.",
    searchTerm: "water access Ghana",
    category: "Infrastructure",
    colour: "linear-gradient(135deg, #0C4A6E 0%, #0EA5E9 100%)",
    icon: "Droplets",
    dataPoint: "62%",
    dataLabel: "Safe Water Access Rate",
    trend: "up",
  },
  {
    headline: "Basic sanitation access in Ghana at 50% — millions still use open defecation",
    context:
      "Ghana's community-led total sanitation (CLTS) programme has improved coverage, but 50% national access masks significant regional inequality. Northern Ghana, particularly, has critical sanitation gaps.",
    searchTerm: "sanitation Ghana",
    category: "Infrastructure",
    colour: "linear-gradient(135deg, #065F46 0%, #34D399 100%)",
    icon: "Wind",
    dataPoint: "50%",
    dataLabel: "Basic Sanitation Access",
    trend: "up",
  },

  // Days 26-30: Governance and Demographics
  {
    headline: "Ghana's 2024 voter register stands at 18.7 million — 97% of eligible adults",
    context:
      "Ghana has one of Africa's most credible electoral systems. The Electoral Commission's biometric voter verification and transparent tallying processes are frequently cited as regional best practice.",
    searchTerm: "voter registration Ghana election",
    category: "Governance",
    colour: "linear-gradient(135deg, #006B3F 0%, #00A35C 100%)",
    icon: "Vote",
    dataPoint: "18.7M",
    dataLabel: "Registered Voters",
    trend: "up",
  },
  {
    headline: "Greater Accra holds 4.8 million people — 16% of Ghana's total population",
    context:
      "Greater Accra is Ghana's most densely populated region and accounts for over 30% of GDP. Rapid urbanisation is intensifying pressure on housing, transport, and public services in the capital.",
    searchTerm: "population region Ghana",
    category: "Demographics",
    colour: "linear-gradient(135deg, #1E3A5F 0%, #3B82F6 100%)",
    icon: "MapPin",
    dataPoint: "4.8M",
    dataLabel: "Greater Accra Population",
    trend: "up",
  },
  {
    headline: "Ghana's urban population now exceeds 60%, a historic threshold",
    context:
      "For the first time, more Ghanaians live in urban areas than rural. Ashanti and Greater Accra account for the bulk of urbanisation. This shift has major implications for food systems, housing, and services.",
    searchTerm: "urbanisation Ghana population",
    category: "Demographics",
    colour: "linear-gradient(135deg, #4338CA 0%, #818CF8 100%)",
    icon: "Building2",
    dataPoint: "60%",
    dataLabel: "Urban Population Share",
    trend: "up",
  },
  {
    headline: "Youth unemployment in Ghana is 13.4%, masking much higher underemployment",
    context:
      "Official unemployment data understates the challenge. Over 40% of employed youth are in vulnerable or informal work. The government's YouStart and MASLOC programmes aim to create 1 million youth jobs.",
    searchTerm: "youth unemployment Ghana",
    category: "Demographics",
    colour: "linear-gradient(135deg, #B45309 0%, #FCD34D 100%)",
    icon: "Briefcase",
    dataPoint: "13.4%",
    dataLabel: "Youth Unemployment Rate",
    trend: "down",
  },
  {
    headline: "Ghana's public debt to GDP ratio falls to 73% under the IMF programme",
    context:
      "After breaching 100% of GDP in 2022 and triggering a sovereign debt restructuring, Ghana's debt metrics are improving. The IMF Extended Credit Facility has been critical in stabilising the fiscal position.",
    searchTerm: "debt GDP Ghana fiscal",
    category: "Governance",
    colour: "linear-gradient(135deg, #7F1D1D 0%, #EF4444 100%)",
    icon: "Scale",
    dataPoint: "73%",
    dataLabel: "Public Debt / GDP",
    trend: "down",
  },
];

// Icon resolver
const ICON_MAP = {
  TrendingUp, TrendingDown, Minus, BarChart3, Leaf, Users, Building2,
  Zap, Wifi, Droplets, Globe, ShieldCheck, Activity, Heart, BookOpen,
  Banknote, PiggyBank, Truck, Radio, Wind, Sun, Vote, MapPin, Baby,
  Briefcase, Scale,
};

function resolveIcon(name) {
  return ICON_MAP[name] || BarChart3;
}

// Format today as 'MONDAY, 14 JULY 2025'
function formatHeroDate() {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).toUpperCase();
}

// Parse a numeric value from strings like '5.3%', '$4.7B', '700k MT', '80.7%'
function extractNumber(dataPoint) {
  if (!dataPoint) return null;
  const num = parseFloat(dataPoint.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

// Count-up hook (self-contained — works even without useCountUp)
function useSimpleCountUp(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

export default function TodayHighlight() {
  const navigate = useNavigate();

  const dayIdx = (new Date().getDate() - 1) % 30;
  const highlight = HIGHLIGHTS[dayIdx];

  const [relatedDatasets, setRelatedDatasets] = useState([]);
  const [copied, setCopied] = useState(false);

  // Fetch up to 2 related datasets
  useEffect(() => {
    datasetsApi
      .list({ search: highlight.searchTerm, per_page: 2, limit: 2 })
      .then((r) => {
        const data = r.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];
        setRelatedDatasets(items.slice(0, 2));
      })
      .catch(() => setRelatedDatasets([]));
  }, [highlight.searchTerm]);

  // Count-up for the data point number
  const rawNumber = extractNumber(highlight.dataPoint);
  const animated = useSimpleCountUp(rawNumber);

  // Rebuild the animated display string
  function buildAnimatedValue() {
    if (rawNumber === null) return highlight.dataPoint;
    const prefix = highlight.dataPoint.match(/^[^0-9]*/)?.[0] || "";
    const suffix = highlight.dataPoint.replace(/^[^0-9]*[\d.,]+/, "");
    const decimals = (String(rawNumber).split(".")[1] || "").length;
    return `${prefix}${animated.toFixed(decimals)}${suffix}`;
  }

  // Share
  function handleShare() {
    const url = `${window.location.origin}/datasets?search=${encodeURIComponent(highlight.searchTerm)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Trend
  const TrendIcon = highlight.trend === "up"
    ? TrendingUp
    : highlight.trend === "down"
    ? TrendingDown
    : Minus;

  const trendColour = highlight.trend === "up"
    ? "#22C55E"
    : highlight.trend === "down"
    ? "#EF4444"
    : "#9CA3AF";

  const trendLabel =
    highlight.trend === "up"
      ? "Trending upward compared to previous period"
      : highlight.trend === "down"
      ? "Trending downward compared to previous period"
      : "Stable compared to previous period";

  const DataIcon = resolveIcon(highlight.icon);

  // Navigation dots: 6 groups of 5 days
  const groupIdx = Math.floor(dayIdx / 5);

  return (
    <div className="th-outer fade-in-up">
      <style>{highlightStyles}</style>

      <div className="th-card">
        {/* Share button */}
        <button className="th-share-btn" onClick={handleShare} title="Share this highlight">
          <Share2 size={16} />
          {copied && <span className="th-copied-tip">Copied!</span>}
        </button>

        {/* LEFT — editorial */}
        <div className="th-left" style={{ background: highlight.colour }}>
          {/* decorative circles */}
          <div className="th-circle th-circle-lg" />
          <div className="th-circle th-circle-sm" />

          <div className="th-left-content">
            <div className="th-date-label">{formatHeroDate()}</div>
            <div className="th-cat-badge">{highlight.category}</div>
            <h2 className="th-headline">{highlight.headline}</h2>
            <p className="th-context">{highlight.context}</p>
            <button
              className="th-explore-link"
              onClick={() =>
                navigate(`/datasets?search=${encodeURIComponent(highlight.searchTerm)}`)
              }
            >
              Explore the data <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT — data */}
        <div className="th-right">
          <div className="th-data-icon">
            <DataIcon size={36} color="var(--green)" />
          </div>

          <div className="th-data-point">{buildAnimatedValue()}</div>
          <div className="th-data-label">{highlight.dataLabel}</div>

          <div className="th-trend-row">
            <TrendIcon size={28} color={trendColour} />
            <span className="th-trend-text" style={{ color: trendColour }}>
              {trendLabel}
            </span>
          </div>

          <div className="th-divider" />

          <div className="th-related-title">Related datasets on GhanaDataHub</div>

          {relatedDatasets.length > 0 ? (
            <div className="th-related-list">
              {relatedDatasets.map((d) => (
                <button
                  key={d.id}
                  className="th-related-item"
                  onClick={() => navigate(`/datasets/${d.id}`)}
                >
                  <ArrowRight size={12} />
                  {d.title}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="th-related-item th-related-upload"
              onClick={() => navigate("/datasets")}
            >
              + Upload data for this topic
            </button>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="th-dots">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`th-dot ${i === groupIdx ? "th-dot-active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

const highlightStyles = `
  .th-outer {
    padding: 20px 28px 0;
  }

  .th-card {
    position: relative;
    display: grid;
    grid-template-columns: 60fr 40fr;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
    min-height: 300px;
  }

  /* SHARE BUTTON */
  .th-share-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;
  }
  .th-share-btn:hover {
    background: rgba(255,255,255,0.30);
  }
  .th-copied-tip {
    position: absolute;
    top: 40px;
    right: 0;
    background: rgba(0,0,0,0.80);
    color: #fff;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
  }

  /* LEFT */
  .th-left {
    position: relative;
    padding: 32px 36px;
    overflow: hidden;
  }
  .th-left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .th-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    pointer-events: none;
  }
  .th-circle-lg {
    width: 180px;
    height: 180px;
    top: -50px;
    right: -40px;
    filter: blur(20px);
  }
  .th-circle-sm {
    width: 100px;
    height: 100px;
    bottom: 20px;
    right: 60px;
    filter: blur(14px);
    background: rgba(255,255,255,0.08);
  }
  .th-date-label {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.1em;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .th-cat-badge {
    display: inline-block;
    padding: 3px 12px;
    border: 1px solid rgba(255,255,255,0.55);
    border-radius: 99px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 12px;
    align-self: flex-start;
  }
  .th-headline {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    margin: 0 0 10px;
    font-family: 'Sora', sans-serif;
  }
  .th-context {
    font-size: 14px;
    color: rgba(255,255,255,0.82);
    line-height: 1.7;
    margin: 0 0 auto;
    padding-bottom: 24px;
  }
  .th-explore-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.35);
    border-radius: 99px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 18px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    align-self: flex-start;
  }
  .th-explore-link:hover {
    background: rgba(255,255,255,0.28);
    transform: translateX(2px);
  }

  /* RIGHT */
  .th-right {
    background: #fff;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
  }
  .th-data-icon {
    margin-bottom: 16px;
  }
  .th-data-point {
    font-size: 48px;
    font-weight: 800;
    color: var(--dark, #111827);
    line-height: 1;
    font-family: 'Sora', sans-serif;
    margin-bottom: 6px;
  }
  .th-data-label {
    font-size: 14px;
    color: var(--gray-500, #6B7280);
    font-weight: 500;
    margin-bottom: 20px;
  }
  .th-trend-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .th-trend-text {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }
  .th-divider {
    height: 1px;
    background: var(--gray-100, #F3F4F6);
    margin-bottom: 16px;
  }
  .th-related-title {
    font-size: 12px;
    color: var(--gray-500, #6B7280);
    font-weight: 500;
    margin-bottom: 10px;
  }
  .th-related-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .th-related-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--green, #006B3F);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    padding: 0;
    line-height: 1.4;
    transition: opacity 0.15s;
  }
  .th-related-item:hover {
    opacity: 0.75;
  }
  .th-related-upload {
    color: var(--gray-500, #6B7280);
    font-weight: 500;
  }

  /* DOTS */
  .th-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding-bottom: 4px;
  }
  .th-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gray-300, #D1D5DB);
    transition: width 0.2s, background 0.2s;
  }
  .th-dot-active {
    width: 8px;
    height: 8px;
    background: var(--green, #006B3F);
  }

  /* ENTRY ANIMATION */
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-in-up {
    animation: fade-in-up 0.5s ease-out both;
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .th-card {
      grid-template-columns: 1fr;
    }
    .th-left {
      padding: 24px 20px;
    }
    .th-right {
      padding: 24px 20px;
    }
    .th-headline {
      font-size: 18px;
    }
    .th-data-point {
      font-size: 36px;
    }
    .th-outer {
      padding: 16px 16px 0;
    }
  }
`;
