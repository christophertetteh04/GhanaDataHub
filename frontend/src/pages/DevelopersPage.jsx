import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  KeyRound,
  Play,
  Search,
  ShieldCheck,
} from "lucide-react";
import DarkModeToggle from "../components/DarkModeToggle";

const API_ORIGIN = "https://api.ghanadatahub.com";
const BASE_URL = "https://api.ghanadatahub.com/api/v1";

const NAV_GROUPS = [
  {
    label: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
      { id: "api-keys", label: "API Keys" },
      { id: "rate-limits", label: "Rate Limits" },
    ],
  },
  {
    label: "Core Endpoints",
    items: [
      { id: "datasets", label: "Datasets" },
      { id: "search", label: "Search" },
      { id: "categories", label: "Categories" },
      { id: "users", label: "Users" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "pagination", label: "Pagination" },
      { id: "filtering", label: "Filtering" },
      { id: "sorting", label: "Sorting" },
      { id: "versioning", label: "Versioning" },
    ],
  },
  {
    label: "Code Examples",
    items: [
      { id: "code-examples", label: "Python" },
      { id: "code-examples", label: "JavaScript" },
      { id: "code-examples", label: "R Language" },
      { id: "code-examples", label: "curl" },
    ],
  },
  {
    label: "Live Playground",
    items: [{ id: "playground", label: "Try the API" }],
  },
  {
    label: "Resources",
    items: [
      { id: "resources", label: "OpenAPI Spec" },
      { id: "changelog", label: "Changelog" },
      { id: "support", label: "Support" },
    ],
  },
];

const RESPONSE_CODES = [
  ["200 OK", "Request succeeded", "The endpoint returned data successfully."],
  ["201 Created", "Resource created", "A dataset, key, or record was created."],
  ["400 Bad Request", "Invalid request", "Missing fields, invalid query params, or malformed JSON."],
  ["401 Unauthorized", "Authentication missing", "Your API key is missing, expired, or invalid."],
  ["403 Forbidden", "Not allowed", "Your role or API tier cannot access this resource."],
  ["404 Not Found", "Missing resource", "The dataset, user, or endpoint does not exist."],
  ["429 Too Many Requests", "Rate limited", "You exceeded the per-minute or daily request limit."],
  ["500 Server Error", "Platform error", "Something failed on the GhanaDataHub API server."],
];

const RATE_LIMITS = [
  ["Unauthenticated", "30", "1,000", "Public datasets only, page <= 50"],
  ["Registered (free)", "200", "10,000", "All public datasets, full pagination"],
  ["Premium", "500", "50,000", "Priority queue, bulk download, private datasets"],
];

const DATASET_PARAMS = [
  ["search", "string", "No", "-", "Full-text search across title and description"],
  ["category_id", "UUID", "No", "-", "Filter by category"],
  ["visibility", "enum", "No", "public", "public, private, organization"],
  ["file_type", "string", "No", "-", "csv, json, xlsx, pdf"],
  ["sort_by", "enum", "No", "created_at", "created_at, download_count, title"],
  ["sort_dir", "enum", "No", "desc", "asc, desc"],
  ["page", "integer", "No", "1", "Page number"],
  ["per_page", "integer", "No", "20", "Items per page (max 100)"],
];

