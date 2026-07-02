from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.core.middleware import get_bound_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.models import ActivityAction, ActivityLog, User, UserRole
from app.schemas.schemas import Token, TokenRefresh, UserLogin, UserOut, UserRegister

import uuid

router = APIRouter()


def log_activity(db: Session, user_id, action, ip=None, details=None):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        ip_address=ip,
        details=details,
    )
    db.add(log)
    db.commit()


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    logger = get_bound_logger(__name__)

    # Check duplicates
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username.lower()).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # First user becomes super_admin
    is_first = db.query(User).count() == 0
    user = User(
        email=payload.email,
        username=payload.username.lower(),
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.super_admin if is_first else UserRole.viewer,
        is_verified=True,  # Skip email verification for MVP
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(db, user.id, ActivityAction.register, request.client.host)
    logger.info(
        "user_registered",
        user_id=user.id,
        email=user.email,
        role=str(user.role),
    )
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    logger = get_bound_logger(__name__)

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        log_activity(
            db,
            user.id if user else None,
            ActivityAction.failed_login,
            request.client.host,
            {"email": payload.email},
        )
        logger.warning(
            "login_failed",
            email=payload.email,
            reason="bad_credentials",
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        logger.warning(
            "login_blocked",
            user_id=user.id,
            reason="account_suspended",
        )
        raise HTTPException(status_code=403, detail="Account suspended")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    log_activity(db, user.id, ActivityAction.login, request.client.host)
    logger.info("user_login", user_id=user.id, email=user.email)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(payload: TokenRefresh, db: Session = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    try:
        from uuid import UUID as _UUID

        user_id = _UUID(token_data["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger = get_bound_logger(__name__)

    log_activity(db, current_user.id, ActivityAction.logout, request.client.host)
    logger.info("user_logout", user_id=current_user.id)

    return {"message": "Logged out successfully"}

