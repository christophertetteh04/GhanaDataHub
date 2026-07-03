from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, organizations, datasets, search, dashboard, share, misc, audit

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["Datasets"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(share.router, prefix="/share", tags=["Share"])
api_router.include_router(misc.categories_router, prefix="/categories", tags=["Categories"])
api_router.include_router(misc.notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
