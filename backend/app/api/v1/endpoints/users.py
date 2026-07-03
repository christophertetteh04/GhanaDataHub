from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.core.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserOut, UserUpdate, UserRoleUpdate
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
