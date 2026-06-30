from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.models import Dataset, User, Organization, VisibilityEnum, UserRole
from app.schemas.schemas import DatasetOut
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Base query based on role
    if current_user.role == UserRole.super_admin:
        base_q = db.query(Dataset)
    else:
        base_q = db.query(Dataset).filter(
            (Dataset.visibility == VisibilityEnum.public) |
            (Dataset.owner_id == current_user.id) |
            (Dataset.organization_id == current_user.organization_id)
        )

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

    return {
        "total_datasets": total_datasets,
        "total_users": total_users,
        "total_organizations": total_orgs,
        "total_storage_bytes": total_storage,
        "most_downloaded": [DatasetOut.model_validate(d) for d in most_downloaded],
        "recent_uploads": [DatasetOut.model_validate(d) for d in recent_uploads],
        "monthly_uploads": monthly_uploads,
        "datasets_by_visibility": visibility_stats,
    }
