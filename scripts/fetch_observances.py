import os
import sys
import argparse
import logging
from datetime import datetime
from sqlalchemy.orm import Session
import requests

# Add the parent directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.database import SessionLocal
from backend.app.models.models import ObservanceFeature, Dataset
from backend.app.core.config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

CURATED_OBSERVANCES = {
    "World Health Day": {
        "category": "Health",
        "headline": "Highlighting Ghana's health infrastructure and outcomes.",
        "narrative": "World Health Day brings attention to public health issues. In Ghana, health data provides critical insights into ongoing challenges and progress.",
        "keywords": ["health", "hospital", "disease", "mortality"]
    },
    "Africa Day": {
        "category": "Governance",
        "headline": "Celebrating African Unity and Data.",
        "narrative": "Africa Day is the annual commemoration of the foundation of the Organisation of African Unity. We highlight datasets showing regional collaboration.",
        "keywords": ["africa", "governance", "union", "trade"]
    },
    "International Women's Day": {
        "category": "Demographics",
        "headline": "Empowering women through data visibility.",
        "narrative": "Focusing on gender parity, workforce participation, and education statistics for women in Ghana.",
        "keywords": ["women", "gender", "female", "equality"]
    },
    "World Teachers' Day": {
        "category": "Education",
        "headline": "Celebrating educators and tracking education metrics.",
        "narrative": "Teachers are the backbone of the nation. We highlight datasets on school enrollment and teacher-to-student ratios.",
        "keywords": ["teacher", "education", "school", "student"]
    },
    "Farmers' Day": {
        "category": "Agriculture",
        "headline": "Honoring the contribution of farmers to Ghana's economy.",
        "narrative": "Agriculture remains a key driver of Ghana's GDP. Explore datasets on crop yields, agricultural employment, and food security.",
        "keywords": ["farm", "agriculture", "crop", "cocoa"]
    },
    # Add more curated observances as needed to reach the full 28 list
}

def fetch_calendarific_observances(api_key: str, date_obj: datetime):
    url = "https://calendarific.com/api/v2/holidays"
    params = {
        "api_key": api_key,
        "country": "GH",
        "year": date_obj.year,
        "month": date_obj.month,
        "day": date_obj.day
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        holidays = data.get('response', {}).get('holidays', [])
        return [h.get('name') for h in holidays]
    except Exception as e:
        logging.error(f"Error fetching from Calendarific: {e}")
        return []

def find_best_dataset(db: Session, keywords: list):
    for keyword in keywords:
        dataset = db.query(Dataset).filter(Dataset.title.ilike(f"%{keyword}%")).first()
        if dataset:
            return dataset.id
    return None

def fetch_todays_observances(db: Session, date_obj: datetime = None):
    if not date_obj:
        date_obj = datetime.now()
        
    api_key = settings.CALENDARIFIC_API_KEY
    if not api_key:
        logging.error("CALENDARIFIC_API_KEY is not set. Cannot fetch from API.")
        return
        
    logging.info(f"Checking observances for {date_obj.date()}...")
    holidays = fetch_calendarific_observances(api_key, date_obj)
    
    if not holidays:
        logging.info("No observances found from API for today.")
        return

    for holiday in holidays:
        logging.info(f"API returned holiday: {holiday}")
        
        # Check if we already created a feature for this observance today
        existing = db.query(ObservanceFeature).filter(
            ObservanceFeature.observance_name == holiday,
            ObservanceFeature.observance_date == date_obj.date()
        ).first()
        
        if existing:
            logging.info(f"Observance '{holiday}' already exists in DB. Skipping.")
            continue
            
        curated_info = CURATED_OBSERVANCES.get(holiday)
        if curated_info:
            logging.info(f"Match found in curated list for '{holiday}'!")
            
            # Try to match a dataset based on keywords
            dataset_id = find_best_dataset(db, curated_info.get("keywords", []))
            
            new_feature = ObservanceFeature(
                observance_name=holiday,
                observance_date=date_obj.date(),
                category=curated_info["category"],
                headline=curated_info["headline"],
                narrative=curated_info["narrative"],
                featured_dataset_id=dataset_id,
                status="draft"
            )
            db.add(new_feature)
            db.commit()
            logging.info(f"Saved '{holiday}' to DB as draft.")
        else:
            logging.info(f"Holiday '{holiday}' is not in curated list. Ignored.")

def main():
    parser = argparse.ArgumentParser(description="Fetch and process daily observances")
    parser.add_argument("--date", type=str, help="Date in YYYY-MM-DD format (default: today)")
    args = parser.parse_args()

    date_obj = datetime.now()
    if args.date:
        try:
            date_obj = datetime.strptime(args.date, "%Y-%m-%d")
        except ValueError:
            logging.error("Invalid date format. Use YYYY-MM-DD.")
            return

    db = SessionLocal()
    try:
        fetch_todays_observances(db, date_obj)
    finally:
        db.close()

if __name__ == "__main__":
    main()
