"""
Background worker for processing assessments.

Connects the CV pipeline to the FastAPI assessment lifecycle.
Runs offline inference using local MediaPipe model.

Usage:
    python -m backend.app.worker
"""

import os
import sys
import tempfile
import time
import logging
from datetime import datetime, timezone
from typing import Optional

# Add project root to path for ai module imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import SessionLocal, engine
from app.models.assessment import Assessment
from app.services.storage_service import StorageService
from ai.assessment_pipeline import analyze_video, PipelineResult, AnalysisStatus

logger = logging.getLogger(__name__)

# Configuration
POLL_INTERVAL_SECONDS = 5
MAX_RETRIES = 3
DOWNLOAD_TIMEOUT_SECONDS = 60

# Error classification
TRANSIENT_ERRORS = (
    ConnectionError,
    TimeoutError,
    IOError,
)

# Keys for retry tracking in JSON fields
RETRY_COUNT_KEY = "worker_retry_count"


def get_db_session() -> Session:
    """Create a new database session for the worker."""
    return SessionLocal()


def _get_retry_count(assessment: Assessment) -> int:
    """Get the current retry count from video_metadata JSON field."""
    if assessment.video_metadata and isinstance(assessment.video_metadata, dict):
        return assessment.video_metadata.get(RETRY_COUNT_KEY, 0)
    return 0


def _increment_retry_count(db: Session, assessment: Assessment) -> int:
    """Increment the retry count in video_metadata and persist."""
    metadata = dict(assessment.video_metadata) if assessment.video_metadata else {}
    new_count = metadata.get(RETRY_COUNT_KEY, 0) + 1
    metadata[RETRY_COUNT_KEY] = new_count
    assessment.video_metadata = metadata
    db.commit()
    db.refresh(assessment)
    return new_count


def _reset_retry_count(db: Session, assessment: Assessment):
    """Reset retry count to 0 (on successful processing)."""
    metadata = dict(assessment.video_metadata) if assessment.video_metadata else {}
    metadata[RETRY_COUNT_KEY] = 0
    assessment.video_metadata = metadata
    db.commit()


def _is_transient_error(error: Exception) -> bool:
    """Determine if an error is transient and worth retrying."""
    if isinstance(error, TRANSIENT_ERRORS):
        return True
    # Check for common transient error messages
    error_str = str(error).lower()
    transient_indicators = [
        "connection",
        "timeout",
        "network",
        "temporary",
        "unavailable",
        "dns",
        "resolve",
        "storage",
        "download",
        "upload",
        "sign",
        "url",
    ]
    return any(indicator in error_str for indicator in transient_indicators)


def download_video_from_storage(bucket: str, storage_path: str) -> Optional[str]:
    """
    Download video from Supabase Storage to a local temporary file.
    If storage_path is a local file path that exists, return it directly (for testing).
    
    Returns:
        Local file path, or None if download failed
    """
    # If it's a local file path that exists, use it directly (for testing)
    if os.path.exists(storage_path):
        logger.info(f"Using local video file: {storage_path}")
        return storage_path
    
    try:
        # Create signed download URL
        import asyncio
        download_url = asyncio.run(
            StorageService.create_signed_download_url(bucket, storage_path, expires_in=3600)
        )
        
        if not download_url:
            logger.error(f"Failed to create signed download URL for {storage_path}")
            return None
        
        # Download the video
        import httpx
        with httpx.stream("GET", download_url, timeout=DOWNLOAD_TIMEOUT_SECONDS) as response:
            response.raise_for_status()
            
            # Create temp file
            suffix = os.path.splitext(storage_path)[1] or ".mp4"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                for chunk in response.iter_bytes(chunk_size=8192):
                    tmp_file.write(chunk)
                temp_path = tmp_file.name
        
        logger.info(f"Downloaded video to {temp_path} ({os.path.getsize(temp_path)} bytes)")
        return temp_path
        
    except Exception as e:
        logger.exception(f"Error downloading video {storage_path}: {e}")
        return None


