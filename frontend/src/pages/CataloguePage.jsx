import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Bot,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Download,
  GraduationCap,
  Landmark,
  Link2,
  Map,
  Newspaper,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { datasetsApi, categoriesApi } from "../services/api";
import WatchButton from "../components/WatchButton";

const FILE_TYPES = [
  { key: "csv", label: "CSV" },
  { key: "json", label: "JSON" },
  { key: "excel", label: "Excel" },
  { key: "pdf", label: "PDF" },
  { key: "image", label: "Images" },
];

const CATEGORY_COLORS = [
  "#D4F4DD",
  "#E8F4FF",
  "#FFF1D6",
  "#FFE4E6",
  "#F5E8FF",
  "#E9F8FF",
  "#E8F6E8",
  "#F8F1E4",
];

const OWNER_COLORS = [
  "#D1FAE5",
  "#E0F2FE",
  "#FEF3C7",
  "#FEE2E2",
  "#E9D5FF",
  "#DCFCE7",
];

const INDICATOR_META = {
  "SP.URB.TOTL.IN.ZS": {
    title: "Urban Population (% of Total Population)",
    summary: "Tracks Ghana's annual urban population share. Useful for understanding city growth, housing demand, transport pressure and regional development.",
    topic: "Population",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Trending upward",
  },
  "SP.POP.TOTL": {
    title: "Total Population of Ghana",
    summary: "Shows Ghana's population growth over time, supporting planning for schools, clinics, housing, infrastructure and jobs.",
    topic: "Population",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Long-term growth",
  },
  "NY.GDP.MKTP.CD": {
    title: "Gross Domestic Product (Current US$)",
    summary: "Measures the size of Ghana's economy in current US dollars. Useful for macroeconomic analysis, investment research and policy work.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Economic scale",
  },
  "NY.GDP.MKTP.KD.ZG": {
    title: "GDP Growth Rate",
    summary: "Tracks Ghana's annual economic growth rate, helping users compare expansions, slowdowns and recovery periods.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Growth indicator",
  },
  "FP.CPI.TOTL.ZG": {
    title: "Inflation Rate",
    summary: "Tracks consumer price inflation in Ghana, useful for understanding cost of living changes, monetary policy and household purchasing power.",
    topic: "Economy",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Price pressure",
  },
  "SL.UEM.TOTL.ZS": {
    title: "Unemployment Rate",
    summary: "Shows the share of Ghana's labour force that is unemployed, useful for employment, youth policy and economic opportunity analysis.",
    topic: "Employment",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Labour market signal",
  },
  "SE.ADT.LITR.ZS": {
    title: "Adult Literacy Rate",
    summary: "Measures adult literacy in Ghana and supports education planning, regional equity analysis and human capital research.",
    topic: "Education",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Human capital indicator",
  },
  "SP.DYN.IMRT.IN": {
    title: "Infant Mortality Rate",
    summary: "Tracks infant deaths per 1,000 live births in Ghana, helping users understand child health outcomes and healthcare progress.",
    topic: "Health",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Health outcome",
  },
  "SH.STA.MMRT": {
    title: "Maternal Mortality Ratio",
    summary: "Measures maternal deaths per 100,000 live births, useful for maternal health, facility access and public health planning.",
    topic: "Health",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Public health priority",
  },
  "EG.ELC.ACCS.ZS": {
    title: "Access to Electricity (% of Population)",
    summary: "Shows the share of Ghanaians with access to electricity, useful for energy planning, infrastructure analysis and development work.",
    topic: "Energy",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Access expanding",
  },
  "AG.PRD.CROP.XD": {
    title: "Crop Production Index",
    summary: "Tracks crop production trends in Ghana, useful for agriculture, food security, commodity planning and rural development analysis.",
    topic: "Agriculture",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Agricultural output",
  },
  "IT.NET.USER.ZS": {
    title: "Internet Users (% of Population)",
    summary: "Tracks internet adoption in Ghana, useful for digital economy, telecoms, education technology and financial inclusion analysis.",
    topic: "Technology",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Digital adoption",
  },
  "EN.ATM.CO2E.PC": {
    title: "CO2 Emissions per Person",
    summary: "Measures Ghana's carbon dioxide emissions per capita, useful for climate, energy transition and environmental policy analysis.",
    topic: "Environment",
    coverage: "1960-2025",
    records: "66 years",
    regions: "National",
    trend: "Climate indicator",
  },
};

