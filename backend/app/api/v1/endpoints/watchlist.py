from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.models import Dataset, DatasetWatch, User
from app.schemas.schemas import DatasetOut

router = APIRouter()


@router.get("/", response_model=list[DatasetOut])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's watched datasets."""
    watches = (
        db.query(DatasetWatch)
        .filter(DatasetWatch.user_id == current_user.id)
        .all()
    )
    dataset_ids = [w.dataset_id for w in watches]
    if not dataset_ids:
        return []

    datasets = (
        db.query(Dataset)
        .options(
            joinedload(Dataset.owner),
            joinedload(Dataset.category),
            joinedload(Dataset.tags),
        )
        .filter(Dataset.id.in_(dataset_ids))
        .all()
    )
    return [DatasetOut.model_validate(d) for d in datasets]


@router.get("/is-watching/{dataset_id}")
def check_is_watching(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if the current user is watching a specific dataset."""
    watch = (
        db.query(DatasetWatch)
        .filter(
            DatasetWatch.user_id == current_user.id,
            DatasetWatch.dataset_id == dataset_id,
        )
        .first()
    )
    return {"is_watching": watch is not None}


@router.post("/{dataset_id}", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a dataset to the current user's watchlist."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    existing = (
        db.query(DatasetWatch)
        .filter(
            DatasetWatch.user_id == current_user.id,
            DatasetWatch.dataset_id == dataset_id,
        )
        .first()
    )
    if existing:
        return {"message": "Already watching"}

    watch = DatasetWatch(user_id=current_user.id, dataset_id=dataset_id)
    db.add(watch)
    db.commit()
    return {"message": "Added to watchlist"}


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a dataset from the current user's watchlist."""
    watch = (
        db.query(DatasetWatch)
        .filter(
            DatasetWatch.user_id == current_user.id,
            DatasetWatch.dataset_id == dataset_id,
        )
        .first()
    )
    if not watch:
        raise HTTPException(status_code=404, detail="Watch record not found")

    db.delete(watch)
    db.commit()
    return None
