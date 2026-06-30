from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import re
from app.core.database import get_db
from app.models.models import User, Organization, UserRole, Notification
from app.schemas.schemas import OrgCreate, OrgOut, OrgInvite, UserOut
from app.api.v1.deps import get_current_user, require_roles

router = APIRouter()


def slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug


@router.post("/", response_model=OrgOut, status_code=201)
def create_org(
    payload: OrgCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    slug = slugify(payload.name)
    if db.query(Organization).filter(Organization.slug == slug).first():
        raise HTTPException(status_code=400, detail="Organization name already taken")
    org = Organization(name=payload.name, slug=slug, description=payload.description, website=payload.website)
    db.add(org)
    db.flush()
    current_user.organization_id = org.id
    if current_user.role != UserRole.super_admin:
        current_user.role = UserRole.org_admin
    db.commit()
    db.refresh(org)
    return org


@router.get("/", response_model=list[OrgOut])
def list_orgs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Organization).filter(Organization.is_active == True).offset((page - 1) * per_page).limit(per_page).all()


@router.get("/{org_id}", response_model=OrgOut)
def get_org(org_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/{org_id}/members", response_model=list[UserOut])
def get_members(org_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(User).filter(User.organization_id == org_id).all()


@router.post("/{org_id}/invite")
def invite_member(
    org_id: UUID,
    payload: OrgInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with that email not found")
    user.organization_id = org_id
    user.role = payload.role
    # Notify
    notif = Notification(
        user_id=user.id,
        title="Organization Invitation",
        message=f"You have been invited to join an organization by {current_user.full_name}.",
        notification_type="invite",
    )
    db.add(notif)
    db.commit()
    return {"message": f"User {user.email} added to organization"}


@router.delete("/{org_id}/members/{user_id}")
def remove_member(
    org_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    user.organization_id = None
    db.commit()
    return {"message": "Member removed"}
