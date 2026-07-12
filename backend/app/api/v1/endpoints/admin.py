import re
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.v1.deps import get_current_user, require_roles
from app.core.database import get_db
from app.models.models import (
    ActivityAction,
    ActivityLog,
    Dataset,
    Organization,
    User,
    UserRole,
    VisibilityEnum,
)
from app.schemas.schemas import UserOut, UserRoleUpdate

router = APIRouter()


def parse_date(date_value: str) -> datetime:
    try:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", date_value):
            return datetime.strptime(date_value, "%Y-%m-%d")
        return datetime.fromisoformat(date_value)
    except ValueError:
        raise HTTPException(status_code=400, detail="date_from must be YYYY-MM-DD or ISO format")


@router.get("/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    last_24h = now - timedelta(hours=24)

    total_users = db.query(func.count(User.id)).scalar() or 0
    new_users_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_users_this_week = db.query(func.count(User.id)).filter(User.created_at >= week_start).scalar() or 0
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0
    new_datasets_today = db.query(func.count(Dataset.id)).filter(Dataset.created_at >= today_start).scalar() or 0
    new_datasets_this_week = db.query(func.count(Dataset.id)).filter(Dataset.created_at >= week_start).scalar() or 0
    total_downloads_all_time = db.query(func.coalesce(func.sum(Dataset.download_count), 0)).scalar() or 0
    total_storage_bytes = db.query(func.coalesce(func.sum(Dataset.file_size), 0)).scalar() or 0
    total_organizations = db.query(func.count(Organization.id)).scalar() or 0
    active_users_last_30_days = (
        db.query(func.count(func.distinct(ActivityLog.user_id)))
        .filter(ActivityLog.user_id != None, ActivityLog.created_at >= thirty_days_ago)
        .scalar()
        or 0
    )
    error_events_last_24h = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == ActivityAction.failed_login, ActivityLog.created_at >= last_24h)
        .scalar()
        or 0
    )

    datasets_by_status = {"public": 0, "private": 0, "organization": 0}
    for visibility, count in (
        db.query(Dataset.visibility, func.count(Dataset.id)).group_by(Dataset.visibility).all()
    ):
        key = visibility.value if hasattr(visibility, "value") else str(visibility)
        datasets_by_status[key] = count

    recent_signups = []
    for user in db.query(User).order_by(User.created_at.desc()).limit(5).all():
        recent_signups.append(
            {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value if hasattr(user.role, "value") else str(user.role),
                "created_at": user.created_at,
            }
        )

    return {
        "total_users": total_users,
        "new_users_today": new_users_today,
        "new_users_this_week": new_users_this_week,
        "total_datasets": total_datasets,
        "new_datasets_today": new_datasets_today,
        "new_datasets_this_week": new_datasets_this_week,
        "total_downloads_all_time": total_downloads_all_time,
        "total_storage_bytes": total_storage_bytes,
        "total_organizations": total_organizations,
        "active_users_last_30_days": active_users_last_30_days,
        "error_events_last_24h": error_events_last_24h,
        "datasets_by_status": datasets_by_status,
        "top_search_terms": [],
        "recent_signups": recent_signups,
    }


