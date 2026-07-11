#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path

def main():
    python_exe = sys.executable
    project_root = str(Path(__file__).resolve().parent.parent)
    api_base = os.getenv("GDH_API_BASE", "http://localhost:8000")
    
    cron_cmd = f"cd {project_root} && {python_exe} scripts/pipeline.py --api-base {api_base} >> scripts/pipeline_log.txt 2>&1"
    cron_line = f"0 6 * * * {cron_cmd}"
    
    try:
        current_crontab = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
    except Exception:
        current_crontab = ""
        
    if "scripts/pipeline.py" not in current_crontab:
        new_crontab = current_crontab.strip() + f"\n{cron_line}\n"
        proc = subprocess.run(["crontab", "-"], input=new_crontab, text=True, capture_output=True)
        if proc.returncode == 0:
            print("Cron job installed. Pipeline will run daily at 06:00 UTC.")
        else:
            print("Failed to install cron job.")
    else:
        print("Cron job already installed. Pipeline will run daily at 06:00 UTC.")
        
    print("\nTo run on Render: go to New+ > Cron Job.")
    print("Command: python scripts/pipeline.py --api-base $GDH_API_BASE")
    print("Schedule: 0 6 * * *")
    print("Environment variables: GDH_EMAIL, GDH_PASSWORD, GDH_API_BASE")

if __name__ == "__main__":
    main()
