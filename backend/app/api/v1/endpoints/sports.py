from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.sport import Sport, AssessmentType
from app.schemas.sport import SportOut, AssessmentTypeOut

router = APIRouter()

@router.get("", response_model=List[SportOut])
async def get_sports_catalog(db: Session = Depends(get_db)):
    sports = db.query(Sport).all()
    result = []
    for s in sports:
        drills = db.query(AssessmentType).filter(AssessmentType.sport_id == s.id).all()
        sport_dict = {
            "id": s.id,
            "name": s.name,
            "icon": s.icon,
            "description": s.description,
            "category": s.category,
            "active_athletes_count": s.active_athletes_count,
            "assessment_types": [
                AssessmentTypeOut(
                    id=d.id,
                    sport_id=d.sport_id,
                    name=d.name,
                    description=d.description,
                    duration_sec=d.duration_sec,
                    camera_angle=d.camera_angle,
                    metrics_measured=d.metrics_measured or [],
                    instructions=d.instructions or [],
                    requirements=d.requirements or []
                ) for d in drills
            ]
        }
        result.append(sport_dict)
    return result
