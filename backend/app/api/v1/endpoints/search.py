from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.models.models import Dataset, Tag, VisibilityEnum, UserRole, User
from app.schemas.schemas import DatasetOut
from app.api.v1.deps import get_optional_user

router = APIRouter()


@router.get("/")
def search(
    q: str = Query(..., min_length=1),
    category_id: Optional[UUID] = None,
    tag: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    organization_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = db.query(Dataset).options(
        joinedload(Dataset.owner),
        joinedload(Dataset.category),
        joinedload(Dataset.tags),
    )

    # Visibility
    if not current_user:
        query = query.filter(Dataset.visibility == VisibilityEnum.public)
    elif current_user.role != UserRole.super_admin:
        query = query.filter(
            or_(
                Dataset.visibility == VisibilityEnum.public,
                Dataset.owner_id == current_user.id,
                Dataset.organization_id == current_user.organization_id,
            )
        )

    # Search text
    query = query.filter(
        or_(
            Dataset.title.ilike(f"%{q}%"),
            Dataset.description.ilike(f"%{q}%"),
        )
    )

    if category_id:
        query = query.filter(Dataset.category_id == category_id)
    if owner_id:
        query = query.filter(Dataset.owner_id == owner_id)
    if organization_id:
        query = query.filter(Dataset.organization_id == organization_id)
    if date_from:
        query = query.filter(Dataset.created_at >= date_from)
    if date_to:
        query = query.filter(Dataset.created_at <= date_to)
    if tag:
        query = query.join(Dataset.tags).filter(Tag.name == tag.lower().strip())

    sort_col = getattr(Dataset, sort_by, Dataset.created_at)
    query = query.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": [DatasetOut.model_validate(d) for d in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "query": q,
    }
