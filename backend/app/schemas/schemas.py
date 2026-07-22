from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.models import UserRole, VisibilityEnum


# ── Auth Schemas ─────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not v.isalnum() and "_" not in v:
            raise ValueError("Username must be alphanumeric")
        return v.lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ── User Schemas ──────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str


class UserOut(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    organization_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class BookmarkCreate(BaseModel):
    dataset_id: UUID


class DownloadHistoryItem(BaseModel):
    dataset_id: Optional[UUID]
    created_at: datetime
    resource_type: Optional[str]
    title: Optional[str]
    file_type: Optional[str]


class PublicUserProfileOut(BaseModel):
    id: UUID
    username: str
    full_name: str
    role: UserRole
    organization_id: Optional[UUID]
    created_at: datetime
    public_dataset_count: int
    public_downloads_received: int

    class Config:
        from_attributes = True


# ── Organization Schemas ──────────────────────────────────────────────────────
class OrgCreate(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


class OrgOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    website: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OrgInvite(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.viewer


# ── Category Schemas ──────────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]

    class Config:
        from_attributes = True


# ── Tag Schemas ───────────────────────────────────────────────────────────────
class TagOut(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


# ── Dataset Schemas ───────────────────────────────────────────────────────────
class DatasetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    license: Optional[str] = None
    visibility: VisibilityEnum = VisibilityEnum.private
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = []


class DatasetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    license: Optional[str] = None
    visibility: Optional[VisibilityEnum] = None
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    change_summary: Optional[str] = None


class DatasetOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    license: Optional[str]
    visibility: VisibilityEnum
    file_name: Optional[str]
    file_size: int
    file_type: Optional[str]
    analysis_data: Optional[dict] = None
    download_count: int
    version: int
    owner_id: Optional[UUID]
    organization_id: Optional[UUID]
    category_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserOut] = None
    category: Optional[CategoryOut] = None
    tags: List[TagOut] = []

    class Config:
        from_attributes = True


class DatasetVersionOut(BaseModel):
    id: UUID
    version_number: int
    file_name: Optional[str]
    file_size: int
    change_summary: Optional[str]
    author_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Search / Pagination ───────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int


# ── Share Schemas ─────────────────────────────────────────────────────────────
class ShareCreate(BaseModel):
    dataset_id: UUID
    expires_in_hours: Optional[int] = None  # None = never expires


class SharedLinkOut(BaseModel):
    id: UUID
    token: str
    expires_at: Optional[datetime]
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# ── Notification Schemas ──────────────────────────────────────────────────────
class NotificationOut(BaseModel):
    id: UUID
    title: str
    message: str
    is_read: bool
    notification_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Schema ──────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_datasets: int
    total_users: int
    total_organizations: int
    total_storage_bytes: int
    most_downloaded: List[DatasetOut]
    recent_uploads: List[DatasetOut]
    monthly_uploads: List[dict]
    datasets_by_category: List[dict]
    datasets_by_visibility: List[dict]
    my_datasets_count: int
    my_organization_name: Optional[str]
    unread_notifications_count: int
    recent_activity: List[dict]
    my_recent_uploads: List[DatasetOut]
