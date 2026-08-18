from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: str = "none"  # none, image, video
    sport: Optional[str] = None

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    sport: Optional[str] = None

class PostOut(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: str = "athlete"
    content: str
    media_url: Optional[str] = None
    media_type: str = "none"
    sport: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked_by_me: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReactionToggleRequest(BaseModel):
    reaction_type: str = "like"
