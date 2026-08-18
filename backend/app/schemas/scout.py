from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ScoutNoteCreate(BaseModel):
    athlete_id: str
    note: str
    rating: float = 8.0
    status: str = "shortlisted"
    tags: List[str] = []

class ScoutNoteOut(BaseModel):
    id: str
    scout_id: str
    scout_name: str
    athlete_id: str
    note: str
    rating: float
    status: str
    tags: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
