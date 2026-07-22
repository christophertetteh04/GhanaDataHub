import csv
import os
import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, or_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.models import (
    Dataset,
    User,
    Organization,
    Category,
    Notification,
    ActivityLog,
    VisibilityEnum,
    UserRole,
)
from app.schemas.schemas import DatasetOut
from app.api.v1.deps import get_current_user

router = APIRouter()


def get_accessible_dataset_query(db: Session, current_user: User):
    if current_user.role == UserRole.super_admin:
        return db.query(Dataset)
    return db.query(Dataset).filter(
        (Dataset.visibility == VisibilityEnum.public)
        | (Dataset.owner_id == current_user.id)
        | (Dataset.organization_id == current_user.organization_id)
    )


def parse_number(value):
    if value is None:
        return None
    match = re.search(r"-?[\d,]+(?:\.\d+)?", str(value))
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def format_value(value, unit="", prefix="", decimals=2):
    if value is None:
        return None
    if abs(value) >= 1000:
        number = f"{value:,.0f}" if decimals == 0 else f"{value:,.{decimals}f}"
    else:
        number = f"{value:.{decimals}f}"
    return f"{prefix}{number}{unit}"


def read_csv_rows(dataset: Dataset):
    if not dataset.file_path or not os.path.exists(dataset.file_path):
        return []
    if not (
        (dataset.file_type or "").lower() in ("text/csv", "application/csv")
        or (dataset.file_name or "").lower().endswith(".csv")
    ):
        return []

    with open(dataset.file_path, "r", encoding="utf-8", errors="ignore", newline="") as csv_file:
        return list(csv.DictReader(csv_file))


def find_latest_dataset(base_q, *terms):
    filters = []
    for term in terms:
        pattern = f"%{term}%"
        filters.append(Dataset.title.ilike(pattern))
        filters.append(Dataset.description.ilike(pattern))

    return (
        base_q.filter(or_(*filters))
        .order_by(Dataset.updated_at.desc(), Dataset.created_at.desc())
        .first()
    )


def newest_row(rows):
    if not rows:
        return None
    return sorted(rows, key=lambda row: row.get("date") or "", reverse=True)[0]


def extract_percent_from_title(dataset):
    if not dataset:
        return None
    match = re.search(r"(-?[\d,]+(?:\.\d+)?)\s*%", dataset.title or "")
    if not match:
        return None
    return parse_number(match.group(1))


def build_pulse_item(key, title, dataset=None, value=None, direction="stable", indicator=None, comp_value=None):
    return {
        "key": key,
        "title": title,
        "value": value,
        "direction": direction,
        "live": bool(dataset or key == "platform"),
        "updated_at": dataset.updated_at.isoformat() if dataset and dataset.updated_at else None,
        "dataset_id": str(dataset.id) if dataset else None,
        "download_count": dataset.download_count if dataset else 0,
        "indicator": indicator,
        "comp_value": comp_value,
    }


