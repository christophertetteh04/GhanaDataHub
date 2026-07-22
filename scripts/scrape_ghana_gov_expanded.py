#!/usr/bin/env python3
"""Expanded GhanaDataHub source monitor and uploader.

Usage:
  python3 scripts/scrape_ghana_gov_expanded.py
  python3 scripts/scrape_ghana_gov_expanded.py --sources godi_ckan bog_statistical
  python3 scripts/scrape_ghana_gov_expanded.py --dry-run
"""

from __future__ import annotations

import argparse
import io
import os
import tempfile
import time
import warnings
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin, urlparse

import requests
from urllib3.exceptions import InsecureRequestWarning


USER_AGENT = "GhanaDataHub/1.0 (data research contact@ghanadatahub.com)"
DEFAULT_API_BASE = os.getenv("GHANADATAHUB_API_BASE") or os.getenv("GDH_API_BASE") or "http://localhost:8000"
MAX_PACKAGES_PER_RUN = 50
warnings.filterwarnings("ignore", category=InsecureRequestWarning)


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.anchors: list[dict] = []
        self._current: dict | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            attr_map = dict(attrs)
            href = attr_map.get("href")
            if href:
                self._current = {"href": href, "text": ""}

    def handle_data(self, data: str) -> None:
        if self._current is not None:
            self._current["text"] += data

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._current is not None:
            self._current["text"] = self._current["text"].strip()
            self.anchors.append(self._current)
            self._current = None


def extract_links(html: str) -> list[dict]:
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")
        return [{"href": a["href"], "text": a.get_text(strip=True)} for a in soup.find_all("a", href=True)]
    except ImportError:
        parser = AnchorParser()
        parser.feed(html)
        return parser.anchors


def normalise_api_base(api_base: str) -> str:
    return api_base.rstrip("/")


def load_local_env() -> None:
    """Load simple KEY=value pairs from scripts/.env and backend/.env if present."""
    for env_path in (Path(__file__).resolve().parent / ".env", Path(__file__).resolve().parent.parent / "backend" / ".env"):
        if not env_path.exists():
            continue
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            if "GDH_EMAIL=" in line and not line.startswith("GDH_EMAIL="):
                os.environ.setdefault("GDH_EMAIL", line.split("GDH_EMAIL=", 1)[1].strip())
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


load_local_env()


def absolute_url(base_url: str, href: str) -> str:
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return urljoin(base_url, href)


def safe_filename(title: str, fallback_ext: str = ".csv") -> str:
    stem = "".join(ch if ch.isalnum() else "_" for ch in title.lower()).strip("_")
    stem = "_".join(part for part in stem.split("_") if part)[:80] or "dataset"
    if "." not in Path(stem).name:
        return f"{stem}{fallback_ext}"
    return stem


def content_type_for_url(url: str) -> str:
    path = urlparse(url).path.lower()
    if path.endswith(".csv"):
        return "text/csv"
    if path.endswith(".xlsx"):
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    if path.endswith(".xls"):
        return "application/vnd.ms-excel"
    if path.endswith(".json"):
        return "application/json"
    if path.endswith(".pdf"):
        return "application/pdf"
    return "application/octet-stream"


def scrape_ckan_api(source_config: dict, session: requests.Session, existing_titles: set[str]) -> list[dict]:
    """Scrape any CKAN-powered open data portal (GODI, HDX)."""
    api_url = source_config["api_url"]
    resp = session.get(f"{api_url}package_list", timeout=30, verify=False)
    resp.raise_for_status()
    packages = resp.json()["result"]
    new_datasets = []

    for pkg_name in packages[:MAX_PACKAGES_PER_RUN]:
        pkg_resp = session.get(f"{api_url}package_show?id={pkg_name}", timeout=15, verify=False)
        if not pkg_resp.ok:
            continue
        pkg = pkg_resp.json().get("result", {})
        if not isinstance(pkg, dict):
            continue

        if "country_filter" in source_config:
            country = source_config["country_filter"]
            pkg_groups = [
                g.get("name", "") if isinstance(g, dict) else str(g)
                for g in pkg.get("groups", [])
            ]
            if country.lower() not in " ".join(pkg_groups).lower():
                continue

        for resource in pkg.get("resources", []):
            if not isinstance(resource, dict):
                continue
            fmt = (resource.get("format") or "").upper()
            if fmt in ("CSV", "XLSX", "XLS", "JSON"):
                title = f"{source_config['name']}: {pkg.get('title') or pkg_name}"
                if title.lower().strip() in existing_titles:
                    continue
                new_datasets.append(
                    {
                        "title": title,
                        "url": resource["url"],
                        "description": pkg.get("notes", ""),
                        "attribution": source_config["attribution"],
                        "source_url": source_config["url"],
                        "licence": source_config["licence"],
                        "category": source_config["category"],
                    }
                )
                break
    return new_datasets