const SECTOR_COLOURS = {
  Economy: "#1D4ED8",
  Agriculture: "#059669",
  Health: "#DC2626",
  Education: "#7C3AED",
  Population: "#D97706",
  Demographics: "#D97706",
  Infrastructure: "#EA580C",
  Energy: "#CA8A04",
  Environment: "#0891B2",
  Technology: "#0369A1",
  Employment: "#9333EA",
  Governance: "#5B21B6",
  Default: "#006B3F",
};

function getHashIndex(value, length) {
  return (
    value?.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % length || 0
  );
}

function getIndicatorCode(title = "") {
  const match = title.match(/([A-Z]{2,}(?:\.[A-Z0-9]+){2,})\s*$/);
  return match?.[1] || null;
}

function getPublisher(dataset) {
  const text = `${dataset.title || ""} ${dataset.description || ""}`.toLowerCase();
  if (text.includes("world bank")) return "World Bank";
  if (text.includes("bank of ghana") || text.includes("bog")) return "Bank of Ghana";
  if (text.includes("ghana statistical") || text.includes("statsghana") || text.includes("gss")) return "Ghana Statistical Service";
  if (text.includes("faostat") || text.includes("fao")) return "FAOSTAT";
  if (text.includes("who")) return "WHO";
  if (text.includes("ghana health service") || text.includes("ghs")) return "Ghana Health Service";
  return dataset.owner?.full_name || dataset.organization?.name || "GhanaDataHub";
}

function titleCaseWords(value = "") {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTopic(dataset) {
  const text = `${dataset.category?.name || ""} ${dataset.title || ""} ${dataset.description || ""}`.toLowerCase();
  if (/inflation|gdp|forex|exchange|revenue|debt|bank|econom|trade|export/.test(text)) return "Economy";
  if (/cocoa|maize|cassava|crop|farm|agric/.test(text)) return "Agriculture";
  if (/health|hospital|mortality|malaria|maternal|hiv|disease/.test(text)) return "Health";
  if (/school|education|literacy|teacher/.test(text)) return "Education";
  if (/population|census|urban|demographic/.test(text)) return "Population";
  if (/road|rail|port|infrastructure/.test(text)) return "Infrastructure";
  if (/electricity|energy|power|oil/.test(text)) return "Energy";
  if (/climate|forest|co2|environment|rainfall/.test(text)) return "Environment";
  if (/job|employment|unemployment|labour/.test(text)) return "Employment";
  if (/internet|technology|digital|mobile/.test(text)) return "Technology";
  return dataset.category?.name || "Ghana Data";
}

function getCleanTitle(dataset) {
  const rawTitle = dataset.title || "Untitled Dataset";
  const code = getIndicatorCode(rawTitle);
  if (code && INDICATOR_META[code]) return INDICATOR_META[code].title;

  return rawTitle
    .replace(/^World Bank Open Data\s*[–-]\s*Ghana\s*:\s*/i, "")
    .replace(/\b[A-Z]{2,}(?:\.[A-Z0-9]+){2,}\b/g, "")
    .replace(/\s*[–-]\s*Ghana\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-—:]\s*$/, "")
    .trim() || titleCaseWords(rawTitle);
}

function getDatasetDisplay(dataset) {
  const code = getIndicatorCode(dataset.title || "");
  const mapped = code ? INDICATOR_META[code] : null;
  const topic = mapped?.topic || getTopic(dataset);
  const aiSentence = dataset.analysis_data?.ai_summary?.split(".")?.[0];
  const summary = mapped?.summary
    || (aiSentence && aiSentence.length > 24 ? `${aiSentence}.` : null)
    || dataset.description
    || `Explore this ${topic.toLowerCase()} dataset for Ghana with visual previews, AI help, maps, API access and downloads.`;

  return {
    title: mapped?.title || getCleanTitle(dataset),
    code,
    summary,
    topic,
    publisher: getPublisher(dataset),
    coverage: mapped?.coverage || (dataset.title?.toLowerCase().includes("regional") ? "Regional" : "Latest"),
    records: mapped?.records || (dataset.analysis_data?.total_rows ? `${dataset.analysis_data.total_rows.toLocaleString()} rows` : "Metadata ready"),
    regions: mapped?.regions || (dataset.title?.toLowerCase().includes("region") ? "Regional" : "National"),
    trend: mapped?.trend || (dataset.download_count > 50 ? "Frequently used" : "Ready to explore"),
    verified: /world bank|ghana statistical service|bank of ghana|ministry|faostat|who|ghana health service/i.test(`${dataset.title} ${dataset.description || ""}`),
  };
}