def cleanup_temp_file(filepath: Optional[str]):
    """Clean up temporary file if it exists."""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
            logger.debug(f"Cleaned up temp file: {filepath}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp file {filepath}: {e}")


def process_assessment(db: Session, assessment_id: str) -> bool:
    """
    Process a single assessment through the CV pipeline.
    
    Uses atomic claim: only processes if status == "pending_analysis".
    
    Returns:
        True if processing succeeded, False otherwise
    """
    temp_video_path = None
    
    try:
        # Atomic claim: only proceed if status is still pending_analysis
        # This prevents double-processing if two workers pick the same assessment
        result = db.execute(
            text("""
                UPDATE assessments 
                SET status = 'processing', updated_at = :now
                WHERE id = :asm_id AND status = 'pending_analysis'
            """),
            {"asm_id": assessment_id, "now": datetime.now(timezone.utc)}
        )
        
        if result.rowcount == 0:
            # Another worker claimed it, or status changed
            logger.info(f"Assessment {assessment_id} not claimed (rowcount=0), skipping")
            return False
        
        db.commit()
        
        # Re-fetch the assessment with the new status
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            logger.error(f"Assessment {assessment_id} not found after claim")
            return False
        
        # Validate assessment has video
        if not assessment.video_storage_path:
            raise ValueError(f"Assessment {assessment_id} has no video_storage_path")
        
        logger.info(f"Processing assessment {assessment_id} (type: {assessment.assessment_type})")
        
        # Download video from Supabase Storage
        bucket = "assessment-videos"  # From config
        temp_video_path = download_video_from_storage(bucket, assessment.video_storage_path)
        
        if not temp_video_path:
            raise RuntimeError("Failed to download video from storage")
        
        # Run CV pipeline
        logger.info(f"Running CV pipeline on {temp_video_path}")
        result: PipelineResult = analyze_video(
            video_path=temp_video_path,
            assessment_type=assessment.assessment_type
        )
        
        # Persist results
        if result.success:
            assessment.status = "completed"
            assessment.completed_at = datetime.now(timezone.utc)
            
            # Store real CV results
            assessment.metrics = result.metrics
            assessment.raw_measurements = _serialize_raw_measurements(result.raw_measurements)
            assessment.biomechanics = result.biomechanics
            assessment.confidence_score = result.confidence_score
            assessment.model_version = result.model_version
            
            # overall_score MUST remain None (no fake scores)
            assessment.overall_score = None
            assessment.tier = None
            assessment.strengths = None
            assessment.improvement_areas = None
            assessment.recommendations = None
            
            # Reset retry count on successful completion
            _reset_retry_count(db, assessment)
            
            logger.info(
                f"Assessment {assessment_id} completed successfully. "
                f"Confidence: {result.confidence_score}, Metrics: {bool(result.metrics)}"
            )
        else:
            # CV pipeline failed - treat as transient if quality insufficient
            retry_count = _get_retry_count(assessment)
            error_msg = result.error or f"CV analysis failed: {result.status.value}"
            
            # Store error info in video_metadata
            metadata = dict(assessment.video_metadata) if assessment.video_metadata else {}
            metadata["last_error"] = error_msg
            assessment.video_metadata = metadata
            
            # Quality issues are not transient - don't retry
            if "quality" in error_msg.lower() or "insufficient" in error_msg.lower():
                assessment.status = "failed"
                logger.warning(f"Assessment {assessment_id} failed (quality): {error_msg}")
            else:
                # Transient error - check retry count
                if retry_count < MAX_RETRIES:
                    # Increment retry and reset to pending_analysis for next cycle
                    _increment_retry_count(db, assessment)
                    assessment.status = "pending_analysis"
                    logger.warning(f"Assessment {assessment_id} will be retried: {error_msg}")
                else:
                    # Max retries exceeded - mark as permanently failed
                    assessment.status = "failed"
                    logger.error(f"Assessment {assessment_id} failed permanently: {error_msg}")
        
        db.commit()
        db.refresh(assessment)
        return result.success
        
    except Exception as e:
        logger.exception(f"Error processing assessment {assessment_id}: {e}")
        
        # Try to determine if error is transient for retry logic
        try:
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
            if assessment:
                retry_count = _get_retry_count(assessment)
                is_transient = _is_transient_error(e)
                error_str = str(e)
                
                # Store error info in video_metadata
                metadata = dict(assessment.video_metadata) if assessment.video_metadata else {}
                metadata["last_error"] = error_str
                assessment.video_metadata = metadata
                
                if is_transient and retry_count < MAX_RETRIES:
                    # Transient error - increment retry and reset to pending
                    _increment_retry_count(db, assessment)
                    assessment.status = "pending_analysis"
                    logger.warning(f"Assessment {assessment_id} will be retried due to transient error: {e}")
                else:
                    # Permanent failure or max retries exceeded
                    assessment.status = "failed"
                    if retry_count >= MAX_RETRIES:
                        error_str += f" (max retries {MAX_RETRIES} exceeded)"
                    logger.error(f"Assessment {assessment_id} failed permanently: {e}")
                db.commit()
            else:
                db.rollback()
        except Exception as commit_error:
            logger.error(f"Failed to commit error status: {commit_error}")
            db.rollback()
        return False
        
    finally:
        cleanup_temp_file(temp_video_path)


