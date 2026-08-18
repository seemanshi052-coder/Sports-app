import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.scout import ScoutNote
from app.schemas.scout import ScoutNoteCreate, ScoutNoteOut

router = APIRouter()

@router.get("/notes", response_model=List[ScoutNoteOut])
async def list_scout_notes(
    athlete_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ScoutNote)
    if athlete_id:
        query = query.filter(ScoutNote.athlete_id == athlete_id)
    return query.order_by(ScoutNote.created_at.desc()).all()

@router.post("/notes", response_model=ScoutNoteOut)
async def create_scout_note(
    data: ScoutNoteCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note_id = f"sn_{uuid.uuid4().hex[:10]}"
    new_note = ScoutNote(
        id=note_id,
        scout_id=current_user.get("sub", "scout_1"),
        scout_name=current_user.get("name", "Verified Scout"),
        athlete_id=data.athlete_id,
        note=data.note,
        rating=data.rating,
        status=data.status,
        tags=data.tags,
        created_at=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note
