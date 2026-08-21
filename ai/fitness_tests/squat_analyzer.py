"""
Squat Analyzer - Real MediaPipe-based squat analysis.

Implements state-based detection:
STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING

Uses real MediaPipe landmarks for knee/hip angles and body position.
No fake metrics - returns None for depth_cm without calibration.
"""

import math
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

import numpy as np

from ai.constants import POSE_LANDMARKS

logger = logging.getLogger(__name__)


class SquatState(Enum):
    """Squat state machine states."""
    STANDING = "standing"
    DESCENDING = "descending"
    BOTTOM = "bottom"
    ASCENDING = "ascending"


class TestValidity(Enum):
    VALID = "valid"
    INVALID = "invalid"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass
class SquatAttempt:
    """Single squat attempt with all metrics."""
    attempt_number: int
    validity: TestValidity
    metrics: Dict[str, Any]
    confidence_score: Optional[int]
    evidence: Dict[str, Any] = field(default_factory=dict)
    calibration_available: bool = False
    error: Optional[str] = None


@dataclass
class SquatResult:
    """Complete squat analysis result."""
    test_id: str = "squat"
    success: bool = False
    valid: bool = False
    validity: TestValidity = TestValidity.INSUFFICIENT_EVIDENCE
    attempts: List[SquatAttempt] = field(default_factory=list)
    confidence_score: Optional[int] = None
    overall_score: Optional[float] = None  # Always None per rules
    model_version: str = "cv-squat-v1"
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "test_id": self.test_id,
            "success": self.success,
            "valid": self.valid,
            "validity": self.validity.value,
            "attempts": [
                {
                    "attempt_number": a.attempt_number,
                    "validity": a.validity.value,
                    "metrics": a.metrics,
                    "confidence_score": a.confidence_score,
                    "evidence": a.evidence,
                    "calibration_available": a.calibration_available,
                    "error": a.error,
                }
                for a in self.attempts
            ],
            "confidence_score": self.confidence_score,
            "overall_score": self.overall_score,
            "model_version": self.model_version,
            "error": self.error,
        }


