from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Annotated, Any
import logging

from app.db.session import get_db
from app.schemas.auth import (
    UserCreate, 
    UserRead, 
    Token, 
    TokenData, 
    PasswordReset, 
    PasswordResetRequest
)
from app.crud.users import (
    create_user, 
    authenticate_user, 
    get_user_by_email, 
    update_user_password
)
from app.services.email import send_password_reset_email
from app.core.security import (
    create_access_token, 
    verify_password_reset_token, 
    create_password_reset_token,
    get_current_user
)
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user.
    """
    # Check if user with this email already exists
    db_user = get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    # Create new user
    try:
        user = create_user(db=db, user_create=user_in)
        return user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with a relatively short expiry
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserRead.from_orm(user)
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token.
    """
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.email, "user_id": current_user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user
    }

@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> Any:
    """
    Send a password reset email to the user.
    """
    user = get_user_by_email(db, email=request.email)
    if user:
        # Create password reset token
        token = create_password_reset_token(email=user.email)
        
        # Send password reset email in the background
        background_tasks.add_task(
            send_password_reset_email,
            email_to=user.email,
            token=token,
            username=user.username
        )
    
    # Always return 204 even if user doesn't exist to prevent email enumeration
    return None

@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
) -> Any:
    """
    Reset user password using a reset token.
    """
    email = verify_password_reset_token(reset_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    user = get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user password
    update_user_password(db, user_id=user.id, new_password=reset_data.password)
    
    return None

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: UserRead = Depends(get_current_user)
) -> Any:
    """
    Get current user.
    """
    return current_user
