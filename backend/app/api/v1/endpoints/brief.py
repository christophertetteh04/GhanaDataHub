from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.v1.deps import require_roles
from app.core.database import get_db
from app.models.models import ActivityAction, ActivityLog, Dataset, User, UserRole, VisibilityEnum

router = APIRouter()


def iso_or_none(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def public_dataset_query(db: Session):
    return db.query(Dataset).filter(Dataset.visibility == VisibilityEnum.public)


def latest_dataset_for_terms(db: Session, *terms: str) -> Optional[Dataset]:
    filters = []
    for term in terms:
        pattern = f"%{term}%"
        filters.append(Dataset.title.ilike(pattern))
        filters.append(Dataset.description.ilike(pattern))

    return (
        public_dataset_query(db)
        .filter(or_(*filters))
        .order_by(Dataset.created_at.desc())
        .first()
    )


def build_indicator(label: str, dataset: Optional[Dataset]) -> dict:
    return {
        "label": label,
        "value": None,
        "dataset_id": str(dataset.id) if dataset else None,
        "updated_at": iso_or_none(dataset.updated_at) if dataset else None,
        "status": "live" if dataset else "unavailable",
    }


@router.get("/daily")
def get_daily_brief(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    forex = latest_dataset_for_terms(db, "forex", "exchange rate", "interbank forex")
    gse = latest_dataset_for_terms(db, "gse", "stock", "equity")
    inflation = latest_dataset_for_terms(db, "inflation", "cpi", "consumer price")
    cocoa = latest_dataset_for_terms(db, "cocoa", "commodity", "cocobod")

    total_datasets = public_dataset_query(db).count()
    new_datasets_today = (
        public_dataset_query(db)
        .filter(Dataset.created_at >= today_start)
        .count()
    )

    return {
        "date": now.date().isoformat(),
        "day_of_week": now.strftime("%A"),
        "indicators": [
            build_indicator("Cedi/USD", forex),
            build_indicator("GSE Composite", gse),
            build_indicator("Inflation Rate", inflation),
            build_indicator("Cocoa Price", cocoa),
        ],
        "new_datasets_today": new_datasets_today,
        "total_datasets": total_datasets,
        "generated_at": now.isoformat(),
    }


def format_dataset_line(dataset: Dataset, index: int, extra: Optional[str] = None) -> str:
    description = (dataset.description or "").strip().replace("\n", " ")
    if len(description) > 140:
        description = f"{description[:137]}..."
    suffix = f" - {description}" if description else ""
    extra_text = f" ({extra})" if extra else ""
    return f"{index}. {dataset.title}{extra_text}{suffix}"


def get_top_downloaded_this_week(db: Session, week_start: datetime):
    download_rows = (
        db.query(ActivityLog.resource_id, func.count(ActivityLog.id).label("downloads"))
        .filter(
            ActivityLog.action == ActivityAction.download,
            ActivityLog.resource_type == "dataset",
            ActivityLog.created_at >= week_start,
            ActivityLog.resource_id.isnot(None),
        )
        .group_by(ActivityLog.resource_id)
        .order_by(func.count(ActivityLog.id).desc())
        .limit(5)
        .all()
    )

    if download_rows:
        rows_by_id = {str(row.resource_id): int(row.downloads) for row in download_rows}
        dataset_ids = []
        for resource_id in rows_by_id:
            try:
                dataset_ids.append(UUID(resource_id))
            except ValueError:
                continue
        if not dataset_ids:
            return []
        datasets = (
            public_dataset_query(db)
            .filter(Dataset.id.in_(dataset_ids))
            .all()
        )
        datasets.sort(key=lambda dataset: rows_by_id.get(str(dataset.id), 0), reverse=True)
        return [(dataset, f"{rows_by_id.get(str(dataset.id), 0)} downloads this week") for dataset in datasets]

    fallback = (
        public_dataset_query(db)
        .order_by(Dataset.download_count.desc())
        .limit(5)
        .all()
    )
    return [(dataset, f"{dataset.download_count or 0} total downloads") for dataset in fallback]


@router.get("/weekly-template", response_class=PlainTextResponse)
def get_weekly_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    now = datetime.utcnow()
    week_start = datetime(now.year, now.month, now.day) - timedelta(days=now.weekday())
    week_end = week_start + timedelta(days=6)

    new_datasets = (
        public_dataset_query(db)
        .filter(Dataset.created_at >= week_start)
        .order_by(Dataset.created_at.desc())
        .limit(3)
        .all()
    )
    top_downloaded = get_top_downloaded_this_week(db, week_start)

    total_datasets = public_dataset_query(db).count()
    downloads_this_week = (
        db.query(func.count(ActivityLog.id))
        .filter(
            ActivityLog.action == ActivityAction.download,
            ActivityLog.created_at >= week_start,
        )
        .scalar()
        or 0
    )
    new_users_this_week = (
        db.query(func.count(User.id))
        .filter(User.created_at >= week_start)
        .scalar()
        or 0
    )

    new_dataset_lines = "\n".join(
        format_dataset_line(dataset, index)
        for index, dataset in enumerate(new_datasets, start=1)
    ) or "No new public datasets were added this week."

    top_downloaded_lines = "\n".join(
        format_dataset_line(dataset, index, extra)
        for index, (dataset, extra) in enumerate(top_downloaded[:3], start=1)
    ) or "No download activity was recorded this week."

    return f"""Subject: Ghana Data Digest - Week of {week_start.strftime("%d %b %Y")}

Hello - this week in Ghana data:

THIS WEEK'S HIGHLIGHT
[Write 3-4 sentences about the most significant Ghana data story or indicator movement this week.]

NEW DATASETS THIS WEEK
{new_dataset_lines}

MOST DOWNLOADED THIS WEEK
{top_downloaded_lines}

DATA STORY OF THE WEEK
[Add the most recent GhanaDataHub insight/story link.]

PLATFORM STATS
Total datasets: {total_datasets} | Downloads this week: {downloads_this_week} | New users: {new_users_this_week}

EDITORIAL NOTES
[Add context, caveats, source notes, and the CTA for readers.]

Date range: {week_start.strftime("%d %b %Y")} - {week_end.strftime("%d %b %Y")}
Generated at: {now.isoformat()} UTC
"""
