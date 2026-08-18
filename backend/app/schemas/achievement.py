from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    sport: str
    competition: Optional[str] = None
    date: Optional[str] = None
    organization: Optional[str] = None
    rank_position: Optional[str] = None
    award_type: str = "Medal"
    media_url: Optional[str] = None

class AchievementCreate(AchievementBase):
    pass

class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    sport: Optional[str] = None
    competition: Optional[str] = None
    date: Optional[str] = None
    organization: Optional[str] = None
    rank_position: Optional[str] = None
    award_type: Optional[str] = None
    media_url: Optional[str] = None

class AchievementOut(AchievementBase):
    id: str
    athlete_id: str
    verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
