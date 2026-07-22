import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookText,
  Search,
  Calendar,
  Share2,
  BadgeCheck,
  Bot,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Heart,
  Leaf,
  Users,
  Vote,
  Wind,
} from "lucide-react";
import { datasetsApi } from "../services/api";

export const BLOG_POSTS = [
  {
    id: "ghana-gdp-trends-2024",
    title: "Ten Years of Ghana GDP Growth — What the Numbers Tell Us",
    author: "Amina Mensah",
    authorInitials: "AM",
    authorColor: "#D1FAE5",
    category: "Economy",
    publishedAt: "2024-07-08T09:15:00.000Z",
    readingTime: 8,
    excerpt:
      "Ghana has sustained positive GDP growth for most of the last decade, but the pace has shifted with commodity cycles and structural reforms. This story walks through the data behind growth, sector contributions, and what the 2024 outlook reveals.",
    body:
      "Ghana’s GDP story from 2014 through 2024 shows a resilient expansion driven by services and oil. After a slowdown in 2016, the economy rebounded with robust agriculture and digital finance growth, while oil production boosted export earnings. The IMF and Ghana Statistical Service highlight that services now account for nearly half of GDP, underscoring a gradual shift away from primary commodities.\n\nPublic investment in roads, energy, and digital infrastructure has supported growth, but high debt and inflation remain headwinds. In 2023, nominal GDP growth was tempered by currency pressure even as output volumes rose. The data suggest that expansion is increasingly dependent on domestic demand and private-sector recovery.\n\nManufacturing has been a smaller share of the economy than expected, but recent policy incentives for light manufacturing and agro-processing are designed to expand this base. The Central Bank’s focus on stabilizing the cedi and supporting local industry may determine whether GDP growth can consistently exceed 5% in the coming years.\n\nA closer look at regional performance reveals Greater Accra and Ashanti as leading contributors, with Northern, Upper East, and Upper West regions growing from smaller bases. This geographic nuance reinforces that national GDP figures only tell part of the story — local growth remains uneven but increasingly supported by public spending and agriculture-led recovery.",
    heroColor: "linear-gradient(135deg, #006B3F 0%, #00A35C 100%)",
    relatedDatasetId: null,
    tags: ["GDP", "growth", "economy"],
  },
  {
    id: "ghana-maternal-health-progress",
    title: "Ghana Maternal Health Progress: A Data Story",
    author: "Kojo Osei",
    authorInitials: "KO",
    authorColor: "#E0F2FE",
    category: "Health",
    publishedAt: "2024-07-06T14:20:00.000Z",
    readingTime: 7,
    excerpt:
      "Maternal health has improved markedly in Ghana over the past decade, with declines in mortality and better care access. The data reveal which regions are closing gaps and where progress remains fragile.",
    body:
      "Ghana’s maternal mortality ratio has fallen significantly since 2010, supported by investment in midwifery, community-based health planning, and ambulatory referrals. The Ghana Health Service reports that skilled birth attendance is now above 80% in many regions, a strong signal of system strengthening.\n\nPreventive care coverage has expanded, with antenatal visits and tetanus vaccination reaching more pregnant women each year. However, disparities persist: Upper West and Northern regions still lag behind Greater Accra and Ashanti in facility-based deliveries. These differences are visible in the data and reflect the need for targeted outreach.\n\nNutrition, malaria prevention, and transportation remain critical factors. When women receive regular antenatal checks and have reliable emergency transport, complications such as hemorrhage and hypertensive disorders are far more likely to be managed successfully. Ghana’s national strategy now emphasizes integrated maternal-newborn services to keep that momentum going.\n\nThe latest figures show that while maternal mortality is down, maternal morbidity and late referrals continue to demand attention. Data-driven planning, including district-level dashboards and supplier forecasting for essential drugs, will be key to turning this progress into sustainable gains across every region.",
    heroColor: "linear-gradient(135deg, #DB2777 0%, #F472B6 100%)",
    relatedDatasetId: null,
    tags: ["health", "maternal", "care"],
  },
  {
    id: "cocoa-production-trends-ghana-vs-world",
    title: "Cocoa Production Trends: Ghana vs the World",
    author: "Esi Kwarteng",
    authorInitials: "EK",
    authorColor: "#FEF3C7",
    category: "Agriculture",
    publishedAt: "2024-07-04T11:40:00.000Z",
    readingTime: 6,
    excerpt:
      "Ghana remains one of the world’s top cocoa producers, but global demand, climate risk, and farmgate pricing shape its competitive position. This story compares local production trends with the wider FAOSTAT dataset.",
    body:
      "Cocoa is Ghana’s flagship agricultural export, accounting for a significant share of foreign exchange earnings. FAOSTAT data show that Ghana’s cocoa production has hovered between 800,000 and 900,000 tonnes annually in recent years, placing it second only to Côte d’Ivoire.\n\nThe country’s cocoa acreage and yield metrics reveal a mixed picture: while farm output is high, productivity per hectare trails the best-performing West African estates due to aging trees and uneven fertilizer access. Ghana’s government and COCOBOD have responded with improved seedlings and price stabilization programs.\n\nWorldwide, cocoa supply remains vulnerable to climate shocks and pest outbreaks. Ghana’s data-driven monitoring of rainfall patterns and disease incidence is increasingly important for planning harvest cycles and buffer stocks. The export profile also shows growing interest in traceable, premium cocoa linked to sustainable practices.\n\nLooking ahead, the opportunity for Ghana lies in moving up the value chain through local processing and agritech adoption. The data suggest that investments in farmer training, input distribution, and market transparency will help Ghana retain its status as a cocoa powerhouse while improving smallholder incomes.",
    heroColor: "linear-gradient(135deg, #0F766E 0%, #A7F3D0 100%)",
    relatedDatasetId: null,
    tags: ["cocoa", "agriculture", "trade"],
  },
  {
    id: "ghana-population-growth-by-region",
    title: "Ghana Population Growth by Region 2010-2021",
    author: "Nana Kwame",
    authorInitials: "NK",
    authorColor: "#FEE2E2",
    category: "Demographics",
    publishedAt: "2024-07-02T08:05:00.000Z",
    readingTime: 7,
    excerpt:
      "Census data from 2010 to 2021 show how Ghana’s population is shifting across regions, with urbanization and youth growth reshaping demand for services. This story breaks down the demographic picture region by region.",
    body:
      "Ghana’s 2021 population figures confirm continued growth, with the national population now exceeding 32 million. Major urban centres like Greater Accra and Ashanti continue to grow fastest, while the northern regions expand from smaller bases. The data reveal a clear trend of internal migration toward economic opportunity.\n\nYouth cohorts remain the largest segment of the population, with nearly half of Ghanaians under age 25. That demographic momentum creates both promise and pressure: schools, health facilities, and jobs must keep pace with a rapid entry of new workers. Data on age structure is therefore essential for planning education and social services.\n\nRegional variation is striking. Greater Accra has the highest population density and growth rate, while Savannah and Upper West regions have the lowest density but steady increases in rural population. Urbanization rates are rising in formerly agricultural districts, reflecting expanded road access and market linkages.\n\nThe demographic data also show changing household sizes and fertility patterns. As fertility rates decline gradually, the transition toward smaller family units is visible in both urban and peri-urban areas. This shift has implications for housing demand, utilities, and social policy across Ghana’s regions.",
    heroColor: "linear-gradient(135deg, #9333EA 0%, #A78BFA 100%)",
    relatedDatasetId: null,
    regionMap: {
      title: "Ghana Population by Region 2021",
      rows: [
        ["Region", "Population"],
        ["Greater Accra", 5455692],
        ["Ashanti", 5440463],
        ["Western", 2060585],
        ["Western North", 880921],
        ["Central", 2859821],
        ["Eastern", 2925455],
        ["Volta", 1649555],
        ["Oti", 747248],
        ["Bono", 1208649],
        ["Bono East", 1203306],
        ["Ahafo", 564536],
        ["Northern", 2310648],
        ["Savannah", 653266],
        ["North East", 658903],
        ["Upper East", 1301226],
        ["Upper West", 901502],
      ],
    },
    tags: ["population", "census", "regions"],
  },
  {
    id: "understanding-ghana-inflation-2019-2024",
    title: "Understanding Ghana Inflation: 2019 to 2024",
    author: "Yaa Asantewaa",
    authorInitials: "YA",
    authorColor: "#E9D5FF",
    category: "Economy",
    publishedAt: "2024-06-30T15:55:00.000Z",
    readingTime: 8,
    excerpt:
      "Inflation in Ghana has bounced between policy targets and external shocks over the last five years. This article uses CPI, exchange rate, and food price data to explain the main drivers behind the trend.",
    body:
      "Between 2019 and 2024, Ghana experienced periods of moderate inflation followed by sharper spikes as the economy recovered from the pandemic and weather shocks impacted food supply. Consumer price index data show that food inflation was the largest contributor to headline inflation, particularly in urban markets.\n\nCurrency depreciation and import costs also played a central role. The cedi weakened against major currencies, pushing up the domestic price of petroleum, food imports, and industrial inputs. The Bank of Ghana responded with tighter monetary measures to moderate inflation expectations.\n\nEnergy and utility tariffs were another key factor, as adjustments in power and water pricing affected household budgets. Inflation data for service-sector prices show that substitutions and wage pressures amplified the rise in core inflation. Policymakers have therefore focused on balancing exchange-rate stability with the need to maintain growth.\n\nThe latest data suggest that while inflation remains above the central bank’s target band, it has begun to decelerate as supply conditions improve and fiscal consolidation takes effect. Continued monitoring of food prices, exchange-rate passthrough, and global commodity costs will be essential for keeping inflation on a downward path.",
    heroColor: "linear-gradient(135deg, #F97316 0%, #FCD34D 100%)",
    relatedDatasetId: null,
    tags: ["inflation", "CPI", "macro"],
  },
  {
    id: "voter-registration-data-regional-breakdown",
    title: "Voter Registration Data: A Regional Breakdown",
    author: "Kwesi Adomako",
    authorInitials: "KA",
    authorColor: "#DCFCE7",
    category: "Governance",
    publishedAt: "2024-06-28T10:30:00.000Z",
    readingTime: 6,
    excerpt:
      "Electoral Commission registration data show distinct regional patterns in voter registration rates and turnout potential. This story maps the distribution of registrants across Ghana’s administrative regions.",
    body:
      "The Electoral Commission’s dataset indicates that Greater Accra and Ashanti regions have the highest absolute counts of registered voters, reflecting their larger populations. However, when registration rates are expressed as shares of the eligible population, some smaller regions like Bono East and Upper East score highly.\n\nRegional variation in registration also reflects accessibility and civic engagement. Urban districts generally have more registration centers and better outreach campaigns, while remote rural areas face logistical challenges. The data suggest that mobile registration drives and community mobilization remain crucial for inclusive participation.\n\nGender splits in registration are another important insight: the data show that female registration is closing the gap with males in most regions, although differences remain in a few northern districts. This represents progress for representation and indicates that voter education efforts are reaching more women.\n\nLooking ahead to elections, the turnout potential derived from registration rates signals where political campaigns may place emphasis. Regions with rapid registration growth may become key battlegrounds, while those with lower rates may require continued transparency and confidence-building measures to ensure broad participation.",
    heroColor: "linear-gradient(135deg, #047857 0%, #A7F3D0 100%)",
    relatedDatasetId: null,
    tags: ["voter", "elections", "data"],
  },
];

