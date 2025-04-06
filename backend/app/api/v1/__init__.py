from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.users.router import router as users_router
from app.api.v1.builds import router as builds_router
from app.api.v1.chat import router as chat_router

api_router = APIRouter()

# Include all API routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(builds_router, prefix="/builds", tags=["builds"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])

# Add additional routers here as they are created
