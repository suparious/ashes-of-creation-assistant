from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserPreference
from app.schemas.auth import UserCreate
from app.schemas.users import UserUpdate, UserPreferences


def get_user(db: Session, user_id: int) -> Optional[User]:
    """
    Get a user by ID.
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Get a user by email.
    """
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    Get a user by username.
    """
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user_create: UserCreate) -> User:
    """
    Create a new user.
    """
    # Create user
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=get_password_hash(user_create.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default preferences
    db_preferences = UserPreference(
        user_id=db_user.id,
        email_notifications=True,
        discord_notifications=False,
        dark_mode=False,
        compact_layout=False
    )
    db.add(db_preferences)
    db.commit()
    
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user.
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user(
    db: Session, 
    db_obj: User,
    obj_in: Union[UserUpdate, Dict[str, Any]]
) -> User:
    """
    Update a user.
    """
    update_data = obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
    
    for field in update_data:
        if field != "password" and hasattr(db_obj, field) and update_data[field] is not None:
            setattr(db_obj, field, update_data[field])
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_user_password(db: Session, user_id: int, new_password: str) -> User:
    """
    Update a user's password.
    """
    user = get_user(db, user_id=user_id)
    if not user:
        return None
        
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_preferences(db: Session, user_id: int) -> Optional[UserPreferences]:
    """
    Get a user's preferences.
    """
    preferences = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not preferences:
        return None
        
    return UserPreferences(
        email_notifications=preferences.email_notifications,
        discord_notifications=preferences.discord_notifications,
        dark_mode=preferences.dark_mode,
        compact_layout=preferences.compact_layout,
        additional_preferences=preferences.additional_preferences
    )


def update_user_preferences(
    db: Session, 
    user_id: int, 
    preferences: UserPreferences
) -> UserPreferences:
    """
    Update a user's preferences.
    """
    db_preferences = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    
    if not db_preferences:
        # Create preferences if they don't exist
        db_preferences = UserPreference(
            user_id=user_id,
            email_notifications=preferences.email_notifications,
            discord_notifications=preferences.discord_notifications,
            dark_mode=preferences.dark_mode,
            compact_layout=preferences.compact_layout,
            additional_preferences=preferences.additional_preferences or {}
        )
        db.add(db_preferences)
    else:
        # Update existing preferences
        db_preferences.email_notifications = preferences.email_notifications
        db_preferences.discord_notifications = preferences.discord_notifications
        db_preferences.dark_mode = preferences.dark_mode
        db_preferences.compact_layout = preferences.compact_layout
        
        if preferences.additional_preferences:
            db_preferences.additional_preferences = preferences.additional_preferences
    
    db.commit()
    db.refresh(db_preferences)
    
    return UserPreferences(
        email_notifications=db_preferences.email_notifications,
        discord_notifications=db_preferences.discord_notifications,
        dark_mode=db_preferences.dark_mode,
        compact_layout=db_preferences.compact_layout,
        additional_preferences=db_preferences.additional_preferences
    )
