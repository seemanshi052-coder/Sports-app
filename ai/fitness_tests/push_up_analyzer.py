"""
Push-up Analyzer - Real MediaPipe-based push-up analysis.

Implements state-based detection:
TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP

Uses real MediaPipe landmarks for elbow angles and body alignment.
No fake metrics - returns calibrated metrics only with calibration.
"""

import math
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

import numpy as np

from ai.constants import POSE_LANDMARKS

logger = logging.getLogger(__name__)


class PushUpState(Enum):
    """Push-up state machine states."""
    TOP = "top"
    DESCENDING = "descending"
    BOTTOM = "bottom"
    ASCENDING = "ascending"


class TestValidity(Enum):
    VALID = "valid"
    INVALID = "invalid"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass
class PushUpAttempt:
    """Single push-up attempt with all metrics."""
    attempt_number: int
    validity: TestValidity
    metrics: Dict[str, Any]
    confidence_score: Optional[int]
    evidence: Dict[str, Any] = field(default_factory=dict)
    calibration_available: bool = False
    error: Optional[str] = None


@dataclass
class PushUpResult:
    """Complete push-up analysis result."""
    test_id: str = "push_up"
    success: bool = False
    valid: bool = False
    validity: TestValidity = TestValidity.INSUFFICIENT_EVIDENCE
    attempts: List[PushUpAttempt] = field(default_factory=list)
    confidence_score: Optional[int] = None
    overall_score: Optional[float] = None  # Always None per rules
    model_version: str = "cv-push-up-v2"
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


