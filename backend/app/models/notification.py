from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(128), primary_key=True)
    recipient_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=True)
    sender_name = Column(String(255), nullable=True)
    type = Column(String(64), nullable=False)  # new_message, new_comment, new_reaction, new_connection, report_update
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    target_id = Column(String(128), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    recipient = relationship("Profile", foreign_keys=[recipient_id])
    sender = relationship("Profile", foreign_keys=[sender_id])
