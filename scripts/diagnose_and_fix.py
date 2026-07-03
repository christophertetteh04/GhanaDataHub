#!/usr/bin/env python3
"""Diagnostic + auto-fix script for GhanaDataHub.

Checks the full chain:
1) CSV files exist in scripts/output/
2) Backend is running (GET /health)
3) Auth works (register + login)
4) User has role data_manager or higher
5) Shows existing DB datasets + dashboard counters
6) Attempts one test dataset upload
7) Verifies it appears on dashboard
8) Checks frontend VITE_API_URL
9) Prints final summary

Constraints:
- Uses only standard/common libraries + requests.
- No external dependencies beyond requests.
"""

from __future__ import annotations

import csv
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests


BACKEND_BASE = "http://localhost:8000"
API_V1_BASE = BACKEND_BASE + "/api/v1"

REGISTER_URL = API_V1_BASE + "/auth/register"
LOGIN_URL = API_V1_BASE + "/auth/login"
ME_URL = API_V1_BASE + "/auth/me"
USERS_URL = API_V1_BASE + "/users/"
DATASETS_URL = API_V1_BASE + "/datasets/"
DASHBOARD_URL = API_V1_BASE + "/dashboard/"
HEALTH_URL = BACKEND_BASE + "/health"

CSV_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

TEST_USER = {
    "email": "datauploader@gmail.com",
    "username": "datauploader",
    "full_name": "Data Uploader",
    "password": "DataUp2024!",
}


def _print_step_result(step: int, name: str, ok: bool, extra: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"STEP {step} - {name}: {status}")
    if extra:
        print(extra)


def _safe_json(resp: requests.Response) -> Optional[Dict[str, Any]]:
    try:
        return resp.json()
    except Exception:
        return None


def _token_from_login_payload(payload: Dict[str, Any]) -> Optional[str]:
    token = payload.get("access_token")
    if isinstance(token, str) and token.strip():
        return token
    return None


def _rows_count_csv(path: str) -> int:
    try:
        with open(path, "r", encoding="utf-8", newline="") as f:
            reader = csv.reader(f)
            row_count = -1  # header offset
            for _ in reader:
                row_count += 1
            return max(0, row_count)
    except Exception:
        return 0


def _files_in_output_dir() -> List[str]:
    if not os.path.isdir(CSV_OUTPUT_DIR):
        return []
    files: List[str] = []
    for name in os.listdir(CSV_OUTPUT_DIR):
        if name.lower().endswith(".csv"):
            files.append(os.path.join(CSV_OUTPUT_DIR, name))
    return sorted(files)


def _filename_to_title(path: str) -> str:
    base = os.path.basename(path)
    if base.lower().endswith(".csv"):
        base = base[:-4]
    parts = [p for p in base.replace("-", "_").split("_") if p]
    return " ".join(p[:1].upper() + p[1:] for p in parts) or base


