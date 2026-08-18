from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(128), primary_key=True)
    author_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    author_name = Column(String(255), nullable=False)
    author_avatar = Column(Text, nullable=True)
    author_role = Column(String(64), default="athlete")
    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    media_type = Column(String(32), default="none")  # none, image, video
    sport = Column(String(64), nullable=True)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan", order_by="PostComment.created_at.asc()")
    reactions = relationship("PostReaction", back_populates="post", cascade="all, delete-orphan")

class PostComment(Base):
    __tablename__ = "comments"

    id = Column(String(128), primary_key=True)
    post_id = Column(String(128), ForeignKey("posts.id", ondelete="CASCADE"), index=True, nullable=False)
    author_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    author_name = Column(String(255), nullable=False)
    author_avatar = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    post = relationship("Post", back_populates="comments")

class PostReaction(Base):
    __tablename__ = "post_reactions"

    id = Column(String(128), primary_key=True)
    post_id = Column(String(128), ForeignKey("posts.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    reaction_type = Column(String(32), default="like")  # like, applaud, fire
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="reactions")

    __table_args__ = (
        UniqueConstraint("post_id", "user_id", name="uq_post_user_reaction"),
    )