@router.get("/users")
def list_admin_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user_counts = (
        db.query(Dataset.owner_id.label("owner_id"), func.count(Dataset.id).label("dataset_count"))
        .group_by(Dataset.owner_id)
        .subquery()
    )

    query = (
        db.query(User, func.coalesce(user_counts.c.dataset_count, 0).label("dataset_count"))
        .outerjoin(user_counts, user_counts.c.owner_id == User.id)
    )

    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
            | User.username.ilike(f"%{search}%")
        )
    if role:
        valid_roles = {r.value for r in UserRole}
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role filter")
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for user, dataset_count in users:
        user_out = UserOut.model_validate(user).model_dump()
        user_out["dataset_count"] = int(dataset_count)
        items.append(user_out)

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.post("/users/{user_id}/role")
def change_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role == UserRole.super_admin and current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Cannot assign super_admin role")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/datasets")
def list_admin_datasets(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    visibility: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    query = db.query(Dataset).options(joinedload(Dataset.owner), joinedload(Dataset.organization))
    if search:
        query = query.filter(
            Dataset.title.ilike(f"%{search}%")
            | Dataset.description.ilike(f"%{search}%")
        )
    if visibility:
        valid = {v.value for v in VisibilityEnum}
        if visibility not in valid:
            raise HTTPException(status_code=400, detail="Invalid visibility filter")
        query = query.filter(Dataset.visibility == visibility)

    total = query.count()
    items = query.order_by(Dataset.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": str(dataset.id),
                "title": dataset.title,
                "owner": dataset.owner.username if dataset.owner else None,
                "organization": dataset.organization.name if dataset.organization else None,
                "visibility": dataset.visibility.value if hasattr(dataset.visibility, "value") else str(dataset.visibility),
                "file_size": dataset.file_size,
                "download_count": dataset.download_count,
                "created_at": dataset.created_at,
            }
            for dataset in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.delete("/datasets/{dataset_id}", status_code=204)
def delete_admin_dataset(
    dataset_id: str,
    request: Request,
    reason: str = Query(..., min_length=3),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    log_entry = ActivityLog(
        user_id=current_user.id,
        action=ActivityAction.delete,
        resource_type="dataset",
        resource_id=str(dataset_id),
        details={"reason": reason},
        ip_address=request.client.host if request else None,
    )
    db.add(log_entry)
    db.commit()
    return Response(status_code=204)


@router.get("/audit-logs")
def admin_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    query = db.query(ActivityLog)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action:
        query = query.filter(ActivityLog.action == action)
    if date_from:
        parsed = parse_date(date_from)
        query = query.filter(ActivityLog.created_at >= parsed)

    total = query.count()
    items = query.order_by(ActivityLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": str(item.id),
                "user_id": str(item.user_id) if item.user_id else None,
                "action": item.action.value if hasattr(item.action, "value") else str(item.action),
                "resource_type": item.resource_type,
                "resource_id": item.resource_id,
                "ip_address": item.ip_address,
                "created_at": item.created_at,
            }
            for item in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/storage-breakdown")
def admin_storage_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user_counts = (
        db.query(User.organization_id.label("org_id"), func.count(User.id).label("user_count"))
        .group_by(User.organization_id)
        .subquery()
    )
    dataset_counts = (
        db.query(
            Dataset.organization_id.label("org_id"),
            func.count(Dataset.id).label("dataset_count"),
            func.coalesce(func.sum(Dataset.file_size), 0).label("total_bytes"),
        )
        .group_by(Dataset.organization_id)
        .subquery()
    )

    rows = []
    for org, user_count, dataset_count, total_bytes in (
        db.query(
            Organization,
            func.coalesce(user_counts.c.user_count, 0),
            func.coalesce(dataset_counts.c.dataset_count, 0),
            func.coalesce(dataset_counts.c.total_bytes, 0),
        )
        .outerjoin(user_counts, user_counts.c.org_id == Organization.id)
        .outerjoin(dataset_counts, dataset_counts.c.org_id == Organization.id)
        .all()
    ):
        rows.append(
            {
                "organization_name": org.name,
                "user_count": int(user_count),
                "dataset_count": int(dataset_count),
                "total_bytes": int(total_bytes),
            }
        )

    no_org_user_count = (
        db.query(func.count(User.id)).filter(User.organization_id == None).scalar() or 0
    )
    no_org_dataset_count, no_org_total_bytes = (
        db.query(
            func.count(Dataset.id),
            func.coalesce(func.sum(Dataset.file_size), 0),
        )
        .filter(Dataset.organization_id == None)
        .one()
    )
    if no_org_dataset_count:
        rows.append(
            {
                "organization_name": "No Organization",
                "user_count": int(no_org_user_count),
                "dataset_count": int(no_org_dataset_count),
                "total_bytes": int(no_org_total_bytes),
            }
        )

    rows.sort(key=lambda row: row["total_bytes"], reverse=True)
    return rows
