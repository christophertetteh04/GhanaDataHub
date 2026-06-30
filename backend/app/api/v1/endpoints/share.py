import secrets
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import SharedLink, Dataset, User, ActivityLog, ActivityAction
from app.schemas.schemas import ShareCreate, SharedLinkOut
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=SharedLinkOut, status_code=201)
def create_share_link(
    payload: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if str(dataset.owner_id) != str(current_user.id) and current_user.role not in ("super_admin",):
        raise HTTPException(status_code=403, detail="Access denied")

    expires_at = None
    if payload.expires_in_hours:
        expires_at = datetime.utcnow() + timedelta(hours=payload.expires_in_hours)

    token = secrets.token_urlsafe(32)
    link = SharedLink(
        dataset_id=payload.dataset_id,
        token=token,
        expires_at=expires_at,
        created_by_id=current_user.id,
    )
    db.add(link)
    db.add(ActivityLog(
        user_id=current_user.id,
        action=ActivityAction.share,
        resource_type="dataset",
        resource_id=str(payload.dataset_id),
    ))
    db.commit()
    db.refresh(link)
    return link


@router.get("/access/{token}")
def access_shared_link(token: str, db: Session = Depends(get_db)):
    link = db.query(SharedLink).filter(SharedLink.token == token, SharedLink.is_active == True).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found or inactive")
    if link.expires_at and link.expires_at < datetime.utcnow():
        link.is_active = False
        db.commit()
        raise HTTPException(status_code=410, detail="Link expired")
    return {"dataset_id": str(link.dataset_id), "expires_at": link.expires_at}


@router.delete("/{link_id}", status_code=204)
def revoke_share_link(link_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    link = db.query(SharedLink).filter(SharedLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if str(link.created_by_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    link.is_active = False
    db.commit()
