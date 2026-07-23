#!/usr/bin/env python3
"""
Scrape Ghana Stock Exchange issuer financial statements into a structured CSV.

The company list is static by design and should be reviewed quarterly. The
scraper looks for recent financial-report PDFs on issuer pages, extracts the
first pages of text with PyMuPDF, and asks Gemini to return a strict JSON
object of standard financial metrics.
"""

import csv
import base64
import json
import os
import re
import sys
import time
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "scripts" / "output"
GSE_BASE_URL = "https://www.gse.com.gh"
USER_AGENT = "GhanaDataHub/1.0 (data research; contact@ghanadatahub.com)"
FINANCIAL_KEYWORDS = ("annual", "financial", "result", "report", "statement")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")


GSE_COMPANIES = [
    {"ticker": "ACCESS", "name": "Access Bank Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/access-bank-ghana-limited"},
    {"ticker": "ADB", "name": "Agricultural Development Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/adb-bank-limited"},
    {"ticker": "ALLGH", "name": "Aluworks Ghana", "sector": "Manufacturing", "gse_page_url": "https://www.gse.com.gh/listed-companies/aluworks-limited"},
    {"ticker": "BOPP", "name": "Benso Oil Palm Plantation", "sector": "Agriculture", "gse_page_url": "https://www.gse.com.gh/listed-companies/benso-oil-palm-plantation-limited"},
    {"ticker": "CAL", "name": "CAL Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/cal-bank-limited"},
    {"ticker": "CLYD", "name": "Clydestone Ghana", "sector": "Technology", "gse_page_url": "https://www.gse.com.gh/listed-companies/clydestone-ghana-limited"},
    {"ticker": "CPC", "name": "Camelot Printing", "sector": "Manufacturing", "gse_page_url": "https://www.gse.com.gh/listed-companies/camelot-printing-limited"},
    {"ticker": "EGL", "name": "Enterprise Group", "sector": "Insurance", "gse_page_url": "https://www.gse.com.gh/listed-companies/enterprise-group-limited"},
    {"ticker": "EGH", "name": "Ecobank Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/ecobank-ghana-limited"},
    {"ticker": "ETI", "name": "Ecobank Transnational", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/ecobank-transnational-incorporated"},
    {"ticker": "FAB", "name": "First Atlantic Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/first-atlantic-bank-limited"},
    {"ticker": "FML", "name": "Fan Milk", "sector": "Food & Beverages", "gse_page_url": "https://www.gse.com.gh/listed-companies/fan-milk-limited"},
    {"ticker": "GCB", "name": "GCB Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/gcb-bank-limited"},
    {"ticker": "GGBL", "name": "Guinness Ghana Breweries", "sector": "Food & Beverages", "gse_page_url": "https://www.gse.com.gh/listed-companies/guinness-ghana-breweries-plc"},
    {"ticker": "GOIL", "name": "GOIL Company", "sector": "Energy", "gse_page_url": "https://www.gse.com.gh/listed-companies/goil-plc"},
    {"ticker": "GLD", "name": "NewGold ETF", "sector": "ETF", "gse_page_url": "https://www.gse.com.gh/listed-companies/newgold-etf"},
    {"ticker": "HORDS", "name": "HFC Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/hfc-bank-ghana-limited"},
    {"ticker": "IIL", "name": "Industrial Holding", "sector": "Manufacturing", "gse_page_url": "https://www.gse.com.gh/listed-companies/iil"},
    {"ticker": "KASA", "name": "Kasapreko Company", "sector": "Food & Beverages", "gse_page_url": "https://www.gse.com.gh/listed-companies/kasapreko-company-limited"},
    {"ticker": "MMH", "name": "Mega African Capital", "sector": "Finance", "gse_page_url": "https://www.gse.com.gh/listed-companies/mega-african-capital-limited"},
    {"ticker": "MTNGH", "name": "MTN Ghana", "sector": "Telecoms", "gse_page_url": "https://www.gse.com.gh/listed-companies/mtn-ghana-limited"},
    {"ticker": "RBGH", "name": "Republic Bank Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/republic-bank-ghana-limited"},
    {"ticker": "SCB", "name": "Standard Chartered Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/standard-chartered-bank-ghana-limited"},
    {"ticker": "SCBPREF", "name": "SCB Preference Shares", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/standard-chartered-bank-pref"},
    {"ticker": "SIC", "name": "SIC Insurance", "sector": "Insurance", "gse_page_url": "https://www.gse.com.gh/listed-companies/sic-insurance-company-limited"},
    {"ticker": "SOGEGH", "name": "Societe Generale Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/societe-generale-ghana-limited"},
    {"ticker": "TOTAL", "name": "TotalEnergies Marketing Ghana", "sector": "Energy", "gse_page_url": "https://www.gse.com.gh/listed-companies/totalenergies-marketing-ghana-plc"},
    {"ticker": "UNIL", "name": "Unilever Ghana", "sector": "Consumer Goods", "gse_page_url": "https://www.gse.com.gh/listed-companies/unilever-ghana-limited"},
    {"ticker": "ZEN", "name": "Zenith Bank Ghana", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/zenith-bank-ghana-limited"},
    {"ticker": "ADB", "name": "ADB Bank", "sector": "Banking", "gse_page_url": "https://www.gse.com.gh/listed-companies/adb-bank"},
    {"ticker": "DASPHARMA", "name": "Dannex Ayrton Starwin", "sector": "Pharmaceuticals", "gse_page_url": "https://www.gse.com.gh/listed-companies/dannex-ayrton-starwin"},
]


AI_PROMPT_TEMPLATE = """
You are a financial data extractor for GhanaDataHub.
Extract the following 10 financial metrics from this financial statement.
Return ONLY a JSON object with exactly these keys.
If a value is not found, use null.
All monetary values should be in Ghana Cedis (GHS) thousands unless
the document specifies otherwise - note the unit used.

Keys to extract:
revenue: Total revenue or turnover (number)
operating_profit: Operating profit or EBIT (number)
profit_before_tax: Profit before income tax (number)
profit_after_tax: Net profit or profit after tax (number)
total_assets: Total assets (number)
total_liabilities: Total liabilities (number)
shareholders_equity: Total equity or shareholders funds (number)
basic_eps: Basic earnings per share in pesewas (number)
dividends_per_share: Dividends per share declared in pesewas (number)
report_year: The financial year this report covers (integer, e.g. 2024)
currency_unit: The unit used (e.g. GHS thousands, GHS millions)

Document text:
{text}

Return minified JSON on one line only. No markdown, no comments, no spaces, no line breaks.
"""


FINANCIAL_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "revenue": {"type": "NUMBER", "nullable": True},
        "operating_profit": {"type": "NUMBER", "nullable": True},
        "profit_before_tax": {"type": "NUMBER", "nullable": True},
        "profit_after_tax": {"type": "NUMBER", "nullable": True},
        "total_assets": {"type": "NUMBER", "nullable": True},
        "total_liabilities": {"type": "NUMBER", "nullable": True},
        "shareholders_equity": {"type": "NUMBER", "nullable": True},
        "basic_eps": {"type": "NUMBER", "nullable": True},
        "dividends_per_share": {"type": "NUMBER", "nullable": True},
        "report_year": {"type": "INTEGER", "nullable": True},
        "currency_unit": {"type": "STRING", "nullable": True},
    },
}


FIELD_DESCRIPTIONS = {
    "revenue": "Total revenue or turnover as a number.",
    "operating_profit": "Operating profit or EBIT as a number.",
    "profit_before_tax": "Profit before income tax as a number.",
    "profit_after_tax": "Net profit or profit after tax as a number.",
    "total_assets": "Total assets as a number.",
    "total_liabilities": "Total liabilities as a number.",
    "shareholders_equity": "Total equity or shareholders funds as a number.",
    "basic_eps": "Basic earnings per share in pesewas as a number.",
    "dividends_per_share": "Dividends per share declared in pesewas as a number.",
    "report_year": "The financial year this report covers as an integer, e.g. 2024.",
    "currency_unit": "The unit used, e.g. GHS thousands or GHS millions.",
}

GEMINI_FIELD_GROUPS = [
    ["revenue", "operating_profit", "profit_before_tax", "profit_after_tax", "report_year"],
    [
        "total_assets",
        "total_liabilities",
        "shareholders_equity",
        "basic_eps",
        "dividends_per_share",
        "currency_unit",
    ],
]


FIELDNAMES = [
    "ticker",
    "company_name",
    "sector",
    "report_year",
    "revenue",
    "operating_profit",
    "profit_before_tax",
    "profit_after_tax",
    "total_assets",
    "total_liabilities",
    "shareholders_equity",
    "basic_eps",
    "dividends_per_share",
    "currency_unit",
    "pdf_url",
    "extracted_at",
    "error",
]


def get_gemini_api_key() -> str | None:
    """Read Gemini credentials from the environment, with a forgiving .env fallback."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key:
        return api_key

    env_path = PROJECT_ROOT / "backend" / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        stripped = line.strip()
        if not stripped.startswith(("GEMINI_API_KEY", "GOOGLE_API_KEY")) or "=" not in stripped:
            continue
        value = stripped.split("=", 1)[1].strip()
        if " #" in value:
            value = value.split(" #", 1)[0].strip()
        value = value.strip("'\"")
        if value and value.lower() not in {"none", "null"}:
            os.environ["GEMINI_API_KEY"] = value
            return value
    return None


def normalise_gse_url(href: str, base_url: str = GSE_BASE_URL) -> str:
    """Convert GSE relative, protocol-relative, and bare-host URLs to absolute URLs."""
    href = (href or "").strip()
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("http"):
        return href
    if href.startswith("gse.com.gh") or href.startswith("www.gse.com.gh"):
        return "https://" + href
    return urljoin(base_url, href)


def pdf_url_variants(url: str) -> list:
    """Return likely downloadable PDF URLs, including readfile?file= targets."""
    variants = [url]
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    for value in query.get("file", []):
        if value:
            variants.insert(0, normalise_gse_url(value))
    seen = set()
    ordered = []
    for variant in variants:
        if variant not in seen:
            seen.add(variant)
            ordered.append(variant)
    return ordered


def extract_pdf_links_from_html(html: str, page_url: str) -> list:
    """Find financial-statement PDF links on a GSE HTML page."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    pdf_links = []
    seen = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        link_text = anchor.get_text(" ", strip=True)
        combined = f"{href} {link_text}".lower()

        if ".pdf" not in href.lower() and "readfile?file=" not in href.lower():
            continue
        if not any(keyword in combined for keyword in FINANCIAL_KEYWORDS):
            continue

        full_url = normalise_gse_url(href, page_url)
        for variant in pdf_url_variants(full_url):
            if variant in seen:
                continue
            seen.add(variant)
            pdf_links.append({"url": variant, "label": link_text or variant.rsplit("/", 1)[-1]})

    return pdf_links


def current_company_page_candidates(company: dict) -> list:
    ticker_slug = company["ticker"].lower()
    return [
        company["gse_page_url"],
        f"https://gse.com.gh/listed-company/{ticker_slug}/",
        f"https://www.gse.com.gh/listed-company/{ticker_slug}/",
    ]


def search_gse_financial_posts(company: dict, session) -> list:
    """Search current GSE WordPress posts for a company's financial statements."""
    post_urls = []
    seen_posts = set()
    queries = [
        f'{company["ticker"]} financial statements',
        f'{company["ticker"]} annual report',
        f'{company["name"]} financial statements',
    ]

    for query in queries:
        try:
            resp = session.get(
                "https://gse.com.gh/wp-json/wp/v2/search",
                params={"search": query, "per_page": 10},
                timeout=20,
            )
            if not resp.ok:
                continue
            for item in resp.json():
                url = item.get("url")
                title = (item.get("title") or "").lower()
                haystack = f"{url or ''} {title}".lower()
                if not url or not any(keyword in haystack for keyword in FINANCIAL_KEYWORDS):
                    continue
                if url in seen_posts:
                    continue
                seen_posts.add(url)
                post_urls.append(url)
        except Exception as exc:
            print(f'  Search failed for {company["ticker"]}: {exc}')

    pdf_links = []
    seen_pdf = set()
    for post_url in post_urls[:8]:
        try:
            resp = session.get(post_url, timeout=20)
            if not resp.ok:
                continue
            for link in extract_pdf_links_from_html(resp.text, post_url):
                if link["url"] in seen_pdf:
                    continue
                seen_pdf.add(link["url"])
                pdf_links.append(link)
        except Exception as exc:
            print(f'  Failed to inspect GSE post for {company["ticker"]}: {exc}')

    return pdf_links


def get_company_announcements(company: dict) -> list:
    """Find financial-statement PDF links on current and legacy GSE pages."""
    headers = {"User-Agent": USER_AGENT}
    try:
        import requests

        try:
            from bs4 import BeautifulSoup
        except ImportError as exc:
            raise RuntimeError("beautifulsoup4 is required for GSE page parsing. Install with: pip install beautifulsoup4") from exc

        session = requests.Session()
        session.headers.update(headers)
        pdf_links = []
        seen = set()

        for page_url in current_company_page_candidates(company):
            try:
                resp = session.get(page_url, timeout=15)
                if not resp.ok:
                    continue
                for link in extract_pdf_links_from_html(resp.text, page_url):
                    if link["url"] in seen:
                        continue
                    seen.add(link["url"])
                    pdf_links.append(link)
            except Exception as exc:
                print(f'  Failed to inspect {page_url} for {company["ticker"]}: {exc}')

        if not pdf_links:
            for link in search_gse_financial_posts(company, session):
                if link["url"] in seen:
                    continue
                seen.add(link["url"])
                pdf_links.append(link)

        return pdf_links[:3]
    except Exception as exc:
        print(f'  FAILED to fetch page for {company["ticker"]}: {exc}')
        return []


def extract_text_from_pdf(content: bytes) -> str:
    try:
        import fitz
    except ImportError as exc:
        raise RuntimeError("PyMuPDF is required for PDF extraction. Install with: pip install PyMuPDF") from exc

    doc = fitz.open(stream=content, filetype="pdf")
    try:
        return "".join(page.get_text() for page in doc)[:6000]
    finally:
        doc.close()


def extract_json_object(raw: str) -> dict:
    text = raw.strip()
    preview = text.replace("\n", " ")[:240]
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise ValueError(f"Gemini did not return JSON: {preview}") from exc
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as nested_exc:
            raise ValueError(f"Gemini returned invalid JSON: {preview}") from nested_exc


def parse_partial_fields(raw: str, field_names: list[str]) -> dict:
    parsed = {}
    for field_name in field_names:
        pattern = rf'"?{re.escape(field_name)}"?\s*:\s*("([^"\\]|\\.)*"|-?\d+(?:\.\d+)?|null)(?=\s*[,}}])'
        match = re.search(pattern, raw, flags=re.IGNORECASE)
        if not match:
            continue
        token = match.group(1)
        if token == "null":
            parsed[field_name] = None
        elif token.startswith('"'):
            parsed[field_name] = json.loads(token)
        elif "." in token:
            parsed[field_name] = float(token)
        else:
            parsed[field_name] = int(token)
    return parsed


def parse_response_for_fields(raw: str, field_names: list[str]) -> dict:
    try:
        return extract_json_object(raw)
    except Exception:
        partial = parse_partial_fields(raw, field_names)
        if partial:
            return partial
        raise


def parse_single_field_fallback(raw: str, field_name: str) -> dict:
    text = raw.strip().replace(",", "")
    if field_name == "currency_unit":
        if '"currency_unit"' in raw and re.search(r'"\s*G(?:H|$)', raw):
            return {field_name: "GHS thousands"}
        unit_match = re.search(r"GHS\s+(?:thousands|millions|cedis)|Ghana Cedis(?:\s+\w+)?", raw, flags=re.IGNORECASE)
        return {field_name: unit_match.group(0) if unit_match else raw.strip()[:80] or None}
    if field_name == "report_year":
        year_match = re.search(r"\b(?:19|20)\d{2}\b", text)
        return {field_name: int(year_match.group(0)) if year_match else None}

    number_match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not number_match:
        return {field_name: None}
    value = number_match.group(0)
    return {field_name: float(value) if "." in value else int(value)}


def post_gemini_payload(payload: dict, api_key: str, timeout: int = 90) -> dict:
    import requests

    last_error = None
    for attempt in range(1, 4):
        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key,
                },
                json=payload,
                timeout=timeout,
            )
            response.raise_for_status()
            return response.json()
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                print(f"  Gemini retry {attempt}/3 after: {exc}")
                time.sleep(2 * attempt)
    raise last_error


