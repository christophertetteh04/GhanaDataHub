import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.models import Category, Dataset


KEYWORD_MAP = {
    "Economy and Finance": [
        "gdp", "inflation", "forex", "exchange rate", "monetary", "treasury",
        "tax", "revenue", "banking", "interest rate", "cedi", "ghs", "imf",
        "world bank", "fiscal", "budget", "debt", "bond", "credit",
        "unemployment", "employment", "labour", "jobs",
    ],
    "Agriculture and Food": [
        "cocoa", "cassava", "maize", "crop", "farm", "food", "agriculture",
        "harvest", "yield", "livestock", "fishery", "cocobod", "faostat",
        "irrigation", "fertilizer", "rural",
    ],
    "Health": [
        "health", "mortality", "hospital", "clinic", "vaccination", "malaria",
        "hiv", "aids", "maternal", "infant", "disease", "nutrition", "nhia",
        "ghs", "medical", "doctor", "nurse", "facility",
    ],
    "Education": [
        "education", "literacy", "school", "enrolment", "teacher", "pupil",
        "bece", "wassce", "university", "learning", "dropout", "gender parity",
    ],
    "Demographics": [
        "population", "census", "demographic", "birth", "death", "age",
        "migration", "household", "district", "region", "urban", "rural",
    ],
    "Governance and Electoral": [
        "voter", "election", "electoral", "parliament", "constituency",
        "government", "policy", "law", "procurement", "corruption",
    ],
    "Energy and Infrastructure": [
        "electricity", "energy", "power", "road", "water", "sanitation",
        "telecoms", "internet", "broadband", "ecg", "gridco", "gwcl",
    ],
    "Environment and Climate": [
        "climate", "temperature", "rainfall", "forest", "deforestation",
        "land use", "carbon", "emission", "drought", "flood",
    ],
    "Financial Markets": [
        "stock", "gse", "share", "equity", "etf", "crypto", "bitcoin",
        "index", "dividend", "eps", "market cap", "listed",
    ],
    "Trade and Commerce": [
        "import", "export", "trade", "customs", "port", "tariff",
        "comtrade", "commerce", "logistics", "supply chain",
    ],
    "Social Welfare": [
        "poverty", "inequality", "gini", "welfare", "social", "leap",
        "vulnerable", "beneficiary", "assistance", "subsidy",
    ],
    "Real Estate and Housing": [
        "real estate", "housing", "property", "rent", "mortgage", "greda",
        "construction", "land title",
    ],
}


def categorise_dataset(dataset, categories_by_name):
    text = f'{dataset.title} {dataset.description or ""}'.lower()
    scores = {}
    for cat_name, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[cat_name] = score
    if not scores:
        return None
    best_cat = max(scores, key=scores.get)
    return categories_by_name.get(best_cat)


def auto_categorise() -> None:
    db = SessionLocal()
    categorised = 0
    unmatched = 0
    try:
        categories_by_name = {category.name: category for category in db.query(Category).all()}
        datasets = db.query(Dataset).filter(Dataset.category_id.is_(None)).all()

        for index, dataset in enumerate(datasets, start=1):
            category = categorise_dataset(dataset, categories_by_name)
            if not category:
                unmatched += 1
                continue

            dataset.category_id = category.id
            categorised += 1
            print(f"Assigned {category.name} to: {dataset.title}")

            if index % 50 == 0:
                db.commit()

        db.commit()
        print(f"{categorised} datasets categorised, {unmatched} could not be matched.")
    finally:
        db.close()


if __name__ == "__main__":
    auto_categorise()
