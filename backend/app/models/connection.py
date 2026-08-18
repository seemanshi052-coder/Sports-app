from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserConnection(Base):
    __tablename__ = "connections"

    id = Column(String(128), primary_key=True)
    follower_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    following_id = Column(String(128), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String(32), default="following")  # following, connected, pending
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower = relationship("Profile", foreign_keys=[follower_id])
    following = relationship("Profile", foreign_keys=[following_id])

    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_connection"),
    )
