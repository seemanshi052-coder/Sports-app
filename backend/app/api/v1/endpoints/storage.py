import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.schemas.video import UploadUrlRequest, UploadUrlResponse
from app.services.storage_service import StorageService

router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".m4v"}
ALLOWED_MIME_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-m4v"}

@router.post("/upload-url", response_model=UploadUrlResponse)
async def generate_signed_upload_url(
    req: UploadUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Validate file extension and MIME type
    import os
    _, ext = os.path.splitext(req.file_name.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if req.file_type and req.file_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported MIME type '{req.file_type}'. Must be a valid video MIME type."
        )

    unique_file = f"{uuid.uuid4()}_{req.file_name}"
    storage_path = f"assessments/{user_id}/{unique_file}"

    signed_info = await StorageService.create_signed_upload_url(
        bucket_name=req.bucket,
        storage_path=storage_path
    )

    return signed_info
