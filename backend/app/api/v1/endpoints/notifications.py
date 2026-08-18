from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter()

@router.get("", response_model=List[NotificationOut])
async def list_my_notifications(
    limit: int = Query(30, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    notifs = db.query(Notification).filter(
        Notification.recipient_id == user_id
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    return notifs

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == user_id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}

@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    db.query(Notification).filter(
        Notification.recipient_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