const CATEGORY_ICON = {
  Home: BookText,
  Economy: TrendingUp,
  Health: Heart,
  Agriculture: Leaf,
  Demographics: Users,
  Governance: Vote,
  Environment: Wind,
};

const CATEGORY_LIST = [
  "Home",
  "Economy",
  "Health",
  "Agriculture",
  "Demographics",
  "Governance",
  "Environment",
];

function getDatasetCategory(dataset) {
  const category = dataset?.category?.name || dataset?.category || "Data";
  if (CATEGORY_LIST.includes(category)) return category;

  const text = `${dataset?.title || ""} ${dataset?.description || ""} ${(dataset?.tags || [])
    .map((tag) => tag.name || tag)
    .join(" ")}`.toLowerCase();

  if (/(inflation|gdp|econom|finance|bank|forex|revenue|tax|trade)/.test(text)) return "Economy";
  if (/(health|mortality|maternal|malaria|hospital|immunization|hiv)/.test(text)) return "Health";
  if (/(cocoa|food|crop|farm|agriculture|maize|cassava)/.test(text)) return "Agriculture";
  if (/(population|census|demographic|household|urban)/.test(text)) return "Demographics";
  if (/(voter|election|governance|parliament|procurement|budget)/.test(text)) return "Governance";
  if (/(environment|energy|forest|soil|climate|electricity)/.test(text)) return "Environment";
  return "Economy";
}

