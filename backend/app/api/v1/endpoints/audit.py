from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.models import ActivityLog, User, UserRole
from app.api.v1.deps import require_roles

router = APIRouter()


@router.get("/")
def get_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    q = db.query(ActivityLog)
    if user_id:
        q = q.filter(ActivityLog.user_id == user_id)
    if action:
        q = q.filter(ActivityLog.action == action)
    total = q.count()
    items = q.order_by(ActivityLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [
            {
                "id": str(i.id),
                "user_id": str(i.user_id) if i.user_id else None,
                "action": i.action,
                "resource_type": i.resource_type,
                "resource_id": i.resource_id,
                "ip_address": i.ip_address,
                "created_at": i.created_at,
            }
            for i in items
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }
