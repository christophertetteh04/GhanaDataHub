from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, String
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.models.models import User, UserRole, Dataset, ActivityLog, UserBookmark, VisibilityEnum
from app.schemas.schemas import (
    UserOut,
    UserUpdate,
    UserRoleUpdate,
    BookmarkCreate,
    DownloadHistoryItem,
    PublicUserProfileOut,
    DatasetOut,
)
from app.api.v1.deps import get_current_user, require_role as require_roles

router = APIRouter()


@router.get("/", response_model=list[UserOut])
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    q = db.query(User)
    if search:
        q = q.filter(
            User.full_name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%")
        )
    return q.offset((page - 1) * per_page).limit(per_page).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/download-history", response_model=list[DownloadHistoryItem])
def get_download_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entries = (
        db.query(ActivityLog, Dataset)
        .join(Dataset, ActivityLog.resource_id == func.cast(Dataset.id, String), isouter=True)
        .filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.action == "download",
        )
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for log, dataset in entries:
        result.append(
            {
                "dataset_id": UUID(log.resource_id) if log.resource_id else None,
                "created_at": log.created_at,
                "resource_type": log.resource_type,
                "title": dataset.title if dataset else None,
                "file_type": dataset.file_type if dataset else None,
            }
        )
    return result


@router.get("/me/bookmarks", response_model=list[DatasetOut])
def list_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookmarks = (
        db.query(UserBookmark)
        .options(joinedload(UserBookmark.dataset).joinedload(Dataset.owner))
        .filter(UserBookmark.user_id == current_user.id)
        .all()
    )
    return [bookmark.dataset for bookmark in bookmarks if bookmark.dataset]


@router.post("/me/bookmarks", response_model=DatasetOut)
def add_bookmark(
    payload: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    existing = (
        db.query(UserBookmark)
        .filter(
            UserBookmark.user_id == current_user.id,
            UserBookmark.dataset_id == payload.dataset_id,
        )
        .first()
    )
    if existing:
        return dataset
    bookmark = UserBookmark(user_id=current_user.id, dataset_id=payload.dataset_id)
    db.add(bookmark)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/me/bookmarks/{dataset_id}")
def remove_bookmark(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookmark = (
        db.query(UserBookmark)
        .filter(
            UserBookmark.user_id == current_user.id,
            UserBookmark.dataset_id == dataset_id,
        )
        .first()
    )
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed"}


@router.get("/{username}/public", response_model=PublicUserProfileOut)
def public_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    public_count = (
        db.query(func.count(Dataset.id))
        .filter(Dataset.owner_id == user.id, Dataset.visibility == VisibilityEnum.public)
        .scalar()
        or 0
    )
    total_downloads = (
        db.query(func.coalesce(func.sum(Dataset.download_count), 0))
        .filter(Dataset.owner_id == user.id, Dataset.visibility == VisibilityEnum.public)
        .scalar()
        or 0
    )

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "organization_id": user.organization_id,
        "created_at": user.created_at,
        "public_dataset_count": public_count,
        "public_downloads_received": total_downloads,
    }


@router.patch("/{user_id}/role", response_model=UserOut)
def update_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Org admins can't promote to super_admin
    if payload.role == UserRole.super_admin and current_user.role != UserRole.super_admin:
        raise HTTPException(status_code=403, detail="Cannot assign super_admin role")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/suspend")
def suspend_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": "User suspended"}


@router.patch("/{user_id}/reactivate")
def reactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"message": "User reactivated"}
