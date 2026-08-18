from typing import List, Optional
from pydantic import BaseModel

class AssessmentTypeOut(BaseModel):
    id: str
    sport_id: str
    name: str
    description: str
    duration_sec: int
    camera_angle: str
    metrics_measured: List[str]
    instructions: List[str]
    requirements: List[str]

class SportOut(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    category: str
    active_athletes_count: int
    assessment_types: List[AssessmentTypeOut] = []

    class Config:
        from_attributes = True
