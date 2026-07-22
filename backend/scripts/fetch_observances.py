from datetime import date, timedelta
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Dataset, ObservanceFeature


CURATED_OBSERVANCES: Dict[str, Dict[str, Any]] = {
    'World Food Day': {
        'category': 'Agriculture',
        'keywords': ['food', 'cocoa', 'agriculture', 'cassava', 'maize', 'nutrition'],
        'headline_template': 'On World Food Day: What Ghana food data shows',
        'narrative_template': 'Ghana is the world second-largest cocoa producer and one of West Africa most food-diverse economies. Today data shows both the achievements and the gaps in food security across Ghana 16 regions.',
        'key_datapoint': '38.1%',
        'key_datapoint_label': 'Food insecurity rate Q3 2025 (GSS)',
    },
    'World Cocoa Day': {
        'category': 'Agriculture',
        'keywords': ['cocoa', 'cacao', 'agriculture', 'faostat', 'commodity'],
        'headline_template': 'World Cocoa Day: Ghana produces 20% of the world supply',
        'narrative_template': 'Cocoa prices hit $6,455/MT in 2026 - a historic high. Yet Ghana cocoa farmers earn less than $2/day on average. The data behind this paradox is available to download below.',
        'key_datapoint': '$6,455/MT',
        'key_datapoint_label': 'Cocoa global price 2026',
    },
    'International Day of Education': {
        'category': 'Education',
        'keywords': ['education', 'literacy', 'enrolment', 'school', 'gender', 'parity'],
        'headline_template': 'Education Day: Ghana literacy gap by region visualised',
        'narrative_template': 'Primary school enrolment in Ghana reached 97.4% nationally. But in the Upper West Region only 43% of girls complete secondary education. Regional breakdown available below.',
        'key_datapoint': '97.4%',
        'key_datapoint_label': 'Ghana primary school enrolment rate',
    },
    'International Literacy Day': {
        'category': 'Education',
        'keywords': ['literacy', 'education', 'reading', 'adult'],
        'headline_template': 'Literacy Day: Ghana adult literacy by region and gender',
        'narrative_template': 'Ghana adult literacy rate stands at 79% nationally but masks a 22 percentage point gap between Greater Accra and the Northern Savannah zone. Download the full dataset.',
        'key_datapoint': '79%',
        'key_datapoint_label': 'Ghana adult literacy rate',
    },
    'World Teachers Day': {
        'category': 'Education',
        'keywords': ['teacher', 'school', 'education', 'pupil'],
        'headline_template': 'Teachers Day: Ghana pupil-teacher ratios by district',
        'narrative_template': 'The pupil-teacher ratio in Ghana public primary schools averages 32:1 nationally but reaches 65:1 in some Northern districts. Education data available below.',
        'key_datapoint': '32:1',
        'key_datapoint_label': 'National average pupil-teacher ratio',
    },
    'World Health Day': {
        'category': 'Health',
        'keywords': ['health', 'hospital', 'mortality', 'vaccination', 'medical'],
        'headline_template': 'World Health Day: Healthcare access across Ghana regions',
        'narrative_template': 'Ghana has made remarkable progress in reducing infant mortality from 80 per 1000 births in 2000 to 32 in 2024. Regional data shows the remaining gaps. Explore and download below.',
        'key_datapoint': '32 per 1,000',
        'key_datapoint_label': 'Ghana infant mortality rate 2024',
    },
    'World Mental Health Day': {
        'category': 'Health',
        'keywords': ['health', 'mental', 'wellbeing', 'hospital'],
        'headline_template': 'Mental Health Day: Ghana healthcare spending data',
        'narrative_template': 'Ghana allocates approximately 5% of its national budget to health. Mental health services represent a fraction of that. Health spending data by region available below.',
        'key_datapoint': '5%',
        'key_datapoint_label': 'Ghana health budget share',
    },
    'World AIDS Day': {
        'category': 'Health',
        'keywords': ['health', 'hiv', 'aids', 'disease'],
        'headline_template': 'World AIDS Day: Ghana HIV prevalence and treatment data',
        'narrative_template': 'Ghana HIV prevalence stands at 1.7% of the adult population. Treatment access has improved significantly since 2010. Regional breakdown available in the dataset below.',
        'key_datapoint': '1.7%',
        'key_datapoint_label': 'Ghana HIV adult prevalence rate',
    },
    'World Malaria Day': {
        'category': 'Health',
        'keywords': ['malaria', 'health', 'disease', 'vector'],
        'headline_template': 'World Malaria Day: Ghana malaria case data by region',
        'narrative_template': 'Malaria remains the leading cause of outpatient visits in Ghana. Cases are concentrated in the Savannah belt. Download regional malaria incidence data below.',
        'key_datapoint': '5M+',
        'key_datapoint_label': 'Annual malaria cases in Ghana',
    },
    'International Day of the African Child': {
        'category': 'Health',
        'keywords': ['child', 'mortality', 'vaccination', 'education', 'nutrition'],
        'headline_template': 'African Child Day: Child welfare indicators across Ghana',
        'narrative_template': 'Ghana under-5 mortality has fallen from 111 per 1000 in 2000 to 43 in 2024. Vaccination coverage varies significantly by region. Full dataset below.',
        'key_datapoint': '43 per 1,000',
        'key_datapoint_label': 'Ghana under-5 mortality rate 2024',
    },
    'World Population Day': {
        'category': 'Demographics',
        'keywords': ['population', 'census', 'demographic', 'growth', 'region'],
        'headline_template': 'World Population Day: Ghana population by region 2021',
        'narrative_template': 'Ghana population has grown from 6.7 million at independence in 1957 to 33 million in 2024. Greater Accra now holds 17% of the population on 1.4% of land. Census data below.',
        'key_datapoint': '33 million',
        'key_datapoint_label': 'Ghana total population 2024',
    },
    'International Women Day': {
        'category': 'Governance',
        'keywords': ['gender', 'women', 'maternal', 'girl', 'female', 'parity'],
        'headline_template': 'International Women Day: Gender data across Ghana sectors',
        'narrative_template': 'Women are 51% of Ghana population but 14.5% of MPs. Female literacy in the Northern Savannah zone is 42% vs 83% in Greater Accra. Download the full gender dataset.',
        'key_datapoint': '14.5%',
        'key_datapoint_label': 'Women in Ghana Parliament 2024',
    },
    'International Day of Rural Women': {
        'category': 'Agriculture',
        'keywords': ['rural', 'women', 'agriculture', 'farming', 'gender'],
        'headline_template': 'Rural Women Day: Women in Ghana agriculture sector',
        'narrative_template': 'Women make up 52% of Ghana agricultural workforce but own only 22% of agricultural land. Data on rural women employment and land rights below.',
        'key_datapoint': '52%',
        'key_datapoint_label': 'Women share of Ghana agricultural workforce',
    },
    'Africa Day': {
        'category': 'Economy',
        'keywords': ['gdp', 'economy', 'trade', 'development', 'africa'],
        'headline_template': 'Africa Day: Ghana compared to key African economies',
        'narrative_template': 'Ghana GDP per capita of $2,400 ranks it among the middle-income African nations. The cedi gained 8.2% YTD against the dollar - one of Africa best-performing currencies in 2026.',
        'key_datapoint': '$2,400',
        'key_datapoint_label': 'Ghana GDP per capita 2024',
    },
    'International Day for the Eradication of Poverty': {
        'category': 'Economy',
        'keywords': ['poverty', 'welfare', 'income', 'inequality', 'household'],
        'headline_template': 'Poverty Eradication Day: Ghana poverty rate by region',
        'narrative_template': 'Ghana national poverty rate fell from 51.7% in 1992 to 23.4% in 2017. But the Savannah regions remain above 50%. GLSS7 household survey data available below.',
        'key_datapoint': '23.4%',
        'key_datapoint_label': 'Ghana national poverty rate (GLSS7)',
    },
    'World Savings Day': {
        'category': 'Economy',
        'keywords': ['savings', 'finance', 'banking', 'deposit', 'interest'],
        'headline_template': 'World Savings Day: Ghana banking and savings data',
        'narrative_template': 'Ghana banking sector total deposits reached GH 250 billion in 2025. The savings-to-GDP ratio stands at 14%. Bank of Ghana banking sector data available below.',
        'key_datapoint': 'GH 250B',
        'key_datapoint_label': 'Ghana banking sector total deposits 2025',
    },
    'World Entrepreneurs Day': {
        'category': 'Economy',
        'keywords': ['business', 'entrepreneurship', 'sme', 'startup', 'trade'],
        'headline_template': 'Entrepreneurs Day: Ghana business registration data',
        'narrative_template': 'Ghana SMEs account for 70% of GDP and 80% of employment. Business registration data and trade statistics available to download and analyse.',
        'key_datapoint': '70%',
        'key_datapoint_label': 'SME contribution to Ghana GDP',
    },
    'World Environment Day': {
        'category': 'Environment',
        'keywords': ['environment', 'forest', 'land', 'deforestation', 'green'],
        'headline_template': 'Environment Day: Ghana land use and forest cover data',
        'narrative_template': 'Ghana has lost 90% of its original forest cover. Arable land accounts for 20.7% of total land area. Environmental and land use data available below.',
        'key_datapoint': '20.7%',
        'key_datapoint_label': 'Ghana arable land as share of total area',
    },
    'International Day of Clean Energy': {
        'category': 'Environment',
        'keywords': ['energy', 'electricity', 'renewable', 'power', 'access'],
        'headline_template': 'Clean Energy Day: Ghana electricity access by region',
        'narrative_template': 'Ghana national electricity access rate reached 84% in 2024, up from 43% in 2000. But 16% of Ghanaians - concentrated in rural Northern regions - remain unconnected. Energy data below.',
        'key_datapoint': '84%',
        'key_datapoint_label': 'Ghana electricity access rate 2024',
    },
    'World Soil Day': {
        'category': 'Agriculture',
        'keywords': ['soil', 'land', 'agriculture', 'farming', 'crop'],
        'headline_template': 'World Soil Day: Ghana agricultural land quality data',
        'narrative_template': 'Soil degradation threatens 40% of Ghana farmland. Agricultural land use data and crop yield trends available to download from our FAOSTAT collection.',
        'key_datapoint': '40%',
        'key_datapoint_label': 'Share of Ghana farmland with soil degradation',
    },
    'World Statistics Day': {
        'category': 'Governance',
        'keywords': ['statistics', 'data', 'census', 'survey'],
        'headline_template': 'World Statistics Day: GhanaDataHub platform overview',
        'narrative_template': 'On World Statistics Day we celebrate the power of data to drive evidence-based decisions. GhanaDataHub now hosts datasets covering economy, health, education, agriculture and governance. Explore everything available on the platform.',
        'key_datapoint': None,
        'key_datapoint_label': None,
    },
    'Africa Statistics Day': {
        'category': 'Governance',
        'keywords': ['statistics', 'data', 'africa', 'census', 'survey'],
        'headline_template': 'Africa Statistics Day: A year of Ghana data in review',
        'narrative_template': 'Africa Statistics Day celebrates the role of national statistics offices across the continent. We publish our annual platform transparency report today.',
        'key_datapoint': None,
        'key_datapoint_label': None,
    },
    'Open Data Day': {
        'category': 'Governance',
        'keywords': [],
        'headline_template': 'Open Data Day: All Ghana data, free to download',
        'narrative_template': 'Open Data Day is our biggest day of the year. Every dataset on GhanaDataHub is freely downloadable. Today we are releasing our most comprehensive dataset collection yet.',
        'key_datapoint': None,
        'key_datapoint_label': None,
    },
    'World Data Privacy Day': {
        'category': 'Governance',
        'keywords': ['privacy', 'data', 'protection', 'security'],
        'headline_template': 'Data Privacy Day: Ghana Data Protection Act explained',
        'narrative_template': 'Ghana Data Protection Act 2012 governs how personal data is collected and used. GhanaDataHub never collects personal data beyond what is necessary. Platform privacy policy linked below.',
        'key_datapoint': '2012',
        'key_datapoint_label': 'Year Ghana Data Protection Act was enacted',
    },
    'Ghana Independence Day': {
        'category': 'Governance',
        'keywords': ['ghana', 'independence', 'history', 'development'],
        'headline_template': 'Independence Day: Ghana development journey in data',
        'narrative_template': 'Since independence on 6 March 1957, Ghana population has grown 5x, GDP per capita has risen 8x, and life expectancy has increased from 45 to 68 years. Explore the data journey.',
        'key_datapoint': '1957',
        'key_datapoint_label': 'Year of Ghana independence',
    },
}


