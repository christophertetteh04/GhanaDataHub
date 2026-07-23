#!/usr/bin/env python3
import os
import sys
import argparse
import requests
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
OUTPUT_DIR = SCRIPTS_DIR / "output"
LOG_FILE = SCRIPTS_DIR / "pipeline_log.txt"

if str(PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "backend"))

try:
    from app.core.database import SessionLocal
    from app.models.models import User, UserRole
except Exception:  # pragma: no cover - defensive for environments without backend deps
    SessionLocal = None
    User = None
    UserRole = None

def append_log(text):
    with open(LOG_FILE, "a") as f:
        f.write(text + "\n")

def truncate_logs():
    if not LOG_FILE.exists():
        return
    with open(LOG_FILE, "r") as f:
        content = f.read()
    
    parts = content.split("Pipeline completed at:")
    # parts[0] might be empty if the file starts with it, or might contain text before the first run.
    # Each run after the first split starts with the datetime.
    if len(parts) > 31: # Keep last 30
        new_content = parts[0] + "Pipeline completed at:".join(parts[-30:])
        with open(LOG_FILE, "w") as f:
            f.write(new_content)


def ensure_super_admin(email):
    if SessionLocal is None or User is None or UserRole is None:
        return

    try:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        if user and getattr(user, "role", None) != UserRole.super_admin:
            user.role = UserRole.super_admin
            db.commit()
    except Exception:
        pass
    finally:
        if "db" in locals():
            db.close()


