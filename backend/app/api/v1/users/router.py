from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.db.session import get_db
from app.schemas.users import (
    UserUpdate,
    UserRead,
    UserPasswordUpdate,
    UserPreferences
)
from app.schemas.auth import TokenData
from app.crud.users import (
    update_user,
    get_user,
    update_user_password,
    get_user_preferences,
    update_user_preferences
)
from app.core.security import get_current_user, get_password_hash, verify_password

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: UserRead = Depends(get_current_user)
) -> Any:
    """
    Get current user profile.
    """
    return current_user

@router.put("/profile", response_model=UserRead)
async def update_user_profile(
    user_in: UserUpdate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user profile.
    """
    # If updating email, check it's not already taken
    if user_in.email and user_in.email != current_user.email:
        from app.crud.users import get_user_by_email
        if get_user_by_email(db, email=user_in.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
            
    # Get current user from database
    user = get_user(db, user_id=current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Update user
    user = update_user(db, db_obj=user, obj_in=user_in)
    return user

@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    password_update: UserPasswordUpdate,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user password.
    """
    # Get user from database
    user = get_user(db, user_id=current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(password_update.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Update password
    update_user_password(db, user_id=user.id, new_password=password_update.new_password)
    return None

@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current user preferences.
    """
    preferences = get_user_preferences(db, user_id=current_user.id)
    if not preferences:
        # Return default preferences if none are set
        return UserPreferences(
            email_notifications=True,
            discord_notifications=False,
            dark_mode=False,
            compact_layout=False
        )
    return preferences

@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Update current user preferences.
    """
    updated_preferences = update_user_preferences(
        db, 
        user_id=current_user.id, 
        preferences=preferences
    )
    return updated_preferences

@router.get("/subscription")
async def get_subscription(
    current_user: UserRead = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get current user subscription information.
    """
    # Get user from database to check if premium
    user = get_user(db, user_id=current_user.id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_premium:
        return {
            "plan": "Free",
            "is_active": True
        }
    
    # TODO: Implement subscription details retrieval from payment provider
    # This is a placeholder for now
    return {
        "plan": "Premium",
        "billing_cycle": "Monthly",
        "next_billing_date": "2023-12-01",
        "payment_method": "Credit Card (ending in 1234)",
        "is_active": True
    }
