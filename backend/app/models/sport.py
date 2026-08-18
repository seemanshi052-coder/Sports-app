from sqlalchemy import Column, String, Integer, Text, JSON
from app.db.session import Base

class Sport(Base):
    __tablename__ = "sports"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    icon = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(64), nullable=False)
    active_athletes_count = Column(Integer, default=0)

class AssessmentType(Base):
    __tablename__ = "assessment_types"

    id = Column(String(128), primary_key=True)
    sport_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    duration_sec = Column(Integer, default=15)
    camera_angle = Column(String(128), default="side_view")
    metrics_measured = Column(JSON, default=list)
    instructions = Column(JSON, default=list)
    requirements = Column(JSON, default=list)
