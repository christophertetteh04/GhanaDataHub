import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.config import settings
from app.models.models import (
    Dataset, DatasetVersion, Tag, Category, User, ActivityLog,
    ActivityAction, UserRole, VisibilityEnum, Notification
)
from app.schemas.schemas import DatasetOut, DatasetUpdate, DatasetVersionOut
from app.api.v1.deps import get_current_user, require_roles, get_optional_user

router = APIRouter()

ALLOWED_TYPES = {
    "text/csv", "application/json",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
    "image/png", "image/jpeg", "image/gif", "image/webp",
}


def get_or_create_tag(db: Session, name: str) -> Tag:
    tag = db.query(Tag).filter(Tag.name == name.lower().strip()).first()
    if not tag:
        tag = Tag(name=name.lower().strip())
        db.add(tag)
        db.flush()
    return tag


def log_activity(db, user_id, action, resource_type=None, resource_id=None, ip=None):
    db.add(ActivityLog(
        user_id=user_id, action=action,
        resource_type=resource_type, resource_id=str(resource_id) if resource_id else None,
        ip_address=ip,
    ))


def notify(db, user_id, title, message, ntype):
    db.add(Notification(user_id=user_id, title=title, message=message, notification_type=ntype))


@router.post("/", response_model=DatasetOut, status_code=201)
async def create_dataset(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    license: Optional[str] = Form(None),
    visibility: VisibilityEnum = Form(VisibilityEnum.private),
    category_id: Optional[UUID] = Form(None),
    tags: Optional[str] = Form(None),  # comma-separated
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        UserRole.super_admin, UserRole.org_admin, UserRole.data_manager
    )),
):
    file_path = None
    file_name = None
    file_size = 0
    file_type = None

    if file:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"File type not allowed: {file.content_type}")
        content = await file.read()
        file_size = len(content)
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large (max 100MB)")
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        stored_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        with open(file_path, "wb") as f:
            f.write(content)
        file_name = file.filename
        file_type = file.content_type

    dataset = Dataset(
        title=title,
        description=description,
        license=license,
        visibility=visibility,
        file_path=file_path,
        file_name=file_name,
        file_size=file_size,
        file_type=file_type,
        owner_id=current_user.id,
        organization_id=current_user.organization_id,
        category_id=category_id,
        version=1,
    )
    db.add(dataset)
    db.flush()

    # Tags
    if tags:
        for tag_name in tags.split(","):
            tag_name = tag_name.strip()
            if tag_name:
                dataset.tags.append(get_or_create_tag(db, tag_name))

    # First version record
    version = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        file_path=file_path,
        file_name=file_name,
        file_size=file_size,
        change_summary="Initial upload",
        author_id=current_user.id,
    )
    db.add(version)
    log_activity(db, current_user.id, ActivityAction.upload, "dataset", dataset.id, request.client.host)
    notify(db, current_user.id, "Dataset Uploaded", f'Your dataset "{title}" was uploaded.', "upload")
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/", response_model=dict)
def list_datasets(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[UUID] = None,
    visibility: Optional[VisibilityEnum] = None,
    owner_id: Optional[UUID] = None,
    sort_by: str = Query("created_at", regex="^(created_at|title|download_count|file_size)$"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    q = db.query(Dataset).options(
        joinedload(Dataset.owner),
        joinedload(Dataset.category),
        joinedload(Dataset.tags),
    )

    # Visibility filter
    if not current_user:
        q = q.filter(Dataset.visibility == VisibilityEnum.public)
    elif current_user.role not in (UserRole.super_admin,):
        q = q.filter(
            (Dataset.visibility == VisibilityEnum.public) |
            (Dataset.owner_id == current_user.id) |
            (Dataset.organization_id == current_user.organization_id)
        )

    if search:
        q = q.filter(Dataset.title.ilike(f"%{search}%") | Dataset.description.ilike(f"%{search}%"))
    if category_id:
        q = q.filter(Dataset.category_id == category_id)
    if visibility:
        q = q.filter(Dataset.visibility == visibility)
    if owner_id:
        q = q.filter(Dataset.owner_id == owner_id)

    # Sorting
    sort_col = getattr(Dataset, sort_by)
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return {
        "items": [DatasetOut.model_validate(d) for d in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    dataset = db.query(Dataset).options(
        joinedload(Dataset.owner), joinedload(Dataset.category), joinedload(Dataset.tags)
    ).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    # Access check
    if dataset.visibility == VisibilityEnum.private:
        if not current_user or (str(dataset.owner_id) != str(current_user.id) and current_user.role != UserRole.super_admin):
            raise HTTPException(status_code=403, detail="Access denied")
    return dataset


@router.put("/{dataset_id}", response_model=DatasetOut)
async def update_dataset(
    dataset_id: UUID,
    request: Request,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    license: Optional[str] = Form(None),
    visibility: Optional[VisibilityEnum] = Form(None),
    category_id: Optional[UUID] = Form(None),
    tags: Optional[str] = Form(None),
    change_summary: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if str(dataset.owner_id) != str(current_user.id) and current_user.role not in (UserRole.super_admin, UserRole.org_admin):
        raise HTTPException(status_code=403, detail="Access denied")

    if title: dataset.title = title
    if description: dataset.description = description
    if license: dataset.license = license
    if visibility: dataset.visibility = visibility
    if category_id: dataset.category_id = category_id
    if tags is not None:
        dataset.tags = []
        for tag_name in tags.split(","):
            t = tag_name.strip()
            if t:
                dataset.tags.append(get_or_create_tag(db, t))

    new_file_path, new_file_name, new_file_size = dataset.file_path, dataset.file_name, dataset.file_size
    if file:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="File type not allowed")
        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        stored_name = f"{uuid.uuid4()}{ext}"
        new_file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        with open(new_file_path, "wb") as f:
            f.write(content)
        new_file_name = file.filename
        new_file_size = len(content)
        dataset.file_path = new_file_path
        dataset.file_name = new_file_name
        dataset.file_size = new_file_size
        dataset.file_type = file.content_type

    dataset.version += 1
    dataset.updated_at = datetime.utcnow()

    version = DatasetVersion(
        dataset_id=dataset.id,
        version_number=dataset.version,
        file_path=new_file_path,
        file_name=new_file_name,
        file_size=new_file_size,
        change_summary=change_summary or "Updated",
        author_id=current_user.id,
    )
    db.add(version)
    log_activity(db, current_user.id, ActivityAction.update, "dataset", dataset.id, request.client.host)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/{dataset_id}", status_code=204)
def delete_dataset(
    dataset_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if str(dataset.owner_id) != str(current_user.id) and current_user.role not in (UserRole.super_admin,):
        raise HTTPException(status_code=403, detail="Access denied")
    if dataset.file_path and os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    log_activity(db, current_user.id, ActivityAction.delete, "dataset", dataset.id, request.client.host)
    db.delete(dataset)
    db.commit()


@router.get("/{dataset_id}/versions", response_model=list[DatasetVersionOut])
def get_versions(
    dataset_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).order_by(DatasetVersion.version_number.desc()).all()
