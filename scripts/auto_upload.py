"""Auto-upload a CSV to the existing GhanaDataHub platform via its public API.

This is a pure API client script. It does NOT import or modify backend/frontend code.

Example:
  python scripts/auto_upload.py \
    --file scripts/output/ghana_gdp.csv \
    --title 'Ghana GDP 2000-2024' \
    --tags 'gdp,economy,ghana' \
    --api-base 'http://localhost:8000' \
    --token 'your_jwt_token'

Notes:
- If --url is provided, the CSV will be downloaded first.
- If both --file and --url are provided, --file takes precedence.
- The script posts to: {api-base}/api/v1/datasets/
"""

from __future__ import annotations

import argparse
import os
import sys
import tempfile
from pathlib import Path
from typing import Optional, Tuple

import requests


DATASETS_ENDPOINT_SUFFIX = "/api/v1/datasets/"


def _normalize_base(api_base: str) -> str:
    return api_base.rstrip("/")


def _download_csv(url: str) -> Tuple[Path, str]:
    """Download CSV and return (local_path, original_filename)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; GhanaDataHub-Client/1.0; +https://example.com)"
    }
    try:
        with requests.get(url, headers=headers, stream=True, timeout=60) as resp:
            resp.raise_for_status()
            # Try to infer filename.
            cd = resp.headers.get("content-disposition")
            filename = None
            if cd and "filename=" in cd:
                # crude parse
                filename = cd.split("filename=")[-1].strip().strip('"').strip("'")

            if not filename:
                filename = "downloaded.csv"

            fd, tmp_path = tempfile.mkstemp(suffix=".csv", prefix="gh-dh-upload-")
            os.close(fd)

            with open(tmp_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=1024 * 64):
                    if chunk:
                        f.write(chunk)

            return Path(tmp_path), filename
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to download CSV from {url}: {e}")


def _post_upload(
    *,
    api_base: str,
    token: str,
    csv_path: Path,
    title: str,
    tags: str,
    visibility: str,
) -> requests.Response:
    url = _normalize_base(api_base) + DATASETS_ENDPOINT_SUFFIX

    headers = {
        "Authorization": f"Bearer {token}",
    }

    # Multipart/form-data; requests sets boundaries automatically.
    with open(csv_path, "rb") as f:
        files = {
            "file": (
                csv_path.name,
                f,
                "text/csv",
            )
        }

        data = {
            "title": title,
            "tags": tags,
            "visibility": visibility,
        }

        try:
            return requests.post(url, headers=headers, data=data, files=files, timeout=120)
        except requests.RequestException as e:
            raise RuntimeError(f"Connection error uploading dataset to {url}: {e}")


def _print_error(resp: requests.Response) -> None:
    status = resp.status_code
    # Try to extract a useful message.
    msg = ""
    try:
        payload = resp.json()
        msg = payload.get("detail") or payload.get("message") or str(payload)
    except Exception:
        msg = resp.text[:500]

    if status == 401:
        print(f"[ERROR] 401 Unauthorized: bad token. {msg}")
    elif status == 400:
        print(f"[ERROR] 400 Bad Request: likely bad file type/fields. {msg}")
    elif status == 413:
        print(f"[ERROR] 413 Payload Too Large: file too large. {msg}")
    else:
        print(f"[ERROR] HTTP {status}: {msg}")


def _extract_dataset_id_and_link(api_base: str, resp: requests.Response) -> Tuple[Optional[str], Optional[str]]:
    try:
        body = resp.json()
    except Exception:
        return None, None

    dataset_id = None
    for key in ("id", "dataset_id"):
        if key in body:
            dataset_id = body[key]
            break

    dataset_id_str = str(dataset_id) if dataset_id is not None else None

    view_link = None
    if dataset_id_str:
        # Best-effort: try typical dataset detail route; if your frontend differs,
        # users can still use the printed id.
        view_link = _normalize_base(api_base) + f"/datasets/{dataset_id_str}"

    return dataset_id_str, view_link


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Upload a CSV to GhanaDataHub via public API")
    parser.add_argument(
        "--file",
        default=None,
        help="Local CSV path to upload (takes precedence over --url).",
    )
    parser.add_argument(
        "--url",
        default=None,
        help="Optional: download CSV from URL first, then upload.",
    )
    parser.add_argument("--title", required=True, help="Dataset title")
    parser.add_argument("--tags", required=True, help="Comma-separated tags")
    parser.add_argument(
        "--visibility",
        default="public",
        help="Dataset visibility (default: public)",
    )
    parser.add_argument(
        "--api-base",
        required=True,
        help="API base URL (e.g. http://localhost:8000 or production URL)",
    )
    parser.add_argument("--token", required=True, help="JWT access token or API key")

    args = parser.parse_args(argv)

    if args.file:
        csv_path = Path(args.file)
        if not csv_path.exists():
            print(f"[ERROR] --file not found: {csv_path}")
            return 2
        tmp_downloaded = None
    elif args.url:
        csv_path, _downloaded_filename = _download_csv(args.url)
        tmp_downloaded = csv_path
    else:
        print("[ERROR] Provide either --file <path> or --url <url>.")
        return 2

    try:
        print(f"[INFO] Uploading CSV: {csv_path}")
        resp = _post_upload(
            api_base=args.api_base,
            token=args.token,
            csv_path=csv_path,
            title=args.title,
            tags=args.tags,
            visibility=args.visibility,
        )

        if resp.status_code in (200, 201):
            dataset_id, view_link = _extract_dataset_id_and_link(args.api_base, resp)
            print("[DONE] Dataset created successfully")
            if dataset_id:
                print(f"  id: {dataset_id}")
            if view_link:
                print(f"  view: {view_link}")
            return 0

        _print_error(resp)
        return 1

    finally:
        # Clean up downloaded temp file.
        if tmp_downloaded is not None and tmp_downloaded.exists():
            try:
                tmp_downloaded.unlink()
            except Exception:
                pass


if __name__ == "__main__":
    raise SystemExit(main())

