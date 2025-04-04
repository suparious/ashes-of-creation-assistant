from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserRead(UserBase):
    id: int
    display_name: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def password_complexity(cls, v):
        """
        Validate password complexity.
        At least 8 characters long and contains at least one digit.
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserPreferences(BaseModel):
    email_notifications: bool = True
    discord_notifications: bool = False
    dark_mode: bool = False
    compact_layout: bool = False
    additional_preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True


class SavedItemCreate(BaseModel):
    item_id: str
    notes: Optional[str] = None


class SavedItemRead(SavedItemCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True


class SavedItemUpdate(BaseModel):
    notes: Optional[str] = None
