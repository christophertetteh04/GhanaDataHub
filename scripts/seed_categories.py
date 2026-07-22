import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.models import Category


CATEGORIES_TO_SEED = [
    {
        "name": "Economy and Finance",
        "description": "GDP, inflation, forex rates, monetary policy, treasury, tax, trade, banking",
        "icon": "TrendingUp",
        "colour": "#006B3F",
    },
    {
        "name": "Agriculture and Food",
        "description": "Cocoa, cassava, maize, food prices, FAOSTAT, COCOBOD, land use",
        "icon": "Leaf",
        "colour": "#92400E",
    },
    {
        "name": "Health",
        "description": "Maternal mortality, vaccination, health facilities, NHIA, disease burden",
        "icon": "Heart",
        "colour": "#DC2626",
    },
    {
        "name": "Education",
        "description": "Literacy rates, enrolment, pupil-teacher ratios, BECE/WASSCE results",
        "icon": "GraduationCap",
        "colour": "#1D4ED8",
    },
    {
        "name": "Demographics",
        "description": "Census data, population projections, regional and district population",
        "icon": "Users",
        "colour": "#7C3AED",
    },
    {
        "name": "Governance and Electoral",
        "description": "Voter registration, election results, parliamentary data, government spending",
        "icon": "Scale",
        "colour": "#0369A1",
    },
    {
        "name": "Energy and Infrastructure",
        "description": "Electricity access, energy mix, road networks, water and sanitation, telecoms",
        "icon": "Zap",
        "colour": "#D97706",
    },
    {
        "name": "Environment and Climate",
        "description": "Temperature, rainfall, deforestation, land use, greenhouse gas, sea level",
        "icon": "Wind",
        "colour": "#059669",
    },
    {
        "name": "Financial Markets",
        "description": "GSE daily stocks, ETF data, cryptocurrency, global market indices",
        "icon": "BarChart2",
        "colour": "#BE123C",
    },
    {
        "name": "Trade and Commerce",
        "description": "Import export data, trade partners, customs revenue, port activity",
        "icon": "Globe",
        "colour": "#0891B2",
    },
    {
        "name": "Social Welfare",
        "description": "Poverty rates, inequality, social protection, LEAP programme, school feeding",
        "icon": "HandHeart",
        "colour": "#DB2777",
    },
    {
        "name": "Real Estate and Housing",
        "description": "Housing prices, housing supply, GREDA reports, mortgage market",
        "icon": "Building2",
        "colour": "#9333EA",
    },
]


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug


def seed_categories() -> None:
    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for entry in CATEGORIES_TO_SEED:
            existing = db.query(Category).filter(Category.name == entry["name"]).first()
            if not existing:
                db.add(Category(**entry, slug=slugify(entry["name"])))
                created += 1
                continue

            changed = False
            for field in ("description", "icon", "colour"):
                if getattr(existing, field) != entry[field]:
                    setattr(existing, field, entry[field])
                    changed = True
            if not existing.slug:
                existing.slug = slugify(existing.name)
                changed = True
            if changed:
                updated += 1

        db.commit()
        print(f"Seeded {len(CATEGORIES_TO_SEED)} categories.")
        print(f"Created {created}, updated {updated}, skipped {len(CATEGORIES_TO_SEED) - created - updated}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
