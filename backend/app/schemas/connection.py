from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class ConnectionCreate(BaseModel):
    following_id: str

class ConnectionOut(BaseModel):
    id: str
    follower_id: str
    following_id: str
    status: str = "following"
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_role: Optional[str] = None
    sport: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
