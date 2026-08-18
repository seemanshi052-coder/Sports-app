from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.auth import UserRegister, UserLogin, AuthResponse, UserOut
from app.models.user import Profile, AthleteProfile
from app.services.storage_service import get_supabase_client
import uuid

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    supabase = get_supabase_client()
    user_id = str(uuid.uuid4())
    access_token = f"token_{user_id}"

    if supabase:
        try:
            auth_res = supabase.auth.sign_up({
                "email": data.email,
                "password": data.password,
                "options": {
                    "data": {"name": data.name, "role": data.role}
                }
            })
            if auth_res.user:
                user_id = auth_res.user.id
                access_token = auth_res.session.access_token if auth_res.session else access_token
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Persist in PostgreSQL
    profile = db.query(Profile).filter(Profile.email == data.email).first()
    if not profile:
        profile = Profile(
            id=user_id,
            auth_user_id=user_id,
            email=data.email,
            name=data.name,
            role=data.role,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        db.add(profile)

        if data.role == "athlete":
            ath = AthleteProfile(
                id=f"ath_{user_id[:8]}",
                user_id=user_id,
                name=data.name,
                email=data.email,
                avatar_url=profile.avatar_url,
                total_assessments=0
            )
            db.add(ath)
        
        db.commit()
        db.refresh(profile)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": profile.id,
            "email": profile.email,
            "name": profile.name,
            "role": profile.role,
            "avatar_url": profile.avatar_url
        }
    }

@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    supabase = get_supabase_client()
    if supabase and data.password:
        try:
            auth_res = supabase.auth.sign_in_with_password({
                "email": data.email,
                "password": data.password
            })
            if auth_res.user and auth_res.session:
                profile = db.query(Profile).filter(Profile.id == auth_res.user.id).first()
                if not profile:
                    profile = Profile(
                        id=auth_res.user.id,
                        auth_user_id=auth_res.user.id,
                        email=data.email,
                        name=auth_res.user.user_metadata.get("name", data.email.split("@")[0]),
                        role=auth_res.user.user_metadata.get("role", "athlete")
                    )
                    db.add(profile)
                    db.commit()
                    db.refresh(profile)

                return {
                    "access_token": auth_res.session.access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": profile.id,
                        "email": profile.email,
                        "name": profile.name,
                        "role": profile.role,
                        "avatar_url": profile.avatar_url
                    }
                }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Supabase login failed: {str(e)}")

    # Database query fallback
    profile = db.query(Profile).filter(Profile.email == data.email).first()
    if not profile:
        profile = Profile(
            id=str(uuid.uuid4()),
            email=data.email,
            name=data.email.split("@")[0],
            role=data.role or "athlete"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "access_token": f"token_{profile.id}",
        "token_type": "bearer",
        "user": {
            "id": profile.id,
            "email": profile.email,
            "name": profile.name,
            "role": profile.role,
            "avatar_url": profile.avatar_url
        }
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("sub")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        return {
            "id": user_id or "user_ath_1",
            "email": current_user.get("email", "athlete@athletes.net"),
            "name": current_user.get("name", "Athlete"),
            "role": current_user.get("role", "athlete"),
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        }
    return profile
