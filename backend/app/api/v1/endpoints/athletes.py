from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import AthleteProfile, Profile
from app.models.block import UserBlock
from app.models.connection import UserConnection
from app.schemas.athlete import AthleteOut, AthleteUpdate

router = APIRouter()

@router.get("/me", response_model=AthleteOut)
async def get_my_athlete_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        # Create initial profile if not exists
        athlete = AthleteProfile(
            id=f"ath_{user_id[:8] if user_id else 'default'}",
            user_id=user_id,
            name=current_user.get("name", "Athlete"),
            email=current_user.get("email"),
            sport="football",
            position="Striker / Forward",
            total_assessments=0
        )
        db.add(athlete)
        db.commit()
        db.refresh(athlete)
    
    # Calculate real follower/following counts
    followers_c = db.query(UserConnection).filter(UserConnection.following_id == user_id).count()
    following_c = db.query(UserConnection).filter(UserConnection.follower_id == user_id).count()
    athlete.followers_count = followers_c
    athlete.following_count = following_c

    return athlete

@router.put("/me", response_model=AthleteOut)
async def update_my_athlete_profile(
    data: AthleteUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    athlete = db.query(AthleteProfile).filter(AthleteProfile.user_id == user_id).first()
    if not athlete:
        athlete = AthleteProfile(
            id=f"ath_{user_id[:8] if user_id else 'default'}",
            user_id=user_id,
            name=current_user.get("name", "Athlete")
        )
        db.add(athlete)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(athlete, field, value)

    # Sync name/avatar with main profile if changed
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if profile:
        if "name" in update_data and update_data["name"]:
            profile.name = update_data["name"]
        if "avatar_url" in update_data:
            profile.avatar_url = update_data["avatar_url"]

    db.commit()
    db.refresh(athlete)
    return athlete

@router.get("/discover", response_model=List[AthleteOut])
async def discover_athletes(
    sport: Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    user_role = current_user.get("role", "athlete")

    # Exclude blocked users in discovery
    blocked_subquery = db.query(UserBlock.blocked_id).filter(UserBlock.blocker_id == user_id)
    blocker_subquery = db.query(UserBlock.blocker_id).filter(UserBlock.blocked_id == user_id)

    query = db.query(AthleteProfile).filter(
        AthleteProfile.user_id != user_id,
        ~AthleteProfile.user_id.in_(blocked_subquery),
        ~AthleteProfile.user_id.in_(blocker_subquery)
    )

    # Privacy filtering:
    if user_role in ["scout", "coach", "admin"]:
        # Scouts/coaches can see public and coaches_only profiles
        query = query.filter(AthleteProfile.visibility.in_(["public", "coaches_only"]))
    else:
        # General athletes can only see public profiles
        query = query.filter(AthleteProfile.visibility == "public")

    if sport and sport != "all":
        query = query.filter(AthleteProfile.sport.ilike(f"%{sport}%"))
    if position and position != "all":
        query = query.filter(AthleteProfile.position.ilike(f"%{position}%"))
    if location:
        query = query.filter(AthleteProfile.location.ilike(f"%{location}%"))
    if experience_level and experience_level != "all":
        query = query.filter(AthleteProfile.experience_level.ilike(f"%{experience_level}%"))
    if search:
        query = query.filter(
            (AthleteProfile.name.ilike(f"%{search}%")) |
            (AthleteProfile.location.ilike(f"%{search}%")) |
            (AthleteProfile.sport.ilike(f"%{search}%")) |
            (AthleteProfile.club_academy.ilike(f"%{search}%"))
        )

    results = query.order_by(AthleteProfile.created_at.desc()).offset(offset).limit(limit).all()
    return results

@router.get("/{athlete_id}", response_model=AthleteOut)
async def get_athlete_by_id(
    athlete_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    athlete = db.query(AthleteProfile).filter(AthleteProfile.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete profile not found")

    user_id = current_user.get("sub")
    user_role = current_user.get("role", "athlete")

    # If it's the user's own profile, always allow
    if athlete.user_id == user_id:
        return athlete

    # Check blocking
    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == athlete.user_id)) |
        ((UserBlock.blocker_id == athlete.user_id) & (UserBlock.blocked_id == user_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Profile is unavailable due to user blocking restrictions")

    # Privacy visibility checks
    if athlete.visibility == "private":
        raise HTTPException(status_code=403, detail="This athlete profile is set to private")
    elif athlete.visibility == "coaches_only" and user_role not in ["coach", "scout", "admin"]:
        raise HTTPException(status_code=403, detail="This profile is accessible only to verified coaches and scouts")

    # Dynamic followers calculation
    followers_c = db.query(UserConnection).filter(UserConnection.following_id == athlete.user_id).count()
    following_c = db.query(UserConnection).filter(UserConnection.follower_id == athlete.user_id).count()
    athlete.followers_count = followers_c
    athlete.following_count = following_c

    return athlete
