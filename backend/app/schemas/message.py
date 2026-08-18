from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class MessageCreate(BaseModel):
    message_text: str
    media_url: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    message_text: str
    media_url: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConversationMemberOut(BaseModel):
    user_id: str
    user_name: str
    user_role: str = "athlete"
    user_avatar: Optional[str] = None
    last_read_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    recipient_id: str
    initial_message: Optional[str] = None
    title: Optional[str] = None

class ConversationOut(BaseModel):
    id: str
    title: Optional[str] = None
    is_group: bool = False
    members: List[ConversationMemberOut] = []
    last_message: Optional[MessageOut] = None
    unread_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
