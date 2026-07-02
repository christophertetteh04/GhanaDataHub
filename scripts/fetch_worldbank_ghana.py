"""Fetch Ghana World Bank indicators and save as CSV.

Downloads indicators from the World Bank API:
  https://api.worldbank.org/v2/country/GH/indicator/{INDICATOR_CODE}?format=json&per_page=60

Outputs CSV files to: scripts/output/
Each CSV has columns: year, value, indicator_name, country

Requirements:
  - requests

Run:
  python scripts/fetch_worldbank_ghana.py
"""

from __future__ import annotations

import csv
import os
from typing import Any, Dict, Iterable, List, Optional

import requests


WORLD_BANK_BASE = "https://api.worldbank.org/v2/country/GH/indicator/{code}"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

INDICATORS: List[Dict[str, str]] = [
    {"code": "NY.GDP.MKTP.CD", "filename": "ghana_gdp.csv", "name": "GDP in current USD"},
    {"code": "FP.CPI.TOTL.ZG", "filename": "ghana_inflation.csv", "name": "Inflation rate %"},
    {"code": "SP.POP.TOTL", "filename": "ghana_population.csv", "name": "Total population"},
    {"code": "SL.UEM.TOTL.ZS", "filename": "ghana_unemployment.csv", "name": "Unemployment %"},
    {"code": "SE.ADT.LITR.ZS", "filename": "ghana_literacy.csv", "name": "Adult literacy rate %"},
]


def _world_bank_url(indicator_code: str) -> str:
    return WORLD_BANK_BASE.format(code=indicator_code)


def _fetch_indicator(indicator_code: str) -> Optional[List[Dict[str, Any]]]:
    url = _world_bank_url(indicator_code)
    params = {"format": "json", "per_page": 60}

    try:
        resp = requests.get(url, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"[ERROR] Network error fetching {indicator_code}: {e}")
        return None

    if resp.status_code != 200:
        print(f"[ERROR] HTTP {resp.status_code} fetching {indicator_code}: {resp.text[:200]}")
        return None

    try:
        data = resp.json()
    except ValueError:
        print(f"[ERROR] Invalid JSON returned for {indicator_code}")
        return None

    # Expected shape: [meta, rows]
    if not isinstance(data, list) or len(data) < 2 or not isinstance(data[1], list):
        print(f"[ERROR] Unexpected API response shape for {indicator_code}")
        return None

    return data[1]


def _iter_csv_rows(rows: Iterable[Dict[str, Any]], *, indicator_name: str, country: str):
    for row in rows:
        year = row.get("date")
        value = row.get("value")

        # Skip missing values (value can be None)
        if value is None:
            continue

        yield {
            "year": year,
            "value": value,
            "indicator_name": indicator_name,
            "country": country,
        }


def _write_csv(filename: str, rows: List[Dict[str, Any]]):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["year", "value", "indicator_name", "country"])
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    country = "Ghana"

    for spec in INDICATORS:
        code = spec["code"]
        filename = spec["filename"]
        indicator_name = spec["name"]

        print(f"[INFO] Downloading {code} -> {filename}")
        rows = _fetch_indicator(code)
        if rows is None:
            print(f"[WARN] Skipping {code} due to previous errors")
            continue

        csv_rows = list(_iter_csv_rows(rows, indicator_name=indicator_name, country=country))
        print(f"[INFO] Writing {len(csv_rows)} rows to {filename}")
        try:
            _write_csv(filename, csv_rows)
        except OSError as e:
            print(f"[ERROR] Failed to write CSV {filename}: {e}")

    print(f"[DONE] Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