def _serialize_raw_measurements(raw_measurements) -> Optional[dict]:
    """Convert RawMeasurements dataclass to JSON-serializable dict."""
    if raw_measurements is None:
        return None
    
    # Convert tuples to lists for JSON serialization
    serialized = {}
    for key, value in raw_measurements.__dict__.items():
        if isinstance(value, dict):
            # Convert any tuples in nested dicts to lists
            serialized[key] = _convert_tuples_to_lists(value)
        else:
            serialized[key] = value
    return serialized


def _convert_tuples_to_lists(obj):
    """Recursively convert tuples to lists for JSON serialization."""
    if isinstance(obj, tuple):
        return list(obj)
    elif isinstance(obj, list):
        return [_convert_tuples_to_lists(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: _convert_tuples_to_lists(v) for k, v in obj.items()}
    else:
        return obj


def run_worker_once() -> int:
    """
    Run one iteration of the worker: process all pending assessments.
    
    Uses atomic claim per assessment to prevent double-processing.
    
    Returns:
        Number of assessments processed (claimed)
    """
    db = get_db_session()
    processed = 0
    
    try:
        # Find IDs of assessments pending analysis (only IDs to minimize lock time)
        pending_ids = db.query(Assessment.id).filter(
            Assessment.status == "pending_analysis"
        ).order_by(Assessment.created_at.asc()).all()
        
        if not pending_ids:
            return 0
        
        pending_ids = [row[0] for row in pending_ids]
        logger.info(f"Found {len(pending_ids)} pending assessment(s)")
        
        for assessment_id in pending_ids:
            try:
                success = process_assessment(db, assessment_id)
                processed += 1
                
                # Small delay between assessments
                if processed < len(pending_ids):
                    time.sleep(1)
                    
            except Exception as e:
                logger.exception(f"Unexpected error processing {assessment_id}: {e}")
                processed += 1
        
        return processed
        
    finally:
        db.close()


def run_worker_continuous():
    """Run worker continuously, polling for new assessments."""
    logger.info("Starting assessment worker (continuous mode)")
    
    while True:
        try:
            processed = run_worker_once()
            if processed > 0:
                logger.info(f"Processed {processed} assessment(s) in this cycle")
        except Exception as e:
            logger.exception(f"Worker cycle error: {e}")
        
        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # Ensure database tables exist
    from app.db.init_db import init_db
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")
    
    # Check for one-shot mode
    if "--once" in sys.argv:
        logger.info("Running worker in single-pass mode")
        processed = run_worker_once()
        logger.info(f"Processed {processed} assessment(s)")
    else:
        run_worker_continuous()