def gemini_text(payload: dict) -> str:
    parts = payload["candidates"][0]["content"]["parts"]
    return "".join(part.get("text", "") for part in parts)


def schema_for_fields(field_names: list[str]) -> dict:
    properties = FINANCIAL_RESPONSE_SCHEMA["properties"]
    return {
        "type": "OBJECT",
        "properties": {field_name: properties[field_name] for field_name in field_names},
    }


def prompt_for_fields(document_text: str, field_names: list[str]) -> str:
    key_lines = "\n".join(f"{field_name}: {FIELD_DESCRIPTIONS[field_name]}" for field_name in field_names)
    return f"""You are a financial data extractor for GhanaDataHub.
Extract ONLY these fields from this Ghana Stock Exchange financial statement.
Return a minified JSON object with exactly these keys and no extra text.
If a value is not found, use null.
All monetary values should be in Ghana Cedis (GHS) thousands unless the document specifies otherwise.

Keys:
{key_lines}

Document text:
{document_text}
"""


def extract_fields_with_gemini(api_key: str, field_groups: list[list[str]], parts_for_group, timeout: int) -> dict:
    data = {}
    for field_group in field_groups:
        payload = post_gemini_payload(
            {
                "contents": [{"parts": parts_for_group(field_group)}],
                "generationConfig": {
                    "maxOutputTokens": 800,
                    "temperature": 0,
                },
            },
            api_key,
            timeout=timeout,
        )
        raw = gemini_text(payload)
        parsed = parse_response_for_fields(raw, field_group)

        missing_fields = [field_name for field_name in field_group if field_name not in parsed]
        for field_name in missing_fields:
            single_payload = post_gemini_payload(
                {
                    "contents": [{"parts": parts_for_group([field_name])}],
                    "generationConfig": {
                        "maxOutputTokens": 200,
                        "temperature": 0,
                    },
                },
                api_key,
                timeout=timeout,
            )
            single_raw = gemini_text(single_payload)
            try:
                parsed.update(parse_response_for_fields(single_raw, [field_name]))
            except Exception:
                parsed.update(parse_single_field_fallback(single_raw, field_name))

        data.update(parsed)
    return data


