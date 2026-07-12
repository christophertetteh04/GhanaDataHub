import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Download,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { datasetsApi, categoriesApi } from "../services/api";

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

function getHashIndex(value, length) {
  return (
    value?.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % length || 0
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
  const [categories, setCategories] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [allDatasets, setAllDatasets] = useState([]);
  const [allTotal, setAllTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
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
          <div style={{ background: "white", borderRadius: 14, boxShadow: "var(--shadow-md)", padding: 16 }}>
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
                        <span style={{ minWidth: 30, textAlign: "center", background: isActive ? "rgba(255,255,255,0.2)" : "white", borderRadius: 999, padding: "2px 8px", fontSize: 12, color: isActive ? "white" : "var(--gray-700)" }}>
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
                        <span style={{ width: 14, height: 14, borderRadius: 999, background: isActive ? "white" : "var(--gray-200)", border: isActive ? "1px solid transparent" : "1px solid var(--gray-300)" }} />
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
                  <div key={owner.id} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid white", background: getOwnerColor(owner.full_name), color: "var(--gray-900)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, zIndex: 1 }}>
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
                    <div style={{ position: "absolute", top: "110%", left: 0, width: 220, background: "white", borderRadius: 12, boxShadow: "var(--shadow-md)", padding: 10, zIndex: 20 }}>
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
                    background: "white",
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
                  background: "white",
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
                <div key={index} style={{ padding: 18, borderRadius: 14, background: "white", boxShadow: "var(--shadow-md)", minHeight: 220, animation: "fadeUp 0.3s ease forwards", animationDelay: `${index * 0.03}s` }}>
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
            <div style={{ minHeight: 320, borderRadius: 14, background: "white", boxShadow: "var(--shadow-md)", display: "grid", placeItems: "center", textAlign: "center", padding: 40 }}>
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
                const category = item.category;
                const categoryColor = getCategoryColor(category?.name || "Unknown");
                const ownerName = item.owner?.full_name || "Unknown";
                const ownerInitials = getInitials(ownerName);
                const ownerColor = getOwnerColor(ownerName);
                const activeMenuOpen = activeMenu === item.id;
                return (
                  <div
                    key={item.id}
                    className="catalogue-card"
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={(event) => {
                      if (event.target.closest(".catalogue-card-menu") || event.target.closest(".catalogue-card-menu-item")) return;
                      navigate(`/datasets/${item.id}`);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, position: "relative" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999, background: categoryColor, color: "var(--gray-900)", fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--green)" }} />
                        {category?.name || "Uncategorized"}
                      </span>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="catalogue-card-menu"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveMenu((prev) => (prev === item.id ? null : item.id));
                          }}
                          style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid var(--gray-200)", background: "white", cursor: "pointer" }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {activeMenuOpen && (
                          <div style={{ position: "absolute", top: 40, right: 0, width: 150, borderRadius: 12, background: "white", boxShadow: "var(--shadow-md)", zIndex: 15, padding: 8 }}>
                            <button
                              type="button"
                              className="catalogue-card-menu-item"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/datasets/${item.id}`);
                                setActiveMenu(null);
                              }}
                              style={{ width: "100%", padding: "10px 12px", textAlign: "left", border: "none", background: "transparent", color: "var(--gray-700)", cursor: "pointer" }}
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
                              style={{ width: "100%", padding: "10px 12px", textAlign: "left", border: "none", background: "transparent", color: "var(--gray-700)", cursor: "pointer" }}
                            >
                              Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                      {item.visibility === "public" && (
                        <span style={{ position: "absolute", top: -8, right: -8, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "white", border: "1px solid var(--gray-200)", color: "var(--green)" }}>
                          <CheckCircle2 size={16} />
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--gray-900)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.5, marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description || "No description available."}</div>
                    </div>
                    <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, color: "var(--gray-600)", fontSize: 12 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 8, background: ownerColor, display: "grid", placeItems: "center", color: "var(--gray-900)", fontSize: 11, fontWeight: 700 }}>
                        {ownerInitials}
                      </span>
                      <span>{ownerName}</span>
                      <span style={{ marginLeft: "auto", color: "var(--gray-400)", fontSize: 11 }}>ghanadatahub.com</span>
                    </div>
                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {filteredDatasets.slice(0, 3).map((owner, idx) => {
                          const initials = getInitials(owner.owner?.full_name || "?");
                          const color = getOwnerColor(owner.owner?.full_name || "?");
                          return (
                            <div key={owner.id} style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid white", background: color, color: "var(--gray-900)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx }}>
                              {initials}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--gray-500)", fontSize: 12 }}>
                        <Calendar size={14} />
                        {formatDateLabel(item.created_at)}
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
          background: white;
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
