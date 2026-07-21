#!/usr/bin/env python3
"""
parse_daily_briefing.py
-----------------------
Parses the Bora Capital Advisors daily Ghana financial briefing text into
structured CSV files and optionally uploads them to GhanaDataHub.

Usage:
  python3 scripts/parse_daily_briefing.py --file briefing.txt
  cat briefing.txt | python3 scripts/parse_daily_briefing.py --stdin
  python3 scripts/parse_daily_briefing.py --file briefing.txt --parse-only
  python3 scripts/parse_daily_briefing.py --file briefing.txt --api-base http://localhost:8000
"""

import argparse
import csv
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    requests = None  # Only needed if uploading

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPTS_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPTS_DIR / "output"

# ---------------------------------------------------------------------------
# Emoji / Unicode cleanup
# ---------------------------------------------------------------------------
_EMOJI_RE = re.compile(
    "["
    "\U00010000-\U0010ffff"  # supplementary multilingual plane (emoji)
    "\U0001F300-\U0001F9FF"  # misc symbols & pictographs
    "\u2600-\u26FF"          # misc symbols
    "\u2700-\u27BF"          # dingbats
    "\uFE00-\uFE0F"          # variation selectors
    "\u200D"                 # zero-width joiner
    "\u20E3"                 # combining enclosing keycap
    "]",
    flags=re.UNICODE,
)
_ARROW_RE = re.compile(r"[➡️🔼🔽↑↓→←▲▼]+")


def strip_emoji(text: str) -> str:
    """Remove emoji and directional arrows; keep ASCII + basic Latin."""
    text = _EMOJI_RE.sub("", text)
    text = _ARROW_RE.sub("", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    return text


# ---------------------------------------------------------------------------
# Date extraction
# ---------------------------------------------------------------------------
_DATE_MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}
_DATE_RE = re.compile(
    r"\b(january|february|march|april|may|june|july|august|september|"
    r"october|november|december)\s+(\d{1,2})[,\s]+(\d{4})\b",
    re.IGNORECASE,
)


def extract_date(text: str) -> str:
    m = _DATE_RE.search(text)
    if m:
        month = _DATE_MONTHS[m.group(1).lower()]
        day = int(m.group(2))
        year = int(m.group(3))
        return f"{year}-{month:02d}-{day:02d}"
    return datetime.now().strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Section splitter
# ---------------------------------------------------------------------------
def split_sections(raw: str) -> dict:
    SECTION_MARKERS = [
        ("FOREX",             "interbank_forex"),
        ("INTERBANK",         "interbank_forex"),
        ("GSE DAILY",         "gse_daily"),
        ("DAILY GAINER",      "gse_daily"),
        ("DAILY LOSER",       "gse_daily"),
        ("GSE YEAR",          "ytd_gse"),
        ("YEAR-TO-DATE",      "ytd_gse"),
        ("YTD",               "ytd_gse"),
        ("TOP GAINER",        "ytd_gse"),
        ("ECONOMIC INDICATOR","indicators"),
        ("TREASURY",          "treasury"),
        ("T-BILL",            "treasury"),
        ("PETROLEUM",         "petroleum"),
        ("FUEL PRICE",        "petroleum"),
        ("COMMODITY",         "commodities"),
        ("GLOBAL MARKET",     "commodities"),
        ("CRYPTOCURR",        "crypto"),
        ("DIGITAL ASSET",     "crypto"),
        ("BOG GOLD",          "gold_coins"),
        ("GOLD COIN",         "gold_coins"),
    ]

    sections = {}
    current_key = "preamble"
    current_lines = []

    for line in raw.splitlines():
        upper = line.strip().upper()
        matched = None
        for marker, key in SECTION_MARKERS:
            if marker in upper:
                matched = key
                break
        if matched:
            sections[current_key] = "\n".join(current_lines)
            current_key = matched
            current_lines = [line]
        else:
            current_lines.append(line)

    sections[current_key] = "\n".join(current_lines)
    return sections


# ---------------------------------------------------------------------------
# 1. INTERBANK FOREX RATES
# ---------------------------------------------------------------------------
_FOREX_RE = re.compile(
    r"([A-Z]{2,6}[/\$]*(?:GH[CS]?|GHS|USD|EUR|GBP)?)"
    r"\s+Buy\s+([\d.,]+)"
    r"\s+Sell\s+([\d.,]+)",
    re.IGNORECASE,
)


