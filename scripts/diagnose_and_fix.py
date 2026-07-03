#!/usr/bin/env python3
"""Diagnostic and fix script for GhanaDataHub.

Runs the dataset ingestion diagnostic chain:
1) ensure scripts/output CSV files exist
2) verify backend /health
3) register/login test user
4) confirm current user role
5) inspect datasets + dashboard
6) upload a test CSV
7) verify dashboard after upload
8) validate frontend VITE_API_URL
9) print a final summary
"""

import csv
import os
import sys
import time
import uuid

try:
    import requests
except ImportError:
    print("ERROR: This script requires requests. Install with: pip install requests")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_OUTPUT_DIR = os.path.join(ROOT, "scripts", "output")
FRONTEND_DIR = os.path.join(ROOT, "frontend")

BACKEND_BASE = os.environ.get("GHANADATAHUB_BACKEND_URL", "http://127.0.0.1:8000")
API_BASE = BACKEND_BASE + "/api/v1"
HEALTH_URL = BACKEND_BASE + "/health"
REGISTER_URL = API_BASE + "/auth/register"
LOGIN_URL = API_BASE + "/auth/login"
ME_URL = API_BASE + "/auth/me"
USERS_URL = API_BASE + "/users/"
DATASETS_URL = API_BASE + "/datasets/"
DASHBOARD_URL = API_BASE + "/dashboard/"

