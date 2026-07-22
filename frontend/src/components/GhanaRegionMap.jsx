import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Download, Loader2, Map, Share2 } from "lucide-react";
import {
  buildRegionDataMap,
  detectRegionColumn,
  getColourScale,
} from "../utils/mapUtils";

const MAP_WIDTH = 800;

function parseNumericValue(value) {
  const cleaned = String(value ?? "")
    .replace(/[,%]/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  const parsed = parseFloat(
    cleaned
  );
  return Number.isNaN(parsed) ? null : parsed;
}

function getNumericColumns(rows) {
  const headers = rows?.[0] || [];
  const dataRows = rows?.slice(1) || [];

  return headers
    .map((header, index) => {
      const populatedRows = dataRows.filter((row) => row[index] !== null && row[index] !== undefined && String(row[index]).trim() !== "");
      if (populatedRows.length === 0) return null;

      const numericCount = populatedRows.filter((row) => parseNumericValue(row[index]) !== null).length;
      return numericCount / populatedRows.length > 0.5 ? { index, label: header } : null;
    })
    .filter(Boolean);
}

function formatLegendValue(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const number = Number(value);
  const formatted = Math.abs(number) >= 1000
    ? number.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : number.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${formatted}${unit}`;
}

function getSafeFilename(title) {
  return `${String(title || "dataset").replace(/[^a-z0-9]/gi, "_")}_ghana_map.png`;
}

function getFeatureCoordinates(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }

  return [];
}

function getGeoBounds(featureCollection) {
  const coordinates = (featureCollection?.features || []).flatMap(getFeatureCoordinates);
  if (!coordinates.length) return null;

  const longitudes = coordinates.map(([lon]) => lon);
  const latitudes = coordinates.map(([, lat]) => lat);

  return {
    minLon: Math.min(...longitudes),
    maxLon: Math.max(...longitudes),
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
  };
}

function mercatorY(lat) {
  const radians = lat * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function inverseMercatorY(y) {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
}

function getProjectionConfig(geoData, height) {
  const bounds = getGeoBounds(geoData);
  if (!bounds) return { scale: 3200, center: [-1.0, 7.9] };

  const lonSpan = Math.max((bounds.maxLon - bounds.minLon) * Math.PI / 180, 0.0001);
  const minY = mercatorY(bounds.minLat);
  const maxY = mercatorY(bounds.maxLat);
  const ySpan = Math.max(Math.abs(maxY - minY), 0.0001);
  const scale = Math.min((MAP_WIDTH * 0.9) / lonSpan, (height * 0.88) / ySpan);
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerLat = inverseMercatorY((minY + maxY) / 2);

  return {
    scale,
    center: [centerLon, centerLat],
  };
}

export default function GhanaRegionMap({
  rows = [],
  datasetTitle = "dataset",
  datasetId,
  height = 420,
  compact = false,
}) {
  const mapRef = useRef(null);
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [selectedValueCol, setSelectedValueCol] = useState(null);
  const [scaleType, setScaleType] = useState("sequential");
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const headers = rows?.[0] || [];
  const regionColIdx = useMemo(() => detectRegionColumn(headers), [headers]);
  const numericColumns = useMemo(() => getNumericColumns(rows), [rows]);
  const validNumericColumns = useMemo(
    () => numericColumns.filter((column) => column.index !== regionColIdx),
    [numericColumns, regionColIdx]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch("/ghana-regions.geojson", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setGeoData(data);
        setGeoError(false);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        console.error("Unable to load Ghana regions GeoJSON", error);
        setGeoError(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (validNumericColumns.length === 0) {
      if (selectedValueCol !== null) setSelectedValueCol(null);
      return;
    }

    if (
      selectedValueCol !== null &&
      validNumericColumns.some((column) => column.index === selectedValueCol)
    ) {
      return;
    }

    if (validNumericColumns.length > 0) {
      setSelectedValueCol(validNumericColumns[0].index);
    }
  }, [selectedValueCol, validNumericColumns]);

  const computed = useMemo(() => {
    if (regionColIdx === -1 || selectedValueCol === null) {
      return {
        regionDataMap: {},
        values: [],
        colourScale: () => "#E5E7EB",
        min: 0,
        max: 0,
        mid: 0,
        unit: "",
      };
    }

    const regionDataMap = buildRegionDataMap(rows.slice(1), regionColIdx, selectedValueCol);
    const values = Object.values(regionDataMap);
    const colourScale = getColourScale(values, scaleType);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const mid = (min + max) / 2;
    const unit = headers[selectedValueCol]?.includes("%") ? "%" : "";

    return { regionDataMap, values, colourScale, min, max, mid, unit };
  }, [headers, regionColIdx, rows, scaleType, selectedValueCol]);

  const hasUsableData = regionColIdx !== -1 && validNumericColumns.length > 0 && selectedValueCol !== null;
  const columnName = headers[selectedValueCol] || "Value";
  const regionsWithData = Object.keys(computed.regionDataMap).length;
  const mapHeight = compact ? Math.max(280, height) : height;
  const projectionConfig = useMemo(
    () => getProjectionConfig(geoData, mapHeight),
    [geoData, mapHeight]
  );

  async function handleShare() {
    const url = `${window.location.origin}/datasets/${datasetId}?tab=map&col=${selectedValueCol}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    if (!mapRef.current) return;

    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapRef.current, { scale: 2, useCORS: true });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getSafeFilename(datasetTitle);
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Unable to download Ghana region map", error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      className={compact ? "ghana-region-map ghana-region-map-compact" : "ghana-region-map"}
      style={{
        width: "100%",
        borderRadius: compact ? 0 : 12,
        overflow: "hidden",
        boxShadow: compact ? "none" : "var(--shadow-md)",
        background: "var(--surface-card)",
      }}
    >
      <div
        className="ghana-region-map-toolbar"
        style={{
          background: "var(--surface-card)",
          borderRadius: "12px 12px 0 0",
          padding: compact ? "10px 14px" : "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: compact ? 10 : 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Map size={16} color="var(--green)" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
            {compact ? columnName : "Ghana Regional Map"}
          </span>
        </div>

        {validNumericColumns.length > 1 && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            Showing:
            <select
              value={selectedValueCol ?? ""}
              onChange={(event) => setSelectedValueCol(Number(event.target.value))}
              style={{
                border: "1px solid var(--gray-300)",
                borderRadius: 8,
                height: 32,
                padding: "0 8px",
                fontSize: 12,
                background: "var(--surface-card)",
                color: "var(--text-primary)",
                outlineColor: "var(--green)",
              }}
            >
              {validNumericColumns.map((column) => (
                <option key={column.index} value={column.index}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["sequential", "diverging"].map((type) => {
            const active = scaleType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setScaleType(type)}
                style={{
                  height: 28,
                  borderRadius: 6,
                  border: active ? "1px solid var(--green)" : "1px solid var(--gray-300)",
                  background: active ? "var(--green)" : "var(--surface-card)",
                  color: active ? "#fff" : "var(--text-secondary)",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {type === "sequential" ? "Linear" : "Diverging"}
              </button>
            );
          })}

          {!compact && (
            <>
              <button
                type="button"
                onClick={handleShare}
                disabled={!datasetId || selectedValueCol === null}
                style={{
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid var(--green)",
                  background: "var(--surface-card)",
                  color: "var(--green)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: !datasetId || selectedValueCol === null ? 0.55 : 1,
                }}
              >
                <Share2 size={14} />
                {copied ? "Copied!" : "Share"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || !geoData || !hasUsableData}
                style={{
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid var(--green)",
                  background: "var(--surface-card)",
                  color: "var(--green)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: isDownloading || !geoData || !hasUsableData ? 0.55 : 1,
                }}
              >
                <Download size={14} />
                PNG
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={mapRef}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--surface-card)",
          height: mapHeight,
          display: "grid",
          placeItems: "center",
        }}
      >
        {!geoData && !geoError && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(90deg, var(--surface-base) 0%, var(--surface-elevated) 50%, var(--surface-base) 100%)",
              backgroundSize: "200% 100%",
              animation: "ghanaMapShimmer 1.2s infinite",
            }}
          >
            <Loader2 size={24} color="var(--green)" style={{ animation: "ghanaMapSpin 0.9s linear infinite" }} />
          </div>
        )}

        {(geoError || (geoData && !hasUsableData)) && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Map size={48} color="var(--gray-300)" />
            <div style={{ marginTop: 12, fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
              No region data detected
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              This dataset does not contain a Ghana region column.
            </div>
          </div>
        )}

        {geoData && hasUsableData && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={projectionConfig}
            width={MAP_WIDTH}
            height={mapHeight}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const regionName = geo.properties.name;
                    const value = computed.regionDataMap[regionName];
                    const fillColour = value !== undefined ? computed.colourScale(value) : "var(--surface-base)";

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColour}
                        stroke="var(--surface-card)"
                        strokeWidth={0.8}
                        style={{
                          default: {
                            outline: "none",
                            cursor: value !== undefined ? "pointer" : "default",
                          },
                          hover: {
                            outline: "none",
                            fill: value !== undefined ? fillColour : "#E5E7EB",
                            filter: "brightness(0.9)",
                            transition: "all 0.15s ease",
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(event) => {
                          setHoveredRegion({ name: regionName, value, unit: computed.unit });
                          setTooltipPos({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseMove={(event) => {
                          setTooltipPos({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {geoData && hasUsableData && (
        <div
          style={{
            background: "var(--surface-card)",
            borderTop: "1px solid var(--border-subtle)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Showing: {columnName}
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                width: 160,
                height: 12,
                borderRadius: 6,
                background:
                  scaleType === "sequential"
                    ? "linear-gradient(to right, #E8F5EF, #004D2C)"
                    : "linear-gradient(to right, #DC2626, #F9FAFB, #006B3F)",
              }}
            />
            <div style={{ width: 160, display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
              <span>{formatLegendValue(computed.min, computed.unit)}</span>
              <span>{formatLegendValue(computed.mid, computed.unit)}</span>
              <span>{formatLegendValue(computed.max, computed.unit)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--surface-base)", border: "1px solid var(--border-default)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No data</span>
          </div>

          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
            {regionsWithData} of 16 regions have data
          </div>
        </div>
      )}

      {hoveredRegion && (
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 40,
            pointerEvents: "none",
            zIndex: 1000,
            background: "var(--surface-card)",
            borderRadius: 8,
            padding: "8px 12px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-md)",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
            {hoveredRegion.name}
          </div>
          {hoveredRegion.value !== undefined ? (
            <div style={{ marginTop: 2, color: "var(--green)", fontWeight: 800 }}>
              {Number(hoveredRegion.value).toFixed(2)}
              {hoveredRegion.unit}
            </div>
          ) : (
            <div style={{ marginTop: 2, color: "var(--text-secondary)", fontStyle: "italic" }}>
              No data available
            </div>
          )}
        </div>
      )}

      <style>{`
        .ghana-region-map button:disabled {
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .ghana-region-map-toolbar {
            align-items: stretch !important;
          }

          .ghana-region-map-toolbar > div {
            width: 100%;
            justify-content: space-between;
          }

          .ghana-region-map-toolbar button,
          .ghana-region-map-toolbar select {
            min-height: 36px;
          }
        }

        @media (max-width: 480px) {
          .ghana-region-map-compact .ghana-region-map-toolbar {
            padding: 10px 12px !important;
          }
        }

        @keyframes ghanaMapSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ghanaMapShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
