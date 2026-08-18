import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import AthleteProfile
from app.models.achievement import Achievement
from app.models.block import UserBlock
from app.schemas.achievement import AchievementCreate, AchievementUpdate, AchievementOut

router = APIRouter()

@router.post("", response_model=AchievementOut)
async def create_achievement(
    data: AchievementCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        raise HTTPException(status_code=400, detail="Athlete profile not found. Please complete profile first.")

    ach_id = f"ach_{uuid.uuid4().hex[:12]}"
    new_ach = Achievement(
        id=ach_id,
        athlete_id=athlete.id,
        title=data.title,
        description=data.description,
        sport=data.sport,
        competition=data.competition,
        date=data.date,
        organization=data.organization,
        rank_position=data.rank_position,
        award_type=data.award_type,
        media_url=data.media_url,
        verified=False  # Real verification starts as false
    )
    db.add(new_ach)
    db.commit()
    db.refresh(new_ach)
    return new_ach

@router.get("", response_model=List[AchievementOut])
async def list_achievements(
    athlete_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")

    if not athlete_id:
        # Default to current athlete's achievements
        athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
        if not athlete:
            return []
        athlete_id = athlete.id

    target_athlete = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_id).first()
    if not target_athlete:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    # If viewing another athlete's achievements, check blocking and privacy
    if target_athlete.user_id != user_id:
        is_blocked = db.query(UserBlock).filter(
            ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == target_athlete.user_id)) |
            ((UserBlock.blocker_id == target_athlete.user_id) & (UserBlock.blocked_id == user_id))
        ).first()
        if is_blocked:
            return []

        user_role = current_user.get("role", "athlete")
        if target_athlete.visibility == "private":
            return []
        elif target_athlete.visibility == "coaches_only" and user_role not in ["coach", "scout", "admin"]:
            return []

    return db.query(Achievement).filter(Achievement.athlete_id == athlete_id).order_by(Achievement.created_at.desc()).all()

@router.get("/{achievement_id}", response_model=AchievementOut)
async def get_achievement(
    achievement_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ach = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return ach

@router.put("/{achievement_id}", response_model=AchievementOut)
async def update_achievement(
    achievement_id: str,
    data: AchievementUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        raise HTTPException(status_code=403, detail="Not authorized")

    ach = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    if ach.athlete_id != athlete.id:
        raise HTTPException(status_code=403, detail="You can only edit your own achievements")

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(ach, field, val)

    db.commit()
    db.refresh(ach)
    return ach

@router.delete("/{achievement_id}")
async def delete_achievement(
    achievement_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        raise HTTPException(status_code=403, detail="Not authorized")

    ach = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not ach:
        raise HTTPException(status_code=404, detail="Achievement not found")

    if ach.athlete_id != athlete.id:
        raise HTTPException(status_code=403, detail="You can only delete your own achievements")

    db.delete(ach)
    db.commit()
    return {"status": "success", "message": "Achievement deleted successfully"}