ADMIN_EMAIL = os.environ.get("GHANADATAHUB_ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("GHANADATAHUB_ADMIN_PASSWORD")

UNIQUE_ID = uuid.uuid4().hex[:8]
TEST_USER = {
    "email": f"datauploader+{UNIQUE_ID}@example.com",
    "username": f"datauploader_{UNIQUE_ID}",
    "full_name": "Data Uploader",
    "password": "DataUp2024!",
}

SUMMARY = {
    "csv_files": 0,
    "backend_running": False,
    "auth_working": False,
    "role_ok": False,
    "role": None,
    "datasets_before": 0,
    "upload_result": "NOT RUN",
    "datasets_after": 0,
    "vite_api_url": None,
    "vite_api_url_ok": False,
}


def print_step(step, message):
    print("\nSTEP {} - {}".format(step, message))


def print_result(ok, detail=""):
    status = "PASS" if ok else "FAIL"
    print(status + (": " + detail if detail else ""))


def list_csv_files():
    if not os.path.isdir(CSV_OUTPUT_DIR):
        return []
    return sorted(
        os.path.join(CSV_OUTPUT_DIR, name)
        for name in os.listdir(CSV_OUTPUT_DIR)
        if name.lower().endswith(".csv")
    )


def count_csv_rows(path):
    try:
        with open(path, "r", encoding="utf-8", newline="") as fh:
            return sum(1 for _ in csv.reader(fh))
    except Exception:
        return 0


def derive_title(path):
    name = os.path.basename(path)
    if name.lower().endswith(".csv"):
        name = name[:-4]
    name = name.replace("-", "_")
    parts = [part for part in name.split("_") if part]
    title = " ".join(part.capitalize() for part in parts)
    if title and not title.lower().endswith("data"):
        title = title + " Data"
    return title or "Uploaded Data"


def _safe_json(resp):
    try:
        return resp.json()
    except Exception:
        return None


def step1():
    print_step(1, "CHECK CSV FILES EXIST")
    if not os.path.isdir(CSV_OUTPUT_DIR):
        print_result(False, f"Folder not found: {CSV_OUTPUT_DIR}")
        print("Re-run the World Bank downloader: python3 scripts/fetch_worldbank_ghana.py")
        sys.exit(1)

    files = list_csv_files()
    SUMMARY["csv_files"] = len(files)
    if not files:
        print_result(False, "No CSV files found in scripts/output/")
        print("Re-run the World Bank downloader: python3 scripts/fetch_worldbank_ghana.py")
        sys.exit(1)

    nonempty = False
    for path in files:
        rows = count_csv_rows(path)
        size_kb = os.path.getsize(path) / 1024.0
        print(f"  {os.path.basename(path)} | {size_kb:.2f} KB | {rows} rows")
        if rows > 0:
            nonempty = True

    print_result(nonempty, "Found non-empty CSV file(s)" if nonempty else "CSV files exist but are empty")
    if not nonempty:
        print("CSV FILES EMPTY. Re-run the World Bank downloader script: python3 scripts/fetch_worldbank_ghana.py")
        sys.exit(1)
    return files


def step2():
    print_step(2, "CHECK BACKEND IS RUNNING")
    try:
        resp = requests.get(HEALTH_URL, timeout=5)
        if resp.status_code == 200:
            SUMMARY["backend_running"] = True
            print_result(True, "Backend health check passed")
            return
        print_result(False, f"Health returned status {resp.status_code}")
    except Exception as exc:
        print_result(False, f"Health request failed: {exc}")

    print("Backend must be running at http://localhost:8000. Start it with:\n  cd backend && uvicorn app.main:app --reload")
    sys.exit(1)


def step3():
    print_step(3, "CHECK OR CREATE A USER ACCOUNT")

    if ADMIN_EMAIL and ADMIN_PASSWORD:
        print(f"Attempting admin login for {ADMIN_EMAIL}")
        try:
            admin_resp = requests.post(LOGIN_URL, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
            if admin_resp.status_code == 200:
                payload = _safe_json(admin_resp)
                token = payload.get("access_token") if isinstance(payload, dict) else None
                if token:
                    print_result(True, "Admin login succeeded")
                    SUMMARY["auth_working"] = True
                    return token
                print_result(False, "Admin login succeeded but no access_token returned")
            else:
                print(f"Admin login failed: {admin_resp.status_code} {admin_resp.text}")
        except Exception as exc:
            print(f"Admin login request failed: {exc}")

        print("Falling back to creating a diagnostic test user.")

    try:
        reg_resp = requests.post(REGISTER_URL, json=TEST_USER, timeout=10)
    except Exception as exc:
        print_result(False, f"Registration request failed: {exc}")
        sys.exit(1)

    if reg_resp.status_code == 201:
        print("Registration succeeded.")
    elif reg_resp.status_code == 400:
        print("Registration returned 400 (user may already exist). Continuing.")
    else:
        print_result(False, f"Registration failed: {reg_resp.status_code} {reg_resp.text}")
        sys.exit(1)

    try:
        login_resp = requests.post(LOGIN_URL, json={"email": TEST_USER["email"], "password": TEST_USER["password"]}, timeout=10)
    except Exception as exc:
        print_result(False, f"Login request failed: {exc}")
        sys.exit(1)

    if login_resp.status_code != 200:
        print_result(False, f"Login failed: {login_resp.status_code} {login_resp.text}")
        sys.exit(1)

    payload = _safe_json(login_resp)
    if not payload or not isinstance(payload, dict):
        print_result(False, "Login response is not JSON or malformed")
        sys.exit(1)

    token = payload.get("access_token")
    if not token:
        print_result(False, "Login response did not contain access_token")
        sys.exit(1)

    SUMMARY["auth_working"] = True
    print_result(True, "Auth register/login succeeded")
    return token


def step4(token):
    print_step(4, "CHECK USER ROLE")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(ME_URL, headers=headers, timeout=10)
    except Exception as exc:
        print_result(False, f"GET /auth/me failed: {exc}")
        sys.exit(1)

    if resp.status_code != 200:
        print_result(False, f"GET /auth/me returned {resp.status_code}: {resp.text}")
        sys.exit(1)

    payload = _safe_json(resp)
    role = payload.get("role") if isinstance(payload, dict) else None
    SUMMARY["role"] = role
    print(f"Current user role: {role}")
    allowed = {"super_admin", "org_admin", "data_manager"}
    if role in allowed:
        SUMMARY["role_ok"] = True
        print_result(True, f"Role {role} is sufficient")
        return

    print_result(False, f"Role {role} is not sufficient")
    if role == "viewer":
        print("Viewers cannot upload datasets. Ask a super_admin to assign data_manager role.")
    sys.exit(1)


def step5(token):
    print_step(5, "CHECK DATASETS AND DASHBOARD")
    headers = {"Authorization": f"Bearer {token}"}

    try:
        resp = requests.get(DATASETS_URL, headers=headers, timeout=15)
    except Exception as exc:
        print_result(False, f"GET /datasets/ failed: {exc}")
        return None

    if resp.status_code != 200:
        print_result(False, f"GET /datasets/ returned {resp.status_code}: {resp.text}")
        return None

    payload = _safe_json(resp)
    titles = []
    total = None
    if isinstance(payload, dict):
        total = payload.get("total")
        items = payload.get("items") or payload.get("results") or []
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict):
                    titles.append(item.get("title") or item.get("name") or "<unknown>")
    elif isinstance(payload, list):
        titles = [item.get("title") or item.get("name") or "<unknown>" for item in payload if isinstance(item, dict)]
        total = len(titles)
    if total is None:
        total = len(titles)

    print(f"Datasets in DB: {total}")
    if titles:
        for title in titles:
            print(f"  - {title}")

    dashboard_payload = None
    try:
        dash_resp = requests.get(DASHBOARD_URL, headers=headers, timeout=15)
        if dash_resp.status_code == 200:
            dashboard_payload = _safe_json(dash_resp)
        else:
            print(f"GET /dashboard/ returned {dash_resp.status_code}: {dash_resp.text}")
    except Exception as exc:
        print(f"GET /dashboard/ failed: {exc}")

    if isinstance(dashboard_payload, dict):
        print("Dashboard:")
        print(f"  total_datasets: {dashboard_payload.get('total_datasets')}")
        print(f"  total_users: {dashboard_payload.get('total_users')}")
        uploads = dashboard_payload.get('recent_uploads')
        if isinstance(uploads, list):
            print(f"  recent_uploads: {len(uploads)}")

    print_result(True, "Dataset + dashboard endpoints reached")
    return total


def step6(token, csv_path):
    print_step(6, "UPLOAD ONE TEST CSV")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": derive_title(csv_path),
        "description": "Uploaded by GhanaDataHub diagnostic script",
        "visibility": "public",
        "tags": "ghana,diagnostic,test",
    }

    try:
        with open(csv_path, "rb") as fh:
            files = {"file": (os.path.basename(csv_path), fh, "text/csv")}
            resp = requests.post(DATASETS_URL, headers=headers, data=data, files=files, timeout=120)
    except Exception as exc:
        print_result(False, f"Upload request failed: {exc}")
        return False, f"Upload request failed: {exc}"

    body = _safe_json(resp)
    if resp.status_code == 201:
        print_result(True, "Upload created successfully")
        return True, "SUCCESS"

    reason = body if body is not None else resp.text
    if isinstance(body, dict):
        reason = body.get("detail") or body

    if resp.status_code == 403:
        print_result(False, f"Upload rejected: 403 forbidden. {reason}")
        return False, "FAIL role or permissions"
    if resp.status_code == 413:
        print_result(False, "Payload too large")
        return False, "FAIL file too large"
    if resp.status_code in (400, 422):
        print_result(False, f"Upload validation failed: {reason}")
        return False, f"FAIL validation: {reason}"
    if resp.status_code == 500:
        print_result(False, "Backend internal error during upload")
        return False, "FAIL server error"

    print_result(False, f"Upload failed with status {resp.status_code}")
    return False, f"FAIL unexpected status {resp.status_code}: {reason}"


