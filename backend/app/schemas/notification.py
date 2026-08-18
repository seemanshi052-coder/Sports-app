from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: str
    recipient_id: str
    sender_id: Optional[str] = None
    sender_name: Optional[str] = None
    type: str
    title: str
    body: str
    target_id: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