const CODE_EXAMPLES = {
  python: `import os, requests

API_BASE = 'https://api.ghanadatahub.com/api/v1'
API_KEY = os.environ.get('GHANADATAHUB_API_KEY', '')
headers = {'Authorization': f'Bearer {API_KEY}'} if API_KEY else {}

# Search for Ghana cocoa datasets
def search_datasets(query, category=None):
    params = {'search': query, 'per_page': 10}
    if category:
        params['category_id'] = category
    r = requests.get(f'{API_BASE}/datasets/', headers=headers, params=params)
    r.raise_for_status()
    return r.json()

# Download a dataset by ID
def download_dataset(dataset_id, filename):
    url_resp = requests.get(
        f'{API_BASE}/datasets/{dataset_id}/download-url',
        headers=headers
    )
    signed_url = url_resp.json()['download_url']

    file_resp = requests.get(signed_url)
    with open(filename, 'wb') as f:
        f.write(file_resp.content)
    print(f'Downloaded: {filename}')

results = search_datasets('cocoa production')
print(f'Found {results["total"]} datasets')
for d in results['items'][:3]:
    print(f'  {d["title"]} ({d["download_count"]} downloads)')`,
  javascript: `const API_BASE = 'https://api.ghanadatahub.com/api/v1';
const API_KEY = process.env.GHANADATAHUB_API_KEY;
const headers = API_KEY ? { Authorization: \`Bearer \${API_KEY}\` } : {};

async function searchDatasets(query) {
  const url = new URL(\`\${API_BASE}/datasets/\`);
  url.searchParams.set('search', query);
  url.searchParams.set('per_page', '10');

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}

async function downloadDataset(datasetId) {
  const urlRes = await fetch(
    \`\${API_BASE}/datasets/\${datasetId}/download-url\`,
    { headers }
  );
  const { download_url } = await urlRes.json();
  window.open(download_url, '_blank');
}

const results = await searchDatasets('Ghana inflation');
console.log(\`Found \${results.total} datasets\`);`,
  r: `library(httr)
library(jsonlite)

API_BASE <- 'https://api.ghanadatahub.com/api/v1'
API_KEY <- Sys.getenv('GHANADATAHUB_API_KEY')
auth_header <- if (nchar(API_KEY) > 0)
  add_headers(Authorization = paste('Bearer', API_KEY))
else add_headers()

search_datasets <- function(query) {
  response <- GET(
    url = paste0(API_BASE, '/datasets/'),
    query = list(search = query, per_page = 10),
    auth_header
  )
  content(response, as = 'parsed', type = 'application/json')
}

load_ghana_dataset <- function(dataset_id) {
  url_resp <- GET(
    paste0(API_BASE, '/datasets/', dataset_id, '/download-url'),
    auth_header
  )
  signed_url <- content(url_resp)$download_url
  read.csv(signed_url)
}

results <- search_datasets('Ghana GDP')
cat('Found', results$total, 'datasets\\n')
# df <- load_ghana_dataset(results$items[[1]]$id)`,
  curl: `# 1. Search datasets
curl 'https://api.ghanadatahub.com/api/v1/datasets/?search=cocoa&per_page=5'

# 2. Search with auth
curl -H 'Authorization: Bearer YOUR_KEY' \\
  'https://api.ghanadatahub.com/api/v1/datasets/?search=cocoa'

# 3. Get a single dataset
curl 'https://api.ghanadatahub.com/api/v1/datasets/{DATASET_ID}'

# 4. Upload a dataset
curl -X POST \\
  -H 'Authorization: Bearer YOUR_KEY' \\
  -F 'title=My Ghana Dataset' \\
  -F 'description=Description here' \\
  -F 'visibility=public' \\
  -F 'file=@/path/to/file.csv' \\
  'https://api.ghanadatahub.com/api/v1/datasets/'`,
};

const QUICK_EXAMPLES = [
  { label: "List datasets", endpoint: "/api/v1/datasets/?per_page=5" },
  { label: "Search cocoa", endpoint: "/api/v1/datasets/?search=cocoa" },
  { label: "Get categories", endpoint: "/api/v1/categories/" },
];

function copyText(value, setCopied) {
  navigator.clipboard.writeText(value);
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
}

