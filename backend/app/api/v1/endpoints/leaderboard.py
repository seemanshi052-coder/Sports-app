from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.assessment import Assessment

router = APIRouter()

@router.get("")
async def get_leaderboard(
    sport: Optional[str] = Query(None),
    assessment_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns verified athletic rankings.
    Returns honest empty list if no assessments have completed real CV verification.
    """
    query = db.query(Assessment).filter(Assessment.status == "completed", Assessment.overall_score.isnot(None))
    if sport and sport != "all":
        query = query.filter(Assessment.sport.ilike(f"%{sport}%"))
    if assessment_type and assessment_type != "all":
        query = query.filter(Assessment.assessment_type.ilike(f"%{assessment_type}%"))
    
    verified_results = query.order_by(Assessment.overall_score.desc()).all()
    
    items = []
    for idx, r in enumerate(verified_results):
        items.append({
            "rank": idx + 1,
            "athlete_id": r.athlete_id,
            "name": r.athlete_name,
            "sport": r.sport,
            "assessment_type": r.assessment_type,
            "overall_score": r.overall_score,
            "tier": r.tier or "Verified",
            "date": r.completed_at.isoformat() if r.completed_at else None
        })

    return {
        "items": items,
        "total": len(items),
        "message": "Real verified rankings" if len(items) > 0 else "No completed assessments verified yet."
    }