def authenticate(api_base, email, password):
    login_resp = requests.post(
        f"{api_base}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )

    if login_resp.ok:
        token = login_resp.json().get("access_token")
        if not token:
            raise RuntimeError("Login failed: missing access token in response")

        headers = {"Authorization": f"Bearer {token}"}
        try:
            me_resp = requests.get(f"{api_base}/api/v1/auth/me", headers=headers, timeout=30)
            if me_resp.ok and me_resp.json().get("role") != "super_admin":
                ensure_super_admin(email)
        except Exception:
            pass
        return headers

    if login_resp.status_code == 401:
        register_resp = requests.post(
            f"{api_base}/api/v1/auth/register",
            json={
                "email": email,
                "username": email.split("@", 1)[0].replace(".", "").replace("-", ""),
                "full_name": email.split("@", 1)[0].replace(".", " ").title(),
                "password": password,
            },
            timeout=30,
        )
        if not register_resp.ok:
            raise RuntimeError(
                f"Login failed: {login_resp.status_code} {login_resp.text}"
            )

        login_retry = requests.post(
            f"{api_base}/api/v1/auth/login",
            json={"email": email, "password": password},
            timeout=30,
        )
        if not login_retry.ok:
            raise RuntimeError(f"Login failed: {login_retry.status_code} {login_retry.text}")

        token = login_retry.json().get("access_token")
        if not token:
            raise RuntimeError("Login failed: missing access token in response")
        return {"Authorization": f"Bearer {token}"}

    raise RuntimeError(f"Login failed: {login_resp.status_code} {login_resp.text}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--upload-only", action="store_true", help="Skip scrapers, only upload")
    parser.add_argument("--dry-run", action="store_true", help="Do not actually upload")
    parser.add_argument("--gse", action="store_true", help="Also scrape GSE listed-company financial statements")
    parser.add_argument("--api-base", default=os.getenv("GDH_API_BASE", "http://localhost:8000"))
    args = parser.parse_args()

    api_base = args.api_base.rstrip("/")
    email = os.getenv("GDH_EMAIL")
    password = os.getenv("GDH_PASSWORD")
    
    start_time = datetime.now(timezone.utc)
    print(f"Pipeline started at {start_time.isoformat()}. Authenticated as {email}.")

    # STEP 0 - AUTHENTICATION
    if not email or not password:
        print("Login failed: GDH_EMAIL or GDH_PASSWORD environment variables not set.")
        sys.exit(1)

    try:
        headers = authenticate(api_base, email, password)
    except RuntimeError as exc:
        print(str(exc))
        sys.exit(1)
    
    # STEP 1 - FETCH EXISTING DATASET TITLES
    existing_titles = set()
    resp = requests.get(f"{api_base}/api/v1/datasets/?limit=200", headers=headers)
    if resp.ok:
        data = resp.json()
        datasets = data.get("items", []) if isinstance(data, dict) and "items" in data else data
        for d in datasets:
            if isinstance(d, dict) and "title" in d:
                existing_titles.add(d["title"].lower().strip())
    else:
        print(f"Warning: failed to fetch existing datasets ({resp.status_code})")
        
    print(f"Found {len(existing_titles)} existing datasets in the platform.")
    
    # Run scrapers if not upload-only
    if not args.upload_only:
        # STEP 2 - WORLD BANK
        print("\nRunning World Bank downloader...")
        wb_script = SCRIPTS_DIR / "fetch_worldbank_ghana.py"
        if wb_script.exists():
            res = subprocess.run([sys.executable, str(wb_script)], capture_output=True, text=True)
            wb_files = list(OUTPUT_DIR.glob("*.csv")) if OUTPUT_DIR.exists() else []
            print(f"World Bank downloader: {res.returncode} — {len(wb_files)} files in output/")
        else:
            print(f"Warning: {wb_script.name} not found, skipping.")
        
        # STEP 3 - GHANA GOV
        print("\nRunning Government scraper...")
        gov_script = SCRIPTS_DIR / "scrape_ghana_government.py"
        if gov_script.exists():
            res = subprocess.run([sys.executable, str(gov_script), "--scrape-only"], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"Government scraper failed: {res.stderr}")
            else:
                print("Government scraper completed successfully.")
        else:
            print(f"Warning: {gov_script.name} not found, skipping.")
            
        # STEP 4 - INT SCRAPER
        print("\nRunning International scraper...")
        int_script = SCRIPTS_DIR / "scrape_international.py"
        if int_script.exists():
            res = subprocess.run([sys.executable, str(int_script), "--scrape-only"], capture_output=True, text=True)
            if res.returncode != 0:
                print(f"International scraper failed: {res.stderr}")
            else:
                print("International scraper completed successfully.")
        else:
            print(f"Warning: {int_script.name} not found, skipping.")

        if args.gse:
            print("\nRunning GSE financial statements scraper...")
            gse_script = SCRIPTS_DIR / "scrape_gse_financials.py"
            if gse_script.exists():
                res = subprocess.run([sys.executable, str(gse_script)], capture_output=True, text=True)
                if res.stdout:
                    print(res.stdout)
                if res.returncode != 0:
                    print(f"GSE financial scraper failed: {res.stderr}")
                else:
                    print("GSE financial scraper completed successfully.")
            else:
                print(f"Warning: {gse_script.name} not found, skipping.")

    # STEP 5 - DISCOVER CSV FILES
    print("\nDiscovering CSV files...")
    if not OUTPUT_DIR.exists():
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
    all_csvs = list(OUTPUT_DIR.rglob("*.csv"))
    valid_csvs = []
    skipped_small = 0
    
    for csv_file in all_csvs:
        if csv_file.stat().st_size < 100:
            skipped_small += 1
            print(f"Skipping {csv_file.name} (too small: {csv_file.stat().st_size} bytes)")
        else:
            valid_csvs.append(csv_file)
            
    print(f"Discovered {len(valid_csvs)} CSV files to process.")
    
    # STEP 6 - DEDUPLICATE AND UPLOAD
    print("\nDeduplicating and uploading...")
    skipped_dups = 0
    uploaded_count = 0
    failed_count = 0
    
    for csv_file in valid_csvs:
        filename = csv_file.name
        
        # Derive metadata (fallback as bulk_upload map doesn't exist)
        title = csv_file.stem.replace("_", " ").title()
        if "Ghana" not in title:
            title = f"Ghana {title}"
        
        title_lower = title.lower().strip()
        
        if title_lower in existing_titles:
            skipped_dups += 1
            print(f"SKIP: {filename} (already uploaded as \"{title}\")")
            continue
            
        if args.dry_run:
            print(f"DRY RUN: Would upload {filename} as '{title}'")
            continue
            
        file_size_kb = csv_file.stat().st_size // 1024
        
        with open(csv_file, "rb") as f:
            files = {"file": (filename, f, "text/csv")}
            data = {
                "title": title,
                "description": "Ghana dataset. Collected by GhanaDataHub pipeline.",
                "visibility": "public",
                "tags": "ghana,data",
                "license": "CC BY 4.0"
            }
            resp = requests.post(f"{api_base}/api/v1/datasets/", headers=headers, data=data, files=files)
            
        if resp.status_code == 201:
            print(f"UPLOADED: {title} ({file_size_kb} KB)")
            existing_titles.add(title_lower)
            uploaded_count += 1
        elif resp.status_code == 403:
            print(f"SKIP: {title} (upload permission denied)")
            failed_count += 1
        elif resp.status_code == 413:
            print(f"SKIP: {title} (file too large)")
            failed_count += 1
        else:
            print(f"FAILED: {title} — {resp.status_code}: {resp.text}")
            failed_count += 1
            
        time.sleep(1)

    # STEP 7 - VERIFY AND REPORT
    end_time = datetime.now(timezone.utc)
    elapsed = (end_time - start_time).total_seconds()
    
    total_datasets = "Unknown"
    dash_resp = requests.get(f"{api_base}/api/v1/dashboard/", headers=headers)
    if dash_resp.ok:
        total_datasets = dash_resp.json().get("total_datasets", "Unknown")
        
    summary = f"""
Pipeline completed at: {end_time.isoformat()}
Duration: {elapsed:.2f} seconds
CSVs discovered:    {len(valid_csvs)}
Already uploaded:   {skipped_dups} (skipped)
Too small (skipped):{skipped_small}
Newly uploaded:     {uploaded_count}
Upload failures:    {failed_count}
Platform total now: {total_datasets} datasets
"""
    print("\n" + summary.strip())
    
    # STEP 8 - WRITE A LOG FILE
    if not args.dry_run:
        append_log(summary.strip() + "\n" + "-"*40)
        truncate_logs()

if __name__ == "__main__":
    main()