function CodeBlock({ code, language = "bash", title = null }) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="dev-code-block">
      {title && (
        <div className="dev-code-title">
          {language.toUpperCase()} - {title}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <pre>{code}</pre>
        <button onClick={() => copyText(code, setCopied)} className="dev-copy-btn" type="button">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function EndpointBlock({ method, path, description, children }) {
  const [copied, setCopied] = useState(false);
  const methodColours = {
    GET: "#059669",
    POST: "#1D4ED8",
    DELETE: "#DC2626",
    PATCH: "#D97706",
  };

  return (
    <div className="endpoint-block">
      <div className="endpoint-top">
        <span className="method-badge" style={{ background: methodColours[method] }}>
          {method}
        </span>
        <code>{path}</code>
        <button type="button" onClick={() => copyText(path, setCopied)} className="endpoint-copy">
          <Copy size={13} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="endpoint-body">
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}

function DocsTable({ columns, rows, codeColumn = 0 }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className={cellIndex === codeColumn ? "code-cell" : ""}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="dev-section">
      {eyebrow && <div className="dev-eyebrow">{eyebrow}</div>}
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export default function DevelopersPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [docSearch, setDocSearch] = useState("");
  const [activeLanguage, setActiveLanguage] = useState("python");
  const [baseCopied, setBaseCopied] = useState(false);
  const [endpoint, setEndpoint] = useState("/api/v1/datasets/?search=cocoa&per_page=5");
  const [method, setMethod] = useState("GET");
  const [addAuth, setAddAuth] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [playgroundResponse, setPlaygroundResponse] = useState(null);
  const [playgroundError, setPlaygroundError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseCopied, setResponseCopied] = useState(false);

  const filteredGroups = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          group.label.toLowerCase().includes(q)
      ),
    })).filter((group) => group.items.length > 0);
  }, [docSearch]);

  const flatTabs = useMemo(() => {
    const seen = new Set();
    return NAV_GROUPS.flatMap((group) => group.items).filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, []);

  function scrollToSection(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function sendPlaygroundRequest(nextEndpoint = endpoint) {
    setIsLoading(true);
    setPlaygroundError(null);
    setPlaygroundResponse(null);
    const start = Date.now();
    try {
      const path = nextEndpoint.startsWith("/") ? nextEndpoint : `/${nextEndpoint}`;
      const headers = {};
      if (addAuth && apiKey.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
      const response = await fetch(`${API_ORIGIN}${path}`, { method, headers });
      const contentType = response.headers.get("content-type") || "unknown";
      const text = await response.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON API responses are still useful in the playground.
      }
      setPlaygroundResponse({
        status: response.status,
        contentType,
        time: Date.now() - start,
        data,
      });
    } catch (error) {
      setPlaygroundError(error.message || "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const responseText = playgroundResponse
    ? typeof playgroundResponse.data === "string"
      ? playgroundResponse.data
      : JSON.stringify(playgroundResponse.data, null, 2)
    : "";

  return (
    <div className="developers-page">
      <style>{`
        .developers-page {
          min-height: 100vh;
          background: var(--surface-base);
          color: var(--text-primary);
          font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dev-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(17,24,39,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }

        [data-theme='light'] .dev-nav {
          background: rgba(248,250,252,0.88);
        }

        .dev-nav-inner {
          height: 60px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 24px;
        }

        .dev-brand,
        .dev-nav-actions,
        .dev-quick-card,
        .endpoint-top,
        .status-row,
        .resource-card a,
        .dev-resource-button {
          display: inline-flex;
          align-items: center;
        }

        .dev-brand {
          gap: 10px;
          color: var(--text-primary);
          font-weight: 900;
          text-decoration: none;
        }

        .dev-logo {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--green);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .dev-nav-title {
          color: var(--green);
          font-size: 14px;
          font-weight: 800;
          justify-self: center;
        }

        .dev-nav-actions {
          gap: 10px;
          justify-content: flex-end;
        }

        .dev-button {
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          padding: 0 14px;
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
        }

        .dev-button.primary {
          border-color: var(--green);
          background: var(--green);
          color: var(--text-on-accent);
        }

        .developers-layout {
          display: flex;
          padding-top: 60px;
        }

        .docs-sidebar {
          width: 260px;
          flex: 0 0 260px;
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
          overflow-y: auto;
          background: var(--surface-sidebar);
          border-right: 1px solid var(--border-subtle);
          padding: 24px 0;
        }

        .docs-search {
          padding: 0 16px 16px;
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
        }

        .docs-search svg {
          position: absolute;
          left: 28px;
          top: 10px;
          color: var(--text-muted);
        }

        .docs-search input {
          width: 100%;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-primary);
          padding: 0 12px 0 34px;
          font-size: 13px;
        }

        .docs-group-label {
          padding: 16px 16px 6px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .docs-nav-item {
          width: 100%;
          border: 0;
          background: transparent;
          border-left: 3px solid transparent;
          color: var(--text-secondary);
          padding: 7px 16px;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .docs-nav-item:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
        }

        .docs-nav-item.active {
          border-left-color: var(--green);
          color: var(--text-primary);
          font-weight: 800;
          background: rgba(37,99,235,0.08);
        }

        .docs-mobile-tabs {
          display: none;
        }

        .docs-content {
          flex: 1;
          max-width: 820px;
          padding: 80px 48px;
        }

        .dev-section {
          scroll-margin-top: 84px;
          padding-bottom: 48px;
          margin-bottom: 48px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .dev-section:last-child {
          border-bottom: 0;
        }

        .dev-eyebrow {
          color: var(--green);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .dev-section h1 {
          margin: 0;
          color: var(--text-primary);
          font-size: 40px;
          line-height: 1.12;
          letter-spacing: -0.02em;
        }

        .dev-section h2 {
          color: var(--text-primary);
          font-size: 28px;
          letter-spacing: -0.01em;
          margin: 0 0 16px;
        }

        .dev-section h3 {
          color: var(--text-primary);
          font-size: 17px;
          margin: 24px 0 10px;
        }

        .dev-section p,
        .dev-section li {
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.8;
        }

        .dev-subtitle {
          max-width: 680px;
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.8;
          margin: 16px 0 0;
        }

        .base-card,
        .endpoint-block,
        .playground-card,
        .resource-card,
        .dev-quick-card,
        .warning-card,
        .info-card {
          border: 1px solid var(--border-default);
          border-radius: 10px;
          background: var(--surface-elevated);
        }

        .base-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          margin-top: 24px;
        }

        .base-label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .base-url {
          color: var(--green);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 14px;
          flex: 1;
          word-break: break-all;
        }

        .quick-grid,
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .dev-quick-card {
          align-items: flex-start;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: var(--surface-card);
        }

        .dev-quick-card svg {
          color: var(--green);
        }

        .dev-quick-card strong,
        .resource-card strong {
          color: var(--text-primary);
          font-size: 14px;
        }

        .dev-quick-card span,
        .resource-card span {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
        }

        .warning-card {
          display: flex;
          gap: 12px;
          background: rgba(217,119,6,0.08);
          border-color: rgba(217,119,6,0.3);
          border-left: 4px solid #D97706;
          padding: 16px 20px;
          margin: 16px 0;
        }

        .warning-card svg {
          color: #D97706;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .info-card {
          border-left: 4px solid var(--green);
          padding: 16px 20px;
          margin: 16px 0;
          background: var(--surface-card);
        }

        .docs-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          margin: 14px 0;
        }

        .docs-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }

        .docs-table th {
          background: var(--surface-elevated);
          color: var(--text-muted);
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-align: left;
          padding: 10px 12px;
        }

        .docs-table td {
          border-top: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 13px;
          padding: 11px 12px;
          vertical-align: top;
        }

        .code-cell {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: var(--text-primary) !important;
          font-weight: 700;
        }

        .dev-code-block {
          background: #0B1120;
          border: 1px solid var(--border-default);
          border-radius: 10px;
          overflow: hidden;
          margin: 12px 0;
        }

        .dev-code-title {
          padding: 8px 16px;
          background: rgba(255,255,255,0.04);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
          color: var(--text-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .dev-code-block pre {
          padding: 16px 20px;
          margin: 0;
          overflow: auto;
          font-size: 13px;
          line-height: 1.7;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #93C5FD;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .dev-copy-btn,
        .endpoint-copy {
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          color: var(--text-muted);
          cursor: pointer;
        }

        .dev-copy-btn {
          position: absolute;
          top: 10px;
          right: 10px;
        }

        .endpoint-block {
          overflow: hidden;
          margin: 20px 0;
          background: var(--surface-card);
        }

        .endpoint-top {
          gap: 12px;
          padding: 12px 18px;
          background: var(--surface-elevated);
          border-bottom: 1px solid var(--border-subtle);
        }

        .method-badge {
          color: white;
          font-size: 11px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .endpoint-top code {
          font-size: 14px;
          color: var(--text-primary);
          flex: 1;
        }

        .endpoint-copy {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .endpoint-body {
          padding: 16px 20px;
        }

        .endpoint-body p {
          margin: 0 0 12px;
        }

        .language-tabs,
        .quick-example-row,
        .play-row,
        .auth-row,
        .status-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .language-tabs {
          margin: 16px 0;
        }

        .language-tab,
        .quick-example,
        .play-method,
        .send-button {
          border-radius: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .language-tab {
          height: 32px;
          padding: 0 12px;
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          color: var(--text-secondary);
          font-size: 12px;
        }

        .language-tab.active {
          background: var(--green);
          border-color: var(--green);
          color: var(--text-on-accent);
        }

        .playground-card {
          background: var(--surface-card);
          border-radius: 16px;
          padding: 24px;
        }

        .play-row {
          align-items: stretch;
        }

        .play-method {
          width: 86px;
          height: 44px;
          background: var(--green);
          border: 0;
          color: var(--text-on-accent);
          padding: 0 10px;
        }

        .endpoint-input,
        .api-key-input {
          height: 44px;
          border-radius: 10px;
          border: 1px solid var(--border-default);
          background: var(--surface-elevated);
          color: var(--text-primary);
          padding: 0 14px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 14px;
        }

        .endpoint-input {
          flex: 1;
          min-width: 260px;
        }

        .api-key-input {
          width: 100%;
          margin-top: 10px;
        }

        .auth-row {
          margin: 16px 0;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .send-button {
          height: 44px;
          border: 0;
          background: var(--green);
          color: var(--text-on-accent);
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .response-area {
          margin-top: 18px;
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
        }

        .status-row {
          justify-content: space-between;
          margin-bottom: 10px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .status-badge {
          border-radius: 999px;
          padding: 4px 10px;
          color: white;
          font-weight: 900;
          font-size: 11px;
        }

        .error-box {
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.28);
          color: #EF4444;
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 14px;
          font-size: 13px;
        }

        .quick-example-row {
          margin-top: 16px;
        }

        .quick-example {
          height: 32px;
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--green);
          padding: 0 12px;
          font-size: 12px;
        }

        .resource-card {
          background: var(--surface-card);
          border-radius: 14px;
          padding: 18px;
          display: grid;
          gap: 12px;
        }

        .dev-resource-button {
          justify-content: center;
          gap: 8px;
          min-height: 36px;
          border-radius: 8px;
          border: 1px solid var(--green);
          color: var(--green);
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          background: transparent;
        }

        .dev-resource-button.disabled {
          border-color: var(--border-default);
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 1024px) {
          .developers-layout {
            display: block;
          }

          .docs-sidebar {
            display: none;
          }

          .docs-mobile-tabs {
            display: flex;
            position: sticky;
            top: 60px;
            z-index: 90;
            overflow-x: auto;
            gap: 8px;
            padding: 10px 16px;
            background: var(--surface-sidebar);
            border-bottom: 1px solid var(--border-subtle);
          }

          .docs-mobile-tabs button {
            flex: 0 0 auto;
            border: 1px solid var(--border-default);
            background: var(--surface-elevated);
            color: var(--text-secondary);
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 12px;
            font-weight: 800;
          }

          .docs-mobile-tabs button.active {
            background: var(--green);
            border-color: var(--green);
            color: var(--text-on-accent);
          }

          .docs-content {
            max-width: none;
            padding: 48px 24px 72px;
          }
        }

        @media (max-width: 760px) {
          .dev-nav-inner {
            grid-template-columns: auto 1fr auto;
            gap: 10px;
            padding: 0 14px;
          }

          .dev-nav-title,
          .dev-back {
            display: none;
          }

          .dev-button.primary {
            padding: 0 10px;
          }

          .dev-section h1 {
            font-size: 32px;
          }

          .quick-grid,
          .resource-grid {
            grid-template-columns: 1fr;
          }

          .base-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .play-row {
            display: grid;
          }

          .endpoint-input {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>

      <header className="dev-nav">
        <div className="dev-nav-inner">
          <Link className="dev-brand" to="/">
            <span className="dev-logo">GD</span>
            <span>GhanaDataHub</span>
          </Link>
          <div className="dev-nav-title">Developers</div>
          <div className="dev-nav-actions">
            <Link className="dev-button primary" to="/profile#api-keys">
              Get API Key
            </Link>
            <DarkModeToggle />
            <Link className="dev-button dev-back" to="/dashboard">
              Back to Platform
            </Link>
          </div>
        </div>
      </header>

      <div className="developers-layout">
        <aside className="docs-sidebar" aria-label="Developer documentation navigation">
          <div className="docs-search">
            <Search size={14} />
            <input
              value={docSearch}
              onChange={(event) => setDocSearch(event.target.value)}
              placeholder="Search docs..."
              aria-label="Search documentation"
            />
          </div>
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <div className="docs-group-label">{group.label}</div>
              {group.items.map((item, index) => (
                <button
                  type="button"
                  key={`${group.label}-${item.id}-${index}`}
                  className={`docs-nav-item ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="docs-mobile-tabs" aria-label="Developer documentation sections">
          {flatTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeSection === tab.id ? "active" : ""}
              onClick={() => scrollToSection(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="docs-content">
          <section id="introduction" className="dev-section">
            <div className="dev-eyebrow">GhanaDataHub API</div>
            <h1>Build with Ghana Open Data</h1>
            <p className="dev-subtitle">
              The GhanaDataHub REST API gives you programmatic access to thousands of Ghana datasets covering economy, health, agriculture, demographics, governance, and more. All responses are JSON.
            </p>

            <div className="base-card">
              <span className="base-label">Base URL</span>
              <code className="base-url">{BASE_URL}</code>
              <button className="dev-button" type="button" onClick={() => copyText(BASE_URL, setBaseCopied)}>
                <Copy size={14} /> {baseCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="quick-grid">
              <article className="dev-quick-card">
                <KeyRound size={18} />
                <strong>Get an API Key</strong>
                <span>Free, instant access.</span>
                <Link className="dev-resource-button" to="/profile#api-keys">Create key</Link>
              </article>
              <article className="dev-quick-card">
                <Play size={18} />
                <strong>Try the Playground</strong>
                <span>No key needed for public endpoints.</span>
                <button className="dev-resource-button" type="button" onClick={() => scrollToSection("playground")}>Open playground</button>
              </article>
              <article className="dev-quick-card">
                <Download size={18} />
                <strong>Download OpenAPI Spec</strong>
                <span>Import into Postman or Insomnia.</span>
                <a className="dev-resource-button" href="/api/openapi.json">openapi.json</a>
              </article>
            </div>
          </section>

          <Section id="authentication" title="Authentication">
            <p>
              GhanaDataHub supports unauthenticated access for public discovery and bearer-token access for registered users, bulk usage, private data, and higher rate limits.
            </p>
            <h3>Bearer Token</h3>
            <CodeBlock
              title="registered users"
              code={`curl -H 'Authorization: Bearer YOUR_API_KEY' \\
  https://api.ghanadatahub.com/api/v1/datasets/`}
            />
            <h3>No Auth</h3>
            <CodeBlock
              title="public endpoints"
              code={`curl https://api.ghanadatahub.com/api/v1/datasets/?visibility=public`}
            />
            <DocsTable columns={["Code", "Meaning", "When it occurs"]} rows={RESPONSE_CODES} />
          </Section>

          <Section id="api-keys" title="API Keys">
            <p>
              API keys identify your application, unlock higher limits, and make it possible to audit downloads, saved endpoints, and API usage.
            </p>
            <ol>
              <li>Register at ghanadatahub.com/register.</li>
              <li>Go to your Profile, then Settings, then API Keys.</li>
              <li>Click Generate Key, give it a name, and copy the key immediately.</li>
              <li>Store your key securely. It is shown only once.</li>
            </ol>
            <div className="warning-card">
              <AlertTriangle size={18} />
              <p>
                <strong style={{ color: "var(--text-primary)" }}>Never commit your API key to a public GitHub repository.</strong> Use environment variables instead. If your key is compromised, revoke it immediately at /profile#api-keys and generate a new one.
              </p>
            </div>
            <CodeBlock title="environment variable" code={`export GHANADATAHUB_API_KEY='your-key-here'`} />
            <CodeBlock title="Python" language="python" code={`import os\napi_key = os.environ['GHANADATAHUB_API_KEY']`} />
            <CodeBlock title=".env file" language="env" code={`GHANADATAHUB_API_KEY=your-key-here`} />
          </Section>

          <Section id="rate-limits" title="Rate Limits">
            <p>
              Rate limits are applied per minute and per day. Unauthenticated requests are limited by IP address. Authenticated requests are tied to the user or API key.
            </p>
            <DocsTable columns={["Tier", "Requests per minute", "Daily limit", "Notes"]} rows={RATE_LIMITS} codeColumn={0} />
            <CodeBlock
              language="json"
              title="429 response"
              code={`{
  "detail": "Rate limit exceeded.",
  "retry_after_seconds": 60,
  "limit": 30,
  "tier": "unauthenticated"
}`}
            />
            <CodeBlock
              language="python"
              title="retry helper"
              code={`import time, requests

def get_with_retry(url, headers, max_retries=3):
    for i in range(max_retries):
        resp = requests.get(url, headers=headers)
        if resp.status_code == 429:
            wait = int(resp.headers.get('Retry-After', 60))
            print(f'Rate limited. Waiting {wait}s...')
            time.sleep(wait)
        else:
            return resp
    raise Exception('Max retries exceeded')`}
            />
          </Section>

          <Section id="datasets" title="Datasets">
            <EndpointBlock method="GET" path="/datasets/" description="List all publicly accessible datasets. Supports filtering, sorting, and pagination.">
              <DocsTable columns={["Name", "Type", "Required", "Default", "Description"]} rows={DATASET_PARAMS} />
              <CodeBlock
                language="json"
                title="example response"
                code={`{
  "items": [{
    "id": "uuid",
    "title": "Ghana Interbank Forex Rates 2026-07-11",
    "description": "Daily forex rates published by Bank of Ghana.",
    "file_type": "csv",
    "file_size": 2048,
    "download_count": 142,
    "visibility": "public",
    "created_at": "2026-07-11T06:30:00Z",
    "category": { "id": "uuid", "name": "Economy and Finance" },
    "owner": { "id": "uuid", "full_name": "GhanaDataHub Pipeline" }
  }],
  "total": 312,
  "page": 1,
  "per_page": 20,
  "pages": 16
}`}
              />
            </EndpointBlock>

            <EndpointBlock method="GET" path="/datasets/{id}" description="Get a single dataset by UUID.">
              <DocsTable columns={["Path parameter", "Type", "Required", "Description"]} rows={[["id", "UUID", "Yes", "The dataset identifier returned from /datasets/."]]} />
              <CodeBlock
                language="json"
                title="example response"
                code={`{
  "id": "uuid",
  "title": "Urban Population (% of Total Population)",
  "description": "Tracks Ghana's annual urban population share.",
  "source_attribution": "World Bank Open Data",
  "analysis_data": {
    "total_rows": 66,
    "total_columns": 5,
    "completeness_pct": 100,
    "ai_summary": "This dataset tracks Ghana's long-term urbanisation trend."
  },
  "created_at": "2026-07-11T06:30:00Z",
  "updated_at": "2026-07-11T06:30:00Z"
}`}
              />
            </EndpointBlock>

            <EndpointBlock method="GET" path="/datasets/{id}/download" description="Download the dataset file. Returns the file binary. For production apps, request a signed URL first.">
              <CodeBlock
                title="two-step download"
                code={`curl -H 'Authorization: Bearer YOUR_KEY' \\
  https://api.ghanadatahub.com/api/v1/datasets/{id}/download-url

curl -L 'SIGNED_DOWNLOAD_URL' -o dataset.csv`}
              />
            </EndpointBlock>

            <EndpointBlock method="POST" path="/datasets/" description="Upload a new dataset. Requires authentication and multipart form data.">
              <CodeBlock
                title="file upload"
                code={`curl -X POST \\
  -H 'Authorization: Bearer YOUR_KEY' \\
  -F 'title=My Ghana Dataset' \\
  -F 'description=Description here' \\
  -F 'visibility=public' \\
  -F 'file=@/path/to/file.csv' \\
  'https://api.ghanadatahub.com/api/v1/datasets/'`}
              />
            </EndpointBlock>
          </Section>

          <Section id="search" title="Search">
            <p>
              Search is built into the dataset list endpoint. Use the <code>search</code> query parameter for conversational phrases like cocoa exports, Ghana inflation, hospitals, road network, or population by region.
            </p>
            <CodeBlock code={`curl 'https://api.ghanadatahub.com/api/v1/datasets/?search=population%20ashanti&per_page=10'`} />
          </Section>

          <Section id="categories" title="Categories">
            <p>Categories organise datasets by sector so applications can power sector pages, dashboards, and recommendation experiences.</p>
            <EndpointBlock method="GET" path="/categories/" description="List dataset categories with colours, icons, and dataset counts where available.">
              <CodeBlock
                language="json"
                title="example response"
                code={`[
  { "id": "uuid", "name": "Economy and Finance", "icon": "TrendingUp", "colour": "#2563EB" },
  { "id": "uuid", "name": "Health", "icon": "Heart", "colour": "#DC2626" }
]`}
              />
            </EndpointBlock>
          </Section>

          <Section id="users" title="Users">
            <p>
              Public profile and authenticated user endpoints support attribution, bookmarks, API keys, and dataset ownership. Administrative user management endpoints require admin roles.
            </p>
            <CodeBlock code={`curl -H 'Authorization: Bearer YOUR_KEY' https://api.ghanadatahub.com/api/v1/users/me`} />
          </Section>

          <Section id="pagination" title="Pagination">
            <p>
              List endpoints use page-based pagination. Set <code>page</code> and <code>per_page</code>, then read <code>total</code> and <code>pages</code> from the response.
            </p>
            <CodeBlock code={`curl 'https://api.ghanadatahub.com/api/v1/datasets/?page=2&per_page=50'`} />
          </Section>

          <Section id="filtering" title="Filtering">
            <p>Combine category, visibility, file type, and search filters to build rich data discovery interfaces.</p>
            <CodeBlock code={`curl 'https://api.ghanadatahub.com/api/v1/datasets/?search=cocoa&file_type=csv&visibility=public'`} />
          </Section>

          <Section id="sorting" title="Sorting">
            <p>Sort datasets by recency, popularity, or title. Use <code>sort_dir=asc</code> or <code>sort_dir=desc</code>.</p>
            <CodeBlock code={`curl 'https://api.ghanadatahub.com/api/v1/datasets/?sort_by=download_count&sort_dir=desc'`} />
          </Section>

          <Section id="versioning" title="Versioning">
            <p>
              The API path includes the version prefix <code>/api/v1</code>. Breaking changes will ship under a new version path so production integrations remain stable.
            </p>
            <div className="info-card">
              <p>Current stable version: <strong style={{ color: "var(--text-primary)" }}>v1</strong></p>
            </div>
          </Section>

          <Section id="code-examples" title="Code Examples">
            <div className="language-tabs">
              {[
                ["python", "Python"],
                ["javascript", "JavaScript"],
                ["r", "R"],
                ["curl", "curl"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={`language-tab ${activeLanguage === key ? "active" : ""}`}
                  onClick={() => setActiveLanguage(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <CodeBlock
              language={activeLanguage === "javascript" ? "js" : activeLanguage}
              title={`${activeLanguage} example`}
              code={CODE_EXAMPLES[activeLanguage]}
            />
          </Section>

          <Section id="playground" title="Live API Playground">
            <p>
              Make real requests to the GhanaDataHub API without leaving this page. No API key is required for public endpoints.
            </p>
            <div className="playground-card">
              <div className="play-row">
                <select className="play-method" value={method} onChange={(event) => setMethod(event.target.value)}>
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <input
                  className="endpoint-input"
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  placeholder="/api/v1/datasets/?search=cocoa&per_page=5"
                />
              </div>
              <label className="auth-row">
                <input type="checkbox" checked={addAuth} onChange={(event) => setAddAuth(event.target.checked)} />
                Add Authorization header
              </label>
              {addAuth && (
                <input
                  className="api-key-input"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Paste API key. Header is built automatically."
                  type="password"
                />
              )}
              <button className="send-button" type="button" onClick={() => sendPlaygroundRequest()} disabled={isLoading}>
                <Play size={15} />
                {isLoading ? "Sending..." : "Send Request"}
              </button>

              <div className="quick-example-row">
                {QUICK_EXAMPLES.map((example) => (
                  <button
                    type="button"
                    key={example.label}
                    className="quick-example"
                    onClick={() => setEndpoint(example.endpoint)}
                  >
                    {example.label}
                  </button>
                ))}
              </div>

              {playgroundError && <div className="error-box">{playgroundError}</div>}
              {playgroundResponse && (
                <div className="response-area">
                  <div className="status-row">
                    <span
                      className="status-badge"
                      style={{ background: playgroundResponse.status < 400 ? "#059669" : "#DC2626" }}
                    >
                      HTTP {playgroundResponse.status}
                    </span>
                    <span>{playgroundResponse.time}ms</span>
                    <span>{playgroundResponse.contentType}</span>
                  </div>
                  <div className="dev-code-block" style={{ maxHeight: 400, overflow: "auto" }}>
                    <div style={{ position: "relative" }}>
                      <pre>{responseText}</pre>
                      <button
                        className="dev-copy-btn"
                        type="button"
                        onClick={() => copyText(responseText, setResponseCopied)}
                      >
                        {responseCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section id="resources" title="Resources">
            <div className="resource-grid">
              <article className="resource-card">
                <Database size={18} color="var(--green)" />
                <strong>OpenAPI Spec</strong>
                <span>Import the full OpenAPI 3.0 specification into Postman, Insomnia, or any API client.</span>
                <a className="dev-resource-button" href="/api/openapi.json">
                  Download openapi.json <Download size={13} />
                </a>
              </article>
              <article className="resource-card">
                <Code2 size={18} color="var(--green)" />
                <strong>Postman Collection</strong>
                <span>A pre-built Postman collection with all endpoints configured and examples ready to run.</span>
                <span className="dev-resource-button disabled">Coming Soon</span>
              </article>
              <article className="resource-card" id="support">
                <ShieldCheck size={18} color="var(--green)" />
                <strong>Support</strong>
                <span>Questions about the API? Email the developer team. We respond within 24 hours.</span>
                <a className="dev-resource-button" href="mailto:api@ghanadatahub.com">
                  Contact Support <ExternalLink size={13} />
                </a>
              </article>
            </div>
          </Section>

          <Section id="changelog" title="Changelog">
            <div className="info-card">
              <p><CheckCircle2 size={15} style={{ verticalAlign: "text-bottom", color: "var(--green)" }} /> v1 is the current public API. Changelog entries will appear here as the developer platform evolves.</p>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
