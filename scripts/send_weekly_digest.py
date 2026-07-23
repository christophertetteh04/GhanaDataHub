#!/usr/bin/env python3
import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
LOG_FILE = SCRIPTS_DIR / "weekly_digest_log.txt"


def append_log(message: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as log_file:
        log_file.write(message.rstrip() + "\n")


def log(message: str) -> None:
    stamped = f"[{datetime.now(timezone.utc).isoformat()}] {message}"
    print(stamped)
    append_log(stamped)


def authenticate(api_base: str, email: str, password: str) -> str:
    import requests

    response = requests.post(
        f"{api_base}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    if not response.ok:
        raise RuntimeError(f"Login failed: {response.status_code} {response.text}")

    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("Login failed: missing access_token")
    return token


def run_pipeline(api_base: str, dry_run: bool = False) -> None:
    command = [
        sys.executable,
        str(SCRIPTS_DIR / "pipeline.py"),
        "--api-base",
        api_base,
    ]
    if dry_run:
        command.append("--dry-run")

    log(f"Running pipeline.py before weekly digest: {' '.join(command)}")
    result = subprocess.run(
        command,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
        timeout=int(os.getenv("DIGEST_PIPELINE_TIMEOUT_SECONDS", "900")),
    )
    if result.stdout:
        append_log(result.stdout)
    if result.stderr:
        append_log(result.stderr)
    if result.returncode != 0:
        raise RuntimeError(f"pipeline.py failed with exit code {result.returncode}")


def fetch_weekly_template(api_base: str, token: str) -> str:
    import requests

    response = requests.get(
        f"{api_base}/api/v1/brief/weekly-template",
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    if not response.ok:
        raise RuntimeError(f"Weekly template request failed: {response.status_code} {response.text}")
    return response.text.strip()


def split_subject(markdown: str) -> tuple[str, str]:
    lines = markdown.splitlines()
    if lines and lines[0].lower().startswith("subject:"):
        subject = lines[0].split(":", 1)[1].strip()
        body = "\n".join(lines[1:]).strip()
        return subject, body
    return "Ghana Data Digest", markdown


def markdown_to_basic_html(markdown: str) -> str:
    escaped = (
        markdown.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return (
        "<div style=\"font-family:Inter,Arial,sans-serif;font-size:14px;"
        "line-height:1.7;color:#111827;white-space:pre-wrap;\">"
        f"{escaped}</div>"
    )


def send_resend_email(markdown: str, dry_run: bool = False) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("DIGEST_FROM_EMAIL", "GhanaDataHub <briefs@ghanadatahub.com>")
    to_email = os.getenv("DIGEST_TO_EMAIL") or os.getenv("DIGEST_EDITOR_EMAIL")

    if not to_email:
        raise RuntimeError("DIGEST_TO_EMAIL or DIGEST_EDITOR_EMAIL must be set")

    subject, body = split_subject(markdown)
    recipients = [email.strip() for email in to_email.split(",") if email.strip()]

    if dry_run:
        log(f"DRY RUN: would send digest '{subject}' to {', '.join(recipients)}")
        append_log(body)
        return

    if not api_key:
        raise RuntimeError("RESEND_API_KEY must be set")

    import requests

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": recipients,
            "subject": subject,
            "text": body,
            "html": markdown_to_basic_html(body),
        },
        timeout=30,
    )
    if not response.ok:
        raise RuntimeError(f"Resend email failed: {response.status_code} {response.text}")
    log(f"Weekly digest emailed to {', '.join(recipients)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate and email the weekly GhanaDataHub digest.")
    parser.add_argument("--api-base", default=os.getenv("GDH_API_BASE", "http://localhost:8000"))
    parser.add_argument("--run-pipeline", action="store_true", help="Run scripts/pipeline.py before generating the digest")
    parser.add_argument("--skip-pipeline", action="store_true", help="Do not run scripts/pipeline.py even if configured")
    parser.add_argument("--dry-run", action="store_true", help="Generate but do not send email or upload data")
    args = parser.parse_args()

    api_base = args.api_base.rstrip("/")
    email = os.getenv("GDH_EMAIL")
    password = os.getenv("GDH_PASSWORD")

    if not email or not password:
        raise RuntimeError("GDH_EMAIL and GDH_PASSWORD must be set")

    should_run_pipeline = args.run_pipeline and not args.skip_pipeline
    if should_run_pipeline:
        run_pipeline(api_base, dry_run=args.dry_run)

    token = authenticate(api_base, email, password)
    markdown = fetch_weekly_template(api_base, token)
    send_resend_email(markdown, dry_run=args.dry_run)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        log(f"ERROR: {exc}")
        sys.exit(1)