function getUseCases(topic) {
  const common = [
    { label: "Students", icon: GraduationCap },
    { label: "Researchers", icon: Users },
    { label: "Journalists", icon: Newspaper },
  ];
  if (topic === "Economy" || topic === "Energy" || topic === "Infrastructure") {
    return [{ label: "Investors", icon: TrendingUp }, { label: "Government", icon: Landmark }, ...common.slice(0, 2)];
  }
  if (topic === "Health" || topic === "Education") {
    return [{ label: "Government", icon: Landmark }, ...common];
  }
  return common.concat({ label: "Government", icon: Landmark });
}

function getSectorColour(topic) {
  return SECTOR_COLOURS[topic] || SECTOR_COLOURS.Default;
}

function starRating(value = 5) {
  const safeValue = Math.max(1, Math.min(5, value));
  return "★".repeat(safeValue) + "☆".repeat(5 - safeValue);
}

function CataloguePreviewVisual({ dataset, display, colour }) {
  const topic = display.topic.toLowerCase();
  const type = topic.includes("health") || topic.includes("environment") || display.regions === "Regional"
    ? "map"
    : topic.includes("agriculture") || topic.includes("energy") || topic.includes("infrastructure")
      ? "bar"
      : "line";

  if (type === "map") {
    return (
      <svg className="catalogue-intel-visual" viewBox="0 0 220 112" role="img" aria-label="Ghana map preview">
        <path d="M100 11 148 20 187 49 174 91 125 105 75 97 38 72 52 31Z" fill="rgba(0,163,92,0.12)" stroke={colour} strokeWidth="3" />
        <path d="M100 11 103 54 52 31Z" fill={colour} opacity="0.55" />
        <path d="M103 54 148 20 187 49 134 66Z" fill={colour} opacity="0.28" />
        <path d="M103 54 134 66 125 105 75 97Z" fill={colour} opacity="0.76" />
      </svg>
    );
  }

  const fallbackValues = [18, 24, 21, 35, 42, 48, 54, 63, 70, 76, 82, 88];
  const values = Array.isArray(dataset.preview_data)
    ? dataset.preview_data.slice(0, 12).map((value) => Number(value)).filter((value) => !Number.isNaN(value))
    : fallbackValues;
  const safeValues = values.length > 1 ? values : fallbackValues;
  const max = Math.max(...safeValues);
  const min = Math.min(...safeValues);
  const range = max - min || 1;
  const points = safeValues.map((value, index) => {
    const x = 10 + (index / (safeValues.length - 1)) * 196;
    const y = 90 - ((value - min) / range) * 62;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="catalogue-intel-visual" viewBox="0 0 220 112" role="img" aria-label="Chart preview">
      {[28, 56, 84].map((y) => <line key={y} x1="10" x2="210" y1={y} y2={y} stroke="var(--border-subtle)" />)}
      {type === "bar" ? safeValues.slice(0, 8).map((value, index) => {
        const height = Math.max(8, ((value - min) / range) * 64 + 8);
        return <rect key={`${value}-${index}`} x={18 + index * 24} y={92 - height} width="13" height={height} rx="5" fill={colour} opacity={0.82} />;
      }) : (
        <>
          <polyline points={`10,96 ${points} 210,96`} fill={colour} opacity="0.12" />
          <polyline points={points} fill="none" stroke={colour} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="158" cy="42" r="5" fill={colour} />
        </>
      )}
    </svg>
  );
}

function getCategoryColor(name) {
  return CATEGORY_COLORS[getHashIndex(name, CATEGORY_COLORS.length)];
}

function getOwnerColor(name) {
  return OWNER_COLORS[getHashIndex(name, OWNER_COLORS.length)];
}

function getInitials(name) {
  return name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getFileTypeKey(type) {
  if (!type) return "default";
  const normalized = type.toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("json")) return "json";
  if (normalized.includes("pdf")) return "pdf";
  if (normalized.includes("xls") || normalized.includes("excel")) return "excel";
  if (normalized.includes("png") || normalized.includes("jpg") || normalized.includes("jpeg") || normalized.includes("image")) return "image";
  return "default";
}

function formatDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

function sortDatasets(items, sortBy) {
  const list = [...items];
  if (sortBy === "downloads") {
    return list.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
  }
  if (sortBy === "az") {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === "za") {
    return list.sort((a, b) => b.title.localeCompare(a.title));
  }
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function csvEscape(value) {
  const escaped = `${value ?? ""}`.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function CataloguePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [allDatasets, setAllDatasets] = useState([]);
  const [allTotal, setAllTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || null);
  const [selectedFileTypes, setSelectedFileTypes] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [sidebarOpen, setSidebarOpen] = useState({ categories: true, fileTypes: false });
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTotal, setCurrentTotal] = useState(0);
  const mainTopRef = useRef(null);

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const [catsRes, dataRes] = await Promise.all([
          categoriesApi.list(),
          datasetsApi.list({ per_page: 50, sort_by: "created_at" }),
        ]);
        setCategories(catsRes.data || []);
        setAllDatasets(dataRes.data?.items || dataRes.data || []);
        setDatasets(dataRes.data?.items || dataRes.data || []);
        setAllTotal(dataRes.data?.total ?? 0);
        setCurrentTotal(dataRes.data?.total ?? 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (activeCategory === null) {
      setDatasets(allDatasets);
      setCurrentTotal(allTotal);
      return;
    }
    async function loadCategory() {
      setLoading(true);
      try {
        const res = await datasetsApi.list({ category_id: activeCategory, per_page: 20 });
        setDatasets(res.data?.items || res.data || []);
        setCurrentTotal(res.data?.total ?? (res.data?.items?.length ?? 0));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [activeCategory, allDatasets, allTotal]);

  const filteredDatasets = useMemo(() => {
    const filtered = datasets.filter((item) => {
      if (!selectedFileTypes.length) return true;
      const key = getFileTypeKey(item.file_type);
      return selectedFileTypes.includes(key);
    });
    return sortDatasets(filtered, sortBy);
  }, [datasets, selectedFileTypes, sortBy]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategory) return "All Datasets";
    return categories.find((cat) => cat.id === activeCategory)?.name || "Category";
  }, [activeCategory, categories]);

  const ownerList = useMemo(() => {
    const owners = [];
    const seen = new Set();
    filteredDatasets.forEach((item) => {
      const owner = item.owner;
      if (owner?.id && !seen.has(owner.id)) {
        seen.add(owner.id);
        owners.push(owner);
      }
    });
    return owners;
  }, [filteredDatasets]);

  const categoryCounts = useMemo(() => {
    const counts = categories.reduce((acc, cat) => {
      acc[cat.id] = 0;
      return acc;
    }, {});
    allDatasets.forEach((item) => {
      const catId = item.category?.id;
      if (catId in counts) counts[catId] += 1;
    });
    return counts;
  }, [categories, allDatasets]);

  const visibleOwners = ownerList.slice(0, 4);
  const moreOwners = Math.max(0, ownerList.length - 4);

  const tabCategories = categories.slice(0, 5);
  const extraCategories = categories.slice(5);

  const toggleFileType = (key) => {
    setSelectedFileTypes((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleCategorySelect = (id) => {
    setActiveCategory(id);
    const nextParams = new URLSearchParams(searchParams);
    if (id) {
      nextParams.set("category", id);
    } else {
      nextParams.delete("category");
    }
    setSearchParams(nextParams, { replace: true });
    setShowMoreTabs(false);
    setTimeout(() => {
      mainTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const toggleGroup = (group) => {
    setSidebarOpen((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const exportCsv = () => {
    const headers = ["title", "category", "file_type", "download_count", "created_at"];
    const rows = [headers.join(",")];
    filteredDatasets.forEach((item) => {
      rows.push(
        [
          csvEscape(item.title),
          csvEscape(item.category?.name),
          csvEscape(item.file_type),
          csvEscape(item.download_count),
          csvEscape(item.created_at),
        ].join(","),
      );
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalogue.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeTabCount = activeCategory ? categoryCounts[activeCategory] || 0 : allTotal;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-100)", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
          <div style={{ background: "var(--surface-card)", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gray-500)", marginBottom: 12 }}>Browse By</div>
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--gray-200)",
                background: activeCategory === null ? "var(--green)" : "transparent",
                color: activeCategory === null ? "white" : "var(--gray-700)",
                fontWeight: activeCategory === null ? 700 : 500,
                cursor: "pointer",
              }}
            >
              <span>All Datasets</span>
              <span style={{ minWidth: 32, textAlign: "center", background: activeCategory === null ? "rgba(255,255,255,0.2)" : "var(--gray-100)", borderRadius: 999, padding: "2px 8px", fontSize: 12 }}>
                {allTotal}
              </span>
            </button>

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => toggleGroup("categories")}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gray-700)",
                  fontWeight: 600,
                }}
              >
                <span>By Category</span>
                {sidebarOpen.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sidebarOpen.categories && (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    const color = getCategoryColor(category.name);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: isActive ? "var(--green)" : "var(--gray-50)",
                          color: isActive ? "white" : "var(--gray-700)",
                          border: "1px solid var(--gray-200)",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 4, background: color }} />
                          {category.name}
                        </span>
                        <span style={{ minWidth: 30, textAlign: "center", background: isActive ? "rgba(255,255,255,0.2)" : "var(--surface-card)", borderRadius: 999, padding: "2px 8px", fontSize: 12, color: isActive ? "white" : "var(--gray-700)" }}>
                          {categoryCounts[category.id] ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => toggleGroup("fileTypes")}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gray-700)",
                  fontWeight: 600,
                }}
              >
                <span>By File Type</span>
                {sidebarOpen.fileTypes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {sidebarOpen.fileTypes && (
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {FILE_TYPES.map((type) => {
                    const isActive = selectedFileTypes.includes(type.key);
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => toggleFileType(type.key)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: isActive ? "var(--green)" : "var(--gray-50)",
                          color: isActive ? "white" : "var(--gray-700)",
                          border: "1px solid var(--gray-200)",
                          cursor: "pointer",
                        }}
                      >
                        <span>{type.label}</span>
                        <span style={{ width: 14, height: 14, borderRadius: 999, background: isActive ? "var(--surface-card)" : "var(--gray-200)", border: isActive ? "1px solid transparent" : "1px solid var(--gray-300)" }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main style={{ position: "relative" }}>
          <div ref={mainTopRef} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 22 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 12, background: "var(--green)", display: "grid", placeItems: "center", color: "white" }}>
                  <BookOpen size={18} />
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--gray-900)" }}>Data Catalogue</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{filteredDatasets.length} datasets available</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: -10 }}>
                {visibleOwners.map((owner) => (
                  <div key={owner.id} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid var(--surface-card)", background: getOwnerColor(owner.full_name), color: "var(--gray-900)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, zIndex: 1 }}>
                    {getInitials(owner.full_name)}
                  </div>
                ))}
                {moreOwners > 0 && (
                  <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid white", background: "var(--gray-200)", color: "var(--gray-700)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>
                    +{moreOwners}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={exportCsv}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--green)",
                  background: "transparent",
                  color: "var(--green)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
              <div
                onClick={() => handleCategorySelect(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: activeCategory === null ? "var(--green)" : "transparent",
                  color: activeCategory === null ? "white" : "var(--gray-700)",
                  border: activeCategory === null ? "none" : "1px solid var(--gray-300)",
                  cursor: "pointer",
                  minWidth: 96,
                }}
              >
                All
                <span style={{ minWidth: 24, textAlign: "center", background: activeCategory === null ? "rgba(255,255,255,0.2)" : "var(--gray-200)", color: activeCategory === null ? "white" : "var(--gray-700)", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>
                  {allTotal}
                </span>
              </div>
              {tabCategories.map((category) => {
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: active ? "var(--green)" : "transparent",
                      color: active ? "white" : "var(--gray-700)",
                      border: active ? "none" : "1px solid var(--gray-200)",
                      cursor: "pointer",
                      minWidth: 110,
                    }}
                  >
                    {category.name}
                    <span style={{ minWidth: 24, textAlign: "center", background: active ? "rgba(255,255,255,0.2)" : "var(--gray-200)", borderRadius: 999, padding: "2px 8px", fontSize: 11, color: active ? "white" : "var(--gray-700)" }}>
                      {categoryCounts[category.id] ?? 0}
                    </span>
                  </button>
                );
              })}
              {extraCategories.length > 0 && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowMoreTabs((state) => !state)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "transparent",
                      color: "var(--gray-700)",
                      border: "1px solid var(--gray-200)",
                      cursor: "pointer",
                    }}
                  >
                    + More
                  </button>
                  {showMoreTabs && (
                    <div style={{ position: "absolute", top: "110%", left: 0, width: 220, background: "var(--surface-card)", borderRadius: 12, boxShadow: "var(--shadow-md)", padding: 10, zIndex: 20 }}>
                      {extraCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            handleCategorySelect(category.id);
                            setShowMoreTabs(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: "var(--gray-50)",
                            color: "var(--gray-700)",
                            marginBottom: 6,
                            cursor: "pointer",
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowFilterPanel((prev) => !prev)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--gray-300)",
                    background: "var(--surface-card)",
                    color: "var(--gray-700)",
                    cursor: "pointer",
                  }}
                >
                  <SlidersHorizontal size={16} /> Filter
                </button>
                {showFilterPanel && (
                  <div style={{ position: "absolute", right: 0, top: "110%", width: 220, padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 24px 60px rgba(15,23,42,0.08)", zIndex: 20, animation: "panelOpen 0.18s ease" }}>
                    {FILE_TYPES.map((type) => (
                      <label key={type.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, fontSize: 13, color: "var(--gray-700)" }}>
                        <span>{type.label}</span>
                        <input
                          type="checkbox"
                          checked={selectedFileTypes.includes(type.key)}
                          onChange={() => toggleFileType(type.key)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--gray-300)",
                  background: "var(--surface-card)",
                  color: "var(--gray-700)",
                }}
              >
                <option value="newest">Newest</option>
                <option value="downloads">Most Downloaded</option>
                <option value="az">Alphabetical A-Z</option>
                <option value="za">Alphabetical Z-A</option>
              </select>
              <button
                type="button"
                onClick={() => navigate("/datasets")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--green)",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Add New
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", color: "var(--gray-500)", fontSize: 13 }}>
            <span>Catalogue</span>
            <ChevronRight size={14} />
            <span style={{ color: "var(--gray-900)", fontWeight: 700 }}>{activeCategoryName}</span>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} style={{ padding: 18, borderRadius: 14, background: "var(--surface-card)", boxShadow: "var(--shadow-md)", minHeight: 220, animation: "fadeUp 0.3s ease forwards", animationDelay: `${index * 0.03}s` }}>
                  <div style={{ width: 100, height: 14, background: "var(--gray-200)", borderRadius: 8, marginBottom: 16 }} />
                  <div style={{ width: "80%", height: 20, background: "var(--gray-200)", borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ width: "100%", height: 12, background: "var(--gray-200)", borderRadius: 8, marginBottom: 8 }} />
                  <div style={{ width: "100%", height: 12, background: "var(--gray-200)", borderRadius: 8, marginBottom: 16 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gray-200)" }} />
                    <div style={{ width: "60%", height: 12, background: "var(--gray-200)", borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div style={{ minHeight: 320, borderRadius: 14, background: "var(--surface-card)", boxShadow: "var(--shadow-md)", display: "grid", placeItems: "center", textAlign: "center", padding: 40 }}>
              <BookOpen size={48} color="var(--green)" />
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--gray-900)", marginTop: 18 }}>No datasets in this category yet</div>
              <button
                type="button"
                onClick={() => navigate("/datasets")}
                style={{ marginTop: 18, padding: "10px 18px", borderRadius: 10, border: "1px solid var(--green)", background: "transparent", color: "var(--green)", fontWeight: 700, cursor: "pointer" }}
              >
                Upload the first dataset
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredDatasets.map((item, index) => {
                const ownerName = item.owner?.full_name || "Unknown";
                const ownerInitials = getInitials(ownerName);
                const ownerColor = getOwnerColor(ownerName);
                const activeMenuOpen = activeMenu === item.id;
                const display = getDatasetDisplay(item);
                const sectorColour = getSectorColour(display.topic);
                const useCases = getUseCases(display.topic).slice(0, 4);
                return (
                  <div
                    key={item.id}
                    className="catalogue-card"
                    style={{ animationDelay: `${index * 0.03}s`, borderTop: `4px solid ${sectorColour}` }}
                    onClick={(event) => {
                      if (event.target.closest(".catalogue-card-menu") || event.target.closest(".catalogue-card-menu-item")) return;
                      navigate(`/datasets/${item.id}`);
                    }}
                  >
                    <div className="catalogue-card-top-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                        <span className="catalogue-category-pill" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999, background: `${sectorColour}18`, color: sectorColour, fontSize: 11, fontWeight: 900 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 4, background: sectorColour }} />
                          {display.topic}
                        </span>
                        {display.verified && (
                          <span className="catalogue-ai-badge">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </div>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="catalogue-card-menu"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMenu((prev) => (prev === item.id ? null : item.id));
                          }}
                          style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--surface-card)", color: "var(--text-secondary)", cursor: "pointer" }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {activeMenuOpen && (
                          <div className="catalogue-card-menu-popover" style={{ position: "absolute", top: 40, right: 0, width: 150, borderRadius: 12, background: "var(--surface-card)", boxShadow: "var(--shadow-md)", zIndex: 15, padding: 8 }}>
                            <button
                              type="button"
                              className="catalogue-card-menu-item"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/datasets/${item.id}`);
                                setActiveMenu(null);
                              }}
                              style={{ width: "100%", padding: "10px 12px", textAlign: "left", border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              className="catalogue-card-menu-item"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigator.clipboard.writeText(`${window.location.origin}/datasets/${item.id}`);
                                setActiveMenu(null);
                              }}
                              style={{ width: "100%", padding: "10px 12px", textAlign: "left", border: "none", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                            >
                              Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                      {item.visibility === "public" && (
                        <span className="catalogue-public-badge" style={{ position: "absolute", top: -8, right: -8, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--surface-card)", border: "1px solid var(--border-default)", color: "var(--green)" }}>
                          <CheckCircle2 size={16} />
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{display.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 8, color: "var(--text-secondary)", fontSize: 12 }}>
                            <span>{display.publisher}</span>
                            <span>·</span>
                            <span style={{ color: "var(--green)", fontWeight: 900 }}>{starRating(display.verified ? 5 : 4)}</span>
                            <span>·</span>
                            <span>{display.trend}</span>
                          </div>
                        </div>
                      </div>
                      {display.code && (
                        <div style={{ marginTop: 7, color: "var(--text-muted)", fontSize: 11 }}>
                          World Bank Indicator · {display.code}
                        </div>
                      )}
                    </div>

                    <div className="catalogue-visual-panel" style={{ borderColor: `${sectorColour}26`, background: `${sectorColour}0D` }}>
                      <CataloguePreviewVisual dataset={item} display={display} colour={sectorColour} />
                    </div>

                    <div className="catalogue-ai-summary">
                      <div className="catalogue-section-label"><Sparkles size={12} /> AI Summary</div>
                      <p>{display.summary}</p>
                    </div>

                    <div className="catalogue-key-grid">
                      <div>
                        <span>Coverage</span>
                        <strong>{display.coverage}</strong>
                      </div>
                      <div>
                        <span>Records</span>
                        <strong>{display.records}</strong>
                      </div>
                      <div>
                        <span>Regions</span>
                        <strong>{display.regions}</strong>
                      </div>
                    </div>

                    <div className="catalogue-use-cases">
                      <div className="catalogue-section-label">Perfect for</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {useCases.map(({ label, icon: Icon }) => (
                          <span key={label} className="catalogue-use-pill">
                            <Icon size={12} /> {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="catalogue-popularity-row">
                      <span style={{ width: 22, height: 22, borderRadius: 8, background: ownerColor, display: "grid", placeItems: "center", color: "var(--gray-900)", fontSize: 11, fontWeight: 900 }}>
                        {ownerInitials}
                      </span>
                      <span>{item.download_count || 0} downloads</span>
                      <span>·</span>
                      <span>{formatDateLabel(item.created_at)}</span>
                      <span style={{ marginLeft: "auto" }}>Used in {Math.max(1, Math.min(12, Math.ceil((item.download_count || 1) / 20)))} insights</span>
                    </div>

                    <div className="catalogue-action-grid">
                      <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${item.id}`); }}>
                        <TrendingUp size={14} /> Explore
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${item.id}?ask=kweku`); }}>
                        <Bot size={14} /> Kweku
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${item.id}?tab=map`); }}>
                        <Map size={14} /> Map
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); navigate(`/datasets/${item.id}?tab=api`); }}>
                        <Link2 size={14} /> API
                      </button>
                      <div onClick={(event) => event.stopPropagation()} className="catalogue-save-wrap">
                        <WatchButton datasetId={item.id} datasetTitle={display.title} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <style>{`
        .catalogue-card {
          position: relative;
          background: var(--surface-card);
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          padding: 18px;
          cursor: pointer;
          opacity: 0;
          transform: translateY(12px);
          animation: fadeUp 0.28s ease forwards;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .catalogue-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 22px rgba(0,0,0,0.08);
        }
        .catalogue-card-top-row {
          min-height: 34px;
          isolation: isolate;
        }
        .catalogue-category-pill {
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
          max-width: calc(100% - 44px);
        }
        .catalogue-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border-radius: 999px;
          background: var(--green-pale);
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
        }
        .catalogue-visual-panel {
          margin-top: 16px;
          min-height: 126px;
          border: 1px solid;
          border-radius: 16px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .catalogue-intel-visual {
          width: 100%;
          height: 126px;
          display: block;
        }
        .catalogue-ai-summary {
          margin-top: 14px;
          padding: 13px 14px;
          border-radius: 14px;
          background: var(--surface-elevated);
          border: 1px solid var(--border-subtle);
        }
        .catalogue-section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--green);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 10px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .catalogue-ai-summary p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .catalogue-key-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .catalogue-key-grid div {
          border: 1px solid var(--border-subtle);
          background: var(--surface-elevated);
          border-radius: 12px;
          padding: 10px;
          min-width: 0;
        }
        .catalogue-key-grid span {
          display: block;
          color: var(--text-muted);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 900;
          margin-bottom: 5px;
        }
        .catalogue-key-grid strong {
          display: block;
          color: var(--text-primary);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .catalogue-use-cases {
          margin-top: 13px;
        }
        .catalogue-use-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          background: var(--green-pale);
          color: var(--green);
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 800;
        }
        .catalogue-popularity-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 15px;
          padding-top: 13px;
          border-top: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
        }
        .catalogue-action-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 14px;
        }
        .catalogue-action-grid button {
          min-width: 0;
          height: 34px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-secondary);
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 8px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }
        .catalogue-action-grid button:hover {
          border-color: var(--green);
          color: var(--green);
          background: var(--green-pale);
        }
        .catalogue-save-wrap {
          grid-column: 1 / -1;
        }
        .catalogue-save-wrap > div,
        .catalogue-save-wrap button {
          width: 100%;
        }
        .catalogue-card-menu {
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .catalogue-card-menu:hover {
          background: var(--green-pale) !important;
          border-color: rgba(0,107,63,0.22) !important;
          color: var(--green) !important;
        }
        .catalogue-card-menu-popover {
          border: 1px solid var(--border-default);
          overflow: hidden;
        }
        .catalogue-card-menu-item {
          border-radius: 8px;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .catalogue-card-menu-item:hover {
          background: var(--green-pale) !important;
          color: var(--green) !important;
        }
        .catalogue-public-badge {
          box-shadow: 0 8px 18px rgba(17,24,39,0.10);
        }
        [data-theme='dark'] .catalogue-category-pill {
          border-color: rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 20px rgba(0,0,0,0.22);
        }
        [data-theme='dark'] .catalogue-visual-panel {
          background-color: var(--surface-elevated) !important;
        }
        [data-theme='dark'] .catalogue-card-menu-popover,
        [data-theme='dark'] .catalogue-public-badge {
          border-color: var(--border-default);
          box-shadow: var(--shadow-md);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelOpen {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
