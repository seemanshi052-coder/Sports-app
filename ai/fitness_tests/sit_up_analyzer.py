"""
Sit-up Analyzer - Real MediaPipe-based sit-up analysis.

Implements state-based detection:
LYING -> RISING -> TOP -> LOWERING -> LYING

Uses real MediaPipe landmarks for torso angle and hip position.
No fake metrics - returns real measurements only.
"""

import math
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

import numpy as np

from ai.constants import POSE_LANDMARKS

logger = logging.getLogger(__name__)


class SitUpState(Enum):
    """Sit-up state machine states."""
    LYING = "lying"
    RISING = "rising"
    TOP = "top"
    LOWERING = "lowering"


class TestValidity(Enum):
    VALID = "valid"
    INVALID = "invalid"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass
class SitUpAttempt:
    """Single sit-up attempt with all metrics."""
    attempt_number: int
    validity: TestValidity
    metrics: Dict[str, Any]
    confidence_score: Optional[int]
    evidence: Dict[str, Any] = field(default_factory=dict)
    calibration_available: bool = False
    error: Optional[str] = None


@dataclass
class SitUpResult:
    """Complete sit-up analysis result."""
    test_id: str = "sit_up"
    success: bool = False
    valid: bool = False
    validity: TestValidity = TestValidity.INSUFFICIENT_EVIDENCE
    attempts: List[SitUpAttempt] = field(default_factory=list)
    confidence_score: Optional[int] = None
    overall_score: Optional[float] = None  # Always None per rules
    model_version: str = "cv-sit-up-v2"
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


