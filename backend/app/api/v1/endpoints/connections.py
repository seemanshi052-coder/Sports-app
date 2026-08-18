import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import Profile, AthleteProfile
from app.models.connection import UserConnection
from app.models.block import UserBlock
from app.models.notification import Notification
from app.schemas.connection import ConnectionCreate, ConnectionOut

router = APIRouter()

@router.post("/follow", response_model=ConnectionOut)
async def follow_user(
    data: ConnectionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    follower_id = current_user.get("sub")
    following_id = data.following_id

    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_profile = db.query(Profile).filter(Profile.id == following_id).first()
    if not target_profile:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check blocking
    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == follower_id) & (UserBlock.blocked_id == following_id)) |
        ((UserBlock.blocker_id == following_id) & (UserBlock.blocked_id == follower_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot follow this user due to blocking restrictions")

    existing = db.query(UserConnection).filter(
        UserConnection.follower_id == follower_id,
        UserConnection.following_id == following_id
    ).first()

    if existing:
        return ConnectionOut(
            id=existing.id,
            follower_id=existing.follower_id,
            following_id=existing.following_id,
            status=existing.status,
            user_name=target_profile.name,
            user_avatar=target_profile.avatar_url,
            user_role=target_profile.role,
            created_at=existing.created_at
        )

    conn_id = f"conn_{uuid.uuid4().hex[:12]}"
    new_conn = UserConnection(
        id=conn_id,
        follower_id=follower_id,
        following_id=following_id,
        status="following"
    )
    db.add(new_conn)

    # Notify followed user
    follower_profile = db.query(Profile).filter(Profile.id == follower_id).first()
    f_name = follower_profile.name if follower_profile else "An athlete"
    notif = Notification(
        id=f"notif_{uuid.uuid4().hex[:12]}",
        recipient_id=following_id,
        sender_id=follower_id,
        sender_name=f_name,
        type="new_connection",
        title="New Follower",
        body=f"{f_name} started following your athletic journey.",
        target_id=follower_id
    )
    db.add(notif)

    db.commit()
    db.refresh(new_conn)

    return ConnectionOut(
        id=new_conn.id,
        follower_id=new_conn.follower_id,
        following_id=new_conn.following_id,
        status=new_conn.status,
        user_name=target_profile.name,
        user_avatar=target_profile.avatar_url,
        user_role=target_profile.role,
        created_at=new_conn.created_at
    )

@router.delete("/unfollow/{target_user_id}")
async def unfollow_user(
    target_user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    follower_id = current_user.get("sub")
    conn = db.query(UserConnection).filter(
        UserConnection.follower_id == follower_id,
        UserConnection.following_id == target_user_id
    ).first()

    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    db.delete(conn)
    db.commit()
    return {"status": "success", "message": "Unfollowed user successfully"}

@router.get("/following", response_model=List[ConnectionOut])
async def list_following(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    connections = db.query(UserConnection).filter(UserConnection.follower_id == user_id).all()

    result = []
    for c in connections:
        p = db.query(Profile).filter(Profile.id == c.following_id).first()
        ath = db.query(AthleteProfile).filter(AthleteProfile.user_id == c.following_id).first()
        result.append(ConnectionOut(
            id=c.id,
            follower_id=c.follower_id,
            following_id=c.following_id,
            status=c.status,
            user_name=p.name if p else "User",
            user_avatar=p.avatar_url if p else None,
            user_role=p.role if p else "athlete",
            sport=ath.sport if ath else None,
            created_at=c.created_at
        ))
    return result

@router.get("/followers", response_model=List[ConnectionOut])
async def list_followers(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    connections = db.query(UserConnection).filter(UserConnection.following_id == user_id).all()

    result = []
    for c in connections:
        p = db.query(Profile).filter(Profile.id == c.follower_id).first()
        ath = db.query(AthleteProfile).filter(AthleteProfile.user_id == c.follower_id).first()
        result.append(ConnectionOut(
            id=c.id,
            follower_id=c.follower_id,
            following_id=c.following_id,
            status=c.status,
            user_name=p.name if p else "User",
            user_avatar=p.avatar_url if p else None,
            user_role=p.role if p else "athlete",
            sport=ath.sport if ath else None,
            created_at=c.created_at
        ))
    return result

@router.get("/status/{target_user_id}")
async def check_follow_status(
    target_user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    is_following = db.query(UserConnection).filter(
        UserConnection.follower_id == user_id,
        UserConnection.following_id == target_user_id
    ).first() is not None

    is_follower = db.query(UserConnection).filter(
        UserConnection.follower_id == target_user_id,
        UserConnection.following_id == user_id
    ).first() is not None

    return {
        "is_following": is_following,
        "is_follower": is_follower
    }
