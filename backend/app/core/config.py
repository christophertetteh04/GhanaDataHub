from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ghanadatahub"
    SECRET_KEY: str = "change-this-in-production-must-be-at-least-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 104857600  # 100MB
    FRONTEND_URL: str = "http://localhost:5173"

    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "console"
    LOGTAIL_TOKEN: Optional[str] = None
    CALENDARIFIC_API_KEY: Optional[str] = None

    # Pydantic v2 uses model_config (not Config class)
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",  # Ignores extra fields from .env
    }


settings = Settings()
