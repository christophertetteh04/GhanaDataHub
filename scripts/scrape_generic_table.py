"""Generic HTML table scraper.

Usage:
  python scripts/scrape_generic_table.py <URL>

What it does:
  1) Downloads the given URL with a polite User-Agent.
  2) Finds all <table> elements.
  3) For each table, attempts to convert it to a pandas DataFrame using pd.read_html().
  4) Prints a summary (shape, columns, first 3 rows) for each table.
  5) Saves each parsed table as table_1.csv, table_2.csv, ... in scripts/output/.
  6) Sleeps ~2 seconds between any additional page requests.

This script is standalone and does not depend on the backend/frontend code.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import pandas as pd
import requests
from bs4 import BeautifulSoup


OUTPUT_DIR = Path(__file__).resolve().parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class TableResult:
    table_index: int
    df: pd.DataFrame


def fetch_html(url: str) -> str:
    """Download HTML for the given URL with a polite User-Agent."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; GhanaDataHub-Scraper/1.0; +https://example.com) "
            "(polite-bot)"
        )
    }
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def parse_tables(html: str) -> List[Optional[TableResult]]:
    """Find tables in HTML and try pd.read_html() for each table."""
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    results: List[Optional[TableResult]] = []

    for i, table in enumerate(tables, start=1):
        # Convert this single table element to HTML string.
        table_html = str(table)

        try:
            # pd.read_html() returns list of DataFrames.
            dfs = pd.read_html(table_html)
            if not dfs:
                results.append(None)
                continue

            df = dfs[0]
            results.append(TableResult(table_index=i, df=df))
        except Exception:
            # If a table can't be parsed, keep going with clear error output.
            results.append(None)

    return results


def print_summary(result: TableResult) -> None:
    """Print shape, columns and first 3 rows for a parsed table."""
    df = result.df
    print(f"\n[TABLE {result.table_index}] shape={df.shape}")
    print(f"columns={list(df.columns)}")
    print("first_rows=\n", df.head(3).to_string(index=False))


def save_table_csv(result: TableResult) -> Path:
    """Save a parsed table to output directory."""
    out_path = OUTPUT_DIR / f"table_{result.table_index}.csv"
    result.df.to_csv(out_path, index=False)
    return out_path


def main(argv: List[str]) -> int:
    try:
        if len(argv) != 2:
            print("Usage: python scrape_generic_table.py <URL>")
            return 2

        url = argv[1]
        print(f"[INFO] Fetching: {url}")

        # Download the page (single request for the provided URL).
        html = fetch_html(url)

        print("[INFO] Finding and parsing <table> elements...")
        results = parse_tables(html)

        # Print summary and save CSVs.
        parsed_count = 0
        for res in results:
            if res is None:
                continue
            parsed_count += 1
            print_summary(res)
            out_path = save_table_csv(res)
            print(f"[INFO] Saved: {out_path}")

            # 2-second delay between saves (acts like rate limiting for large pages).
            time.sleep(2)

        print(f"\n[DONE] Parsed {parsed_count} table(s) out of {len(results)} found.")
        return 0

    except requests.RequestException as e:
        print(f"[ERROR] HTTP/network error: {e}")
        return 1
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