def step7(token):
    print_step(7, "VERIFY DASHBOARD AFTER UPLOAD")
    headers = {"Authorization": f"Bearer {token}"}
    time.sleep(1)

    try:
        resp = requests.get(DASHBOARD_URL, headers=headers, timeout=15)
    except Exception as exc:
        print_result(False, f"Dashboard request failed: {exc}")
        return None

    if resp.status_code != 200:
        print_result(False, f"Dashboard returned {resp.status_code}: {resp.text}")
        return None

    payload = _safe_json(resp)
    total = payload.get("total_datasets") if isinstance(payload, dict) else None
    uploads = payload.get("recent_uploads") if isinstance(payload, dict) else None
    print(f"Dashboard total_datasets: {total}")
    if isinstance(uploads, list) and uploads:
        first_upload = uploads[0]
        if isinstance(first_upload, dict):
            print(f"First recent upload: {first_upload.get('title') or first_upload.get('name')}")

    print_result(True, "Dashboard check complete")
    return total


def step8():
    print_step(8, "CHECK FRONTEND API BASE URL")
    candidates = [
        os.path.join(FRONTEND_DIR, ".env.local"),
        os.path.join(FRONTEND_DIR, ".env"),
    ]
    env_path = None
    for candidate in candidates:
        if os.path.isfile(candidate):
            env_path = candidate
            break

    if not env_path:
        env_path = os.path.join(FRONTEND_DIR, ".env.local")
        try:
            with open(env_path, "w", encoding="utf-8") as fh:
                fh.write("VITE_API_URL=http://localhost:8000/api/v1\n")
            print_result(True, f"Created {env_path} with correct VITE_API_URL")
            return "http://localhost:8000/api/v1", True
        except Exception as exc:
            print_result(False, f"Could not create frontend env file: {exc}")
            return None, False

    value = None
    try:
        with open(env_path, "r", encoding="utf-8") as fh:
            for line in fh:
                if line.strip().startswith("VITE_API_URL="):
                    value = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                    break
    except Exception as exc:
        print_result(False, f"Cannot read {env_path}: {exc}")
        return None, False

    expected = "http://localhost:8000/api/v1"
    if value != expected:
        print_result(False, f"VITE_API_URL is {value}, expected {expected}")
        try:
            with open(env_path, "w", encoding="utf-8") as fh:
                fh.write(f"VITE_API_URL={expected}\n")
            print(f"Updated {env_path} to VITE_API_URL={expected}")
        except Exception as exc:
            print(f"Could not update {env_path}: {exc}")
        return value, False

    print_result(True, "Frontend API URL is correct")
    return value, True


