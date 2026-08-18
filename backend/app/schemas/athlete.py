from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class AthleteBase(BaseModel):
    name: str
    email: Optional[str] = None
    age: int = 18
    gender: str = "other"
    height_cm: int = 175
    weight_kg: int = 70
    sport: str = "football"
    secondary_sports: Optional[str] = None
    position: str = "Forward"
    experience_level: str = "intermediate"
    location: str = "United States"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    training_background: Optional[str] = None
    club_academy: Optional[str] = None
    school_college: Optional[str] = None
    personal_bests: Optional[str] = None
    visibility: str = "public"  # public, coaches_only, private

class AthleteUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    sport: Optional[str] = None
    secondary_sports: Optional[str] = None
    position: Optional[str] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    training_background: Optional[str] = None
    club_academy: Optional[str] = None
    school_college: Optional[str] = None
    personal_bests: Optional[str] = None
    visibility: Optional[str] = None

class AthleteOut(AthleteBase):
    id: str
    user_id: Optional[str] = None
    verification_status: str = "unverified"
    followers_count: int = 0
    following_count: int = 0
    overall_rating: Optional[float] = None
    total_assessments: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