def _fetch_calendarific_day(api_key: str, country: str, target_date: date, holiday_type: str) -> List[dict]:
    response = requests.get(
        "https://calendarific.com/api/v2/holidays",
        params={
            "api_key": api_key,
            "country": country,
            "year": target_date.year,
            "month": target_date.month,
            "day": target_date.day,
            "type": holiday_type,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json().get("response", {}).get("holidays", [])


def _find_curated_entry(name: str) -> Optional[tuple[str, Dict[str, Any]]]:
    observed = name.lower()
    for curated_name, metadata in CURATED_OBSERVANCES.items():
        curated = curated_name.lower()
        if curated in observed or observed in curated:
            return curated_name, metadata
    return None


def _find_related_dataset_ids(db: Session, keywords: List[str]) -> List[str]:
    datasets_by_id = {}
    for keyword in keywords:
        matches = (
            db.query(Dataset)
            .filter(Dataset.title.ilike(f"%{keyword}%"))
            .limit(3)
            .all()
        )
        for dataset in matches:
            datasets_by_id[str(dataset.id)] = dataset
            if len(datasets_by_id) >= 3:
                return list(datasets_by_id.keys())
    return list(datasets_by_id.keys())


def _process_observance(db: Session, observance: dict, target_date: date) -> None:
    name = observance.get("name")
    if not name:
        return

    curated_match = _find_curated_entry(name)
    if curated_match is None:
        return

    curated_name, metadata = curated_match
    existing = (
        db.query(ObservanceFeature)
        .filter(
            ObservanceFeature.observance_name == curated_name,
            ObservanceFeature.observance_date == target_date,
        )
        .first()
    )
    if existing:
        return

    feature = ObservanceFeature(
        observance_name=curated_name,
        observance_date=target_date,
        category=metadata["category"],
        headline=metadata["headline_template"],
        narrative=metadata["narrative_template"],
        key_datapoint=metadata["key_datapoint"],
        key_datapoint_label=metadata["key_datapoint_label"],
        related_dataset_ids=_find_related_dataset_ids(db, metadata["keywords"]),
        calendarific_data=observance,
        status="pending",
    )
    db.add(feature)
    db.commit()
    print(f"Created ObservanceFeature for: {curated_name}")


def fetch_todays_observances(db: Session) -> None:
    if settings.CALENDARIFIC_API_KEY is None:
        print("Warning: CALENDARIFIC_API_KEY is not set. Skipping observance fetch.")
        return

    seen_by_day = set()
    today = date.today()
    for offset in range(8):
        target_date = today + timedelta(days=offset)
        observances = []

        for country, holiday_type in (
            ("GH", "national,observance"),
            ("US", "observance"),
        ):
            try:
                observances.extend(
                    _fetch_calendarific_day(
                        settings.CALENDARIFIC_API_KEY,
                        country,
                        target_date,
                        holiday_type,
                    )
                )
            except requests.RequestException as exc:
                print(f"Warning: Calendarific fetch failed for {country} {target_date}: {exc}")

        for observance in observances:
            name = observance.get("name")
            dedupe_key = (target_date, name.lower() if name else "")
            if not name or dedupe_key in seen_by_day:
                continue
            seen_by_day.add(dedupe_key)
            _process_observance(db, observance, target_date)


if __name__ == '__main__':
    from app.core.database import SessionLocal

    db = SessionLocal()
    fetch_todays_observances(db)
    db.close()