def ask_gemini_for_financials(text: str) -> dict:
    api_key = get_gemini_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    return extract_fields_with_gemini(
        api_key,
        GEMINI_FIELD_GROUPS,
        lambda field_group: [{"text": prompt_for_fields(text, field_group)}],
        timeout=45,
    )


def ask_gemini_for_financials_from_pdf(content: bytes) -> dict:
    api_key = get_gemini_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    encoded_pdf = base64.b64encode(content).decode("ascii")
    return extract_fields_with_gemini(
        api_key,
        GEMINI_FIELD_GROUPS,
        lambda field_group: [
            {
                "text": prompt_for_fields(
                    "The financial statement PDF is attached. Extract the requested fields directly from the document.",
                    field_group,
                )
            },
            {
                "inlineData": {
                    "mimeType": "application/pdf",
                    "data": encoded_pdf,
                }
            },
        ],
        timeout=90,
    )


def download_pdf(pdf_url: str) -> bytes:
    import requests

    last_error = None
    for attempt in range(1, 4):
        try:
            response = requests.get(
                pdf_url,
                headers={"User-Agent": USER_AGENT},
                timeout=(15, 90),
            )
            response.raise_for_status()
            return response.content
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                print(f"  PDF download retry {attempt}/3 after: {exc}")
                time.sleep(3 * attempt)
    raise last_error


