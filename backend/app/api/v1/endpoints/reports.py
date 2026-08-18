import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter()

@router.post("", response_model=ReportOut)
async def submit_report(
    data: ReportCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reporter_id = current_user.get("sub")
    rep_id = f"rep_{uuid.uuid4().hex[:12]}"
    
    new_report = Report(
        id=rep_id,
        reporter_id=reporter_id,
        reported_user_id=data.reported_user_id,
        target_type=data.target_type,
        target_id=data.target_id,
        reason=data.reason,
        description=data.description,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/my-reports", response_model=List[ReportOut])
async def list_my_reports(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reporter_id = current_user.get("sub")
    reports = db.query(Report).filter(Report.reporter_id == reporter_id).order_by(Report.created_at.desc()).all()
    return reports

@router.get("", response_model=List[ReportOut])
async def list_all_reports_for_admin(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only admin/authority can view all reports
    user_role = current_user.get("role")
    if user_role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Access forbidden: Admin or Authority role required")

    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    return query.order_by(Report.created_at.desc()).all()
