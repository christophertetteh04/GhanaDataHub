from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

from app.core.database import get_db
from app.models.models import ObservanceFeature, User, UserRole
from app.api.v1.deps import require_role

router = APIRouter()

# --- Pydantic Schemas ---
class ObservanceFeatureOut(BaseModel):
    id: UUID
    observance_name: str
    observance_date: date
    category: Optional[str]
    headline: Optional[str]
    narrative: Optional[str]
    featured_dataset_id: Optional[UUID]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ObservanceFeatureUpdate(BaseModel):
    observance_name: Optional[str] = None
    observance_date: Optional[date] = None
    category: Optional[str] = None
    headline: Optional[str] = None
    narrative: Optional[str] = None
    featured_dataset_id: Optional[UUID] = None
    status: Optional[str] = None

class ObservanceFeatureCreate(BaseModel):
    observance_name: str
    observance_date: date
    category: Optional[str] = None
    headline: Optional[str] = None
    narrative: Optional[str] = None
    featured_dataset_id: Optional[UUID] = None
    status: Optional[str] = "draft"

# --- Endpoints ---

@router.get("/today", response_model=List[ObservanceFeatureOut])
def get_todays_observance(db: Session = Depends(get_db)):
    """Public endpoint to get today's published observances."""
    today = date.today()
    observances = db.query(ObservanceFeature).filter(
        ObservanceFeature.observance_date == today,
        ObservanceFeature.status == "published"
    ).all()
    return observances

@router.get("/upcoming", response_model=List[ObservanceFeatureOut])
def get_upcoming_observances(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.super_admin, UserRole.org_admin))
):
    """Admin endpoint to see upcoming and draft observances."""
    today = date.today()
    observances = db.query(ObservanceFeature).filter(
        ObservanceFeature.observance_date >= today
    ).order_by(ObservanceFeature.observance_date.asc()).all()
    return observances

@router.post("/", response_model=ObservanceFeatureOut)
def create_observance(
    feature: ObservanceFeatureCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.super_admin, UserRole.org_admin))
):
    """Admin endpoint to create a new observance manually."""
    new_feature = ObservanceFeature(**feature.model_dump())
    db.add(new_feature)
    db.commit()
    db.refresh(new_feature)
    return new_feature

@router.patch("/{id}", response_model=ObservanceFeatureOut)
def update_observance(
    id: UUID,
    update_data: ObservanceFeatureUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.super_admin, UserRole.org_admin))
):
    """Admin endpoint to edit an observance."""
    feature = db.query(ObservanceFeature).filter(ObservanceFeature.id == id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Observance Feature not found")
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(feature, key, value)
        
    db.commit()
    db.refresh(feature)
    return feature

@router.post("/{id}/publish", response_model=ObservanceFeatureOut)
def publish_observance(
    id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.super_admin, UserRole.org_admin))
):
    """Admin endpoint to publish a draft observance."""
    feature = db.query(ObservanceFeature).filter(ObservanceFeature.id == id).first()
    if not feature:
        raise HTTPException(status_code=404, detail="Observance Feature not found")
        
    feature.status = "published"
    db.commit()
    db.refresh(feature)
    return feature