def extract_financials_from_pdf(pdf_url: str, ticker: str) -> dict:
    try:
        content = download_pdf(pdf_url)
        text = extract_text_from_pdf(content)
        data = (
            ask_gemini_for_financials(text)
            if text.strip()
            else ask_gemini_for_financials_from_pdf(content)
        )
        data["ticker"] = ticker
        data["pdf_url"] = pdf_url
        data["extracted_at"] = date.today().isoformat()
        return data
    except Exception as exc:
        return {"ticker": ticker, "error": str(exc), "pdf_url": pdf_url}


def run_gse_scraper(tickers=None):
    companies = GSE_COMPANIES
    if tickers:
        selected = {ticker.upper() for ticker in tickers}
        companies = [company for company in companies if company["ticker"].upper() in selected]

    all_results = []
    for company in companies:
        print(f'Processing {company["ticker"]} - {company["name"]}...')
        pdfs = get_company_announcements(company)
        if not pdfs:
            print(f'  No PDF found for {company["ticker"]}')
            all_results.append(
                {
                    "ticker": company["ticker"],
                    "company_name": company["name"],
                    "sector": company["sector"],
                    "error": "No PDF found",
                }
            )
            time.sleep(1)
            continue

        pdf = pdfs[0]
        print(f'  Extracting from: {pdf["url"]}')
        data = extract_financials_from_pdf(pdf["url"], company["ticker"])
        data["company_name"] = company["name"]
        data["sector"] = company["sector"]
        all_results.append(data)
        print(f"  Done: {data}")
        time.sleep(2)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    date_str = date.today().isoformat()
    filename = OUTPUT_DIR / f"gse_financials_{date_str}.csv"

    if all_results:
        with open(filename, "w", newline="", encoding="utf-8") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(all_results)
        print(f"Saved: {filename} ({len(all_results)} companies)")
    return str(filename)


if __name__ == "__main__":
    tickers = sys.argv[1:] if len(sys.argv) > 1 else None
    run_gse_scraper(tickers)
