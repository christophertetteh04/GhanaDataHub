from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, organizations, datasets, search, dashboard, share, misc, audit, admin, calendar, watchlist, observances, api_keys, brief

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
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(calendar.router, tags=["Calendar"])
api_router.include_router(watchlist.router, prefix="/watchlist", tags=["Watchlist"])
api_router.include_router(observances.router, prefix="/observances", tags=["Observances"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])
api_router.include_router(brief.router, prefix="/brief", tags=["Brief"])
