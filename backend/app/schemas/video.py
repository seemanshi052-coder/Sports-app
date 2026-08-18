from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class VideoMetadata(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str = "video/mp4"
    duration_sec: float
    resolution: Optional[str] = "1920x1080"
    storage_bucket: str = "assessment-videos"
    storage_path: str
    public_url: Optional[str] = None
    uploaded_at: Optional[datetime] = None

class UploadUrlRequest(BaseModel):
    file_name: str
    file_type: str = "video/mp4"
    bucket: str = "assessment-videos"
    assessment_id: Optional[str] = None

class UploadUrlResponse(BaseModel):
    bucket: str
    storage_path: str
    signed_upload_url: Optional[str] = None
    token: Optional[str] = None