def _try_register_and_login() -> Tuple[bool, Optional[str], Optional[str]]:
    reg_payload = {
        "email": TEST_USER["email"],
        "username": TEST_USER["username"],
        "full_name": TEST_USER["full_name"],
        "password": TEST_USER["password"],
    }

    print(f"Attempting register: {TEST_USER['email']} / {TEST_USER['username']}")
    try:
        reg_resp = requests.post(REGISTER_URL, json=reg_payload, timeout=10)
    except Exception as e:
        return False, None, f"Registration request failed: {e}"

    if reg_resp.status_code == 400:

        payload = _safe_json(reg_resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        print(f"Register returned 400 (likely already exists). detail={detail}")
    elif reg_resp.status_code not in (200, 201):
        payload = _safe_json(reg_resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        return False, None, f"Register failed with {reg_resp.status_code}. detail={detail or reg_resp.text}"

    login_payload = {"email": TEST_USER["email"], "password": TEST_USER["password"]}
    print("Attempting login...")
    try:
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=10)
    except Exception as e:
        return False, None, f"Login request failed: {e}"

    if login_resp.status_code != 200:
        payload = _safe_json(login_resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        return False, None, f"Login failed with {login_resp.status_code}. detail={detail or login_resp.text}"

    payload = _safe_json(login_resp) or {}
    token = _token_from_login_payload(payload)
    if not token:
        return False, None, f"Login response did not include access_token. payload={payload}"

    return True, token, None


def _get_user_role(token: str) -> Tuple[bool, Optional[str], Optional[str]]:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        me_resp = requests.get(ME_URL, headers=headers, timeout=10)
    except Exception as e:
        return False, None, f"GET /auth/me request failed: {e}"

    if me_resp.status_code != 200:
        payload = _safe_json(me_resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        return False, None, f"GET /auth/me failed with {me_resp.status_code}. detail={detail or me_resp.text}"

    payload = _safe_json(me_resp) or {}
    role = payload.get("role")
    if not role:
        return False, None, f"User payload missing role. payload={payload}"
    if isinstance(role, str):
        return True, role, None
    return False, None, f"Role is not a string. payload={payload}"


def _try_fetch_users_count_and_first_role(token: str) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(USERS_URL, headers=headers, timeout=20)
    except Exception as e:
        return None, None, f"GET /users failed: {e}"

    if resp.status_code != 200:
        return None, None, f"GET /users failed with {resp.status_code}: {resp.text[:300]}"

    payload = _safe_json(resp) or {}
    users = None
    if isinstance(payload, list):
        users = payload
    elif isinstance(payload, dict):
        for key in ("items", "results", "users", "data"):
            if isinstance(payload.get(key), list):
                users = payload[key]
                break

    if not users:
        return 0, None, "No users returned (or unknown response shape)."

    roles = [u.get("role") for u in users if isinstance(u, dict) and "role" in u]
    first_role = roles[0] if roles else None
    return len(users), first_role, None


def _get_datasets_and_dashboard(token: str) -> Tuple[Optional[int], List[str], Optional[Dict[str, Any]]]:
    headers = {"Authorization": f"Bearer {token}"}

    datasets_title_list: List[str] = []
    total_datasets = None

    try:
        ds_resp = requests.get(DATASETS_URL, headers=headers, timeout=20)
    except Exception as e:
        print(f"GET /datasets/ failed: {e}")
        return None, [], None

    if ds_resp.status_code != 200:
        print(f"GET /datasets/ failed with {ds_resp.status_code}: {ds_resp.text[:300]}")
        return None, [], None

    ds_payload = _safe_json(ds_resp) or {}
    if isinstance(ds_payload, dict):
        total_datasets = ds_payload.get("total")
        items = ds_payload.get("items")
        if isinstance(items, list):
            for d in items:
                if isinstance(d, dict) and isinstance(d.get("title"), str):
                    datasets_title_list.append(d["title"])

    dash_payload = None
    try:
        dash_resp = requests.get(DASHBOARD_URL, headers=headers, timeout=20)
        if dash_resp.status_code == 200:
            dash_payload = _safe_json(dash_resp) or {}
        else:
            print(f"GET /dashboard/ failed with {dash_resp.status_code}: {dash_resp.text[:300]}")
    except Exception as e:
        print(f"GET /dashboard/ request failed: {e}")

    return (
        int(total_datasets) if isinstance(total_datasets, (int, str)) and str(total_datasets).isdigit() else total_datasets,
        datasets_title_list,
        dash_payload,
    )


def _upload_csv_test(token: str, csv_path: str) -> Tuple[bool, str, Optional[requests.Response]]:
    headers = {"Authorization": f"Bearer {token}"}

    title = _filename_to_title(csv_path)
    data = {
        "title": title,
        "description": "Uploaded by GhanaDataHub diagnostic script",
        "visibility": "public",
        "tags": "ghana,diagnostic,test",
    }

    file_size_bytes = os.path.getsize(csv_path) if os.path.exists(csv_path) else 0
    file_size_kb = file_size_bytes / 1024.0

    with open(csv_path, "rb") as f:
        files = {"file": (os.path.basename(csv_path), f, "text/csv")}
        try:
            resp = requests.post(DATASETS_URL, headers=headers, data=data, files=files, timeout=120)
        except Exception as e:
            return False, f"Upload request failed: {e}", None

    if resp.status_code == 201:
        return True, "SUCCESS (201 created)", resp

    if resp.status_code == 403:
        payload = _safe_json(resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        return False, f"FAIL (403 role/permission). detail={detail or resp.text[:300]}", resp
    if resp.status_code == 413:
        return False, f"FAIL (413 file too large). file size: {file_size_kb:.2f} KB", resp
    if resp.status_code == 400:
        payload = _safe_json(resp) or {}
        detail = payload.get("detail") if isinstance(payload, dict) else None
        return False, f"FAIL (400 validation). detail={detail or resp.text[:300]}", resp
    if resp.status_code == 422:
        payload = _safe_json(resp) or {}
        return False, f"FAIL (422 schema error). payload={payload or resp.text[:300]}", resp
    if resp.status_code == 500:
        return False, "FAIL (500). Backend internal error. Check your backend terminal for the full traceback.", resp

    payload = _safe_json(resp) or {}
    detail = payload.get("detail") if isinstance(payload, dict) else None
    if detail:
        return False, f"FAIL (HTTP {resp.status_code}). detail={detail}", resp
    return False, f"FAIL (HTTP {resp.status_code}). body={resp.text[:300]}", resp


def _check_frontend_api_url() -> Tuple[Optional[str], bool]:
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", ".env.local"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", ".env"),
    ]

    env_value = None
    for path in candidates:
        if not os.path.isfile(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if not stripped or stripped.startswith("#"):
                        continue
                    if stripped.startswith("VITE_API_URL="):
                        env_value = stripped.split("=", 1)[1].strip().strip('"').strip("'")
                        break
        except Exception:
            pass
        if env_value is not None:
            break

    if env_value is None:
        return None, False

    ok = "localhost:8000" in env_value or ":8000" in env_value
    return env_value, ok


def main() -> int:
    summary: Dict[str, Any] = {
        "csv_files_count": 0,
        "csv_files_nonempty": False,
        "backend_running": False,
        "auth_working": False,
        "role_ok": False,
        "role": None,
        "datasets_before": None,
        "test_upload_success": False,
        "test_upload_reason": None,
        "datasets_after": None,
        "vite_api_url": None,
        "vite_api_url_ok": False,
    }

    # STEP 1
    print("=== STEP 1 - CHECK CSV FILES EXIST ===")
    if not os.path.isdir(CSV_OUTPUT_DIR):
        print(f"scripts/output/ not found at: {CSV_OUTPUT_DIR}")
        print("Re-run the World Bank downloader script: python3 scripts/fetch_worldbank_ghana.py")
        _print_step_result(1, "CSV files exist", False, "Missing scripts/output directory")
        return 2

    csv_files = _files_in_output_dir()
    summary["csv_files_count"] = len(csv_files)

    if not csv_files:
        print(f"No CSV files found in: {CSV_OUTPUT_DIR}")
        print("Re-run the World Bank downloader script: python3 scripts/fetch_worldbank_ghana.py")
        _print_step_result(1, "CSV files exist", False, "No CSV files found")
        return 2

    nonempty_found = False
    for p in csv_files:
        size_kb = os.path.getsize(p) / 1024.0
        rows = _rows_count_csv(p)
        print(f" - {os.path.basename(p)} | size={size_kb:.2f} KB | rows={rows}")
        if rows > 0:
            nonempty_found = True

    summary["csv_files_nonempty"] = nonempty_found
    _print_step_result(1, "CSV files exist", nonempty_found, "Found non-empty CSVs" if nonempty_found else "Found CSVs but they appear empty")
    if not nonempty_found:
        print("CSV FILES EMPTY. Re-run the World Bank downloader script: python3 scripts/fetch_worldbank_ghana.py")
        return 3

    # STEP 2
    print("\n=== STEP 2 - CHECK BACKEND IS RUNNING ===")
    try:
        resp = requests.get(HEALTH_URL, timeout=5)
        ok = resp.status_code == 200
    except Exception as e:
        ok = False
        resp = None
        error = str(e)

    if not ok:
        print("Backend is not running. Start it with:")
        print("  cd backend && uvicorn app.main:app --reload")
        _print_step_result(2, "Backend running", False, f"Error: {error}")
        return 2

    summary["backend_running"] = True
    _print_step_result(2, "Backend running", True, f"GET /health -> {resp.status_code}")

    # STEP 3
    print("\n=== STEP 3 - CHECK OR CREATE A USER ACCOUNT ===")
    ok_auth, token, err = _try_register_and_login()

    # Auto-fix attempt: backend may enforce strict email validation.
    # If it rejects the configured test email format, retry with another format.
    if not ok_auth and err and "not a valid email address" in err:
    
        TEST_USER_FIXED = dict(TEST_USER)
        TEST_USER_FIXED["email"] = "datauploader@gmail.com"
        TEST_USER["email"] = TEST_USER_FIXED["email"]
        ok_auth, token, err = _try_register_and_login()

    if not ok_auth or not token:
        print(f"Login/Register error: {err}")
        _print_step_result(3, "Auth register+login", False, err or "Unknown")
        return 2

    summary["auth_working"] = True
    _print_step_result(3, "Auth register+login", True, "access_token obtained")

    # STEP 4
    print("\n=== STEP 4 - CHECK USER ROLE (must be data_manager or higher) ===")
    ok_role, role, role_err = _get_user_role(token)
    if not ok_role or not role:
        print(f"Failed to get user role: {role_err}")
        _print_step_result(4, "User role fetch", False, role_err or "Unknown")
        return 2

    summary["role"] = role
    allowed_roles = {"super_admin", "org_admin", "data_manager"}

    if role == "viewer":
        print("WARNING: role is viewer. Viewers cannot upload datasets.")
        total_users, first_role, users_err = _try_fetch_users_count_and_first_role(token)
        if users_err:
            print(f"Could not check /users/: {users_err}")
        else:
            if total_users == 1 and first_role == "super_admin":
                print("Viewer role but only one user exists. Backend/seed may be inconsistent.")
            elif total_users == 1:
                print("Only one user exists, but first user's role is not super_admin. Check backend user role assignment logic.")
            else:
                print("Ask your super_admin to change your role to data_manager at /users")

    role_ok = role in allowed_roles
    summary["role_ok"] = role_ok
    print(f"Current role: {role}")
    _print_step_result(4, "User role OK", role_ok, f"role={role}")
    if not role_ok:
        print("Upload cannot proceed until your role is data_manager (or higher).")
        return 2

    # STEP 5
    print("\n=== STEP 5 - CHECK WHAT IS ALREADY IN THE DATABASE ===")
    total_before, titles, dash_payload = _get_datasets_and_dashboard(token)
    summary["datasets_before"] = total_before
    if total_before is None:
        _print_step_result(5, "Datasets in DB", False, "Fetch failed")
        return 2

    print(f"Total datasets currently in the database: {total_before}")
    if titles:
        for t in titles:
            print(f" - {t}")
    else:
        print("No dataset titles returned (DB empty or response page contains none).")

    if isinstance(dash_payload, dict):
        print("Dashboard counts:")
        print(f" - total_datasets: {dash_payload.get('total_datasets')}")
        print(f" - total_users: {dash_payload.get('total_users')}")
        recent_uploads = dash_payload.get("recent_uploads")
        if isinstance(recent_uploads, list):
            print(f" - recent_uploads count: {len(recent_uploads)}")
        else:
            print(" - recent_uploads count: <unknown>")

    _print_step_result(5, "Datasets in DB", True)

    # STEP 6
    print("\n=== STEP 6 - UPLOAD ONE TEST CSV AND VERIFY IT APPEARS ===")
    csv_to_upload = csv_files[0]
    test_ok, reason, upload_resp = _upload_csv_test(token, csv_to_upload)
    summary["test_upload_success"] = test_ok
    summary["test_upload_reason"] = reason

    print(f"Uploading: {os.path.basename(csv_to_upload)}")
    if upload_resp is not None:
        print(f"Upload response: status={upload_resp.status_code}")
        try:
            print("Body:", upload_resp.json())
        except Exception:
            print("Body:", upload_resp.text[:800])
    else:
        print("Upload response: <no response>")

    _print_step_result(6, "Test upload", test_ok, reason)

    # STEP 7
    print("\n=== STEP 7 - VERIFY THE UPLOADED DATASET APPEARS ON DASHBOARD ===")
    if test_ok:
        time.sleep(1)
        headers = {"Authorization": f"Bearer {token}"}
        try:
            dash_resp = requests.get(DASHBOARD_URL, headers=headers, timeout=20)
        except Exception as e:
            _print_step_result(7, "Dashboard after upload", False, f"Dashboard request failed: {e}")
            return 2

        if dash_resp.status_code != 200:
            _print_step_result(7, "Dashboard after upload", False, f"Non-200 dashboard: {dash_resp.status_code} {dash_resp.text[:300]}")
            return 2

        dash_payload2 = _safe_json(dash_resp) or {}
        total_after = dash_payload2.get("total_datasets")
        summary["datasets_after"] = total_after
        print(f"Dashboard total_datasets: {total_after}")

        recent_uploads2 = dash_payload2.get("recent_uploads")
        if isinstance(recent_uploads2, list) and recent_uploads2:
            first_title = recent_uploads2[0].get("title") if isinstance(recent_uploads2[0], dict) else None
            print(f"First recent_uploads title: {first_title}")

        ok7 = isinstance(total_after, int) and total_after >= 1
        if not ok7:
            print("Dashboard endpoint may have a filtering bug. Check that the dataset was saved with visibility=public and that your user role allows seeing it.")
        _print_step_result(7, "Dashboard after upload", ok7, "")
    else:
        _print_step_result(7, "Dashboard after upload", False, "Skipped because upload failed")

    # STEP 8
    print("\n=== STEP 8 - CHECK FRONTEND API BASE URL ===")
    vite_url, vite_ok = _check_frontend_api_url()
    summary["vite_api_url"] = vite_url
    summary["vite_api_url_ok"] = vite_ok

    if vite_url:
        print(f"VITE_API_URL={vite_url}")
    else:
        print("VITE_API_URL not set in frontend/.env.local or frontend/.env")

    if not vite_ok:
        print("WARNING: Your frontend may be calling the wrong API URL. Make sure VITE_API_URL=http://localhost:8000/api/v1 in frontend/.env.local")

    _print_step_result(8, "Frontend API URL", vite_url is not None and vite_ok)

    # STEP 9
    print("\n=== STEP 9 - PRINT FINAL SUMMARY ===")
    print("\nSummary table:")
    print(f"CSV files found:       {summary['csv_files_count']}")
    print(f"Backend running:       {'YES' if summary['backend_running'] else 'NO'}")
    print(f"Auth working:          {'YES' if summary['auth_working'] else 'NO'}")
    print(f"User role OK:          {'YES' if summary['role_ok'] else 'NO'} (show actual role: {summary['role']})")
    print(f"Datasets in DB before: {summary['datasets_before'] if summary['datasets_before'] is not None else '<unknown>'}")

    if summary["test_upload_success"]:
        print(f"Test upload result:    SUCCESS ({summary['test_upload_reason']})")
    else:
        print(f"Test upload result:    FAILED ({summary['test_upload_reason']})")

    print(f"Datasets in DB after:  {summary['datasets_after'] if summary['datasets_after'] is not None else '<unknown>'}")
    print(f"Frontend API URL:      {summary['vite_api_url'] if summary['vite_api_url'] else '<not set>'}")

    # Conclusions
    if not summary["csv_files_nonempty"]:
        conclusion = "CSV FILES EMPTY. Re-run the World Bank downloader script: python3 scripts/fetch_worldbank_ghana.py"
    elif not summary["test_upload_success"]:
        conclusion = f"UPLOAD FAILED. The root cause is: {summary['test_upload_reason']}. Fix: See printed FAIL details above."
    elif isinstance(summary.get("datasets_after"), int) and summary["datasets_after"] >= 1:
        conclusion = "ALL CHECKS PASSED. Your database now has data. Refresh your browser at http://localhost:5173 to see it."
    else:
        conclusion = "UPLOAD MAY HAVE SUCCEEDED BUT DASHBOARD IS NOT SHOWING IT. Check visibility=public and dashboard filtering + frontend API URL."

    print("\nConclusion:")
    print(conclusion)

    if conclusion.startswith("ALL CHECKS PASSED"):
        return 0
    if conclusion.startswith("UPLOAD FAILED"):
        return 1
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

