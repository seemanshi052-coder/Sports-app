from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, validator
from app.schemas.video import VideoMetadata

VALID_MODES = {"preparation", "official"}

class AssessmentCreate(BaseModel):
    sport: str
    assessment_type: str
    video_storage_path: Optional[str] = None
    video_url: Optional[str] = None
    video_metadata: Optional[VideoMetadata] = None
    mode: str

    @validator('mode')
    def validate_mode(cls, v):
        if v not in VALID_MODES:
            raise ValueError(f'Invalid mode: {v}. Must be one of: {", ".join(VALID_MODES)}')
        return v

class AssessmentOut(BaseModel):
    id: str
    athlete_id: str
    athlete_name: Optional[str] = None
    sport: str
    assessment_type: str
    assessment_name: str
    video_storage_path: Optional[str] = None
    video_url: Optional[str] = None
    video_metadata: Optional[Dict[str, Any]] = None
    
    # Real statuses: created, uploading, uploaded, pending_analysis, completed, failed
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Assessment mode: preparation or official
    mode: str
    
    # Analysis metrics (null until authentic CV processing occurs)
    overall_score: Optional[float] = None
    tier: Optional[str] = None
    confidence_score: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None
    raw_measurements: Optional[Dict[str, Any]] = None
    biomechanics: Optional[Dict[str, Any]] = None
    strengths: Optional[List[str]] = None
    improvement_areas: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    model_version: Optional[str] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
