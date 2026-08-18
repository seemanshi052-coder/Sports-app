from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ReportCreate(BaseModel):
    target_type: str  # profile, post, comment, message
    target_id: str
    reported_user_id: Optional[str] = None
    reason: str
    description: Optional[str] = None

class ReportOut(BaseModel):
    id: str
    reporter_id: str
    reported_user_id: Optional[str] = None
    target_type: str
    target_id: str
    reason: str
    description: Optional[str] = None
    status: str = "pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
