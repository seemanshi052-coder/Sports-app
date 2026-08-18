import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import Profile, AthleteProfile
from app.models.message import Conversation, ConversationMember, Message
from app.models.block import UserBlock
from app.models.notification import Notification
from app.schemas.message import (
    ConversationCreate, ConversationOut, ConversationMemberOut,
    MessageCreate, MessageOut
)

router = APIRouter()

@router.post("/conversations", response_model=ConversationOut)
async def start_or_get_conversation(
    data: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    recipient_id = data.recipient_id

    if user_id == recipient_id:
        raise HTTPException(status_code=400, detail="You cannot start a conversation with yourself")

    # Verify recipient exists
    recipient = db.query(Profile).filter(Profile.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    # Check blocking
    is_blocked = db.query(UserBlock).filter(
        ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == recipient_id)) |
        ((UserBlock.blocker_id == recipient_id) & (UserBlock.blocked_id == user_id))
    ).first()
    if is_blocked:
        raise HTTPException(status_code=403, detail="Cannot message this user due to user blocking restrictions")

    # Check if a 1-on-1 conversation already exists between these 2 users
    user_convs = db.query(ConversationMember.conversation_id).filter(ConversationMember.user_id == user_id).subquery()
    existing_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id.in_(user_convs),
        ConversationMember.user_id == recipient_id
    ).first()

    my_profile = db.query(Profile).filter(Profile.id == user_id).first()
    my_name = my_profile.name if my_profile else current_user.get("name", "Athlete")
    my_role = my_profile.role if my_profile else current_user.get("role", "athlete")
    my_avatar = my_profile.avatar_url if my_profile else None

    if existing_member:
        conv = db.query(Conversation).filter(Conversation.id == existing_member.conversation_id).first()
    else:
        # Create new conversation
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        conv = Conversation(
            id=conv_id,
            title=data.title or f"{my_name} & {recipient.name}",
            is_group=False
        )
        db.add(conv)

        # Add both members
        m1 = ConversationMember(
            id=f"mem_{uuid.uuid4().hex[:12]}",
            conversation_id=conv_id,
            user_id=user_id,
            user_name=my_name,
            user_role=my_role,
            user_avatar=my_avatar,
            last_read_at=datetime.utcnow()
        )
        m2 = ConversationMember(
            id=f"mem_{uuid.uuid4().hex[:12]}",
            conversation_id=conv_id,
            user_id=recipient_id,
            user_name=recipient.name,
            user_role=recipient.role,
            user_avatar=recipient.avatar_url,
            last_read_at=None
        )
        db.add_all([m1, m2])
        db.commit()
        db.refresh(conv)

    # If initial message provided, send it
    if data.initial_message:
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        msg = Message(
            id=msg_id,
            conversation_id=conv.id,
            sender_id=user_id,
            sender_name=my_name,
            message_text=data.initial_message,
            created_at=datetime.utcnow()
        )
        db.add(msg)
        conv.updated_at = datetime.utcnow()

        # Send notification
        notif = Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            recipient_id=recipient_id,
            sender_id=user_id,
            sender_name=my_name,
            type="new_message",
            title=f"New message from {my_name}",
            body=data.initial_message[:80],
            target_id=conv.id
        )
        db.add(notif)
        db.commit()

    return _format_conversation(conv, user_id, db)

@router.get("/conversations", response_model=List[ConversationOut])
async def list_my_conversations(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")

    # Get all conversation IDs where user is a member
    member_records = db.query(ConversationMember).filter(ConversationMember.user_id == user_id).all()
    conv_ids = [m.conversation_id for m in member_records]

    if not conv_ids:
        return []

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(conv_ids)
    ).order_by(Conversation.updated_at.desc()).all()

    return [_format_conversation(c, user_id, db) for c in conversations]

@router.get("/conversations/{conv_id}", response_model=ConversationOut)
async def get_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    is_member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user_id
    ).first()
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return _format_conversation(conv, user_id, db)

@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
async def list_conversation_messages(
    conv_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation")

    # Mark last_read_at
    member.last_read_at = datetime.utcnow()
    db.commit()

    messages = db.query(Message).filter(
        Message.conversation_id == conv_id
    ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()

    return [MessageOut.model_validate(m) for m in messages]

@router.post("/conversations/{conv_id}/messages", response_model=MessageOut)
async def send_message(
    conv_id: str,
    data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation")

    # Check if other members have blocked or been blocked by sender
    other_members = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id != user_id
    ).all()

    for om in other_members:
        is_blocked = db.query(UserBlock).filter(
            ((UserBlock.blocker_id == user_id) & (UserBlock.blocked_id == om.user_id)) |
            ((UserBlock.blocker_id == om.user_id) & (UserBlock.blocked_id == user_id))
        ).first()
        if is_blocked:
            raise HTTPException(status_code=403, detail="Cannot send message due to blocking restrictions")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    sender_name = profile.name if profile else current_user.get("name", "Athlete")

    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    new_msg = Message(
        id=msg_id,
        conversation_id=conv_id,
        sender_id=user_id,
        sender_name=sender_name,
        message_text=data.message_text,
        media_url=data.media_url,
        created_at=datetime.utcnow()
    )
    db.add(new_msg)

    # Update conversation timestamp
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()

    # Notify other members
    for om in other_members:
        notif = Notification(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            recipient_id=om.user_id,
            sender_id=user_id,
            sender_name=sender_name,
            type="new_message",
            title=f"New message from {sender_name}",
            body=data.message_text[:80],
            target_id=conv_id
        )
        db.add(notif)

    db.commit()
    db.refresh(new_msg)
    return MessageOut.model_validate(new_msg)

def _format_conversation(conv: Conversation, current_user_id: str, db: Session) -> ConversationOut:
    members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conv.id).all()
    member_outs = [
        ConversationMemberOut(
            user_id=m.user_id,
            user_name=m.user_name,
            user_role=m.user_role,
            user_avatar=m.user_avatar,
            last_read_at=m.last_read_at
        ) for m in members
    ]

    last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.desc()).first()
    last_msg_out = MessageOut.model_validate(last_msg) if last_msg else None

    # Calculate unread count
    my_mem = next((m for m in members if m.user_id == current_user_id), None)
    unread_c = 0
    if my_mem and my_mem.last_read_at:
        unread_c = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.created_at > my_mem.last_read_at
        ).count()
    elif my_mem:
        unread_c = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id
        ).count()

    return ConversationOut(
        id=conv.id,
        title=conv.title,
        is_group=conv.is_group,
        members=member_outs,
        last_message=last_msg_out,
        unread_count=unread_c,
        created_at=conv.created_at,
        updated_at=conv.updated_at
    )
