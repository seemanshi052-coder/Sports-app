from sqlalchemy import Column, String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(128), primary_key=True)
    reporter_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    reported_user_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=True)
    target_type = Column(String(32), nullable=False)  # profile, post, comment, message
    target_id = Column(String(128), nullable=False, index=True)
    reason = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="pending")  # pending, reviewed, resolved, dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reporter = relationship("Profile", foreign_keys=[reporter_id])
    reported_user = relationship("Profile", foreign_keys=[reported_user_id])
