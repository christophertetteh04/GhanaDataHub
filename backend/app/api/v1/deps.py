from typing import Optional
from enum import Enum
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.core.database import get_db
from app.models.models import User
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Decode JWT token and return the current user."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    credentials_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

from typing import Optional

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme, use_cache=False),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current user from the JWT token if present and valid.
    Returns None if no token or token is invalid.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except JWTError:
        return None

def require_roles(*required_roles):
    """
    Dependency that checks if the current user has one of the required roles.
    Super_admin bypasses all checks.
    """
    def normalize(role):
        if isinstance(role, Enum):
            return role.value
        return str(role)

    allowed_roles = {normalize(role) for role in required_roles}

    def dependency(current_user: User = Depends(get_current_user)):
        current_role = normalize(current_user.role)
        if current_role == "super_admin":
            return current_user
        if current_role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return dependency

# Alias for backward compatibility with code expecting require_role
require_role = require_roles