from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.session import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(128), primary_key=True)
    auth_user_id = Column(String(128), index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(64), default="athlete")  # athlete, scout, coach, admin
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    athlete_profile = relationship("AthleteProfile", back_populates="user", uselist=False)

class AthleteProfile(Base):
    __tablename__ = "athlete_profiles"

    id = Column(String(128), primary_key=True)
    user_id = Column(String(128), ForeignKey("profiles.id"), unique=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    age = Column(Integer, default=18)
    gender = Column(String(32), default="other")
    height_cm = Column(Integer, default=175)
    weight_kg = Column(Integer, default=70)
    sport = Column(String(64), default="football")
    secondary_sports = Column(Text, nullable=True)
    position = Column(String(128), default="Forward")
    experience_level = Column(String(64), default="intermediate")
    location = Column(String(255), default="United States")
    bio = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    training_background = Column(Text, nullable=True)
    club_academy = Column(String(255), nullable=True)
    school_college = Column(String(255), nullable=True)
    personal_bests = Column(Text, nullable=True)
    visibility = Column(String(32), default="public")  # public, coaches_only, private
    verification_status = Column(String(32), default="unverified")  # unverified, pending, verified, rejected
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    overall_rating = Column(Float, nullable=True)  # Computed dynamically as average of completed drill scores (e.g. 83.5)
    total_assessments = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("Profile", back_populates="athlete_profile")
    assessments = relationship("Assessment", back_populates="athlete")
    achievements = relationship("Achievement", back_populates="athlete", cascade="all, delete-orphan")
