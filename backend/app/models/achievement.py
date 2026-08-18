from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(128), primary_key=True)
    athlete_id = Column(String(128), ForeignKey("athlete_profiles.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sport = Column(String(64), nullable=False)
    competition = Column(String(255), nullable=True)
    date = Column(String(64), nullable=True)
    organization = Column(String(255), nullable=True)
    rank_position = Column(String(128), nullable=True)  # e.g., "1st Place", "Gold", "Finalist"
    award_type = Column(String(64), default="Medal")     # Medal, Certificate, Trophy, Honor
    media_url = Column(Text, nullable=True)             # Supabase storage path/signed URL
    verified = Column(Boolean, default=False)           # Real verification flag (default False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    athlete = relationship("AthleteProfile", back_populates="achievements")
