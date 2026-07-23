#!/usr/bin/env python3
import argparse
import os
import sys
import subprocess
from pathlib import Path


def install_cron_line(current_crontab, marker, cron_line):
    if marker in current_crontab:
        return current_crontab, False
    clean = current_crontab.strip()
    return f"{clean}\n{cron_line}\n" if clean else f"{cron_line}\n", True


def main():
    parser = argparse.ArgumentParser(description="Install GhanaDataHub pipeline and digest cron jobs.")
    parser.add_argument("--print-only", action="store_true", help="Print the cron jobs without installing them")
    args = parser.parse_args()

    project_root = str(Path(__file__).resolve().parent.parent)
    venv_python = Path(project_root) / "backend" / "venv" / "bin" / "python"
    python_exe = os.getenv("GDH_PYTHON") or (str(venv_python) if venv_python.exists() else sys.executable)
    api_base = os.getenv("GDH_API_BASE", "http://localhost:8000")
    
    daily_pipeline_cmd = f"cd {project_root} && {python_exe} scripts/pipeline.py --api-base {api_base} >> scripts/pipeline_log.txt 2>&1"
    daily_pipeline_line = f"0 6 * * * {daily_pipeline_cmd}"

    weekly_digest_cmd = f"cd {project_root} && {python_exe} scripts/send_weekly_digest.py --api-base {api_base} --run-pipeline >> scripts/weekly_digest_log.txt 2>&1"
    weekly_digest_line = f"0 8 * * 5 {weekly_digest_cmd}"

    if args.print_only:
        print("Daily pipeline cron:")
        print(daily_pipeline_line)
        print("\nWeekly digest cron:")
        print(weekly_digest_line)
        return
    
    try:
        current_crontab = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
    except Exception:
        current_crontab = ""

    new_crontab, added_pipeline = install_cron_line(
        current_crontab,
        "scripts/pipeline.py --api-base",
        daily_pipeline_line,
    )
    new_crontab, added_digest = install_cron_line(
        new_crontab,
        "scripts/send_weekly_digest.py",
        weekly_digest_line,
    )

    if added_pipeline or added_digest:
        try:
            proc = subprocess.run(["crontab", "-"], input=new_crontab, text=True, capture_output=True)
        except PermissionError as exc:
            print(f"Failed to install cron jobs: {exc}")
            print("Run with the needed local permissions, or use --print-only and paste the lines into your scheduler.")
            return
        if proc.returncode == 0:
            if added_pipeline:
                print("Cron job installed. Pipeline will run daily at 06:00 UTC.")
            if added_digest:
                print("Cron job installed. Weekly digest will run Fridays at 08:00 UTC.")
        else:
            print("Failed to install cron jobs.")
            if proc.stderr:
                print(proc.stderr)
    else:
        print("Cron jobs already installed.")
        
    print("\nTo run on Render: go to New+ > Cron Job.")
    print("Daily pipeline command: python scripts/pipeline.py --api-base $GDH_API_BASE")
    print("Daily pipeline schedule: 0 6 * * *")
    print("Weekly digest command: python scripts/send_weekly_digest.py --api-base $GDH_API_BASE --run-pipeline")
    print("Weekly digest schedule: 0 8 * * 5")
    print("Environment variables: GDH_EMAIL, GDH_PASSWORD, GDH_API_BASE, RESEND_API_KEY, DIGEST_FROM_EMAIL, DIGEST_TO_EMAIL")

if __name__ == "__main__":
    main()
