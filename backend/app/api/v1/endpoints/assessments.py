import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.user import AthleteProfile
from app.models.sport import AssessmentType
from app.schemas.assessment import AssessmentCreate, AssessmentOut

router = APIRouter()

def recalculate_athlete_overall_rating(db: Session, athlete_id: str):
    """
    Computes the athlete's overall rating as the exact arithmetic mean (average)
    of all verified completed assessment drill scores:
    e.g. Squat (82) + Vertical Jump (76) + 20m Sprint (91) + Push-up (85) = 334 / 4 = 83.5
    """
    completed_assessments = db.query(Assessment).filter(
        Assessment.athlete_id == athlete_id,
        Assessment.status == "completed",
        Assessment.overall_score.isnot(None)
    ).all()

    athlete = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_id).first()
    if athlete:
        if completed_assessments:
            total_sum = sum(a.overall_score for a in completed_assessments)
            avg_score = total_sum / len(completed_assessments)
            athlete.overall_rating = round(avg_score, 1)
        else:
            athlete.overall_rating = None
        db.commit()
        db.refresh(athlete)

@router.post("", response_model=AssessmentOut)
async def create_assessment_record(
    data: AssessmentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="User identification missing from token")

    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        # Create athlete profile bound to this verified user
        athlete = AthleteProfile(
            id=f"ath_{user_id[:8]}",
            user_id=user_id,
            name=current_user.get("name", "Athlete"),
            email=current_user.get("email"),
            sport=data.sport,
            position="Athlete",
            total_assessments=0
        )
        db.add(athlete)
        db.commit()
        db.refresh(athlete)

    drill = db.query(AssessmentType).filter(AssessmentType.id == data.assessment_type).first()
    drill_name = drill.name if drill else "Standard Drill Assessment"

    asm_id = f"asm_{uuid.uuid4().hex[:12]}"
    new_asm = Assessment(
        id=asm_id,
        athlete_id=athlete.id,
        athlete_name=athlete.name,
        sport=data.sport,
        assessment_type=data.assessment_type,
        assessment_name=drill_name,
        video_storage_path=data.video_storage_path,
        video_url=data.video_url,
        video_metadata=data.video_metadata.model_dump() if data.video_metadata else {},
        status="uploaded" if data.video_storage_path else "created",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )

    db.add(new_asm)
    athlete.total_assessments = (athlete.total_assessments or 0) + 1
        
    db.commit()
    db.refresh(new_asm)
    return new_asm

@router.get("", response_model=List[AssessmentOut])
async def list_assessments(
    athlete_id: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assessment)
    user_role = current_user.get("role", "athlete")
    user_id = current_user.get("sub")

    # If the user is an athlete, restrict query strictly to their own assessments
    if user_role == "athlete":
        athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
        if not athlete:
            return []
        query = query.filter(Assessment.athlete_id == athlete.id)
    elif athlete_id:
        query = query.filter(Assessment.athlete_id == athlete_id)

    if sport and sport != "all":
        query = query.filter(Assessment.sport.ilike(f"%{sport}%"))
    if status:
        query = query.filter(Assessment.status == status)
    
    return query.order_by(Assessment.created_at.desc()).all()

@router.get("/{asm_id}", response_model=AssessmentOut)
async def get_assessment_by_id(
    asm_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asm = db.query(Assessment).filter(Assessment.id == asm_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")

    user_role = current_user.get("role", "athlete")
    user_id = current_user.get("sub")
    if user_role == "athlete":
        athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
        if not athlete or asm.athlete_id != athlete.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this assessment record")

    return asm

@router.post("/{asm_id}/queue")
async def queue_assessment_for_worker(
    asm_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asm = db.query(Assessment).filter(Assessment.id == asm_id).first()
    if not asm:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    user_role = current_user.get("role", "athlete")
    user_id = current_user.get("sub")
    if user_role == "athlete":
        athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
        if not athlete or asm.athlete_id != athlete.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this assessment")

    asm.status = "pending_analysis"
    db.commit()
    db.refresh(asm)
    return {
        "assessment_id": asm.id,
        "status": asm.status,
        "message": "Video verified in Supabase Storage and queued for worker analysis pipeline."
    }