function getStoryColour(category) {
  const colours = {
    Economy: "linear-gradient(135deg, #006B3F 0%, #00A35C 100%)",
    Health: "linear-gradient(135deg, #DB2777 0%, #F472B6 100%)",
    Agriculture: "linear-gradient(135deg, #0F766E 0%, #A7F3D0 100%)",
    Demographics: "linear-gradient(135deg, #9333EA 0%, #A78BFA 100%)",
    Governance: "linear-gradient(135deg, #047857 0%, #A7F3D0 100%)",
    Environment: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
  };
  return colours[category] || colours.Economy;
}

function plainTextFromAiSummary(summary) {
  if (!summary) return null;
  return String(summary)
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\d+\.\s*/gm, "")
    .replace(/^- /gm, "• ")
    .trim();
}

const INDICATOR_STORY_META = {
  "SP.URB.TOTL.IN.ZS": {
    name: "Urban Population (% of Total Population)",
    headline: "Ghana's Urban Population Is Reshaping Housing, Jobs and Transport",
    summary: "Ghana's urban population share has risen steadily for decades, changing where people work, live, commute and demand public services.",
    visual: "line",
    takeaway: "Urbanisation is now one of Ghana's most important planning signals.",
  },
  "SP.POP.TOTL": {
    name: "Total Population",
    headline: "Ghana's Population Growth Is Changing Regional Demand",
    summary: "Population growth is reshaping demand for schools, clinics, housing, transport and jobs across Ghana.",
    visual: "line",
    takeaway: "Population pressure is strongest where services and jobs are already concentrated.",
  },
  "NY.GDP.MKTP.CD": {
    name: "GDP (Current US$)",
    headline: "What Ghana's GDP Says About the Economy's Direction",
    summary: "GDP data helps explain Ghana's economic size, growth cycles and the sectors driving national output.",
    visual: "area",
    takeaway: "GDP growth is useful, but sector and regional detail reveal the real story.",
  },
  "NY.GDP.MKTP.KD.ZG": {
    name: "GDP Growth",
    headline: "Is Ghana's Economy Growing Fast Enough?",
    summary: "Growth data shows whether Ghana's economy is expanding strongly enough to absorb jobs, investment and public spending needs.",
    visual: "area",
    takeaway: "Growth momentum matters most when compared with inflation, employment and debt.",
  },
  "FP.CPI.TOTL.ZG": {
    name: "Inflation Rate",
    headline: "What Ghana's Inflation Data Means for Households",
    summary: "Inflation data explains how prices are changing and why household budgets, food markets and policy rates remain under pressure.",
    visual: "line",
    takeaway: "Inflation is a household story, not just a central bank statistic.",
  },
  "SE.ADT.LITR.ZS": {
    name: "Adult Literacy Rate",
    headline: "Ghana's Literacy Gap Still Shapes Opportunity",
    summary: "Literacy data reveals where education outcomes support opportunity and where regional gaps still hold people back.",
    visual: "bar",
    takeaway: "Literacy is one of the strongest signals of long-term human capital.",
  },
  "SP.DYN.IMRT.IN": {
    name: "Infant Mortality Rate",
    headline: "Ghana's Child Health Gains Still Need Regional Focus",
    summary: "Infant mortality data tracks survival outcomes and highlights where health access, nutrition and prevention are improving.",
    visual: "line",
    takeaway: "Falling mortality is progress, but regional inequality remains the challenge.",
  },
  "EG.ELC.ACCS.ZS": {
    name: "Electricity Access",
    headline: "Where Electricity Access Is Still Holding Ghana Back",
    summary: "Electricity access data shows which communities are connected to reliable power and which still face infrastructure gaps.",
    visual: "map",
    takeaway: "Energy access is a foundation for education, enterprise and public services.",
  },
};

function detectPublisher(dataset) {
  const text = `${dataset?.title || ""} ${dataset?.description || ""}`.toLowerCase();
  if (text.includes("world bank")) return "World Bank";
  if (text.includes("bank of ghana") || text.includes("bog")) return "Bank of Ghana";
  if (text.includes("ghana statistical") || text.includes("statsghana") || text.includes("gss")) return "Ghana Statistical Service";
  if (text.includes("faostat") || text.includes("fao")) return "FAOSTAT";
  if (text.includes("who")) return "WHO";
  if (text.includes("unicef")) return "UNICEF";
  if (text.includes("electoral commission")) return "Electoral Commission Ghana";
  return dataset?.owner?.full_name || "GhanaDataHub";
}

function findIndicatorMeta(dataset) {
  const text = `${dataset?.title || ""} ${dataset?.description || ""}`;
  return Object.entries(INDICATOR_STORY_META).find(([code]) => text.includes(code))?.[1] || null;
}

function getHumanDatasetName(dataset) {
  const meta = findIndicatorMeta(dataset);
  if (meta) return meta.name;

  const rawTitle = dataset?.title || "Ghana dataset";
  return rawTitle
    .replace(/^World Bank Open Data\s*[-—]\s*Ghana:\s*/i, "")
    .replace(/^Data Story:\s*/i, "")
    .replace(/^AI Analysis:\s*/i, "")
    .replace(/\b[A-Z]{2,}\.[A-Z0-9.]{4,}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-—:]\s*$/, "")
    .trim() || rawTitle;
}