@router.get("/economic-pulse")
def get_economic_pulse(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_q = get_accessible_dataset_query(db, current_user)

    forex_dataset = find_latest_dataset(base_q, "forex", "interbank forex", "exchange rate")
    inflation_dataset = find_latest_dataset(base_q, "inflation", "cpi", "consumer price")
    cocoa_dataset = find_latest_dataset(base_q, "cocoa", "commodity")
    gse_dataset = find_latest_dataset(base_q, "gse", "stock", "equity")

    forex_value = None
    forex_rows = read_csv_rows(forex_dataset) if forex_dataset else []
    for row in forex_rows:
        pair = f"{row.get('currency_pair', '')} {row.get('pair', '')}".upper().replace("/", "")
        if "USD" in pair and ("GHS" in pair or "GHANA" in pair):
            buy = parse_number(row.get("buy_rate") or row.get("buy"))
            sell = parse_number(row.get("sell_rate") or row.get("sell"))
            forex_value = sell or buy or ((buy + sell) / 2 if buy and sell else None)
            break

    inflation_value = None
    inflation_rows = read_csv_rows(inflation_dataset) if inflation_dataset else []
    inflation_row = None
    for row in inflation_rows:
        text = " ".join(str(v) for v in row.values()).lower()
        if "inflation" in text or "cpi" in text:
            inflation_row = row
    if inflation_row is None:
        inflation_row = newest_row(inflation_rows)
    if inflation_row:
        for key in ("value", "inflation", "rate", "annual inflation rate"):
            inflation_value = parse_number(inflation_row.get(key))
            if inflation_value is not None:
                break
    if inflation_value is None:
        inflation_value = extract_percent_from_title(inflation_dataset)

    cocoa_value = None
    cocoa_direction = "stable"
    cocoa_rows = read_csv_rows(cocoa_dataset) if cocoa_dataset else []
    for row in cocoa_rows:
        text = " ".join(str(v) for v in row.values()).lower()
        if "cocoa" in text:
            cocoa_value = parse_number(row.get("price") or row.get("value") or row.get("price_usd"))
            change = parse_number(row.get("daily_change_pct") or row.get("change_pct"))
            if change is not None:
                cocoa_direction = "up" if change > 0 else "down" if change < 0 else "stable"
            break

    gse_value = None
    gse_direction = "stable"
    gse_rows = read_csv_rows(gse_dataset) if gse_dataset else []
    if gse_rows:
        changes = [
            parse_number(row.get("change_pct") or row.get("ytd_change_pct"))
            for row in gse_rows
        ]
        changes = [value for value in changes if value is not None]
        if changes:
            gse_value = sum(changes) / len(changes)
            gse_direction = "up" if gse_value > 0 else "down" if gse_value < 0 else "stable"

    total_datasets = base_q.count()

    return {
        "refreshed_at": datetime.utcnow().isoformat(),
        "items": [
            build_pulse_item(
                "cedi",
                "USD / GHS",
                forex_dataset,
                format_value(forex_value, decimals=2) or "11.46",
                "stable",
                "cedi",
                forex_value or 11.46,
            ),
            build_pulse_item(
                "inflation",
                "Inflation Rate",
                inflation_dataset,
                format_value(inflation_value, unit="%", decimals=2) or "5.30%",
                "down" if inflation_value is not None and inflation_value < 15 else "up",
                "inflation",
                inflation_value or 5.3,
            ),
            build_pulse_item(
                "cocoa",
                "Cocoa (USD/MT)",
                cocoa_dataset,
                format_value(cocoa_value, prefix="$", decimals=0) or "$6,455",
                cocoa_direction,
                "cocoa",
                cocoa_value or 6455,
            ),
            build_pulse_item(
                "gse",
                "GSE Movement",
                gse_dataset,
                format_value(gse_value, unit="%", decimals=2) if gse_value is not None else "14,780",
                gse_direction,
                "gse",
                gse_value if gse_value is not None else 25,
            ),
            {
                "key": "platform",
                "title": "Datasets",
                "value": f"{total_datasets:,}",
                "direction": "up",
                "live": True,
                "updated_at": datetime.utcnow().isoformat(),
                "dataset_id": None,
                "download_count": total_datasets,
                "indicator": None,
                "comp_value": None,
            },
        ],
    }


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Base query based on role
    base_q = get_accessible_dataset_query(db, current_user)

    total_datasets = base_q.count()
    total_storage = db.query(func.sum(Dataset.file_size)).scalar() or 0
    total_users = db.query(User).count()
    total_orgs = db.query(Organization).count()

    # Most downloaded
    most_downloaded = base_q.order_by(Dataset.download_count.desc()).limit(5).all()

    # Recent uploads
    recent_uploads = base_q.order_by(Dataset.created_at.desc()).limit(5).all()

    # Monthly uploads (last 6 months)
    monthly_uploads = []
    for i in range(5, -1, -1):
        month_date = datetime.utcnow() - timedelta(days=30 * i)
        count = base_q.filter(
            extract("month", Dataset.created_at) == month_date.month,
            extract("year", Dataset.created_at) == month_date.year,
        ).count()
        monthly_uploads.append({
            "month": month_date.strftime("%b %Y"),
            "count": count,
        })

    # By visibility
    visibility_stats = []
    for vis in VisibilityEnum:
        count = base_q.filter(Dataset.visibility == vis).count()
        visibility_stats.append({"visibility": vis.value, "count": count})

    my_datasets_count = db.query(func.count(Dataset.id)).filter(
        Dataset.owner_id == current_user.id
    ).scalar() or 0

    my_organization_name = (
        current_user.organization.name if current_user.organization else None
    )

    unread_notifications_count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .scalar()
        or 0
    )

    datasets_by_category = (
        base_q.join(Category, Dataset.category)
        .with_entities(Category.name.label("category"), func.count(Dataset.id).label("count"))
        .group_by(Category.name)
        .order_by(func.count(Dataset.id).desc())
        .limit(5)
        .all()
    )
    datasets_by_category = [
        {"category": category, "count": count}
        for category, count in datasets_by_category
    ]

    activity_q = db.query(
        ActivityLog.action,
        ActivityLog.resource_type,
        ActivityLog.resource_id,
        ActivityLog.created_at,
        User.email.label("user_email"),
        User.full_name.label("user_full_name"),
    ).outerjoin(User, ActivityLog.user)

    if current_user.role != UserRole.super_admin:
        activity_q = activity_q.filter(ActivityLog.user_id == current_user.id)

    recent_activity = [
        {
            "action": row.action,
            "resource_type": row.resource_type,
            "resource_id": row.resource_id,
            "created_at": row.created_at,
            "user_email": row.user_email,
            "user_full_name": row.user_full_name,
        }
        for row in activity_q.order_by(ActivityLog.created_at.desc()).limit(5).all()
    ]

    my_recent_uploads = (
        db.query(Dataset)
        .filter(Dataset.owner_id == current_user.id)
        .order_by(Dataset.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "total_datasets": total_datasets,
        "total_users": total_users,
        "total_organizations": total_orgs,
        "total_storage_bytes": total_storage,
        "most_downloaded": [DatasetOut.model_validate(d) for d in most_downloaded],
        "recent_uploads": [DatasetOut.model_validate(d) for d in recent_uploads],
        "monthly_uploads": monthly_uploads,
        "datasets_by_visibility": visibility_stats,
        "my_datasets_count": my_datasets_count,
        "my_organization_name": my_organization_name,
        "unread_notifications_count": unread_notifications_count,
        "datasets_by_category": datasets_by_category,
        "recent_activity": recent_activity,
        "my_recent_uploads": [DatasetOut.model_validate(d) for d in my_recent_uploads],
    }
