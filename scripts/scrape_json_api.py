"""Generic CKAN JSON API scraper.

Downloads a CSV resource from a CKAN portal.

CKAN pattern (used by many open-data portals):
  - package_search: list datasets
  - package_show: get dataset resources

Example:
  python scripts/scrape_json_api.py --base-url https://data.gov.gh --query 'health' --limit 10
  python scripts/scrape_json_api.py --base-url https://data.gov.gh --dataset-id <id>

Output:
  scripts/output/downloaded_{dataset_name}.csv

Requirements:
  - requests
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import requests


OUTPUT_DIR = Path(__file__).resolve().parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _ckan_action_url(base_url: str, action: str) -> str:
    base = base_url.rstrip("/")
    return f"{base}/api/3/action/{action}"


def _request_json(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; GhanaDataHub-Scraper/1.0; +https://example.com) (polite-bot)"
    }
    resp = requests.get(url, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if not isinstance(data, dict) or data.get("success") is not True:
        # CKAN typically returns: {"success": true, "result": {...}}
        raise RuntimeError(f"Unexpected CKAN response: {data}")

    return data


def list_datasets(base_url: str, query: str, limit: int) -> Tuple[str, int, list]:
    """Return result (datasets list) and print numbered summary."""
    url = _ckan_action_url(base_url, "package_search")
    data = _request_json(url, {"q": query, "rows": limit})

    result = data.get("result") or {}
    datasets = result.get("results") or []

    print("\n[INFO] Available CKAN datasets:")
    for idx, ds in enumerate(datasets, start=1):
        ds_id = ds.get("id")
        title = ds.get("title") or "(no title)"
        resources_count = len(ds.get("resources") or [])
        print(f"  {idx}. {ds_id} | {title} | resources={resources_count}")

    return query, limit, datasets


def get_dataset_resources(base_url: str, dataset_id: str) -> Dict[str, Any]:
    """Fetch package_show and return dataset result dict."""
    url = _ckan_action_url(base_url, "package_show")
    data = _request_json(url, {"id": dataset_id})
    return data.get("result") or {}


def _is_csv_resource(resource: Dict[str, Any]) -> bool:
    # CKAN resources often expose: format, mimetype, url, name.
    fmt = (resource.get("format") or "").lower()
    mimetype = (resource.get("mimetype") or "").lower()
    name = (resource.get("name") or "").lower()

    return (
        "csv" in fmt
        or mimetype == "text/csv"
        or mimetype.endswith("/csv")
        or name.endswith(".csv")
        or name.startswith("csv")
    )


def _slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    return s.strip("_") or "dataset"


def download_first_csv_resource(
    *,
    base_url: str,
    dataset_id: str,
) -> Optional[Path]:
    """Download the first CSV resource for the dataset and save it to output."""
    dataset = get_dataset_resources(base_url, dataset_id)
    dataset_name = dataset.get("title") or dataset.get("name") or dataset_id
    safe_name = _slugify(str(dataset_name))

    resources = dataset.get("resources") or []

    csv_resource = None
    for r in resources:
        if _is_csv_resource(r):
            csv_resource = r
            break

    if csv_resource is None:
        # Fallback: if no explicit csv resource, look for url ending in .csv
        for r in resources:
            url = (r.get("url") or "").lower()
            if url.endswith(".csv"):
                csv_resource = r
                break

    if csv_resource is None:
        print(f"[WARN] No CSV resource found for dataset id={dataset_id}")
        return None

    url = csv_resource.get("url")
    if not url:
        print(f"[ERROR] CSV resource missing url for dataset id={dataset_id}")
        return None

    out_path = OUTPUT_DIR / f"downloaded_{safe_name}.csv"

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; GhanaDataHub-Scraper/1.0; +https://example.com) (polite-bot)"
    }
    try:
        print(f"\n[INFO] Downloading CSV resource from: {url}")
        resp = requests.get(url, headers=headers, timeout=60, stream=True)
        resp.raise_for_status()

        # Write streamed content to file.
        with open(out_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 64):
                if chunk:
                    f.write(chunk)

        print(f"[DONE] Saved: {out_path}")
        return out_path

    except requests.RequestException as e:
        print(f"[ERROR] Failed to download CSV for dataset id={dataset_id}: {e}")
        return None


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Scrape CKAN JSON API and download first CSV resource.")
    parser.add_argument("--base-url", required=True, help="CKAN base URL, e.g. https://data.gov.gh")
    parser.add_argument("--query", default="ghana", help="Search query for listing datasets")
    parser.add_argument("--limit", type=int, default=10, help="How many datasets to list")
    parser.add_argument("--dataset-id", default=None, help="CKAN dataset id to download resources from")

    args = parser.parse_args(argv)

    # Always try to list datasets when --query is provided.
    try:
        list_datasets(base_url=args.base_url, query=args.query, limit=args.limit)
    except requests.RequestException as e:
        print(f"[ERROR] Failed listing datasets: {e}")
        # Still allow direct download if --dataset-id provided.

    if not args.dataset_id:
        print("\n[INFO] No --dataset-id provided; skipping download.")
        return 0

    print(f"\n[INFO] Fetching resources for dataset id: {args.dataset_id}")
    download_first_csv_resource(base_url=args.base_url, dataset_id=args.dataset_id)

    # Polite delay in case caller runs repeatedly.
    time.sleep(0.5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