def print_summary():
    print_step(9, "FINAL SUMMARY")
    print(f"CSV files found:       {SUMMARY['csv_files']}")
    print(f"Backend running:       {'YES' if SUMMARY['backend_running'] else 'NO'}")
    print(f"Auth working:          {'YES' if SUMMARY['auth_working'] else 'NO'}")
    print(f"User role OK:          {'YES' if SUMMARY['role_ok'] else 'NO'} ({SUMMARY['role']})")
    print(f"Datasets before:       {SUMMARY['datasets_before']}")
    print(f"Upload result:         {SUMMARY['upload_result']}")
    print(f"Datasets after:        {SUMMARY['datasets_after']}")
    print(f"Frontend API URL:      {SUMMARY['vite_api_url']}")

    if SUMMARY['csv_files'] > 0 and SUMMARY['backend_running'] and SUMMARY['auth_working'] and SUMMARY['role_ok'] and SUMMARY['upload_result'] == 'SUCCESS':
        print("ALL CHECKS PASSED. Refresh http://localhost:5173 to view the dashboard.")
        return
    print("One or more checks failed. Review the step output above.")


def main():
    csv_files = step1()
    step2()
    token = step3()
    step4(token)
    SUMMARY['datasets_before'] = step5(token) or 0
    upload_ok, upload_reason = step6(token, csv_files[0])
    SUMMARY['upload_result'] = upload_reason
    SUMMARY['datasets_after'] = step7(token) or SUMMARY['datasets_before']
    vite_url, vite_ok = step8()
    SUMMARY['vite_api_url'] = vite_url
    SUMMARY['vite_api_url_ok'] = vite_ok
    print_summary()
    if upload_ok and SUMMARY['role_ok']:
        return 0
    return 1


if __name__ == '__main__':
    sys.exit(main())