function buildInsightHeadline(dataset, category) {
  const meta = findIndicatorMeta(dataset);
  if (meta) return meta.headline;

  const text = `${dataset?.title || ""} ${dataset?.description || ""}`.toLowerCase();
  const name = getHumanDatasetName(dataset);
  if (/inflation|cpi|price/.test(text)) return "What Ghana's Latest Inflation Data Means for Households";
  if (/cocoa|crop|maize|cassava|agriculture|food/.test(text)) return "What Ghana's Agriculture Data Reveals About Food and Exports";
  if (/health|mortality|malaria|maternal|hospital|hiv/.test(text)) return "Where Ghana's Health Data Shows Progress and Pressure";
  if (/population|urban|census|demographic/.test(text)) return "How Ghana's Population Is Changing Across Communities";
  if (/electricity|energy|power/.test(text)) return "Where Ghana's Energy Access Story Is Moving Fastest";
  if (/voter|election|governance|procurement/.test(text)) return "What Ghana's Governance Data Reveals About Participation";
  if (/gdp|trade|bank|forex|revenue|econom/.test(text)) return "What Ghana's Economic Data Says Right Now";
  return `${name}: What the Data Reveals for Ghana`;
}

function buildInsightSummary(dataset, body) {
  const meta = findIndicatorMeta(dataset);
  if (meta) return meta.summary;

  const first = (dataset?.description || body || "").split(".")[0]?.trim();
  if (first && first.length > 24) return `${first}.`;
  return "This insight turns a GhanaDataHub dataset into a plain-language brief for researchers, journalists, students and decision-makers.";
}

function getVisualType(dataset, category) {
  const meta = findIndicatorMeta(dataset);
  if (meta) return meta.visual;
  const text = `${dataset?.title || ""} ${dataset?.description || ""}`.toLowerCase();
  if (/region|district|map|health|hospital|mortality/.test(text)) return "map";
  if (/gdp|inflation|population|urban|forex|rate/.test(text)) return "line";
  if (/agriculture|crop|cocoa|trade|export/.test(text)) return "bar";
  return category === "Demographics" ? "line" : category === "Agriculture" ? "bar" : "area";
}

function buildKeyTakeaways(dataset, analysis, body) {
  const meta = findIndicatorMeta(dataset);
  const rows = Number(analysis?.total_rows || 0);
  const columns = Number(analysis?.total_columns || 0);
  const completeness = analysis?.completeness_pct;
  const downloads = dataset?.download_count || 0;

  return [
    meta?.takeaway || buildInsightSummary(dataset, body),
    rows && columns
      ? `${rows.toLocaleString()} records across ${columns} columns are available for analysis.`
      : "The source dataset is available for deeper exploration and reuse.",
    typeof completeness === "number"
      ? `Automated checks show ${completeness}% data completeness.`
      : "Metadata is available; column-level analysis will improve as files are processed.",
    downloads > 0
      ? `${downloads.toLocaleString()} download${downloads === 1 ? "" : "s"} signal user interest.`
      : "This is a fresh insight ready for early readers.",
  ].filter(Boolean).slice(0, 4);
}

function buildAdjoaDiscovery(category, dataset) {
  const name = getHumanDatasetName(dataset);
  const discoveries = {
    Economy: `Adjoa noticed this may connect with inflation, exchange rates, employment and household spending. Compare it with other economy datasets before drawing conclusions.`,
    Health: `Adjoa noticed this health signal may vary by region. A Ghana map or district breakdown could reveal where interventions should be focused.`,
    Agriculture: `Adjoa noticed this agriculture data may connect with rainfall, food prices, exports and farmer income. The next useful comparison is climate or market data.`,
    Demographics: `Adjoa noticed this demographic trend may affect housing, transport, schools and jobs. The next useful question is which regions are changing fastest.`,
    Governance: `Adjoa noticed this governance data becomes more useful when compared by region, year and population share.`,
    Environment: `Adjoa noticed this environmental signal may connect with energy access, land use and agriculture resilience.`,
  };
  return discoveries[category] || `Adjoa noticed ${name} may become more powerful when paired with related Ghana datasets.`;
}