class SitUpAnalyzer:
    """
    Sit-up analyzer using real MediaPipe landmarks.
    
    State machine: LYING -> RISING -> TOP -> LOWERING -> LYING
    
    Key principles:
    - Uses torso angle (shoulder-hip-knee) from real MediaPipe landmarks
    - Tracks nose/shoulder vertical position for range of motion
    - Validates complete rep cycles (full sit-up + controlled lowering)
    - No fake metrics - returns real measurements only
    - Camera-aware symmetry validation
    """
    
    # State transition thresholds
    RISING_TORSO_THRESHOLD = 150.0   # degrees - torso rising from flat
    TOP_TORSO_THRESHOLD = 70.0       # degrees - upright sitting position
    LOWERING_TORSO_THRESHOLD = 120.0 # degrees - lowering back down
    LYING_TORSO_THRESHOLD = 160.0    # degrees - back flat on ground
    MIN_REP_FRAMES = 5               # minimum frames for a valid rep
    MIN_REP_DURATION_SEC = 0.5       # minimum duration for a valid rep
    MAX_REP_DURATION_SEC = 10.0      # maximum duration for a valid rep
    
    def __init__(
        self,
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
        min_confidence: float = 0.5,
    ):
        self.calibration_available = calibration_available
        self.calibration_factor = calibration_factor
        self.min_confidence = min_confidence
        
        # Analysis state
        self.frame_data: List[Dict[str, Any]] = []
        self.state = SitUpState.LYING
        self.state_history: List[SitUpState] = []
        self.attempts: List[SitUpAttempt] = []
        self.current_attempt: Optional[SitUpAttempt] = None
        self.attempt_number = 0
        
    def analyze(self, landmarks_history: List[Dict[str, Any]], fps: float, video_metadata: Dict[str, Any]) -> SitUpResult:
        """
        Analyze sit-up from landmarks history.
        
        Args:
            landmarks_history: List of landmark frames from assessment_pipeline
            fps: Video frames per second
            video_metadata: Video metadata including width, height
            
        Returns:
            SitUpResult with all attempts and metrics
        """
        self.fps = fps
        self.frame_interval = 1.0 / fps
        self.video_width = video_metadata.get("width", 640)
        self.video_height = video_metadata.get("height", 480)
        
        # Reset state
        self._reset_state()
        
        # Extract body signals
        self._extract_body_signals(landmarks_history)
        
        if len(self.frame_data) < 10:
            return SitUpResult(
                success=False,
                error="Insufficient frames with pose detection",
                validity=TestValidity.INSUFFICIENT_EVIDENCE
            )
        
        # Torso angles and positions are computed during _extract_body_signals
        # Run state machine detection
        self._run_state_machine()
        
        # Extract attempts from state transitions
        self._extract_attempts()
        
        # Compute overall confidence
        confidence = self._compute_overall_confidence(landmarks_history)
        
        # Build result
        result = SitUpResult(
            success=len(self.attempts) > 0,
            valid=any(a.validity == TestValidity.VALID for a in self.attempts),
            validity=TestValidity.VALID if any(a.validity == TestValidity.VALID for a in self.attempts) else TestValidity.INVALID,
            attempts=self.attempts,
            confidence_score=confidence,
            overall_score=None,  # Always None per rules
            model_version="cv-sit-up-v2",
        )
        
        if not result.success:
            result.error = "No valid sit-up repetitions detected"
            result.validity = TestValidity.INSUFFICIENT_EVIDENCE
        
        return result
    
    def _reset_state(self):
        """Reset all state for a new analysis."""
        self.frame_data = []
        self.state = SitUpState.LYING
        self.state_history = []
        self.attempts = []
        self.current_attempt = None
        self.attempt_number = 0
        self.min_torso_angle = 180.0
        self.top_frame = None
        self.top_timestamp = None
        self.top_torso_angle = None
    
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
            
            # Compute torso angle (shoulder-hip-knee)
            left_torso_angle = self._calculate_torso_angle(lm, "left")
            right_torso_angle = self._calculate_torso_angle(lm, "right")
            
            torso_angle = None
            if left_torso_angle is not None and right_torso_angle is not None:
                torso_angle = (left_torso_angle + right_torso_angle) / 2
            elif left_torso_angle is not None:
                torso_angle = left_torso_angle
            elif right_torso_angle is not None:
                torso_angle = right_torso_angle
            
            # Nose/shoulder vertical position for range of motion
            nose_y = lm.get("nose", {}).get("y") if "nose" in lm else None
            shoulder_y = None
            if "left_shoulder" in lm and "right_shoulder" in lm:
                shoulder_y = (lm["left_shoulder"]["y"] + lm["right_shoulder"]["y"]) / 2
            
            # Hip position
            hip_y = None
            if "left_hip" in lm and "right_hip" in lm:
                hip_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
            
            # Knee position
            knee_y = None
            if "left_knee" in lm and "right_knee" in lm:
                knee_y = (lm["left_knee"]["y"] + lm["right_knee"]["y"]) / 2
            
            # Torso angle for left/right symmetry
            torso_symmetry = None
            left_torso = self._calculate_torso_angle(lm, "left") if "left_shoulder" in lm and "left_hip" in lm and "left_knee" in lm else None
            right_torso = self._calculate_torso_angle(lm, "right") if "right_shoulder" in lm and "right_hip" in lm and "right_knee" in lm else None
            torso_symmetry = None
            if left_torso is not None and right_torso is not None:
                torso_symmetry = abs(left_torso - right_torso)
            
            # Visibility checks for camera-aware symmetry
            left_hip_vis = lm.get("left_hip", {}).get("visibility", 0) if "left_hip" in lm else 0
            right_hip_vis = lm.get("right_hip", {}).get("visibility", 0) if "right_hip" in lm else 0
            left_knee_vis = lm.get("left_knee", {}).get("visibility", 0) if "left_knee" in lm else 0
            right_knee_vis = lm.get("right_knee", {}).get("visibility", 0) if "right_knee" in lm else 0
            left_shoulder_vis = lm.get("left_shoulder", {}).get("visibility", 0) if "left_shoulder" in lm else 0
            right_shoulder_vis = lm.get("right_shoulder", {}).get("visibility", 0) if "right_shoulder" in lm else 0
            
            # Average visibility for left/right body
            left_hip_vis = left_hip_vis
            right_hip_vis = right_hip_vis
            left_knee_vis = left_knee_vis
            right_knee_vis = right_knee_vis
            left_shoulder_vis = lm.get("left_shoulder", {}).get("visibility", 0) if "left_shoulder" in lm else 0
            right_shoulder_vis = lm.get("right_shoulder", {}).get("visibility", 0) if "right_shoulder" in lm else 0
            
            # Average visibility for left/right body parts
            left_vis = np.mean([left_hip_vis, left_knee_vis, left_shoulder_vis])
            right_vis = np.mean([right_hip_vis, right_knee_vis, right_shoulder_vis])
            
            # Both sides visible for symmetry check
            both_sides_visible = left_vis > 0.5 and right_vis > 0.5
            
            # Torso angle for left/right symmetry
            torso_symmetry = None
            left_torso = self._calculate_torso_angle(lm, "left") if "left_shoulder" in lm and "left_hip" in lm and "left_knee" in lm else None
            right_torso = self._calculate_torso_angle(lm, "right") if "right_shoulder" in lm and "right_hip" in lm and "right_knee" in lm else None
            torso_symmetry = None
            if left_torso is not None and right_torso is not None:
                torso_symmetry = abs(left_torso - right_torso)
            
            # Visibility checks
            shoulder_visibility = 0.0
            if "left_shoulder" in lm and "right_shoulder" in lm:
                shoulder_visibility = (lm["left_shoulder"]["visibility"] + lm["right_shoulder"]["visibility"]) / 2
            
            hip_visibility = 0.0
            if "left_hip" in lm and "right_hip" in lm:
                hip_visibility = (lm["left_hip"]["visibility"] + lm["right_hip"]["visibility"]) / 2
            
            knee_visibility = 0.0
            if "left_knee" in lm and "right_knee" in lm:
                knee_visibility = (lm["left_knee"]["visibility"] + lm["right_knee"]["visibility"]) / 2
            
            self.frame_data.append({
                "valid": True,
                "frame_idx": frame.get("frame_idx", 0),
                "timestamp_sec": frame.get("timestamp_sec", 0.0),
                "torso_angle": torso_angle,
                "nose_y": nose_y,
                "shoulder_y": shoulder_y,
                "hip_y": hip_y,
                "knee_y": knee_y,
                "torso_symmetry": torso_symmetry,
                "left_torso_angle": left_torso_angle,
                "right_torso_angle": right_torso_angle,
                "left_side_visibility": left_vis if 'left_vis' in locals() else np.mean([lm.get("left_hip", {}).get("visibility", 0), lm.get("left_knee", {}).get("visibility", 0), lm.get("left_shoulder", {}).get("visibility", 0)]),
                "right_side_visibility": right_vis if 'right_vis' in locals() else np.mean([lm.get("right_hip", {}).get("visibility", 0), lm.get("right_knee", {}).get("visibility", 0), lm.get("right_shoulder", {}).get("visibility", 0)]),
                "both_sides_visible": left_vis > 0.5 and right_vis > 0.5,
                "raw_landmarks": lm,
            })
    
    def _calculate_torso_angle(self, lm: Dict, side: str) -> Optional[float]:
        """Calculate torso angle (shoulder-hip-knee) for left or right side."""
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
        """Run the state machine to detect sit-up phases."""
        if not self.frame_data:
            return
        
        # Smooth torso angle signal
        torso_angles = [f.get("torso_angle", 180.0) if f.get("valid") else 180.0 for f in self.frame_data]
        
        # Compute torso angle velocity
        velocities = [0.0]
        for i in range(1, len(torso_angles)):
            velocities.append(torso_angles[i] - torso_angles[i-1])
        
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
            frame["torso_angle"] = frame.get("torso_angle", 180.0)
            
            # State transitions
            prev_state = self.state
            
            if self.state == SitUpState.LYING:
                # Transition to RISING when torso angle decreases significantly (sitting up)
                if frame.get("torso_angle", 180) < self.RISING_TORSO_THRESHOLD:
                    self.state = SitUpState.RISING
                    logger.debug(f"Frame {i}: LYING -> RISING (torso_angle={frame['torso_angle']:.1f})")
            
            elif self.state == SitUpState.RISING:
                # Track minimum torso angle (most upright)
                if frame.get("torso_angle", 180) < getattr(self, 'min_torso_angle', 180):
                    self.min_torso_angle = frame.get("torso_angle", 180)
                    self.top_frame = i
                    self.top_timestamp = frame.get("timestamp_sec", 0)
                    self.top_torso_angle = frame.get("torso_angle")
                
                # Transition to TOP when velocity changes from negative to positive (stops rising)
                if frame.get("velocity", 0) > 0 and frame.get("torso_angle", 180) <= self.TOP_TORSO_THRESHOLD:
                    self.state = SitUpState.TOP
                    logger.debug(f"Frame {i}: RISING -> TOP (torso_angle={frame['torso_angle']:.1f})")
            
            elif self.state == SitUpState.TOP:
                # Transition to LOWERING when torso angle starts increasing
                if frame.get("velocity", 0) > 2.0 and frame.get("torso_angle", 180) > self.LOWERING_TORSO_THRESHOLD:
                    self.state = SitUpState.LOWERING
                    logger.debug(f"Frame {i}: TOP -> LOWERING (torso_angle={frame['torso_angle']:.1f})")
            
            elif self.state == SitUpState.LOWERING:
                # Transition to LYING when torso angle returns to flat
                if frame.get("torso_angle", 180) >= self.LYING_TORSO_THRESHOLD:
                    self.state = SitUpState.LYING
                    logger.debug(f"Frame {i}: LOWERING -> LYING (torso_angle={frame['torso_angle']:.1f})")
            
            self.state_history.append(self.state)
            frame["state"] = self.state.value
            
            # Log state transitions
            if prev_state != self.state:
                logger.info(f"State transition: {prev_state.value} -> {self.state.value} at frame {i} (t={frame.get('timestamp_sec', 0):.3f}s)")
    
    def _extract_attempts(self):
        """Extract sit-up attempts from state transitions."""
        in_rep = False
        attempt_start = None
        last_lying_frame = -1
        
        for i, state in enumerate(self.state_history):
            if state == SitUpState.RISING and not in_rep:
                in_rep = True
                attempt_start = i
                self.attempt_number += 1
                self.current_attempt = SitUpAttempt(
                    attempt_number=self.attempt_number,
                    validity=TestValidity.INSUFFICIENT_EVIDENCE,
                    metrics={},
                    confidence_score=None,
                )
            
            elif state == SitUpState.LYING and in_rep and i > attempt_start + self.MIN_REP_FRAMES:
                # Debounce: ensure we haven't just been at LYING
                if i - last_lying_frame > 5:  # debounce frames
                    in_rep = False
                    if attempt_start is not None and self.current_attempt:
                        self._finalize_attempt(attempt_start, i)
                    last_lying_frame = i
                    in_rep = False
            
            # Track when we're at LYING for debouncing
            if state == SitUpState.LYING:
                last_lying_frame = i
        
        # Handle case where rep ends without returning to lying
        if in_rep and attempt_start is not None and self.current_attempt:
            self._finalize_attempt(attempt_start, len(self.state_history) - 1)
    
    def _finalize_attempt(self, start_frame: int, end_frame: int):
        """Finalize and validate a sit-up attempt."""
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
        
        # Torso angle metrics
        torso_angles = [f.get("torso_angle") for f in valid_frames if f.get("torso_angle") is not None]
        if torso_angles:
            metrics["torso_angle_min_deg"] = round(min(torso_angles), 1)
            metrics["torso_angle_max_deg"] = round(max(torso_angles), 1)
            metrics["torso_angle_range_deg"] = round(max(torso_angles) - min(torso_angles), 1)
            evidence["torso_angles_detected"] = True
        
        # Range of motion (nose/shoulder vertical displacement)
        nose_ys = [f.get("nose_y") for f in valid_frames if f.get("nose_y") is not None]
        shoulder_ys = [f.get("shoulder_y") for f in valid_frames if f.get("shoulder_y") is not None]
        
        if nose_ys:
            max_nose_y = max(nose_ys)
            min_nose_y = min(nose_ys)
            normalized_rom = max_nose_y - min_nose_y  # vertical displacement
            metrics["normalized_range_of_motion"] = round(normalized_rom, 4)
            evidence["rom_detected"] = True
            
            # ROM in cm if calibrated
            if self.calibration_available and self.calibration_factor:
                metrics["range_of_motion_cm"] = round(normalized_rom * self.calibration_factor, 1)
            else:
                metrics["range_of_motion_cm"] = None  # Explicitly None per rules
        
        # Rep timing
        if len(valid_frames) >= 2:
            duration = valid_frames[-1]["timestamp_sec"] - valid_frames[0]["timestamp_sec"]
            metrics["rep_duration_sec"] = round(duration, 2)
            evidence["duration_detected"] = True
        
        # Camera-aware torso symmetry
        symmetries = [f.get("torso_symmetry") for f in valid_frames if f.get("torso_symmetry") is not None]
        left_vis = [f.get("left_side_visibility", 0) for f in valid_frames]
        right_vis = [f.get("right_side_visibility", 0) for f in valid_frames]
        left_vis_avg = np.mean(left_vis) if left_vis else 0
        right_vis_avg = np.mean(right_vis) if right_vis else 0
        
        # Both sides visible for symmetry check
        both_sides_visible = left_vis_avg > 0.5 and right_vis_avg > 0.5
        
        symmetries = [f.get("torso_symmetry") for f in valid_frames if f.get("torso_symmetry") is not None]
        if symmetries:
            metrics["torso_symmetry_avg_deg"] = round(np.mean(symmetries), 1)
            metrics["torso_symmetry_max_deg"] = round(max(symmetries), 1)
            evidence["symmetry_detected"] = True
            evidence["both_sides_visible"] = both_sides_visible
            evidence["left_side_visibility_avg"] = round(np.mean([f.get("left_side_visibility", 0) for f in valid_frames]), 2)
            evidence["right_side_visibility_avg"] = round(np.mean([f.get("right_side_visibility", 0) for f in valid_frames]), 2)
        
        # Rep tempo
        velocities = [f.get("velocity", 0) for f in valid_frames if "velocity" in f]
        if velocities:
            metrics["avg_rising_velocity"] = round(np.mean([v for v in velocities if v < 0]), 4)
            metrics["avg_lowering_velocity"] = round(np.mean([v for v in velocities if v > 0]), 4)
        
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
    
    def _validate_attempt(self, attempt: SitUpAttempt, evidence: Dict) -> TestValidity:
        """Validate a sit-up attempt based on evidence."""
        metrics = attempt.metrics
        
        # Check required evidence
        if not evidence.get("torso_angles_detected", False):
            return TestValidity.INVALID
        
        if not evidence.get("rom_detected", False):
            return TestValidity.INSUFFICIENT_EVIDENCE
        
        # Minimum torso angle should show significant flexion (< 90 deg for sitting up)
        torso_min = metrics.get("torso_angle_min_deg", 180)
        if torso_min > 100:  # Not sitting up enough
            return TestValidity.INVALID
        
        # Must return to lying position
        torso_max = metrics.get("torso_angle_max_deg", 0)
        if torso_max < 150:  # Didn't return to lying
            return TestValidity.INVALID
        
        # Range of motion should be significant
        rom = metrics.get("normalized_range_of_motion", 0)
        if rom < 0.05:  # ~3% of frame height
            return TestValidity.INVALID
        
        # Rep duration should be reasonable
        duration = metrics.get("rep_duration_sec", 0)
        if duration < 0.5 or duration > 10:
            return TestValidity.INVALID
        
        # Camera-aware symmetry check
        if evidence.get("symmetry_detected", False):
            both_sides_visible = evidence.get("both_sides_visible", False)
            if both_sides_visible:
                # Both sides visible - apply symmetry check with relaxed threshold
                if metrics.get("torso_symmetry_max_deg", 0) > 30:  # Relaxed from 15
                    return TestValidity.INVALID
            else:
                # One side occluded - don't penalize symmetry, just note it
                logger.info("Sit-up: One side occluded, symmetry check skipped")
                evidence["symmetry_skipped_occlusion"] = True
        
        return TestValidity.VALID
    
    def _compute_attempt_confidence(self, attempt: SitUpAttempt, evidence: Dict) -> Optional[int]:
        """Compute confidence score for an attempt."""
        if attempt.validity != TestValidity.VALID:
            return None
        
        confidence = 0
        
        # Torso angle detection
        if evidence.get("torso_angles_detected"):
            confidence += 25
        
        # Range of motion detection
        if evidence.get("rom_detected"):
            confidence += 25
        
        # Duration detection
        if evidence.get("duration_detected"):
            confidence += 15
        
        # Symmetry (only if both sides visible)
        if evidence.get("symmetry_detected"):
            if evidence.get("both_sides_visible", False):
                symmetry = attempt.metrics.get("torso_symmetry_avg_deg", 20)
                confidence += max(0, 15 - int(symmetry))
            else:
                # One side occluded - partial credit
                confidence += 8
        
        # Calibration availability
        if attempt.calibration_available:
            confidence += 10
        
        # Duration detection
        if evidence.get("duration_detected"):
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


def analyze_sit_up(
    landmarks_history: List[Dict[str, Any]], 
    fps: float, 
    video_metadata: Dict[str, Any],
    calibration_available: bool = False,
    calibration_factor: Optional[float] = None
) -> SitUpResult:
    """
    Main entry point for sit-up analysis.
    
    Args:
        landmarks_history: List of landmark frames from assessment_pipeline
        fps: Video frames per second
        video_metadata: Video metadata (width, height, etc.)
        calibration_available: Whether calibration reference is available
        calibration_factor: Pixels per cm calibration factor
        
    Returns:
        SitUpResult with all attempts and metrics
    """
    analyzer = SitUpAnalyzer(
        calibration_available=calibration_available,
        calibration_factor=calibration_factor,
    )
    return analyzer.analyze(landmarks_history, fps, video_metadata)