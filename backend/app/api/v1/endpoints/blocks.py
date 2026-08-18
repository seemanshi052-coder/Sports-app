import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import Profile
from app.models.block import UserBlock
from app.schemas.block import BlockCreate, BlockOut

router = APIRouter()

@router.post("", response_model=BlockOut)
async def block_user(
    data: BlockCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blocker_id = current_user.get("sub")
    blocked_id = data.blocked_id

    if blocker_id == blocked_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")

    target = db.query(Profile).filter(Profile.id == blocked_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User to block not found")

    existing = db.query(UserBlock).filter(
        UserBlock.blocker_id == blocker_id,
        UserBlock.blocked_id == blocked_id
    ).first()

    if existing:
        return BlockOut(
            id=existing.id,
            blocker_id=existing.blocker_id,
            blocked_id=existing.blocked_id,
            blocked_name=target.name,
            blocked_avatar=target.avatar_url,
            reason=existing.reason,
            created_at=existing.created_at
        )

    block_id = f"blk_{uuid.uuid4().hex[:12]}"
    new_block = UserBlock(
        id=block_id,
        blocker_id=blocker_id,
        blocked_id=blocked_id,
        reason=data.reason
    )
    db.add(new_block)
    db.commit()
    db.refresh(new_block)

    return BlockOut(
        id=new_block.id,
        blocker_id=new_block.blocker_id,
        blocked_id=new_block.blocked_id,
        blocked_name=target.name,
        blocked_avatar=target.avatar_url,
        reason=new_block.reason,
        created_at=new_block.created_at
    )

@router.delete("/{blocked_id}")
async def unblock_user(
    blocked_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blocker_id = current_user.get("sub")
    block = db.query(UserBlock).filter(
        UserBlock.blocker_id == blocker_id,
        UserBlock.blocked_id == blocked_id
    ).first()

    if not block:
        raise HTTPException(status_code=404, detail="Block record not found")

    db.delete(block)
    db.commit()
    return {"status": "success", "message": "User unblocked successfully"}

@router.get("", response_model=List[BlockOut])
async def list_blocked_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    blocks = db.query(UserBlock).filter(UserBlock.blocker_id == user_id).all()

    result = []
    for b in blocks:
        target = db.query(Profile).filter(Profile.id == b.blocked_id).first()
        result.append(BlockOut(
            id=b.id,
            blocker_id=b.blocker_id,
            blocked_id=b.blocked_id,
            blocked_name=target.name if target else "User",
            blocked_avatar=target.avatar_url if target else None,
            reason=b.reason,
            created_at=b.created_at
        ))
    return result