class PushUpAnalyzer:
    """
    Push-up analyzer using real MediaPipe landmarks.
    
    State machine: TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP
    
    Key principles:
    - Uses elbow angles from real MediaPipe landmarks
    - Tracks body alignment (shoulder-hip-ankle line)
    - Validates complete rep cycles (down + up with full extension)
    - No fake strength metrics - returns real measurements only
    - Camera-aware symmetry validation
    """
    
    # State transition thresholds
    DESCENDING_ELBOW_THRESHOLD = 160.0  # degrees - elbow bending starts
    BOTTOM_ELBOW_THRESHOLD = 90.0       # degrees - chest near floor
    ASCENDING_ELBOW_THRESHOLD = 140.0   # degrees - pushing up (reduced for side view)
    TOP_ELBOW_THRESHOLD = 155.0         # degrees - full extension (reduced for side view)
    MIN_REP_FRAMES = 5                  # minimum frames for a valid rep
    MIN_REP_DURATION_SEC = 0.4          # minimum duration for a valid rep
    MAX_REP_DURATION_SEC = 10.0         # maximum duration for a valid rep
    TRANSITION_DEBOUNCE_FRAMES = 3      # frames to debounce state transitions
    
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
        self.state = PushUpState.TOP
        self.state_history: List[PushUpState] = []
        self.attempts: List[PushUpAttempt] = []
        self.current_attempt: Optional[PushUpAttempt] = None
        self.attempt_number = 0
        
        # Transition debouncing
        self._state_frame_count = 0
        self._last_transition_frame = -1
        
        # Angle-tracking for BOTTOM -> ASCENDING transition
        self.min_elbow_angle = 180.0  # tracked during BOTTOM state
        self._elbow_angle_at_bottom = None  # minimum angle recorded at BOTTOM
        self._ascending_frames = 0  # counter for sustained angle increase
        self._angle_rise_threshold = 15.0  # degrees elbow must rise from bottom
        self._sustain_frames = 3  # how many frames angle must sustain increase
        
    def analyze(self, landmarks_history: List[Dict[str, Any]], fps: float, video_metadata: Dict[str, Any]) -> PushUpResult:
        """
        Analyze push-up from landmarks history.
        
        Args:
            landmarks_history: List of landmark frames from assessment_pipeline
            fps: Video frames per second
            video_metadata: Video metadata including width, height
            
        Returns:
            PushUpResult with all attempts and metrics
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
            return PushUpResult(
                success=False,
                error="Insufficient frames with pose detection",
                validity=TestValidity.INSUFFICIENT_EVIDENCE
            )
        
        # Compute joint angles and body alignment
        self._compute_joint_angles_and_alignment()
        
        # Run state machine detection
        self._run_state_machine()
        
        # Extract attempts from state transitions
        self._extract_attempts()
        
        # Compute overall confidence
        confidence = self._compute_overall_confidence(landmarks_history)
        
        # Build result
        result = PushUpResult(
            success=len(self.attempts) > 0,
            valid=any(a.validity == TestValidity.VALID for a in self.attempts),
            validity=TestValidity.VALID if any(a.validity == TestValidity.VALID for a in self.attempts) else TestValidity.INVALID,
            attempts=self.attempts,
            confidence_score=confidence,
            overall_score=None,  # Always None per rules
            model_version="cv-push-up-v2",
        )
        
        if not result.success:
            result.error = "No valid push-up repetitions detected"
            result.validity = TestValidity.INSUFFICIENT_EVIDENCE
        
        return result
    
    def _reset_state(self):
        """Reset all state for a new analysis."""
        self.frame_data = []
        self.state = PushUpState.TOP
        self.state_history = []
        self.attempts = []
        self.current_attempt = None
        self.attempt_number = 0
        self._state_frame_count = 0
        self._last_transition_frame = -1
        self.min_elbow_angle = 180.0
        self.bottom_frame = None
        self.bottom_timestamp = None
        self.bottom_elbow_angle = None
        self.bottom_alignment = None
    
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
            
            # Compute elbow angles
            left_elbow_angle = self._calculate_elbow_angle(lm, "left")
            right_elbow_angle = self._calculate_elbow_angle(lm, "right")
            
            elbow_angle = None
            if left_elbow_angle is not None and right_elbow_angle is not None:
                elbow_angle = (left_elbow_angle + right_elbow_angle) / 2
            elif left_elbow_angle is not None:
                elbow_angle = left_elbow_angle
            elif right_elbow_angle is not None:
                elbow_angle = right_elbow_angle
            
            # Body alignment (shoulder-hip-ankle line)
            body_alignment = self._calculate_body_alignment(lm)
            
            # Shoulder position for depth tracking
            shoulder_y = None
            if "left_shoulder" in lm and "right_shoulder" in lm:
                shoulder_y = (lm["left_shoulder"]["y"] + lm["right_shoulder"]["y"]) / 2
            
            # Hip position for body alignment
            hip_y = None
            if "left_hip" in lm and "right_hip" in lm:
                hip_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
            
            # Ankle position for body line
            ankle_y = None
            if "left_ankle" in lm and "right_ankle" in lm:
                ankle_y = (lm["left_ankle"]["y"] + lm["right_ankle"]["y"]) / 2
            
            # Wrist position for hand placement
            wrist_y = None
            if "left_wrist" in lm and "right_wrist" in lm:
                wrist_y = (lm["left_wrist"]["y"] + lm["right_wrist"]["y"]) / 2
            
            # Elbow symmetry
            left_elbow = self._calculate_elbow_angle(lm, "left")
            right_elbow = self._calculate_elbow_angle(lm, "right")
            elbow_symmetry = None
            if left_elbow is not None and right_elbow is not None:
                elbow_symmetry = abs(left_elbow - right_elbow)
            
            # Arm visibility for camera-aware symmetry
            left_arm_visibility = 0.0
            if "left_shoulder" in lm and "left_elbow" in lm and "left_wrist" in lm:
                left_arm_visibility = (lm["left_shoulder"]["visibility"] + lm["left_elbow"]["visibility"] + lm["left_wrist"]["visibility"]) / 3
            
            right_arm_visibility = 0.0
            if "right_shoulder" in lm and "right_elbow" in lm and "right_wrist" in lm:
                right_arm_visibility = (lm["right_shoulder"]["visibility"] + lm["right_elbow"]["visibility"] + lm["right_wrist"]["visibility"]) / 3
            
            # Arm visibility for camera-aware symmetry
            left_arm_vis = left_arm_visibility if left_elbow is not None else 0
            right_arm_vis = right_arm_visibility if right_elbow is not None else 0
            
            # Elbow symmetry
            left_elbow = self._calculate_elbow_angle(lm, "left")
            right_elbow = self._calculate_elbow_angle(lm, "right")
            elbow_symmetry = None
            if left_elbow is not None and right_elbow is not None:
                elbow_symmetry = abs(left_elbow - right_elbow)
            
            # Visibility checks
            shoulder_visibility = 0.0
            if "left_shoulder" in lm and "right_shoulder" in lm:
                shoulder_visibility = (lm["left_shoulder"]["visibility"] + lm["right_shoulder"]["visibility"]) / 2
            
            hip_visibility = 0.0
            if "left_hip" in lm and "right_hip" in lm:
                hip_visibility = (lm["left_hip"]["visibility"] + lm["right_hip"]["visibility"]) / 2
            
            ankle_visibility = 0.0
            if "left_ankle" in lm and "right_ankle" in lm:
                ankle_visibility = (lm["left_ankle"]["visibility"] + lm["right_ankle"]["visibility"]) / 2
            
            self.frame_data.append({
                "valid": True,
                "frame_idx": frame.get("frame_idx", 0),
                "timestamp_sec": frame.get("timestamp_sec", 0.0),
                "elbow_angle": elbow_angle,
                "left_elbow_angle": left_elbow,
                "right_elbow_angle": right_elbow,
                "body_alignment": body_alignment,
                "shoulder_y": shoulder_y,
                "hip_y": hip_y,
                "ankle_y": ankle_y,
                "wrist_y": wrist_y,
                "elbow_symmetry": elbow_symmetry,
                "shoulder_visibility": shoulder_visibility,
                "hip_visibility": hip_visibility,
                "ankle_visibility": ankle_visibility,
                "left_arm_visibility": left_arm_vis,
                "right_arm_visibility": right_arm_vis,
                "elbow_symmetry": elbow_symmetry,
                "shoulder_visibility": shoulder_visibility,
                "hip_visibility": hip_visibility,
                "ankle_visibility": ankle_visibility,
                "raw_landmarks": lm,
            })
    
    def _calculate_elbow_angle(self, lm: Dict, side: str) -> Optional[float]:
        """Calculate elbow angle for left or right arm."""
        shoulder_key = f"{side}_shoulder"
        elbow_key = f"{side}_elbow"
        wrist_key = f"{side}_wrist"
        
        if shoulder_key not in lm or elbow_key not in lm or wrist_key not in lm:
            return None
        
        shoulder = lm[shoulder_key]
        elbow = lm[elbow_key]
        wrist = lm[wrist_key]
        
        try:
            v1 = np.array([shoulder["x"] - elbow["x"], shoulder["y"] - elbow["y"], shoulder["z"] - elbow["z"]])
            v2 = np.array([wrist["x"] - elbow["x"], wrist["y"] - elbow["y"], wrist["z"] - elbow["z"]])
            
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
    
    def _calculate_body_alignment(self, lm: Dict) -> Optional[float]:
        """Calculate body alignment score (shoulder-hip-ankle collinearity)."""
        # Check if we have all required landmarks
        required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_ankle", "right_ankle"]
        if not all(k in lm for k in required):
            return None
        
        try:
            # Midpoints
            shoulder_x = (lm["left_shoulder"]["x"] + lm["right_shoulder"]["x"]) / 2
            shoulder_y = (lm["left_shoulder"]["y"] + lm["right_shoulder"]["y"]) / 2
            hip_x = (lm["left_hip"]["x"] + lm["right_hip"]["x"]) / 2
            hip_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
            ankle_x = (lm["left_ankle"]["x"] + lm["right_ankle"]["x"]) / 2
            ankle_y = (lm["left_ankle"]["y"] + lm["right_ankle"]["y"]) / 2
            
            # Check collinearity: area of triangle formed by three points
            # Area = 0.5 * |x1(y2-y3) + x2(y3-y1) + x3(y1-y2)|
            area = abs(
                shoulder_x * (hip_y - ankle_y) +
                hip_x * (ankle_y - shoulder_y) +
                ankle_x * (shoulder_y - hip_y)
            ) / 2
            
            # Normalize by body height
            body_height = abs(shoulder_y - ankle_y)
            if body_height > 0:
                normalized_area = area / body_height
                # Alignment score: 1 = perfect line, 0 = completely bent
                alignment_score = 1.0 / (1.0 + normalized_area * 20)
                return alignment_score
            
            return None
        except (KeyError, ValueError, ZeroDivisionError):
            return None
    
    def _compute_joint_angles_and_alignment(self):
        """Pre-compute joint angles and alignment for all frames."""
        # Already computed in _extract_body_signals
        pass
    
    def _run_state_machine(self):
        """Run the state machine to detect push-up phases with proper rep detection."""
        if not self.frame_data:
            return
        
        # Smooth elbow angle signal
        elbow_angles = [f.get("elbow_angle", 180.0) if f.get("valid") else 180.0 for f in self.frame_data]
        
        # Compute elbow angle velocity
        velocities = [0.0]
        for i in range(1, len(elbow_angles)):
            velocities.append(elbow_angles[i] - elbow_angles[i-1])
        
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
            frame["elbow_angle"] = frame.get("elbow_angle", 180.0)
            
            # State transitions with debouncing
            self._state_frame_count += 1
            
            # State transitions with debouncing
            can_transition = (self._state_frame_count - self._last_transition_frame) >= self.TRANSITION_DEBOUNCE_FRAMES
            
            if self.state == PushUpState.TOP:
                # Transition to DESCENDING when elbow angle drops
                if can_transition and frame.get("elbow_angle", 180) < self.DESCENDING_ELBOW_THRESHOLD:
                    self.state = PushUpState.DESCENDING
                    self._last_transition_frame = self._state_frame_count
                    logger.debug(f"Frame {i}: TOP -> DESCENDING (elbow_angle={frame['elbow_angle']:.1f})")
            
            elif self.state == PushUpState.DESCENDING:
                # Track minimum elbow angle (bottom position)
                if frame.get("elbow_angle", 180) < getattr(self, 'min_elbow_angle', 180):
                    self.min_elbow_angle = frame.get("elbow_angle", 180)
                    self.bottom_frame = i
                    self.bottom_timestamp = frame.get("timestamp_sec", 0)
                    self.bottom_elbow_angle = frame.get("elbow_angle")
                    self.bottom_alignment = frame.get("body_alignment")
                
                # Transition to BOTTOM when velocity changes from negative to positive
                if frame.get("velocity", 0) > 0 and frame.get("elbow_angle", 180) <= self.BOTTOM_ELBOW_THRESHOLD:
                    self.state = PushUpState.BOTTOM
                    logger.debug(f"Frame {i}: DESCENDING -> BOTTOM (elbow_angle={frame['elbow_angle']:.1f})")
            
            elif self.state == PushUpState.BOTTOM:
                # Track minimum elbow angle at bottom position
                current_elbow = frame.get("elbow_angle", 180)
                if self._elbow_angle_at_bottom is None or current_elbow < self._elbow_angle_at_bottom:
                    self._elbow_angle_at_bottom = current_elbow
                    self._ascending_frames = 0  # reset counter when new bottom found
                
                # Check if elbow angle is increasing from the bottom minimum
                if self._elbow_angle_at_bottom is not None:
                    angle_rise = current_elbow - self._elbow_angle_at_bottom
                    
                    # Positive rise detected - track sustained increase
                    if angle_rise > 0:
                        self._ascending_frames += 1
                    else:
                        # Angle not rising - reset counter (new movement direction)
                        self._ascending_frames = 0
                    
                    # Transition to ASCENDING after sustained angle increase
                    # elbow must rise by ANGLE_RISE_THRESHOLD degrees over several frames
                    if (self._ascending_frames >= self._sustain_frames and
                        current_elbow > self._elbow_angle_at_bottom + self._angle_rise_threshold):
                        self.state = PushUpState.ASCENDING
                        logger.debug(f"Frame {i}: BOTTOM -> ASCENDING (elbow_angle={current_elbow:.1f}, "
                                     f"rise={angle_rise:.1f} from bottom {self._elbow_angle_at_bottom:.1f}, "
                                     f"frames={self._ascending_frames})")
                        # Reset tracking for ascending phase
                        self._elbow_angle_at_bottom = None
                        self._ascending_frames = 0
            
            elif self.state == PushUpState.ASCENDING:
                # Transition to TOP when elbow angle returns to near full extension
                if frame.get("elbow_angle", 180) >= self.TOP_ELBOW_THRESHOLD:
                    self.state = PushUpState.TOP
                    logger.debug(f"Frame {i}: ASCENDING -> TOP (elbow_angle={frame['elbow_angle']:.1f})")
            
            self._state_frame_count += 1
            self.state_history.append(self.state)
            frame["state"] = self.state.value
            
            # Log state transitions
            if hasattr(self, 'prev_state') and self.prev_state != self.state:
                logger.info(f"State transition: {self.prev_state.value} -> {self.state.value} at frame {i} (t={frame.get('timestamp_sec', 0):.3f}s)")
            self.prev_state = self.state
    
    def _extract_attempts(self):
        """Extract push-up attempts from state transitions with proper rep detection."""
        in_rep = False
        attempt_start = None
        last_top_frame = -1
        
        for i, state in enumerate(self.state_history):
            # Start new rep on DESCENDING (from TOP)
            if state == PushUpState.DESCENDING and not in_rep:
                in_rep = True
                attempt_start = i
                self.attempt_number += 1
                self.current_attempt = PushUpAttempt(
                    attempt_number=self.attempt_number,
                    validity=TestValidity.INSUFFICIENT_EVIDENCE,
                    metrics={},
                    confidence_score=None,
                )
            
            # End of attempt on TOP (completed full cycle down + up)
            elif state == PushUpState.TOP and in_rep and i > attempt_start + self.MIN_REP_FRAMES:
                # Debounce: ensure enough frames since last TOP and minimum rep duration
                if i - last_top_frame > self.TRANSITION_DEBOUNCE_FRAMES and i - attempt_start > 15:
                    in_rep = False
                    if attempt_start is not None and self.current_attempt:
                        self._finalize_attempt(attempt_start, i)
                        last_top_frame = i
                    in_rep = False
            
            # Track when we're at TOP for debouncing
            if state == PushUpState.TOP:
                last_top_frame = i
        
        # Handle case where rep ends without returning to top
        if in_rep and attempt_start is not None and self.current_attempt:
            self._finalize_attempt(attempt_start, len(self.state_history) - 1)
    
    def _finalize_attempt(self, start_frame: int, end_frame: int):
        """Finalize and validate a push-up attempt."""
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
        
        # Elbow angle metrics
        elbow_angles = [f.get("elbow_angle") for f in valid_frames if f.get("elbow_angle") is not None]
        if elbow_angles:
            metrics["elbow_angle_min_deg"] = round(min(elbow_angles), 1)
            metrics["elbow_angle_max_deg"] = round(max(elbow_angles), 1)
            metrics["elbow_angle_range_deg"] = round(max(elbow_angles) - min(elbow_angles), 1)
            evidence["elbow_angles_detected"] = True
        
        # Body alignment metrics
        alignments = [f.get("body_alignment") for f in valid_frames if f.get("body_alignment") is not None]
        if alignments:
            metrics["body_alignment_min"] = round(min(alignments), 3)
            metrics["body_alignment_avg"] = round(np.mean(alignments), 3)
            metrics["body_alignment_max"] = round(max(alignments), 3)
            evidence["alignment_detected"] = True
        
        # Camera-aware elbow symmetry
        left_arm_vis = [f.get("left_arm_visibility", 0) for f in valid_frames]
        right_arm_vis = [f.get("right_arm_visibility", 0) for f in valid_frames]
        symmetries = [f.get("elbow_symmetry") for f in valid_frames if f.get("elbow_symmetry") is not None]
        left_arm_vis_avg = np.mean(left_arm_vis) if left_arm_vis else 0
        right_arm_vis_avg = np.mean(right_arm_vis) if right_arm_vis else 0
        
        # Camera-aware symmetry: only check if both arms are well visible
        both_arms_visible = left_arm_vis_avg > 0.5 and right_arm_vis_avg > 0.5
        
        if symmetries:
            metrics["elbow_symmetry_avg_deg"] = round(np.mean(symmetries), 1)
            metrics["elbow_symmetry_max_deg"] = round(max(symmetries), 1)
            evidence["symmetry_detected"] = True
            evidence["both_arms_visible"] = both_arms_visible
            evidence["left_arm_visibility_avg"] = round(left_arm_vis_avg, 2)
            evidence["right_arm_visibility_avg"] = round(right_arm_vis_avg, 2)
        
        # Rep timing
        if len(valid_frames) >= 2:
            duration = valid_frames[-1]["timestamp_sec"] - valid_frames[0]["timestamp_sec"]
            metrics["rep_duration_sec"] = round(duration, 2)
            evidence["duration_detected"] = True
        
        # Depth (shoulder vertical displacement)
        shoulder_ys = [f.get("shoulder_y") for f in valid_frames if f.get("shoulder_y") is not None]
        if shoulder_ys:
            max_shoulder_y = max(shoulder_ys)  # lowest position
            min_shoulder_y = min(shoulder_ys)  # top position
            normalized_depth = max_shoulder_y - min_shoulder_y
            metrics["normalized_depth"] = round(normalized_depth, 4)
            evidence["depth_detected"] = True
            
            if self.calibration_available and self.calibration_factor:
                metrics["depth_cm"] = round(normalized_depth * self.calibration_factor, 1)
            else:
                metrics["depth_cm"] = None  # Explicitly None per rules
        
        # Rep tempo
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
    
    def _validate_attempt(self, attempt: PushUpAttempt, evidence: Dict) -> TestValidity:
        """Validate a push-up attempt based on evidence."""
        metrics = attempt.metrics
        
        # Check required evidence
        if not evidence.get("elbow_angles_detected", False):
            return TestValidity.INVALID
        
        if not evidence.get("depth_detected", False):
            return TestValidity.INSUFFICIENT_EVIDENCE
        
        # Minimum elbow angle should show significant flexion (< 100 deg for chest near floor)
        elbow_min = metrics.get("elbow_angle_min_deg", 180)
        if elbow_min > 110:  # Not deep enough
            return TestValidity.INVALID
        
        # Must reach near full extension at top
        elbow_max = metrics.get("elbow_angle_max_deg", 0)
        if elbow_max < 160:  # Not fully extending
            return TestValidity.INVALID
        
        # Rep duration should be reasonable
        duration = metrics.get("rep_duration_sec", 0)
        if duration < 0.4 or duration > 10:
            return TestValidity.INVALID
        
        # Body alignment should be maintained
        if evidence.get("alignment_detected", False):
            alignment_min = metrics.get("body_alignment_min", 0)
            if alignment_min < 0.3:  # Significant body bending
                return TestValidity.INVALID
        
# Camera-aware symmetry check
        if evidence.get("symmetry_detected", False):
            both_arms_visible = evidence.get("both_arms_visible", False)
            left_vis = evidence.get("left_arm_visibility_avg", 0)
            right_vis = evidence.get("right_arm_visibility_avg", 0)
            
            # If one arm is significantly less visible (occluded by body in side view), skip symmetry check
            # Visibility ratio > 1.5 suggests side-view perspective distortion
            visibility_ratio = 0
            if left_vis > 0 and right_vis > 0:
                visibility_ratio = max(left_vis, right_vis) / min(left_vis, right_vis)
            
            both_arms_visible = evidence.get("both_arms_visible", False)
            
            if both_arms_visible:
                # Both arms visible - apply symmetry check with perspective-aware threshold
                # If visibility ratio > 1.5, likely side view where perspective distorts angles
                if visibility_ratio > 1.5:
                    # Significant perspective distortion - skip symmetry check
                    logger.info(f"Push-up: Perspective distortion detected (vis_ratio={visibility_ratio:.1f}), symmetry check skipped")
                    evidence["symmetry_skipped_perspective"] = True
                else:
                    # Both arms visible with similar visibility - check symmetry with relaxed threshold
                    # Elbow symmetry naturally varies in side view; allow up to 40°
                    if metrics.get("elbow_symmetry_max_deg", 0) > 40:  # Relaxed from 30 for side-view
                        return TestValidity.INVALID
            else:
                # One arm significantly occluded - don't penalize symmetry
                logger.info("Push-up: One arm occluded, symmetry check skipped")
                evidence["symmetry_skipped_occlusion"] = True
        
        return TestValidity.VALID
    
    def _compute_attempt_confidence(self, attempt: PushUpAttempt, evidence: Dict) -> Optional[int]:
        """Compute confidence score for an attempt."""
        if attempt.validity != TestValidity.VALID:
            return None
        
        confidence = 0
        
        # Elbow angle detection
        if evidence.get("elbow_angles_detected"):
            confidence += 20
        
        # Body alignment detection
        if evidence.get("alignment_detected"):
            confidence += 20
        
        # Depth detection
        if evidence.get("depth_detected"):
            confidence += 20
        
        # Symmetry (only if both arms visible)
        if evidence.get("symmetry_detected"):
            if evidence.get("both_arms_visible", False):
                symmetry = attempt.metrics.get("elbow_symmetry_avg_deg", 20)
                confidence += max(0, 15 - int(symmetry))
            else:
                # One arm occluded - partial credit
                confidence += 8
        
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


def analyze_push_up(
    landmarks_history: List[Dict[str, Any]], 
    fps: float, 
    video_metadata: Dict[str, Any],
    calibration_available: bool = False,
    calibration_factor: Optional[float] = None
) -> PushUpResult:
    """
    Main entry point for push-up analysis.
    
    Args:
        landmarks_history: List of landmark frames from assessment_pipeline
        fps: Video frames per second
        video_metadata: Video metadata (width, height, etc.)
        calibration_available: Whether calibration reference is available
        calibration_factor: Pixels per cm calibration factor
        
    Returns:
        PushUpResult with all attempts and metrics
    """
    analyzer = PushUpAnalyzer(
        calibration_available=calibration_available,
        calibration_factor=calibration_factor,
    )
    return analyzer.analyze(landmarks_history, fps, video_metadata)