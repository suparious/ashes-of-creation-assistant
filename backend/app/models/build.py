from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class Build(Base):
    __tablename__ = "builds"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    data = Column(JSON, nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="builds")
