from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(128), primary_key=True)
    title = Column(String(255), nullable=True)
    is_group = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), index=True)

    members = relationship("ConversationMember", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    id = Column(String(128), primary_key=True)
    conversation_id = Column(String(128), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    user_name = Column(String(255), nullable=False)
    user_role = Column(String(64), default="athlete")
    user_avatar = Column(Text, nullable=True)
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("Profile")

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_member"),
    )

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(128), primary_key=True)
    conversation_id = Column(String(128), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_name = Column(String(255), nullable=False)
    message_text = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("Profile")