def scrape_pdf_link_monitor(source_config: dict, session: requests.Session, existing_titles: set[str]) -> list[dict]:
    """Monitor a publications page for new PDF or Excel links."""
    resp = session.get(source_config["publications_url"], timeout=30, verify=False)
    if not resp.ok:
        return []

    links = extract_links(resp.text)
    keywords = source_config.get("keywords", [])
    new_datasets = []

    for link in links:
        href = link["href"]
        link_text = link.get("text", "").lower()
        ext = href.lower().split("?")[0].split(".")[-1]
        if ext not in ("pdf", "xlsx", "xls", "csv"):
            continue
        if keywords and not any(kw in link_text or kw in href.lower() for kw in keywords):
            continue

        href = absolute_url(source_config["publications_url"], href)
        title = f"{source_config['name']}: {link.get('text') or href.split('/')[-1]}"[:200]
        if title.lower().strip() in existing_titles:
            continue

        new_datasets.append(
            {
                "title": title,
                "url": href,
                "description": f"Published by {source_config['name']}. Original source: {href}",
                "attribution": source_config["attribution"],
                "source_url": source_config["url"],
                "licence": source_config["licence"],
                "category": source_config["category"],
            }
        )
    return new_datasets


def scrape_bog_excel(source_config: dict, session: requests.Session, existing_titles: set[str]) -> list[dict]:
    """Monitor BOG publications page for new Excel files."""
    resp = session.get(source_config["publications_url"], timeout=30, verify=False)
    if not resp.ok:
        return []

    links = extract_links(resp.text)
    new_datasets = []

    for link in links:
        href = link["href"]
        if not href.lower().split("?")[0].endswith((".xlsx", ".xls")):
            continue
        href = absolute_url(source_config["publications_url"], href)
        label = link.get("text") or href.split("/")[-1]
        title = f"Bank of Ghana Statistical Data: {label}"[:200]
        if title.lower().strip() in existing_titles:
            continue
        new_datasets.append(
            {
                "title": title,
                "url": href,
                "description": "Bank of Ghana macroeconomic and financial data.",
                "attribution": source_config["attribution"],
                "source_url": source_config["url"],
                "licence": source_config["licence"],
                "category": source_config["category"],
            }
        )
    return new_datasets


def scrape_worldbank_api(source_config: dict, session: requests.Session, existing_titles: set[str]) -> list[dict]:
    """Create one downloadable World Bank API CSV URL per configured Ghana indicator."""
    new_datasets = []
    for indicator in source_config.get("indicators", []):
        title = f"{source_config['name']}: {indicator}"
        if title.lower().strip() in existing_titles:
            continue
        url = (
            f"{source_config['api_url']}country/{source_config['country_code']}/indicator/"
            f"{indicator}?downloadformat=csv"
        )
        new_datasets.append(
            {
                "title": title,
                "url": url,
                "description": f"World Bank indicator {indicator} for Ghana.",
                "attribution": source_config["attribution"],
                "source_url": source_config["url"],
                "licence": source_config["licence"],
                "category": source_config["category"],
            }
        )
    return new_datasets


def scrape_not_implemented(source_config: dict, session: requests.Session, existing_titles: set[str]) -> list[dict]:
    """Placeholder for specialized APIs that need endpoint-specific query design."""
    print(f"  Method {source_config['scrape_method']} registered; endpoint-specific scraper pending")
    return []