class SquatAnalyzer:
    """
    Squat analyzer using real MediaPipe landmarks.
    
    State machine: STANDING -> DESCENDING -> BOTTOM -> ASCENDING -> STANDING
    
    Key principles:
    - Uses knee/hip angles from real MediaPipe landmarks
    - Tracks hip vertical position for depth measurement
    - Validates complete rep cycles (down + up)
    - No fake depth measurements - returns None for cm without calibration
    """
    
    # State transition thresholds
    DESCENDING_KNEE_THRESHOLD = 160.0  # degrees - knee bending starts
    BOTTOM_KNEE_THRESHOLD = 100.0      # degrees - deep enough
    ASCENDING_KNEE_THRESHOLD = 150.0   # degrees - rising up
    MIN_REP_FRAMES = 5                 # minimum frames for a valid rep
    
    def __init__(
        self,
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,  # pixels per cm
        min_confidence: float = 0.5,
    ):
        self.calibration_available = calibration_available
        self.calibration_factor = calibration_factor
        self.min_confidence = min_confidence
        
        # Analysis state
        self.frame_data: List[Dict[str, Any]] = []
        self.state = SquatState.STANDING
        self.state_history: List[SquatState] = []
        self.attempts: List[SquatAttempt] = []
        self.current_attempt: Optional[SquatAttempt] = None
        self.attempt_number = 0
        
    def analyze(self, landmarks_history: List[Dict[str, Any]], fps: float, video_metadata: Dict[str, Any]) -> SquatResult:
        """
        Analyze squat from landmarks history.
        
        Args:
            landmarks_history: List of landmark frames from assessment_pipeline
            fps: Video frames per second
            video_metadata: Video metadata including width, height
            
        Returns:
            SquatResult with all attempts and metrics
        """
        self.fps = fps
        self.frame_interval = 1.0 / fps
        self.video_width = video_metadata.get("width", 640)
        self.video_height = video_metadata.get("height", 480)
        
        # Extract body signals
        self._extract_body_signals(landmarks_history)
        
        if len(self.frame_data) < 10:
            return SquatResult(
                success=False,
                error="Insufficient frames with pose detection",
                validity=TestValidity.INSUFFICIENT_EVIDENCE
            )
        
        # Joint angles are computed during _extract_body_signals
        # Run state machine detection
        self._run_state_machine()
        
        # Extract attempts from state transitions
        self._extract_attempts()
        
        # Compute overall confidence
        confidence = self._compute_overall_confidence(landmarks_history)
        
        # Build result
        result = SquatResult(
            success=len(self.attempts) > 0,
            valid=any(a.validity == TestValidity.VALID for a in self.attempts),
            validity=TestValidity.VALID if any(a.validity == TestValidity.VALID for a in self.attempts) else TestValidity.INVALID,
            attempts=self.attempts,
            confidence_score=confidence,
            overall_score=None,  # Always None per rules
        )
        
        if not result.success:
            result.error = "No valid squat repetitions detected"
            result.validity = TestValidity.INSUFFICIENT_EVIDENCE
        
        return result
    
    def _extract_body_signals(self, landmarks_history: List[Dict[str, Any]]):
        """Extract key body signals from landmarks."""
        self.frame_data = []
        
        for frame in landmarks_history:
            landmarks = frame.get("landmarks", [])
            if len(landmarks) < 33:
                self.frame_data.append({"valid": False})
                continue
            
            # Convert to lookup dict
            lm = {name: landmarks[idx] for name, idx in POSE_LANDMARKS.items() if idx < len(landmarks)}
            
            # Compute key joint angles
            left_knee_angle = self._calculate_knee_angle(lm, "left")
            right_knee_angle = self._calculate_knee_angle(lm, "right")
            left_hip_angle = self._calculate_hip_angle(lm, "left")
            right_hip_angle = self._calculate_hip_angle(lm, "right")
            
            knee_angle = None
            if left_knee_angle is not None and right_knee_angle is not None:
                knee_angle = (left_knee_angle + right_knee_angle) / 2
            elif left_knee_angle is not None:
                knee_angle = left_knee_angle
            elif right_knee_angle is not None:
                knee_angle = right_knee_angle
            
            hip_angle = None
            if left_hip_angle is not None and right_hip_angle is not None:
                hip_angle = (left_hip_angle + right_hip_angle) / 2
            elif left_hip_angle is not None:
                hip_angle = left_hip_angle
            elif right_hip_angle is not None:
                hip_angle = right_hip_angle
            
            # Hip center for depth tracking
            hip_center_y = None
            hip_center_x = None
            hip_visibility = 0.0
            if "left_hip" in lm and "right_hip" in lm:
                hip_center_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
                hip_center_x = (lm["left_hip"]["x"] + lm["right_hip"]["x"]) / 2
                hip_visibility = (lm["left_hip"]["visibility"] + lm["right_hip"]["visibility"]) / 2
            
            # Ankle visibility for ground contact
            ankle_visibility = 0.0
            if "left_ankle" in lm and "right_ankle" in lm:
                ankle_visibility = (lm["left_ankle"]["visibility"] + lm["right_ankle"]["visibility"]) / 2
            
            # Knee symmetry (difference between left/right knee angles)
            knee_symmetry = None
            if left_knee_angle is not None and right_knee_angle is not None:
                knee_symmetry = abs(left_knee_angle - right_knee_angle)
            
            self.frame_data.append({
                "valid": True,
                "frame_idx": frame.get("frame_idx", 0),
                "timestamp_sec": frame.get("timestamp_sec", 0.0),
                "knee_angle": knee_angle,
                "hip_angle": hip_angle,
                "left_knee_angle": left_knee_angle,
                "right_knee_angle": right_knee_angle,
                "hip_center_y": hip_center_y,
                "hip_center_x": hip_center_x,
                "hip_visibility": hip_visibility,
                "ankle_visibility": ankle_visibility,
                "knee_symmetry": knee_symmetry,
                "raw_landmarks": lm,
            })
    
    def _calculate_knee_angle(self, lm: Dict, side: str) -> Optional[float]:
        """Calculate knee angle for left or right leg."""
        hip_key = f"{side}_hip"
        knee_key = f"{side}_knee"
        ankle_key = f"{side}_ankle"
        
        if hip_key not in lm or knee_key not in lm or ankle_key not in lm:
            return None
        
        hip = lm[hip_key]
        knee = lm[knee_key]
        ankle = lm[ankle_key]
        
        try:
            v1 = np.array([hip["x"] - knee["x"], hip["y"] - knee["y"], hip["z"] - knee["z"]])
            v2 = np.array([ankle["x"] - knee["x"], ankle["y"] - knee["y"], ankle["z"] - knee["z"]])
            
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            
            if norm1 == 0 or norm2 == 0:
                return None
            
            cos_angle = np.dot(v1, v2) / (norm1 * norm2)
            cos_angle = np.clip(cos_angle, -1.0, 1.0)
            angle = math.degrees(math.acos(cos_angle))
            return angle
        except (KeyError, ValueError):
            return None
    
    def _calculate_hip_angle(self, lm: Dict, side: str) -> Optional[float]:
        """Calculate hip angle for left or right side (shoulder-hip-knee)."""
        shoulder_key = f"{side}_shoulder"
        hip_key = f"{side}_hip"
        knee_key = f"{side}_knee"
        
        if shoulder_key not in lm or hip_key not in lm or knee_key not in lm:
            return None
        
        shoulder = lm[shoulder_key]
        hip = lm[hip_key]
        knee = lm[knee_key]
        
        try:
            v1 = np.array([shoulder["x"] - hip["x"], shoulder["y"] - hip["y"], shoulder["z"] - hip["z"]])
            v2 = np.array([knee["x"] - hip["x"], knee["y"] - hip["y"], knee["z"] - hip["z"]])
            
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            
            if norm1 == 0 or norm2 == 0:
                return None
            
            cos_angle = np.dot(v1, v2) / (norm1 * norm2)
            cos_angle = np.clip(cos_angle, -1.0, 1.0)
            angle = math.degrees(math.acos(cos_angle))
            return angle
        except (KeyError, ValueError):
            return None
    
    def _run_state_machine(self):
        """Run the state machine to detect squat phases."""
        if not self.frame_data:
            return
        
        # Smooth knee angle signal
        knee_angles = [f.get("knee_angle", 180.0) if f.get("valid") else 180.0 for f in self.frame_data]
        
        # Compute knee angle velocity (change per frame)
        velocities = [0.0]
        for i in range(1, len(knee_angles)):
            velocities.append(knee_angles[i] - knee_angles[i-1])
        
        # Smooth velocity with moving average
        window = 3
        smoothed_velocities = []
        for i in range(len(velocities)):
            start = max(0, i - window + 1)
            smoothed_velocities.append(np.mean(velocities[start:i+1]))
        
        for i, frame in enumerate(self.frame_data):
            if not frame["valid"]:
                self.state_history.append(self.state)
                continue
                
            frame["velocity"] = smoothed_velocities[i] if i < len(smoothed_velocities) else 0.0
            frame["knee_angle"] = frame.get("knee_angle", 180.0)
            
            # State transitions
            prev_state = self.state
            
            if self.state == SquatState.STANDING:
                # Transition to DESCENDING when knee angle drops significantly
                if frame.get("knee_angle", 180) < self.DESCENDING_KNEE_THRESHOLD:
                    self.state = SquatState.DESCENDING
                    logger.debug(f"Frame {i}: STANDING -> DESCENDING (knee_angle={frame['knee_angle']:.1f})")
            
            elif self.state == SquatState.DESCENDING:
                # Track minimum knee angle (bottom position)
                if frame.get("knee_angle", 180) < getattr(self, 'min_knee_angle', 180):
                    self.min_knee_angle = frame.get("knee_angle", 180)
                    self.bottom_frame = i
                    self.bottom_timestamp = frame.get("timestamp_sec", 0)
                    self.bottom_knee_angle = frame.get("knee_angle")
                    self.bottom_hip_angle = frame.get("hip_angle")
                
                # Transition to BOTTOM when velocity changes from negative to positive
                if frame.get("velocity", 0) > 0 and frame.get("knee_angle", 180) <= self.BOTTOM_KNEE_THRESHOLD:
                    self.state = SquatState.BOTTOM
                    logger.debug(f"Frame {i}: DESCENDING -> BOTTOM (knee_angle={frame['knee_angle']:.1f})")
            
            elif self.state == SquatState.BOTTOM:
                # Transition to ASCENDING when knee angle starts increasing significantly
                if frame.get("velocity", 0) > 2.0 and frame.get("knee_angle", 180) > self.ASCENDING_KNEE_THRESHOLD:
                    self.state = SquatState.ASCENDING
                    logger.debug(f"Frame {i}: BOTTOM -> ASCENDING (knee_angle={frame['knee_angle']:.1f})")
            
            elif self.state == SquatState.ASCENDING:
                # Transition to STANDING when knee angle returns to near 180
                if frame.get("knee_angle", 180) >= 170:
                    self.state = SquatState.STANDING
                    logger.debug(f"Frame {i}: ASCENDING -> STANDING (knee_angle={frame['knee_angle']:.1f})")
            
            self.state_history.append(self.state)
            frame["state"] = self.state.value
            
            # Log state transitions
            if prev_state != self.state:
                logger.info(f"State transition: {prev_state.value} -> {self.state.value} at frame {i} (t={frame.get('timestamp_sec', 0):.3f}s)")
    
    def _extract_attempts(self):
        """Extract squat attempts from state transitions."""
        in_rep = False
        attempt_start = None
        
        for i, state in enumerate(self.state_history):
            if state == SquatState.DESCENDING and not in_rep:
                in_rep = True
                attempt_start = i
                self.attempt_number += 1
                self.current_attempt = SquatAttempt(
                    attempt_number=self.attempt_number,
                    validity=TestValidity.INSUFFICIENT_EVIDENCE,
                    metrics={},
                    confidence_score=None,
                )
            
            elif state == SquatState.STANDING and in_rep and i > attempt_start + self.MIN_REP_FRAMES:
                # End of attempt - completed full cycle
                in_rep = False
                if attempt_start is not None and self.current_attempt:
                    self._finalize_attempt(attempt_start, i)
        
        # Handle case where rep ends without returning to standing
        if in_rep and attempt_start is not None and self.current_attempt:
            self._finalize_attempt(attempt_start, len(self.state_history) - 1)
    
    def _finalize_attempt(self, start_frame: int, end_frame: int):
        """Finalize and validate a squat attempt."""
        if not self.current_attempt:
            return
        
        attempt = self.current_attempt
        
        # Get frames for this attempt
        attempt_frames = self.frame_data[start_frame:end_frame+1]
        valid_frames = [f for f in attempt_frames if f["valid"]]
        
        if len(valid_frames) < self.MIN_REP_FRAMES:
            attempt.validity = TestValidity.INSUFFICIENT_EVIDENCE
            attempt.error = "Insufficient frames in repetition"
            self.attempts.append(attempt)
            self.current_attempt = None
            return
        
        # Extract metrics
        metrics = {}
        evidence = {}
        
        # Knee angle metrics
        knee_angles = [f.get("knee_angle") for f in valid_frames if f.get("knee_angle") is not None]
        if knee_angles:
            metrics["knee_angle_min_deg"] = round(min(knee_angles), 1)
            metrics["knee_angle_max_deg"] = round(max(knee_angles), 1)
            metrics["knee_angle_range_deg"] = round(max(knee_angles) - min(knee_angles), 1)
            evidence["knee_angles_detected"] = True
        
        # Hip angle metrics
        hip_angles = [f.get("hip_angle") for f in valid_frames if f.get("hip_angle") is not None]
        if hip_angles:
            metrics["hip_angle_min_deg"] = round(min(hip_angles), 1)
            metrics["hip_angle_max_deg"] = round(max(hip_angles), 1)
            evidence["hip_angles_detected"] = True
        
        # Knee symmetry
        symmetries = [f.get("knee_symmetry") for f in valid_frames if f.get("knee_symmetry") is not None]
        if symmetries:
            metrics["knee_symmetry_avg_deg"] = round(np.mean(symmetries), 1)
            metrics["knee_symmetry_max_deg"] = round(max(symmetries), 1)
            evidence["symmetry_detected"] = True
        
        # Rep timing
        if len(valid_frames) >= 2:
            duration = valid_frames[-1]["timestamp_sec"] - valid_frames[0]["timestamp_sec"]
            metrics["rep_duration_sec"] = round(duration, 2)
            evidence["duration_detected"] = True
        
        # Depth (normalized hip displacement from standing)
        hip_ys = [f.get("hip_center_y") for f in valid_frames if f.get("hip_center_y") is not None]
        if hip_ys:
            max_hip_y = max(hip_ys)  # lowest position (highest y in image coords)
            min_hip_y = min(hip_ys)  # standing position (lowest y)
            normalized_depth = max_hip_y - min_hip_y  # positive = downward movement
            metrics["normalized_depth"] = round(normalized_depth, 4)
            evidence["depth_detected"] = True
            
            # Depth in cm if calibrated
            if self.calibration_available and self.calibration_factor:
                metrics["depth_cm"] = round(normalized_depth * self.calibration_factor, 1)
            else:
                metrics["depth_cm"] = None  # Explicitly None per rules
        
        # Rep tempo (velocity metrics)
        velocities = [f.get("velocity", 0) for f in valid_frames if "velocity" in f]
        if velocities:
            metrics["avg_descending_velocity"] = round(np.mean([v for v in velocities if v < 0]), 4)
            metrics["avg_ascending_velocity"] = round(np.mean([v for v in velocities if v > 0]), 4)
        
        attempt.metrics = metrics
        attempt.evidence = evidence
        attempt.calibration_available = self.calibration_available
        
        # Determine validity
        attempt.validity = self._validate_attempt(attempt, evidence)
        attempt.valid = (attempt.validity == TestValidity.VALID)
        
        # Compute attempt confidence
        attempt.confidence_score = self._compute_attempt_confidence(attempt, evidence)
        
        self.attempts.append(attempt)
        self.current_attempt = None
    
    def _validate_attempt(self, attempt: SquatAttempt, evidence: Dict) -> TestValidity:
        """Validate a squat attempt based on evidence."""
        metrics = attempt.metrics
        
        # Check required evidence
        if not evidence.get("knee_angles_detected", False):
            return TestValidity.INVALID
        
        if not evidence.get("depth_detected", False):
            return TestValidity.INSUFFICIENT_EVIDENCE
        
        # Minimum knee angle should show significant flexion (< 120 deg for parallel)
        knee_min = metrics.get("knee_angle_min_deg", 180)
        if knee_min > 130:  # Not deep enough
            return TestValidity.INVALID
        
        # Rep duration should be reasonable (0.5-5 seconds)
        duration = metrics.get("rep_duration_sec", 0)
        if duration < 0.3 or duration > 10:
            return TestValidity.INVALID
        
        # Check symmetry if available
        if "knee_symmetry_max_deg" in metrics:
            if metrics["knee_symmetry_max_deg"] > 20:  # >20 deg asymmetry
                return TestValidity.INVALID  # Significant asymmetry
        
        # Must have descended and ascended (velocity evidence)
        if not evidence.get("duration_detected", False):
            return TestValidity.INVALID
        
        return TestValidity.VALID
    
    def _compute_attempt_confidence(self, attempt: SquatAttempt, evidence: Dict) -> Optional[int]:
        """Compute confidence score for an attempt."""
        if attempt.validity != TestValidity.VALID:
            return None
        
        confidence = 0
        
        # Knee angle detection
        if evidence.get("knee_angles_detected"):
            confidence += 20
        
        # Hip angle detection
        if evidence.get("hip_angles_detected"):
            confidence += 15
        
        # Depth detection
        if evidence.get("depth_detected"):
            confidence += 20
        
        # Symmetry
        if evidence.get("symmetry_detected"):
            symmetry = attempt.metrics.get("knee_symmetry_avg_deg", 20)
            confidence += max(0, 15 - int(symmetry))  # Better symmetry = higher confidence
        
        # Duration detection
        if evidence.get("duration_detected"):
            confidence += 15
        
        # Calibration availability
        if attempt.calibration_available:
            confidence += 10
        
        return min(100, confidence)
    
    def _compute_overall_confidence(self, landmarks_history: List[Dict]) -> Optional[int]:
        """Compute overall analysis confidence from pose quality."""
        if not landmarks_history:
            return None
        
        total_frames = len(landmarks_history)
        valid_frames = sum(1 for f in landmarks_history if f.get("landmarks") and len(f.get("landmarks", [])) >= 33)
        detection_rate = valid_frames / total_frames if total_frames > 0 else 0
        
        # Average landmark visibility
        visibility_sum = 0
        visibility_count = 0
        for frame in landmarks_history:
            landmarks = frame.get("landmarks", [])
            for lm in landmarks:
                if lm.get("visibility", 0) > 0.5:
                    visibility_sum += lm["visibility"]
                    visibility_count += 1
        
        avg_visibility = visibility_sum / visibility_count if visibility_count > 0 else 0
        
        # Confidence calculation
        confidence = 0
        confidence += min(30, int(detection_rate * 30))
        confidence += min(25, int(avg_visibility * 25))
        confidence += min(25, int(min(valid_frames / 30.0, 1.0) * 25))
        confidence += min(20, 20 if len(self.attempts) > 0 else 0)
        
        return min(100, confidence) if confidence > 0 else None


def analyze_squat(
    landmarks_history: List[Dict[str, Any]], 
    fps: float, 
    video_metadata: Dict[str, Any],
    calibration_available: bool = False,
    calibration_factor: Optional[float] = None
) -> SquatResult:
    """
    Main entry point for squat analysis.
    
    Args:
        landmarks_history: List of landmark frames from assessment_pipeline
        fps: Video frames per second
        video_metadata: Video metadata (width, height, etc.)
        calibration_available: Whether calibration reference is available
        calibration_factor: Pixels per cm calibration factor
        
    Returns:
        SquatResult with all attempts and metrics
    """
    analyzer = SquatAnalyzer(
        calibration_available=calibration_available,
        calibration_factor=calibration_factor,
    )
    return analyzer.analyze(landmarks_history, fps, video_metadata)