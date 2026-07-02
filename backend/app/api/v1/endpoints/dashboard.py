from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
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