SOURCE_REGISTRY: dict[str, dict] = {
    # TIER 1: OPEN DATA APIS
    "godi_ckan": {
        "name": "Ghana Open Data Initiative",
        "url": "https://data.gov.gh",
        "api_url": "https://data.gov.gh/api/3/action/",
        "licence": "Open Data Commons Attribution Licence (ODC-By 1.0)",
        "licence_url": "https://opendatacommons.org/licenses/by/1.0/",
        "attribution": "Ghana Open Data Initiative (GODI), Government of Ghana. data.gov.gh",
        "category": "Multiple",
        "update_frequency": "irregular",
        "scrape_method": "ckan_api",
        "scrape_function": scrape_ckan_api,
    },
    "gss_statsbank": {
        "name": "Ghana Statistical Service - StatsBank",
        "url": "https://statsbank.statsghana.gov.gh",
        "publications_url": "https://statsghana.gov.gh/statistical-publications",
        "licence": "Open Government Licence - Ghana",
        "attribution": "Ghana Statistical Service (GSS). statsghana.gov.gh",
        "category": "Demographics",
        "update_frequency": "monthly",
        "scrape_method": "publications_monitor",
        "scrape_function": scrape_pdf_link_monitor,
    },
    "bog_statistical": {
        "name": "Bank of Ghana - Statistical Bulletin",
        "url": "https://www.bog.gov.gh",
        "publications_url": "https://www.bog.gov.gh/monetary-policy/summary-of-economic-and-financial-data/",
        "licence": "Open for public use under BOG Act 2002 Section 55",
        "attribution": "Bank of Ghana (BOG). bog.gov.gh. Statistical Bulletin.",
        "category": "Economy and Finance",
        "update_frequency": "monthly",
        "scrape_method": "excel_link_monitor",
        "scrape_function": scrape_bog_excel,
    },
    "hdx_ghana_health": {
        "name": "Humanitarian Data Exchange - Ghana Health",
        "url": "https://data.humdata.org",
        "api_url": "https://data.humdata.org/api/3/action/",
        "licence": "Creative Commons Attribution for Intergovernmental Organisations",
        "attribution": "WHO / Ghana Health Service via HDX. data.humdata.org",
        "category": "Health",
        "update_frequency": "varies",
        "scrape_method": "ckan_api",
        "org_filter": "who",
        "country_filter": "GHA",
        "scrape_function": scrape_ckan_api,
    },
    # TIER 2: PDF/EXCEL PUBLICATION MONITORS
    "ec_voter": {
        "name": "Electoral Commission of Ghana",
        "url": "https://www.ec.gov.gh",
        "publications_url": "https://www.ec.gov.gh/publications.html",
        "licence": "Public domain - EC publications are public records",
        "attribution": "Electoral Commission of Ghana (EC). ec.gov.gh",
        "category": "Governance and Electoral",
        "update_frequency": "after_registration_periods",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["voter", "registration", "election", "results", "constituency"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "energy_commission": {
        "name": "Ghana Energy Commission",
        "url": "https://www.energycom.gov.gh",
        "publications_url": "https://www.energycom.gov.gh/energy-statistics",
        "licence": "Open for public use",
        "attribution": "Ghana Energy Commission. energycom.gov.gh. National Energy Statistics.",
        "category": "Energy and Infrastructure",
        "update_frequency": "annual",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["energy", "statistics", "balance", "electricity", "renewable"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "gra_revenue": {
        "name": "Ghana Revenue Authority",
        "url": "https://www.gra.gov.gh",
        "publications_url": "https://www.gra.gov.gh/resources/publications/",
        "licence": "Public domain",
        "attribution": "Ghana Revenue Authority (GRA). gra.gov.gh. Revenue Statistics.",
        "category": "Economy and Finance",
        "update_frequency": "quarterly",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["revenue", "tax", "domestic", "quarterly", "annual"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "mofep_budget": {
        "name": "Ministry of Finance - Budget Documents",
        "url": "https://www.mofep.gov.gh",
        "publications_url": "https://www.mofep.gov.gh/publications/",
        "licence": "Public domain - government publications",
        "attribution": "Ministry of Finance and Economic Planning (MoFEP). mofep.gov.gh.",
        "category": "Economy and Finance",
        "update_frequency": "annual_budget_quarterly_bulletin",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["budget", "fiscal", "policy", "midyear", "quarterly", "debt"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "cocobod": {
        "name": "Ghana Cocoa Board (COCOBOD)",
        "url": "https://www.cocobod.gh",
        "publications_url": "https://www.cocobod.gh/resources/publications",
        "licence": "Public domain",
        "attribution": "Ghana Cocoa Board (COCOBOD). cocobod.gh.",
        "category": "Agriculture and Food",
        "update_frequency": "seasonal",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["cocoa", "purchase", "production", "export", "price"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "ppa_procurement": {
        "name": "Public Procurement Authority",
        "url": "https://www.ppaghana.org",
        "publications_url": "https://www.ppaghana.org/index.php/resources/publications",
        "licence": "Public domain",
        "attribution": "Public Procurement Authority (PPA) Ghana. ppaghana.org.",
        "category": "Governance and Electoral",
        "update_frequency": "annual",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["procurement", "contract", "award", "annual", "statistics"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "ghanaports": {
        "name": "Ghana Ports and Harbours Authority",
        "url": "https://www.ghanaports.com.gh",
        "publications_url": "https://www.ghanaports.com.gh/about/statistics",
        "licence": "Public domain",
        "attribution": "Ghana Ports and Harbours Authority (GPHA). ghanaports.com.gh.",
        "category": "Trade and Commerce",
        "update_frequency": "monthly",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["port", "throughput", "trade", "container", "cargo", "vessels"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "nic_insurance": {
        "name": "National Insurance Commission",
        "url": "https://www.nicgh.org",
        "publications_url": "https://www.nicgh.org/publications",
        "licence": "Public domain",
        "attribution": "National Insurance Commission (NIC) Ghana. nicgh.org.",
        "category": "Economy and Finance",
        "update_frequency": "annual",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["insurance", "sector", "statistics", "premium", "market"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    "ghana_health_service": {
        "name": "Ghana Health Service",
        "url": "https://ghs.gov.gh",
        "publications_url": "https://ghs.gov.gh/resources-hub",
        "licence": "Public domain - government health publications",
        "attribution": "Ghana Health Service (GHS). ghs.gov.gh.",
        "category": "Health",
        "update_frequency": "irregular",
        "scrape_method": "pdf_link_monitor",
        "keywords": ["health", "disease", "surveillance", "report", "guidelines", "statistics"],
        "scrape_function": scrape_pdf_link_monitor,
    },
    # TIER 3: INTERNATIONAL SOURCES
    "who_ghana": {
        "name": "World Health Organisation - Ghana",
        "url": "https://www.who.int/countries/gha",
        "data_url": "https://ghoapi.azureedge.net/api/",
        "licence": "CC BY-NC-SA 3.0 IGO",
        "attribution": "World Health Organisation (WHO). who.int/countries/gha.",
        "category": "Health",
        "update_frequency": "varies",
        "scrape_method": "who_api",
        "country_code": "GHA",
        "scrape_function": scrape_not_implemented,
    },
    "faostat_ghana": {
        "name": "FAOSTAT - Ghana Agricultural Data",
        "url": "https://www.fao.org/faostat",
        "api_url": "https://fenixservices.fao.org/faostat/api/v1/",
        "licence": "CC BY-NC-SA 3.0 IGO",
        "attribution": "Food and Agriculture Organisation (FAO). FAOSTAT. fao.org/faostat.",
        "category": "Agriculture and Food",
        "update_frequency": "annual",
        "scrape_method": "faostat_api",
        "country_code": "49",
        "scrape_function": scrape_not_implemented,
    },
    "comtrade_ghana": {
        "name": "UN Comtrade - Ghana Trade Data",
        "url": "https://comtrade.un.org",
        "api_url": "https://comtradeapi.un.org/data/v1/",
        "licence": "CC BY 4.0",
        "attribution": "UN Comtrade Database. comtrade.un.org.",
        "category": "Trade and Commerce",
        "update_frequency": "annual",
        "scrape_method": "comtrade_api",
        "country_code": "288",
        "scrape_function": scrape_not_implemented,
    },
    "world_bank_ghana": {
        "name": "World Bank Open Data - Ghana",
        "url": "https://data.worldbank.org/country/ghana",
        "api_url": "https://api.worldbank.org/v2/",
        "licence": "CC BY 4.0",
        "attribution": "World Bank Open Data. data.worldbank.org.",
        "category": "Multiple",
        "update_frequency": "annual",
        "scrape_method": "worldbank_api",
        "country_code": "GH",
        "indicators": [
            "NY.GDP.MKTP.CD", "NY.GDP.MKTP.KD.ZG", "FP.CPI.TOTL.ZG",
            "SP.POP.TOTL", "SL.UEM.TOTL.ZS", "SE.ADT.LITR.ZS",
            "SP.DYN.IMRT.IN", "SH.STA.MMRT", "SH.MED.BEDS.ZS",
            "EG.ELC.ACCS.ZS", "AG.PRD.CROP.XD", "TM.VAL.MRCH.CD.WT",
            "TX.VAL.MRCH.CD.WT", "GC.REV.TOTL.GD.ZS", "GC.DOD.TOTL.GD.ZS",
            "IT.NET.USER.ZS", "SH.XPD.CHEX.GD.ZS", "SE.XPD.TOTL.GD.ZS",
            "EN.ATM.CO2E.PC", "SP.URB.TOTL.IN.ZS",
        ],
        "scrape_function": scrape_worldbank_api,
    },
    "unicef_ghana": {
        "name": "UNICEF - Ghana Child Data",
        "url": "https://data.unicef.org",
        "api_url": "https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/",
        "licence": "CC BY 4.0",
        "attribution": "UNICEF Data. data.unicef.org.",
        "category": "Health",
        "update_frequency": "annual",
        "scrape_method": "unicef_api",
        "country_code": "GHA",
        "scrape_function": scrape_not_implemented,
    },
}


def get_existing_titles(api_base: str, token: str | None) -> set[str]:
    if not token:
        return set()
    try:
        resp = requests.get(
            f"{normalise_api_base(api_base)}/api/v1/datasets/?per_page=100",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30,
        )
        resp.raise_for_status()
        existing = resp.json()
        return {d["title"].lower().strip() for d in existing.get("items", [])}
    except Exception as exc:
        print(f"WARNING: Could not fetch existing titles: {exc}")
        return set()


def get_token(api_base: str, token: str | None = None, email: str | None = None, password: str | None = None) -> str | None:
    """Use an explicit token, env token, or login credentials to get an upload token."""
    token = token or os.getenv("GHANADATAHUB_TOKEN") or os.getenv("GDH_TOKEN")
    if token:
        return token

    email = email or os.getenv("GHANADATAHUB_EMAIL") or os.getenv("GDH_EMAIL")
    password = password or os.getenv("GHANADATAHUB_PASSWORD") or os.getenv("GDH_PASSWORD")
    if not email or not password:
        return None

    try:
        resp = requests.post(
            f"{normalise_api_base(api_base)}/api/v1/auth/login",
            json={"email": email, "password": password},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as exc:
        print(f"WARNING: Automatic login failed: {exc}")
        return None


def upload_dataset(dataset: dict, api_base: str, token: str, session: requests.Session | None = None) -> bool:
    """Download a remote file and upload it to GhanaDataHub."""
    session = session or requests.Session()
    session.headers.setdefault("User-Agent", USER_AGENT)
    remote_url = dataset["url"]
    print(f"    Uploading {dataset['title']}")

    try:
        remote_resp = session.get(remote_url, timeout=60, verify=False)
        remote_resp.raise_for_status()
    except Exception as exc:
        print(f"    FAILED download: {exc}")
        return False

    content = remote_resp.content
    content_type = remote_resp.headers.get("Content-Type") or content_type_for_url(remote_url)
    ext = Path(urlparse(remote_url).path).suffix or ".dat"
    filename = safe_filename(dataset["title"], ext)

    if "zip" in content_type.lower() or zipfile.is_zipfile(io.BytesIO(content)):
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            csv_name = next((name for name in zf.namelist() if name.lower().endswith(".csv")), None)
            if not csv_name:
                print("    FAILED download: ZIP did not contain a CSV file")
                return False
            content = zf.read(csv_name)
            content_type = "text/csv"
            filename = safe_filename(dataset["title"], ".csv")

    allowed_content_types = (
        "text/csv",
        "application/csv",
        "application/json",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    if not any(allowed in content_type.lower() for allowed in allowed_content_types):
        print(f"    SKIP unsupported download type: {content_type}")
        return False

    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        with tmp_path.open("rb") as fh:
            files = {"file": (filename, fh, content_type)}
            data = {
                "title": dataset["title"],
                "description": (
                    f"{dataset.get('description', '')}\n\n"
                    f"Attribution: {dataset['attribution']}\n"
                    f"Source: {dataset['source_url']}"
                ).strip(),
                "visibility": "public",
                "license": dataset["licence"],
                "tags": f"ghana,government,{dataset['category'].lower().replace(' ', '-')}",
            }
            resp = requests.post(
                f"{normalise_api_base(api_base)}/api/v1/datasets/",
                headers={"Authorization": f"Bearer {token}"},
                data=data,
                files=files,
                timeout=120,
            )
        if resp.status_code == 201:
            print("    SUCCESS")
            return True
        print(f"    FAILED upload: {resp.status_code} {resp.text[:300]}")
        return False
    finally:
        tmp_path.unlink(missing_ok=True)


def run_expanded_scrapers(
    api_base: str = DEFAULT_API_BASE,
    token: str | None = None,
    sources: list[str] | None = None,
    dry_run: bool = False,
    email: str | None = None,
    password: str | None = None,
) -> int:
    """Run configured scrapers and upload new datasets."""
    token = get_token(api_base, token=token, email=email, password=password)
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    existing_titles = get_existing_titles(api_base, token)
    sources_to_run = sources or list(SOURCE_REGISTRY.keys())
    total_new = 0

    for source_key in sources_to_run:
        config = SOURCE_REGISTRY.get(source_key)
        if not config:
            print(f"Skipping unknown source: {source_key}")
            continue

        print(f"Checking {config['name']}...")
        try:
            scrape_function: Callable = config["scrape_function"]
            new = scrape_function(config, session, existing_titles)
            print(f"  Found {len(new)} new datasets")
            if dry_run:
                for dataset in new[:10]:
                    print(f"    DRY RUN: {dataset['title']} -> {dataset['url']}")
                continue
            if not token:
                print("  No GHANADATAHUB_TOKEN provided; skipping uploads")
                continue
            for dataset in new:
                if upload_dataset(dataset, api_base, token, session=session):
                    existing_titles.add(dataset["title"].lower().strip())
                    total_new += 1
                time.sleep(1)
        except Exception as exc:
            print(f"  ERROR scraping {source_key}: {exc}")

    print(f"\nTotal new datasets uploaded: {total_new}")
    return total_new


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run expanded GhanaDataHub scrapers.")
    parser.add_argument("--api-base", default=os.getenv("GHANADATAHUB_API_BASE") or os.getenv("GDH_API_BASE") or DEFAULT_API_BASE)
    parser.add_argument("--token", default=os.getenv("GHANADATAHUB_TOKEN") or os.getenv("GDH_TOKEN"))
    parser.add_argument("--email", default=os.getenv("GHANADATAHUB_EMAIL") or os.getenv("GDH_EMAIL"))
    parser.add_argument("--password", default=os.getenv("GHANADATAHUB_PASSWORD") or os.getenv("GDH_PASSWORD"))
    parser.add_argument("--sources", nargs="*", help="Optional source keys to run")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--list-sources", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.list_sources:
        for key, source in SOURCE_REGISTRY.items():
            print(f"{key}: {source['name']} ({source['scrape_method']})")
        return 0
    run_expanded_scrapers(
        api_base=args.api_base,
        token=args.token,
        sources=args.sources,
        dry_run=args.dry_run,
        email=args.email,
        password=args.password,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
