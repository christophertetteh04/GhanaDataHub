from datetime import date, datetime, timedelta
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.v1.deps import require_roles
from app.core.database import get_db
from app.models.models import Dataset, ObservanceFeature, User, UserRole
from app.schemas.schemas import DatasetOut

router = APIRouter()


class ObservancePublicOut(BaseModel):
    id: UUID
    observance_name: str
    observance_date: date
    category: Optional[str] = None
    headline: Optional[str] = None
    narrative: Optional[str] = None
    key_datapoint: Optional[str] = None
    key_datapoint_label: Optional[str] = None
    related_datasets: List[DatasetOut] = []

    class Config:
        from_attributes = True


class ObservanceFeatureOut(BaseModel):
    id: UUID
    observance_name: str
    observance_date: date
    category: Optional[str] = None
    headline: Optional[str] = None
    narrative: Optional[str] = None
    key_datapoint: Optional[str] = None
    key_datapoint_label: Optional[str] = None
    related_dataset_ids: Optional[List[UUID]] = None
    calendarific_data: Optional[Any] = None
    status: str
    publish_on_date: bool
    published_at: Optional[datetime] = None
    created_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ObservanceFeatureCreate(BaseModel):
    observance_name: str
    observance_date: date
    category: Optional[str] = None
    headline: Optional[str] = None
    narrative: Optional[str] = None
    key_datapoint: Optional[str] = None
    key_datapoint_label: Optional[str] = None
    related_dataset_ids: Optional[List[UUID]] = None
    calendarific_data: Optional[Any] = None
    status: str = "pending"
    publish_on_date: bool = True


class ObservanceFeatureUpdate(BaseModel):
    headline: Optional[str] = None
    narrative: Optional[str] = None
    key_datapoint: Optional[str] = None
    key_datapoint_label: Optional[str] = None
    related_dataset_ids: Optional[List[UUID]] = None
    status: Optional[str] = None
    publish_on_date: Optional[bool] = None


def _related_datasets(db: Session, related_dataset_ids: Optional[list]) -> List[DatasetOut]:
    if not related_dataset_ids:
        return []

    ids = [UUID(str(dataset_id)) for dataset_id in related_dataset_ids]
    datasets = db.query(Dataset).filter(Dataset.id.in_(ids)).all()
    by_id = {str(dataset.id): dataset for dataset in datasets}
    ordered = [by_id[str(dataset_id)] for dataset_id in ids if str(dataset_id) in by_id]
    return [DatasetOut.model_validate(dataset) for dataset in ordered]


@router.get("/today", response_model=Optional[ObservancePublicOut])
def get_todays_observance(db: Session = Depends(get_db)):
    today = date.today()
    feature = (
        db.query(ObservanceFeature)
        .filter(
            ObservanceFeature.observance_date == today,
            ObservanceFeature.status == "published",
        )
        .order_by(ObservanceFeature.published_at.desc().nullslast())
        .first()
    )
    if feature is None:
        return None

    return ObservancePublicOut(
        id=feature.id,
        observance_name=feature.observance_name,
        observance_date=feature.observance_date,
        category=feature.category,
        headline=feature.headline,
        narrative=feature.narrative,
        key_datapoint=feature.key_datapoint,
        key_datapoint_label=feature.key_datapoint_label,
        related_datasets=_related_datasets(db, feature.related_dataset_ids),
    )


@router.get("/upcoming", response_model=List[ObservanceFeatureOut])
def get_upcoming_observances(
    days: int = Query(14, ge=1, le=365),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    today = date.today()
    end_date = today + timedelta(days=days)
    return (
        db.query(ObservanceFeature)
        .filter(
            ObservanceFeature.observance_date >= today,
            ObservanceFeature.observance_date <= end_date,
        )
        .order_by(ObservanceFeature.observance_date.asc())
        .all()
    )


@router.patch("/{id}", response_model=ObservanceFeatureOut)
def update_observance(
    id: UUID,
    payload: ObservanceFeatureUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    feature = db.query(ObservanceFeature).filter(ObservanceFeature.id == id).first()
    if feature is None:
        raise HTTPException(status_code=404, detail="ObservanceFeature not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "related_dataset_ids" in update_data and update_data["related_dataset_ids"] is not None:
        update_data["related_dataset_ids"] = [
            str(dataset_id) for dataset_id in update_data["related_dataset_ids"]
        ]

    for key, value in update_data.items():
        setattr(feature, key, value)

    db.commit()
    db.refresh(feature)
    return feature


@router.post("/{id}/publish", response_model=ObservanceFeatureOut)
def publish_observance(
    id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    feature = db.query(ObservanceFeature).filter(ObservanceFeature.id == id).first()
    if feature is None:
        raise HTTPException(status_code=404, detail="ObservanceFeature not found")

    feature.status = "published"
    feature.published_at = datetime.utcnow()
    db.commit()
    db.refresh(feature)
    return feature


@router.post("/", response_model=ObservanceFeatureOut, status_code=201)
def create_observance(
    payload: ObservanceFeatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.super_admin, UserRole.org_admin)),
):
    create_data = payload.model_dump()
    if create_data.get("related_dataset_ids") is not None:
        create_data["related_dataset_ids"] = [
            str(dataset_id) for dataset_id in create_data["related_dataset_ids"]
        ]

    feature = ObservanceFeature(**create_data, created_by_id=current_user.id)
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return feature