function MiniInsightVisual({ type = "line", colour = "var(--green)" }) {
  if (type === "map") {
    return (
      <svg viewBox="0 0 120 76" className="insight-mini-visual" aria-hidden="true">
        <path d="M55 6 82 12 102 31 95 59 70 70 42 65 22 49 29 22Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
        <path d="M55 6 57 34 29 22Z" fill="rgba(255,255,255,0.45)" />
        <path d="M57 34 82 12 102 31 75 42Z" fill="rgba(255,255,255,0.32)" />
        <path d="M57 34 75 42 70 70 42 65Z" fill="rgba(255,255,255,0.55)" />
      </svg>
    );
  }

  if (type === "bar") {
    return (
      <svg viewBox="0 0 120 76" className="insight-mini-visual" aria-hidden="true">
        {[22, 38, 28, 54, 44, 64].map((height, index) => (
          <rect key={height + index} x={12 + index * 17} y={68 - height} width="10" height={height} rx="4" fill="rgba(255,255,255,0.68)" />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 76" className="insight-mini-visual" aria-hidden="true">
      <path d="M8 58 C24 48 29 52 42 39 C54 27 65 34 78 22 C92 10 100 18 113 8" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 62 C24 52 29 56 42 43 C54 31 65 38 78 26 C92 14 100 22 113 12 L113 72 L8 72Z" fill="rgba(255,255,255,0.16)" />
      <circle cx="78" cy="22" r="5" fill="white" />
    </svg>
  );
}

function buildFallbackStoryBody(dataset, analysis) {
  const category = getDatasetCategory(dataset);
  const title = getHumanDatasetName(dataset);
  const rows = analysis?.total_rows;
  const columns = analysis?.total_columns;
  const completeness = analysis?.completeness_pct;
  const downloads = dataset?.download_count || 0;
  const owner = dataset?.owner?.full_name || "the GhanaDataHub community";

  const dataShape = rows && columns
    ? `The dataset contains ${Number(rows).toLocaleString()} rows across ${columns} columns, giving analysts enough structure to explore patterns, compare indicators, and verify claims.`
    : "The dataset is now available on GhanaDataHub for researchers, journalists, and organisations that need reusable Ghana data.";

  const quality = typeof completeness === "number"
    ? `Local analysis reports ${completeness}% completeness${analysis?.has_anomalies ? ", with possible anomalies worth reviewing before publication." : ", with no major anomaly flag from the automated checks."}`
    : "Automated column-level analysis is not available yet, so users should inspect the file before drawing conclusions.";

  return [
    `${title} has been added as a fresh ${category.toLowerCase()} data story. ${dataShape}`,
    `${quality} The dataset has ${downloads.toLocaleString()} download${downloads === 1 ? "" : "s"} so far and was published by ${owner}.`,
    "This story updates from the dataset catalogue, so new uploads and refreshed analysis appear here automatically. Open the related dataset to download the source file, review metadata, and run your own analysis.",
  ].join("\n\n");
}

export function buildStoryFromDataset(dataset, index = 0) {
  const category = getDatasetCategory(dataset);
  const analysis = dataset?.analysis_data || {};
  const aiText = plainTextFromAiSummary(analysis.ai_summary);
  const body = aiText || buildFallbackStoryBody(dataset, analysis);
  const tags = (dataset?.tags || []).map((tag) => tag.name || tag).filter(Boolean);
  const publisher = detectPublisher(dataset);
  const author = publisher === "GhanaDataHub" ? dataset?.owner?.full_name || "GhanaDataHub" : `AI + ${publisher}`;
  const initials = author
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "GD";
  const title = buildInsightHeadline(dataset, category);
  const excerpt = buildInsightSummary(dataset, body);
  const visualType = getVisualType(dataset, category);

  return {
    id: `dataset-${dataset.id}`,
    datasetId: dataset.id,
    rawDatasetTitle: dataset.title,
    humanDatasetTitle: getHumanDatasetName(dataset),
    title,
    author,
    authorInitials: initials,
    authorColor: ["#D1FAE5", "#E0F2FE", "#FEF3C7", "#E9D5FF", "#DCFCE7"][index % 5],
    category,
    publishedAt: dataset.updated_at || dataset.created_at || new Date().toISOString(),
    readingTime: Math.max(3, Math.ceil(body.split(/\s+/).length / 180)),
    excerpt,
    body,
    heroColor: getStoryColour(category),
    relatedDatasetId: dataset.id,
    tags: tags.length ? tags.slice(0, 4) : [category.toLowerCase(), "dataset", "ghana"],
    isLiveDatasetStory: true,
    analysisAvailable: Boolean(analysis?.ai_summary),
    publisher,
    sourceConfidence: publisher === "GhanaDataHub" ? 4 : 5,
    visualType,
    keyTakeaways: buildKeyTakeaways(dataset, analysis, body),
    adjoaDiscovery: buildAdjoaDiscovery(category, dataset),
    insightBadges: [
      analysis?.ai_summary ? "AI Insight" : "Live Insight",
      publisher === "GhanaDataHub" ? "Community Data" : "Verified Source",
      visualType === "map" ? "Map Ready" : "Chart Ready",
    ],
  };
}

function formatTimeAgo(value, now = new Date()) {
  const then = new Date(value);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 0) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function groupByDate(posts) {
  const groups = {};
  posts.forEach((post) => {
    const date = new Date(post.publishedAt);
    const key = date.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}

export function normalizeInsightPost(post) {
  if (!post) return post;
  return {
    publisher: post.publisher || post.author || "GhanaDataHub",
    sourceConfidence: post.sourceConfidence || 5,
    visualType: post.visualType || getVisualType(post, post.category),
    humanDatasetTitle: post.humanDatasetTitle || post.title,
    keyTakeaways: post.keyTakeaways || buildKeyTakeaways(post, {}, post.body || post.excerpt),
    adjoaDiscovery: post.adjoaDiscovery || buildAdjoaDiscovery(post.category, post),
    insightBadges: post.insightBadges || ["Editor's Pick", "Verified", "Data Explained"],
    ...post,
  };
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Home");
  const [activeTab, setActiveTab] = useState("Latest");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState(BLOG_POSTS[0]);
  const [copied, setCopied] = useState(false);
  const [livePosts, setLivePosts] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    async function fetchLiveStories() {
      try {
        const { data } = await datasetsApi.list({
          page: 1,
          per_page: 12,
          sort_by: "created_at",
          sort_dir: "desc",
        });
        if (cancelled) return;
        const items = data?.items || [];
        setLivePosts(items.map((dataset, index) => buildStoryFromDataset(dataset, index)));
        setStoriesError(null);
        setLastSyncedAt(new Date());
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to refresh insights", error);
          setStoriesError("Live dataset insights are temporarily unavailable.");
        }
      } finally {
        if (!cancelled) setStoriesLoading(false);
      }
    }

    fetchLiveStories();
    const refreshId = window.setInterval(fetchLiveStories, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const tickId = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(tickId);
  }, []);

  const storyPosts = useMemo(
    () => (livePosts.length > 0 ? livePosts : BLOG_POSTS).map(normalizeInsightPost),
    [livePosts],
  );

  const filteredPosts = useMemo(() => {
    return storyPosts.filter((post) => {
      const categoryMatch = activeCategory === "Home" || post.category === activeCategory;
      const queryText = query.trim().toLowerCase();
      const searchMatch =
        !queryText ||
        post.title.toLowerCase().includes(queryText) ||
        post.excerpt.toLowerCase().includes(queryText) ||
        post.author.toLowerCase().includes(queryText) ||
        post.tags.some((tag) => tag.toLowerCase().includes(queryText));
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, query, storyPosts]);

  useEffect(() => {
    if (!filteredPosts.some((post) => post.id === selectedPost?.id)) {
      setSelectedPost(filteredPosts[0] || storyPosts[0] || BLOG_POSTS[0]);
    }
  }, [filteredPosts, selectedPost, storyPosts]);

  const popularPosts = useMemo(
    () => [...filteredPosts].sort((a, b) => b.readingTime - a.readingTime),
    [filteredPosts],
  );

  const latestGroups = useMemo(() => {
    const sorted = [...filteredPosts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return groupByDate(sorted);
  }, [filteredPosts]);

  const handleShare = async () => {
  const url = `${window.location.origin}/insights/${selectedPost.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const selectedInsight = normalizeInsightPost(selectedPost);

  return (
    <div className="blog-page-root">
      <div className="blog-layout">
        <aside className="blog-left-panel">
          <div className="blog-left-heading">Insights</div>
          <div className="blog-live-status">
            <span className={livePosts.length > 0 ? "live-dot" : "live-dot muted"} />
            <span>
              {livePosts.length > 0
                ? `Live from ${livePosts.length} recent dataset insights`
                : storiesLoading
                  ? "Syncing insights..."
                  : "Showing curated insights"}
            </span>
          </div>
          <div className="blog-left-categories">
            {CATEGORY_LIST.map((category) => {
              const Icon = CATEGORY_ICON[category];
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`category-row ${active ? "active" : ""}`}
                >
                  <Icon size={16} />
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
          <div className="blog-left-cta-card">
            <div className="blog-left-cta-label">INTELLIGENCE LAYER</div>
            <div className="blog-left-cta-title">Every insight links back to the evidence</div>
            <button type="button" className="blog-left-cta-button" onClick={() => navigate("/datasets")}>Explore Data</button>
          </div>
        </aside>

        <section className="blog-centre-panel">
          <div className="blog-top-tabs">
            <div className="blog-tab-list">
              {['Latest', 'Popular'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`blog-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="blog-top-actions">
              <button type="button" className="blog-icon-button" onClick={() => setShowSearch((prev) => !prev)}>
                <Search size={18} />
              </button>
              <button type="button" className="blog-icon-button" disabled>
                <Calendar size={18} />
              </button>
            </div>
          </div>
          {showSearch && (
            <div className="blog-search-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask for insights: inflation, cocoa, hospitals, urbanisation..."
              />
            </div>
          )}
          <div className="blog-sync-row">
            <span>{storiesError || "Insights refresh automatically from the dataset catalogue and AI analysis."}</span>
            {lastSyncedAt && <strong>Updated {formatTimeAgo(lastSyncedAt, now)}</strong>}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="blog-empty-state">
              <BookText size={36} />
              <div className="blog-empty-title">No insights found</div>
              <div className="blog-empty-copy">Try another category or search term.</div>
            </div>
          ) : activeTab === "Latest" ? (
            <div className="blog-article-list">
              {latestGroups.map((group) => {
                const dateObj = new Date(group.date);
                const day = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                const dayNumber = dateObj.getDate();
                return (
                  <div key={group.date} className="blog-date-group">
                    <div className="blog-date-anchor">
                      <span className="blog-date-weekday">{day}</span>
                      <span className="blog-date-number">{dayNumber}</span>
                    </div>
                    <div className="blog-group-posts">
                      {group.items.map((post) => {
                        const active = selectedPost?.id === post.id;
                        return (
                          <button
                            key={post.id}
                            type="button"
                            className={`blog-article-row ${active ? "selected" : ""}`}
                            onClick={() => setSelectedPost(post)}
                          >
                            <div className="blog-article-left">
                              <span className="blog-article-meta">{formatTimeAgo(post.publishedAt, now)}</span>
                              <div className="blog-article-title">{post.title}</div>
                              <div className="blog-article-excerpt">{post.excerpt}</div>
                              <div className="blog-article-author">{post.publisher || post.author} · {post.readingTime} min read</div>
                              {post.isLiveDatasetStory && (
                                <div className="blog-live-story-badge">
                                  {post.analysisAvailable ? "AI analysed" : "Live dataset"}
                                </div>
                              )}
                            </div>
                            <div className="blog-article-thumb" style={{ background: post.heroColor }}>
                              <MiniInsightVisual type={post.visualType} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="blog-article-list popular-list">
              {popularPosts.map((post, index) => {
                const active = selectedPost?.id === post.id;
                return (
                  <button
                    key={post.id}
                    type="button"
                    className={`blog-article-row ${active ? "selected" : ""}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="blog-popular-rank">{index + 1}</div>
                    <div className="blog-article-left">
                      <span className="blog-article-meta">{formatTimeAgo(post.publishedAt, now)}</span>
                      <div className="blog-article-title">{post.title}</div>
                      <div className="blog-article-excerpt">{post.excerpt}</div>
                      <div className="blog-article-author">{post.publisher || post.author} · {post.readingTime} min read</div>
                      {post.isLiveDatasetStory && (
                        <div className="blog-live-story-badge">
                          {post.analysisAvailable ? "AI analysed" : "Live dataset"}
                        </div>
                      )}
                    </div>
                    <div className="blog-article-thumb" style={{ background: post.heroColor }}>
                      <MiniInsightVisual type={post.visualType} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedPost && filteredPosts.length > 0 && (
            <article className="blog-responsive-preview">
              <div className="blog-responsive-hero" style={{ background: selectedInsight.heroColor }}>
                <MiniInsightVisual type={selectedInsight.visualType} />
                <span>{selectedInsight.category}</span>
              </div>
              <div className="blog-responsive-body">
                <div className="blog-responsive-kicker">
                  {selectedInsight.readingTime} min read · {selectedInsight.publisher || selectedInsight.author}
                </div>
                <h2>{selectedInsight.title}</h2>
                <p>{selectedInsight.excerpt}</p>
                <button type="button" onClick={() => navigate(`/insights/${selectedInsight.id}`)}>
                  Open Insight
                </button>
              </div>
            </article>
          )}
        </section>

        <aside className="blog-right-panel">
          {selectedInsight && (
            <div className="blog-right-content" key={selectedInsight.id}>
              <div className="blog-right-top-row">
                <div className="blog-author-chip">
                  <span className="blog-author-avatar" style={{ background: selectedInsight.authorColor }}>
                    {selectedInsight.authorInitials}
                  </span>
                  <span className="blog-author-by">{selectedInsight.publisher || selectedInsight.author}</span>
                </div>
                <button type="button" className="blog-share-button" onClick={handleShare}>
                  <Share2 size={16} />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
              <div className="blog-hero-card" style={{ background: selectedInsight.heroColor }}>
                <div className="blog-hero-icon">
                  <MiniInsightVisual type={selectedInsight.visualType} />
                </div>
                <span className="blog-hero-pill">{selectedInsight.category}</span>
              </div>
              <div className="blog-right-article">
                <div className="blog-right-title">{selectedInsight.title}</div>
                <div className="blog-right-meta">{selectedInsight.readingTime} min read · {selectedInsight.publisher || selectedInsight.author}</div>
                <div className="blog-confidence-row" title={`${selectedInsight.sourceConfidence} out of 5 source confidence`}>
                  <BadgeCheck size={14} />
                  <span>{"★".repeat(selectedInsight.sourceConfidence)}{"☆".repeat(5 - selectedInsight.sourceConfidence)} Verified evidence</span>
                </div>
                {selectedInsight.isLiveDatasetStory && (
                  <div className="blog-live-story-badge wide">
                    {selectedInsight.analysisAvailable
                      ? "Generated from AI dataset analysis"
                      : "Generated from latest dataset metadata"}
                  </div>
                )}
                <div className="blog-summary-box">
                  <Sparkles size={15} />
                  <span>{selectedInsight.excerpt}</span>
                </div>
                <div className="blog-takeaway-box">
                  <div className="blog-small-section-title">Key takeaways</div>
                  {selectedInsight.keyTakeaways.map((takeaway, index) => (
                    <div className="blog-takeaway-row" key={`${takeaway}-${index}`}>
                      <span>{index + 1}</span>
                      <p>{takeaway}</p>
                    </div>
                  ))}
                </div>
                {selectedInsight.body.split("\n\n").slice(0, 2).map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
                <div className="blog-adjoa-box">
                  <Lightbulb size={16} />
                  <div>
                    <strong>Adjoa's Discovery</strong>
                    <p>{selectedInsight.adjoaDiscovery}</p>
                  </div>
                </div>
                <div className="blog-kweku-box">
                  <div className="blog-small-section-title">Ask Kweku about this insight</div>
                  <div className="blog-kweku-prompts">
                    {["Explain simply", "Show the data", "Create a chart"].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => selectedInsight.relatedDatasetId && navigate(`/datasets/${selectedInsight.relatedDatasetId}?ask=kweku`)}
                      >
                        <Bot size={13} /> {prompt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="blog-tags-row">
                  {selectedInsight.tags.map((tag) => (
                    <span key={tag} className="blog-tag-pill">{tag}</span>
                  ))}
                </div>
                <button type="button" className="blog-full-button" onClick={() => navigate(`/insights/${selectedInsight.id}`)}>
                  Open Full Insight
                </button>
                {selectedInsight.relatedDatasetId && (
                  <button type="button" className="blog-dataset-button" onClick={() => navigate(`/datasets/${selectedInsight.relatedDatasetId}`)}>
                    Open Evidence Dataset
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
      <style>{`
        .blog-page-root {
          min-height: calc(100vh - 56px);
          background: var(--surface-base);
          color: var(--text-primary);
          padding: 0;
        }
        .blog-layout {
          display: grid;
          grid-template-columns: minmax(180px, 220px) minmax(0, 1fr) minmax(360px, 440px);
          min-height: calc(100vh - 56px);
          max-width: 1440px;
          margin: 0 auto;
        }
        .blog-left-panel {
          background: var(--surface-card);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          padding: 0;
        }
        .blog-left-heading {
          font-size: 16px;
          font-weight: 700;
          color: var(--green);
          padding: 20px 16px 8px;
        }
        .blog-live-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px 14px;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.4;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 4px var(--green-pale);
          flex-shrink: 0;
        }
        .live-dot.muted {
          background: var(--text-muted);
          box-shadow: 0 0 0 4px var(--surface-elevated);
        }
        .blog-left-categories {
          display: grid;
          gap: 4px;
          padding: 0 8px;
          flex: 1;
        }
        .category-row {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          text-align: left;
          cursor: pointer;
          border-left: 3px solid transparent;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .category-row:hover {
          background: var(--green-pale);
        }
        .category-row.active {
          border-left-color: var(--green);
          color: var(--green);
          font-weight: 700;
          background: var(--green-pale);
        }
        .blog-left-cta-card {
          margin: 16px;
          padding: 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--green), #004D2C);
          color: white;
        }
        .blog-left-cta-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
          opacity: 0.9;
        }
        .blog-left-cta-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .blog-left-cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid white;
          background: transparent;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        .blog-centre-panel {
          background: var(--surface-card);
          border-right: 1px solid var(--border-subtle);
          overflow-y: auto;
          padding: 20px;
          min-width: 0;
        }
        .blog-top-tabs {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 12px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .blog-tab-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .blog-tab {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
        }
        .blog-tab.active {
          color: var(--text-primary);
          font-weight: 700;
        }
        .blog-tab.active::after {
          content: "";
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 0;
          height: 3px;
          border-radius: 99px;
          background: var(--gold);
        }
        .blog-top-actions {
          display: flex;
          gap: 10px;
        }
        .blog-icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--text-secondary);
          cursor: pointer;
        }
        .blog-icon-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .blog-search-row {
          padding: 14px 0;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 16px;
        }
        .blog-search-row input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-primary);
          outline: none;
          font-size: 14px;
        }
        .blog-search-row input::placeholder {
          color: var(--text-muted);
        }
        .blog-sync-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
          padding: 10px 12px;
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          background: var(--surface-base);
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
        }
        .blog-sync-row strong {
          color: var(--green);
          font-size: 11px;
          white-space: nowrap;
        }
        .blog-article-list {
          display: grid;
          gap: 16px;
        }
        .blog-date-group {
          display: grid;
          gap: 12px;
        }
        .blog-date-anchor {
          display: flex;
          gap: 16px;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .blog-date-weekday {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .blog-date-number {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .blog-group-posts,
        .popular-list {
          display: grid;
          gap: 10px;
        }
        .blog-article-row {
          display: grid;
          grid-template-columns: 1fr 88px;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          text-align: left;
          align-items: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .blog-article-row:hover {
          background: var(--green-pale);
        }
        .blog-article-row.selected {
          background: var(--green-pale);
          border-left: 3px solid var(--green);
          border-color: rgba(0,107,63,0.14);
        }
        .blog-article-left {
          display: grid;
          gap: 6px;
        }
        .blog-article-meta {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .blog-article-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-article-excerpt {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-article-author {
          font-size: 12px;
          color: var(--green);
          font-weight: 600;
        }
        .blog-live-story-badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(0,163,92,0.1);
          color: var(--green);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .blog-live-story-badge.wide {
          margin-top: -4px;
          margin-bottom: 2px;
        }
        .blog-article-thumb {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          display: grid;
          place-items: center;
        }
        .insight-mini-visual {
          width: 86%;
          height: 86%;
          display: block;
        }
        .blog-popular-rank {
          font-size: 20px;
          font-weight: 700;
          color: var(--gold);
          width: 30px;
        }
        .blog-right-panel {
          background: var(--surface-card);
          overflow-y: auto;
          padding: 20px;
        }
        .blog-right-content {
          animation: fadeContent 0.25s ease;
        }
        .blog-right-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }
        .blog-author-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .blog-author-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          font-weight: 700;
          font-size: 12px;
        }
        .blog-author-by {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .blog-share-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--green);
          background: transparent;
          color: var(--green);
          cursor: pointer;
          font-weight: 700;
        }
        .blog-hero-card {
          position: relative;
          width: 100%;
          height: 220px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .blog-hero-icon {
          display: grid;
          place-items: center;
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: rgba(255,255,255,0.18);
        }
        .blog-hero-pill {
          position: absolute;
          bottom: 18px;
          left: 18px;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--surface-card);
          color: var(--green);
          font-size: 12px;
          font-weight: 700;
        }
        .blog-right-article {
          display: grid;
          gap: 16px;
        }
        .blog-right-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .blog-right-meta {
          font-size: 12px;
          color: var(--text-muted);
        }
        .blog-confidence-row {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--green-pale);
          color: var(--green);
          font-size: 12px;
          font-weight: 800;
        }
        .blog-summary-box,
        .blog-adjoa-box,
        .blog-kweku-box,
        .blog-takeaway-box {
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          background: var(--surface-elevated);
          padding: 14px;
        }
        .blog-summary-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--text-primary);
          font-size: 13px;
          line-height: 1.7;
          font-weight: 650;
        }
        .blog-small-section-title {
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 10px;
          font-weight: 900;
          margin-bottom: 10px;
        }
        .blog-takeaway-box {
          display: grid;
          gap: 10px;
        }
        .blog-takeaway-row {
          display: grid;
          grid-template-columns: 22px 1fr;
          gap: 9px;
          align-items: start;
        }
        .blog-takeaway-row span {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--green-pale);
          color: var(--green);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
        }
        .blog-takeaway-row p,
        .blog-adjoa-box p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.6;
        }
        .blog-adjoa-box {
          display: flex;
          gap: 10px;
          color: var(--gold);
        }
        .blog-adjoa-box strong {
          display: block;
          color: var(--text-primary);
          font-size: 13px;
          margin-bottom: 4px;
        }
        .blog-kweku-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .blog-kweku-prompts button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--green);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .blog-right-article p {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.8;
          margin: 0;
        }
        .blog-tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .blog-tag-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--green-pale);
          color: var(--green);
          font-size: 12px;
          font-weight: 700;
        }
        .blog-full-button {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: var(--green);
          color: white;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
        }
        .blog-dataset-button {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--green);
          background: transparent;
          color: var(--green);
          font-weight: 800;
          cursor: pointer;
        }
        .blog-empty-state {
          min-height: 320px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          border: 1px dashed var(--border-default);
          border-radius: 16px;
          color: var(--text-muted);
          background: var(--surface-base);
          text-align: center;
          padding: 32px;
        }
        .blog-empty-title {
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 800;
        }
        .blog-empty-copy {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .blog-responsive-preview {
          display: none;
          margin-top: 20px;
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          background: var(--surface-elevated);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .blog-responsive-hero {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: white;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .blog-responsive-body {
          padding: 18px;
        }
        .blog-responsive-kicker {
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .blog-responsive-body h2 {
          color: var(--text-primary);
          font-size: 18px;
          line-height: 1.35;
          margin: 0;
        }
        .blog-responsive-body p {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.7;
          margin: 10px 0 16px;
        }
        .blog-responsive-body button {
          width: 100%;
          height: 42px;
          border: none;
          border-radius: 10px;
          background: var(--green);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }
        @keyframes fadeContent {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1100px) {
          .blog-layout {
            grid-template-columns: 240px 1fr;
          }
          .blog-right-panel {
            display: none;
          }
          .blog-responsive-preview {
            display: block;
          }
        }
        @media (max-width: 768px) {
          .blog-layout {
            grid-template-columns: 1fr;
          }
          .blog-left-panel {
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
          }
          .blog-left-categories {
            display: flex;
            overflow-x: auto;
            padding: 0 12px 12px;
            gap: 10px;
          }
          .blog-live-status {
            padding: 0 12px 12px;
          }
          .category-row {
            min-width: max-content;
            border-left: none;
            border-radius: 10px;
            padding: 10px 12px;
          }
          .blog-top-tabs {
            flex-direction: column;
            align-items: stretch;
          }
          .blog-top-actions {
            justify-content: flex-start;
          }
          .blog-centre-panel {
            border-right: none;
            padding: 16px;
          }
          .blog-article-row {
            grid-template-columns: 1fr 64px;
            padding: 12px;
          }
          .blog-article-thumb {
            width: 60px;
            height: 60px;
          }
          .blog-left-cta-card {
            display: none;
          }
          .blog-sync-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
