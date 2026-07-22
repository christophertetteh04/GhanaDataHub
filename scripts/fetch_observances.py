import os
import sys


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.services.observance_fetcher import fetch_todays_observances


def main() -> None:
    db = SessionLocal()
    try:
        fetch_todays_observances(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
