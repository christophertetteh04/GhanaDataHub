#!/usr/bin/env python3
"""Monitor GhanaDataHub source pages and trigger scrapers when content changes.

source_hashes.json schema:
{
  "source_key": {
    "name": "Human-readable source name",
    "url": "https://example.gov.gh/publications",
    "sha256": "hex encoded page hash",
    "last_checked_at": "2026-07-22T12:00:00Z",
    "last_changed_at": "2026-07-22T12:00:00Z"
  }
}
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

SCRIPT_DIR = Path(__file__).resolve().parent
HASH_FILE = SCRIPT_DIR / "source_hashes.json"
DEFAULT_API_BASE = os.getenv("GHANADATAHUB_API_BASE", "http://localhost:8000")

if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from scrape_ghana_gov_expanded import SOURCE_REGISTRY, USER_AGENT, run_expanded_scrapers


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def monitor_url_for_source(config: dict) -> str:
    if config.get("publications_url"):
        return config["publications_url"]
    if config.get("scrape_method") == "ckan_api" and config.get("api_url"):
        return f"{config['api_url']}package_list"
    if config.get("api_url"):
        return config["api_url"]
    if config.get("data_url"):
        return config["data_url"]
    return config["url"]


def load_hashes() -> dict:
    if not HASH_FILE.exists():
        return {}
    try:
        return json.loads(HASH_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def save_hashes(hashes: dict) -> None:
    HASH_FILE.write_text(json.dumps(hashes, indent=2, sort_keys=True) + "\n")


def check_page_changed(url: str, stored_hash: str | None, session: requests.Session) -> tuple[bool, str | None]:
    try:
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        current_hash = hashlib.sha256(resp.text.encode()).hexdigest()
        return current_hash != stored_hash, current_hash
    except Exception:
        return False, stored_hash


def monitor_sources(
    api_base: str = DEFAULT_API_BASE,
    token: str | None = None,
    sources: list[str] | None = None,
    dry_run: bool = False,
) -> int:
    token = token or os.getenv("GHANADATAHUB_TOKEN")
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    hashes = load_hashes()
    source_keys = sources or list(SOURCE_REGISTRY.keys())
    changed_count = 0

    for source_key in source_keys:
        config = SOURCE_REGISTRY.get(source_key)
        if not config:
            print(f"Skipping unknown source: {source_key}")
            continue

        url = monitor_url_for_source(config)
        previous = hashes.get(source_key, {})
        changed, current_hash = check_page_changed(url, previous.get("sha256"), session)
        now = utc_now()

        hashes[source_key] = {
            "name": config["name"],
            "url": url,
            "sha256": current_hash,
            "last_checked_at": now,
            "last_changed_at": previous.get("last_changed_at"),
        }

        if changed and previous.get("sha256"):
            print(f"Source {config['name']} updated - triggering scraper")
            hashes[source_key]["last_changed_at"] = now
            changed_count += 1
            run_expanded_scrapers(api_base=api_base, token=token, sources=[source_key], dry_run=dry_run)
        elif changed:
            print(f"Initial hash stored for {config['name']}")
        else:
            print(f"No change: {config['name']}")

    save_hashes(hashes)
    print(f"\nSources changed: {changed_count}")
    return changed_count


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Monitor GhanaDataHub source pages.")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE)
    parser.add_argument("--token", default=os.getenv("GHANADATAHUB_TOKEN"))
    parser.add_argument("--sources", nargs="*")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    monitor_sources(
        api_base=args.api_base,
        token=args.token,
        sources=args.sources,
        dry_run=args.dry_run,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
