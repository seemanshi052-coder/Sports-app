from sqlalchemy import Column, String, Float, DateTime, Text, JSON, func
from app.db.session import Base

class ScoutNote(Base):
    __tablename__ = "scout_notes"

    id = Column(String(128), primary_key=True)
    scout_id = Column(String(128), index=True, nullable=False)
    scout_name = Column(String(255), nullable=False)
    athlete_id = Column(String(128), index=True, nullable=False)
    note = Column(Text, nullable=False)
    rating = Column(Float, default=8.0)
    status = Column(String(64), default="shortlisted")  # shortlisted, trial_offered, signed, watching
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
