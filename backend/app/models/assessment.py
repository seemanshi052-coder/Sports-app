from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(128), primary_key=True)
    athlete_id = Column(String(128), ForeignKey("athlete_profiles.id"), index=True, nullable=False)
    athlete_name = Column(String(255), nullable=True)
    sport = Column(String(64), nullable=False)
    assessment_type = Column(String(128), nullable=False)
    assessment_name = Column(String(255), nullable=False)
    video_storage_path = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    video_metadata = Column(JSON, nullable=True)
    
    # Real Lifecycle status: created -> uploading -> uploaded -> pending_analysis -> completed -> failed
    status = Column(String(64), default="created")
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Real scores (null until processed by verified pipeline)
    overall_score = Column(Float, nullable=True)
    tier = Column(String(64), nullable=True)
    confidence_score = Column(Integer, nullable=True)
    metrics = Column(JSON, nullable=True)
    raw_measurements = Column(JSON, nullable=True)
    biomechanics = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    improvement_areas = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    model_version = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    athlete = relationship("AthleteProfile", back_populates="assessments")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(128), primary_key=True)
    assessment_id = Column(String(128), ForeignKey("assessments.id"), index=True, nullable=False)
    attempt_number = Column(Integer, default=1)
    video_storage_path = Column(Text, nullable=False)
    video_storage_bucket = Column(String(128), default="assessment-videos")
    file_size_bytes = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    resolution = Column(String(64), nullable=True)
    mime_type = Column(String(64), default="video/mp4")
    upload_status = Column(String(64), default="pending")  # pending -> uploaded -> verified
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assessment = relationship("Assessment", back_populates="attempts")
