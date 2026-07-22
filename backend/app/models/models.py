import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, Integer, ForeignKey,
    Text, BigInteger, Enum, Table, JSON, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


# ── Enums ──────────────────────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    org_admin = "org_admin"
    data_manager = "data_manager"
    analyst = "analyst"
    viewer = "viewer"


class VisibilityEnum(str, enum.Enum):
    public = "public"
    private = "private"
    organization = "organization"
    shared_link = "shared_link"


class ActivityAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    upload = "upload"
    delete = "delete"
    update = "update"
    share = "share"
    failed_login = "failed_login"
    role_change = "role_change"
    register = "register"
    download = "download"


# ── Association Tables ──────────────────────────────────────────────────────
dataset_tags = Table(
    "dataset_tags",
    Base.metadata,
    Column("dataset_id", UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE")),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE")),
)


# ── Models ──────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.viewer, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="members")
    datasets = relationship("Dataset", back_populates="owner", foreign_keys="Dataset.owner_id")
    activity_logs = relationship("ActivityLog", back_populates="user")
    bookmarks = relationship("UserBookmark", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("User", back_populates="organization")
    datasets = relationship("Dataset", back_populates="organization")


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", secondary=dataset_tags, back_populates="tags")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text, nullable=True)
    license = Column(String(100), nullable=True)
    visibility = Column(Enum(VisibilityEnum), default=VisibilityEnum.private, nullable=False)
    file_path = Column(String(1000), nullable=True)
    file_name = Column(String(500), nullable=True)
    file_size = Column(BigInteger, default=0)
    file_type = Column(String(100), nullable=True)
    download_count = Column(Integer, default=0)
    version = Column(Integer, default=1)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="datasets", foreign_keys=[owner_id])
    organization = relationship("Organization", back_populates="datasets")
    category = relationship("Category", back_populates="datasets")
    tags = relationship("Tag", secondary=dataset_tags, back_populates="datasets")
    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    shared_links = relationship("SharedLink", back_populates="dataset", cascade="all, delete-orphan")
    bookmarked_by = relationship("UserBookmark", back_populates="dataset", cascade="all, delete-orphan")


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(1000), nullable=True)
    file_name = Column(String(500), nullable=True)
    file_size = Column(BigInteger, default=0)
    change_summary = Column(Text, nullable=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="versions")
    author = relationship("User")


class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    dataset = relationship("Dataset", back_populates="shared_links")
    created_by = relationship("User")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Enum(ActivityAction), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True)
    key_prefix = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")
    dataset = relationship("Dataset", back_populates="bookmarked_by")


class DatasetWatch(Base):
    __tablename__ = "dataset_watches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "dataset_id", name="uq_user_dataset_watch"),)


class ObservanceFeature(Base):
    __tablename__ = 'observance_features'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    observance_name = Column(String(200), nullable=False)
    observance_date = Column(Date, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    headline = Column(String(300), nullable=True)
    narrative = Column(Text, nullable=True)
    key_datapoint = Column(String(100), nullable=True)
    key_datapoint_label = Column(String(150), nullable=True)
    related_dataset_ids = Column(JSON, nullable=True)
    calendarific_data = Column(JSON, nullable=True)
    status = Column(String(20), default='pending', nullable=False)
    publish_on_date = Column(Boolean, default=True)
    published_at = Column(DateTime, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
