from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class BlockCreate(BaseModel):
    blocked_id: str
    reason: Optional[str] = None

class BlockOut(BaseModel):
    id: str
    blocker_id: str
    blocked_id: str
    blocked_name: Optional[str] = None
    blocked_avatar: Optional[str] = None
    reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