def parse_forex(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line)
        m = _FOREX_RE.search(clean)
        if m:
            pair = m.group(1).strip().replace(" ", "")
            try:
                buy = float(m.group(2).replace(",", ""))
                sell = float(m.group(3).replace(",", ""))
                rows.append({
                    "date": date,
                    "currency_pair": pair,
                    "buy_rate": buy,
                    "sell_rate": sell,
                    "source": "Bank of Ghana Interbank",
                })
            except ValueError:
                print(f"  [forex] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 2 & 3. GSE DAILY and YTD
# ---------------------------------------------------------------------------
_GSE_RE = re.compile(
    r"([A-Z]{2,10})"
    r"[\s\-]*"
    r"(?:Gh[Cc]?\s*)?([\d.,]+)"
    r"[\s]*([+-][\d.,]+%)",
    re.IGNORECASE,
)
_GSE_SKIP = {"GAINER", "LOSER", "STOCK", "COMPANY", "TICKER", "DAILY", "YEAR",
             "BUY", "SELL", "THE", "AND", "FOR", "TOP", "GSE"}


def parse_gse(section: str, date: str, ytd: bool = False) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line)
        if any(kw in clean.upper() for kw in _GSE_SKIP) and len(clean.strip()) < 30:
            continue
        m = _GSE_RE.search(clean)
        if m:
            ticker = m.group(1).strip()
            if len(ticker) < 2 or ticker.upper() in _GSE_SKIP:
                continue
            try:
                price = float(m.group(2).replace(",", ""))
                pct = float(m.group(3).replace(",", "").replace("%", ""))
                row = {"date": date, "ticker": ticker, "price_ghs": price}
                if ytd:
                    row["ytd_change_pct"] = pct
                else:
                    row["change_pct"] = pct
                    row["direction"] = "gain" if pct >= 0 else "loss"
                rows.append(row)
            except ValueError:
                print(f"  [gse] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 4. ECONOMIC INDICATORS
# ---------------------------------------------------------------------------
_INDIC_RE = re.compile(
    r"^(.+?)\s*(?:in Ghana)?\s*[:\-]*\s*([\d.,]+)\s*(%|USD|GHS|pts?|bps?)?",
    re.IGNORECASE,
)


def parse_indicators(section: str, date: str) -> list:
    rows = []
    SKIP = {"economic indicator", "indicator", "value", "unit", "date", "ghana"}
    for line in section.splitlines():
        clean = strip_emoji(line).strip()
        if not clean or clean.lower() in SKIP:
            continue
        m = _INDIC_RE.match(clean)
        if m:
            indicator = m.group(1).strip().rstrip(":-")
            if len(indicator) < 4 or indicator.upper() == indicator:
                continue
            raw_val = m.group(2).replace(",", "")
            unit = (m.group(3) or "%").strip()
            try:
                value = float(raw_val)
                rows.append({"date": date, "indicator": indicator, "value": value, "unit": unit})
            except ValueError:
                print(f"  [indicators] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 5. TREASURY RATES
# ---------------------------------------------------------------------------
_TREASURY_RE = re.compile(
    r"(\d+)\s*[-]?\s*[Dd]ay"
    r".*?[Dd]iscount\s+[Rr]ate?\s*([\d.,]+)%?"
    r".*?[Ii]nterest\s+[Rr]ate?\s*([\d.,]+)%?",
    re.IGNORECASE,
)


def parse_treasury(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line)
        m = _TREASURY_RE.search(clean)
        if m:
            try:
                tenor = int(m.group(1))
                discount = float(m.group(2).replace(",", ""))
                interest = float(m.group(3).replace(",", ""))
                rows.append({
                    "date": date,
                    "tenor_days": tenor,
                    "discount_rate_pct": discount,
                    "interest_rate_pct": interest,
                })
            except ValueError:
                print(f"  [treasury] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 6. PETROLEUM PRICES
# ---------------------------------------------------------------------------
_PETROL_RE = re.compile(
    r"^([A-Za-z\s/]+?)"
    r"\s*[-:]*\s*"
    r"(?:Gh[Cc]?\s*)?([\d.,]+)"
    r"(?:\s*/\s*(\w+))?"
    r"(?:.*?([+-][\d.,]+%?))?",
    re.IGNORECASE,
)
_PETROL_SKIP = {"petroleum", "fuel", "product", "price", "date", "item"}


def parse_petroleum(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line).strip()
        if not clean:
            continue
        low = clean.lower()
        if any(kw in low for kw in _PETROL_SKIP) and len(clean) < 20:
            continue
        m = _PETROL_RE.match(clean)
        if m and m.group(2):
            product = m.group(1).strip().strip("-:")
            if not product or len(product) < 3:
                continue
            try:
                price = float(m.group(2).replace(",", ""))
                unit = m.group(3) or "ltr"
                ytd_raw = m.group(4) or ""
                ytd_pct = float(ytd_raw.replace("%", "").replace(",", "")) if ytd_raw else None
                rows.append({
                    "date": date,
                    "product": product,
                    "price_ghs": price,
                    "unit": unit,
                    "ytd_change_pct": ytd_pct,
                })
            except ValueError:
                print(f"  [petroleum] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 7. COMMODITY PRICES
# ---------------------------------------------------------------------------
_COMMODITY_RE = re.compile(
    r"^([A-Za-z\s]+?)"
    r"\s*:\s*"
    r"([\d,. ]+)"
    r"\s+([A-Z]{3})"
    r"\s*/\s*(\w+)"
    r"(?:\s*\(\s*([+-][\d.,]+)"
    r"(?:\s*,\s*([+-][\d.,]+%))?)?",
    re.IGNORECASE,
)


def parse_commodities(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line).strip()
        m = _COMMODITY_RE.match(clean)
        if m:
            try:
                commodity = m.group(1).strip()
                price = float(m.group(2).replace(",", "").strip())
                currency = m.group(3).upper()
                unit = m.group(4)
                daily_change = float(m.group(5).replace(",", "")) if m.group(5) else None
                pct_raw = m.group(6) or ""
                daily_change_pct = float(pct_raw.replace("%", "").replace(",", "")) if pct_raw else None
                rows.append({
                    "date": date,
                    "commodity": commodity,
                    "price": price,
                    "currency": currency,
                    "unit": unit,
                    "daily_change": daily_change,
                    "daily_change_pct": daily_change_pct,
                })
            except ValueError:
                print(f"  [commodities] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 8. CRYPTOCURRENCY PRICES
# ---------------------------------------------------------------------------
_CRYPTO_RE = re.compile(
    r"^([A-Za-z\s]+?)"
    r"\s*:\s*"
    r"\$?\s*([\d,. ]+)"
    r"[\s]*([+-]?[\d.,]+%?)",
    re.IGNORECASE,
)
_CRYPTO_SKIP = {"CRYPTO", "CRYPTOCURRENCY", "NAME", "COIN", "TOKEN", "DIGITAL"}


def parse_crypto(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line).strip()
        m = _CRYPTO_RE.match(clean)
        if m:
            name = m.group(1).strip()
            if not name or len(name) < 3 or name.upper() in _CRYPTO_SKIP:
                continue
            try:
                price = float(m.group(2).replace(",", "").strip())
                pct = float(m.group(3).replace("%", "").replace(",", ""))
                rows.append({"date": date, "name": name, "price_usd": price, "change_24h_pct": pct})
            except ValueError:
                print(f"  [crypto] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# 9. BOG GOLD COIN PRICES
# ---------------------------------------------------------------------------
_GOLD_RE = re.compile(
    r"([\d.,]+)\s*oz"
    r".*?GH[Cc]?\s*([\d,. ]+)"
    r"[\s]*([+-][\d.,]+%?)?",
    re.IGNORECASE,
)


def parse_gold_coins(section: str, date: str) -> list:
    rows = []
    for line in section.splitlines():
        clean = strip_emoji(line).strip()
        m = _GOLD_RE.search(clean)
        if m:
            try:
                weight = float(m.group(1).replace(",", ""))
                price = float(m.group(2).replace(",", "").strip())
                pct_raw = m.group(3) or ""
                pct = float(pct_raw.replace("%", "").replace(",", "")) if pct_raw else None
                rows.append({"date": date, "weight_oz": weight, "price_ghs": price, "ytd_change_pct": pct})
            except ValueError:
                print(f"  [gold_coins] skipped: {line!r}")
    return rows


# ---------------------------------------------------------------------------
# CSV writer
# ---------------------------------------------------------------------------
def save_csv(rows: list, path: Path) -> bool:
    if not rows:
        return False
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    return True


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------
def authenticate(api_base: str, email: str, password: str) -> dict:
    resp = requests.post(
        f"{api_base}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    if resp.ok:
        token = resp.json().get("access_token")
        if not token:
            raise RuntimeError("Login succeeded but no access_token returned")
        return {"Authorization": f"Bearer {token}"}
    raise RuntimeError(f"Login failed: {resp.status_code} {resp.text[:200]}")


def fetch_existing_dataset_map(api_base: str, headers: dict) -> dict:
    """Returns {title_lower: dataset_id} for all existing datasets."""
    mapping = {}
    page = 1
    while page <= 5:
        resp = requests.get(
            f"{api_base}/api/v1/datasets/",
            params={"limit": 200, "page": page},
            headers=headers,
            timeout=30,
        )
        if not resp.ok:
            print(f"  Warning: could not fetch datasets (page {page}): {resp.status_code}")
            break
        data = resp.json()
        items = data.get("items", []) if isinstance(data, dict) else data
        if not items:
            break
        for d in items:
            if isinstance(d, dict) and "title" in d and "id" in d:
                mapping[d["title"].lower().strip()] = d["id"]
        if isinstance(data, dict) and len(items) < 200:
            break
        page += 1
    return mapping


def upload_or_update(
    api_base: str,
    headers: dict,
    csv_path: Path,
    title: str,
    existing_map: dict,
    dry_run: bool = False,
) -> str:
    DESCRIPTION = (
        "Daily Ghana financial market data parsed from the Bora Capital Advisors briefing. "
        "Includes interbank forex rates, GSE stock prices, economic indicators, "
        "treasury rates, petroleum prices, commodity prices, crypto, and BOG gold coin prices."
    )
    TAGS = "ghana,finance,daily,market-data"
    LICENSE_STR = "Data sourced from Bank of Ghana, GSE, Bloomberg, Reuters"

    title_lower = title.lower().strip()
    existing_id = existing_map.get(title_lower)

    if dry_run:
        action = "UPDATE" if existing_id else "CREATE"
        print(f"  DRY RUN: Would {action}: {title}")
        return "skipped"

    form_data = {
        "title": title,
        "description": DESCRIPTION,
        "visibility": "public",
        "tags": TAGS,
        "license": LICENSE_STR,
    }

    if existing_id:
        with open(csv_path, "rb") as f:
            resp = requests.put(
                f"{api_base}/api/v1/datasets/{existing_id}",
                headers=headers,
                data=form_data,
                files={"file": (csv_path.name, f, "text/csv")},
                timeout=60,
            )
        return "updated" if resp.ok else "error"
    else:
        with open(csv_path, "rb") as f:
            resp = requests.post(
                f"{api_base}/api/v1/datasets/",
                headers=headers,
                data=form_data,
                files={"file": (csv_path.name, f, "text/csv")},
                timeout=60,
            )
        if resp.status_code == 201:
            new_id = resp.json().get("id")
            if new_id:
                existing_map[title_lower] = new_id
            return "created"
        print(f"  POST failed ({resp.status_code}): {resp.text[:200]}")
        return "error"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Parse Bora Capital daily briefing and upload to GhanaDataHub."
    )
    src = parser.add_mutually_exclusive_group(required=False)
    src.add_argument("--file", metavar="PATH", help="Path to briefing text file")
    src.add_argument("--stdin", action="store_true", help="Read from stdin")
    parser.add_argument("--parse-only", action="store_true", help="Parse only, skip upload")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen, no writes")
    parser.add_argument("--api-base", default=os.getenv("GDH_API_BASE", "http://localhost:8000"))
    args = parser.parse_args()

    if not args.file and not args.stdin:
        print("Error: provide --file <path>, --stdin, or --parse-only with one of the above.")
        sys.exit(1)

    # Read input
    if args.file:
        p = Path(args.file)
        if not p.exists():
            print(f"Error: file not found: {p}")
            sys.exit(1)
        raw = p.read_text(encoding="utf-8", errors="replace")
    else:
        print("Paste the briefing text below, then press Ctrl-D:")
        raw = sys.stdin.read()

    if not raw.strip():
        print("Error: no input text provided.")
        sys.exit(1)

    # Detect date
    date = extract_date(raw)
    print(f"\n  Briefing date: {date}")

    # Split into sections
    sections = split_sections(raw)
    found = [k for k in sections if k != "preamble" and sections[k].strip()]
    print(f"  Sections found: {', '.join(found) or 'none'}\n")

    # Parser config: (section_key, label, parser_fn, extra_args, csv_prefix)
    PARSERS = [
        ("interbank_forex", "Interbank Forex Rates",    parse_forex,      [],       "daily_forex_"),
        ("gse_daily",       "GSE Daily Prices",         parse_gse,        [False],  "daily_gse_"),
        ("ytd_gse",         "GSE YTD Performance",      parse_gse,        [True],   "ytd_gse_"),
        ("indicators",      "Economic Indicators",      parse_indicators, [],       "daily_indicators_"),
        ("treasury",        "Treasury Rates",           parse_treasury,   [],       "daily_treasury_"),
        ("petroleum",       "Petroleum Prices",         parse_petroleum,  [],       "daily_petroleum_"),
        ("commodities",     "Commodity Prices",         parse_commodities,[],       "daily_commodities_"),
        ("crypto",          "Crypto Prices",            parse_crypto,     [],       "daily_crypto_"),
        ("gold_coins",      "BOG Gold Coins",           parse_gold_coins, [],       "daily_gold_coins_"),
    ]

    results = {}
    for sec_key, label, fn, extra, prefix in PARSERS:
        section_text = sections.get(sec_key, "")
        if not section_text.strip():
            print(f"  [SKIP] {label} — section not found")
            continue
        rows = fn(section_text, date, *extra)
        if not rows:
            print(f"  [EMPTY] {label} — 0 rows parsed (check format)")
            continue
        csv_path = OUTPUT_DIR / f"{prefix}{date}.csv"
        if not args.dry_run:
            save_csv(rows, csv_path)
        results[label] = {"rows": len(rows), "csv": csv_path}
        print(f"  [OK] {label}: {len(rows)} rows -> {csv_path.name}")

    # Final summary
    print(f"\n{'─'*60}")
    total_rows = sum(v["rows"] for v in results.values())
    print(f"  Sections found and parsed    : {len(results)}")
    print(f"  Total CSV files saved        : {len(results)}")
    print(f"  Total rows across all files  : {total_rows}")
    print(f"  Date extracted from briefing : {date}")
    print(f"  Output directory             : {OUTPUT_DIR}")
    print(f"{'─'*60}")

    if args.parse_only or args.dry_run:
        if args.dry_run:
            print("  (dry-run: nothing was written to disk)")
        return

    # Upload
    if requests is None:
        print("\nError: install requests first:  pip install requests")
        sys.exit(1)

    email = os.getenv("GDH_EMAIL")
    password = os.getenv("GDH_PASSWORD")
    api_base = args.api_base.rstrip("/")

    if not email or not password:
        print("\n  GDH_EMAIL / GDH_PASSWORD not set — skipping upload.")
        return

    print(f"\n  Uploading to {api_base} ...")
    try:
        headers = authenticate(api_base, email, password)
        print("  Authenticated successfully")
    except RuntimeError as exc:
        print(f"  {exc}")
        return

    existing_map = fetch_existing_dataset_map(api_base, headers)
    print(f"  {len(existing_map)} existing datasets fetched for dedup\n")

    TITLE_MAP = {
        f"daily_forex_{date}.csv":       f"Ghana Interbank Forex Rates {date}",
        f"daily_gse_{date}.csv":         f"GSE Daily Stock Movers {date}",
        f"ytd_gse_{date}.csv":           f"GSE Year-to-Date Performance {date}",
        f"daily_indicators_{date}.csv":  f"Ghana Economic Indicators {date}",
        f"daily_treasury_{date}.csv":    f"Ghana Treasury Bill Rates {date}",
        f"daily_petroleum_{date}.csv":   f"Ghana Petroleum Product Prices {date}",
        f"daily_commodities_{date}.csv": f"Global Commodity Prices {date}",
        f"daily_crypto_{date}.csv":      f"Cryptocurrency Market Prices {date}",
        f"daily_gold_coins_{date}.csv":  f"Bank of Ghana Gold Coin Prices {date}",
    }

    stats = {"created": 0, "updated": 0, "error": 0}
    ICON = {"created": "NEW", "updated": "UPDATE", "error": "FAIL", "skipped": "SKIP"}

    for label, info in results.items():
        csv_path = info["csv"]
        title = TITLE_MAP.get(csv_path.name, f"Ghana {label} - {date}")
        outcome = upload_or_update(api_base, headers, csv_path, title, existing_map)
        stats[outcome] = stats.get(outcome, 0) + 1
        print(f"  [{ICON.get(outcome, '?')}] {title}")
        time.sleep(0.5)

    print(f"\n{'='*60}")
    print("FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"  Sections found and parsed        : {len(results)}")
    print(f"  Total CSV files saved            : {len(results)}")
    print(f"  Total rows across all files      : {sum(v['rows'] for v in results.values())}")
    print(f"  Datasets uploaded to GhanaDataHub: {stats.get('created', 0) + stats.get('updated', 0)}")
    print(f"  Date extracted from briefing     : {date}")
    print(f"  Created: {stats.get('created', 0)} | Updated: {stats.get('updated', 0)} | Errors: {stats.get('error', 0)}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
