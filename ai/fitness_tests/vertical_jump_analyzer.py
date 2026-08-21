"""
Vertical Jump Analyzer - Real MediaPipe-based vertical jump analysis.

Implements state-based detection:
STANDING -> LOADING -> TAKEOFF -> FLIGHT -> PEAK -> LANDING -> RECOVERY -> STANDING

Uses body-relative vertical displacement signal from real landmarks.
No fake jump heights - returns None for jump_height_cm without calibration.
"""

import math
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

import numpy as np

from ai.constants import POSE_LANDMARKS

logger = logging.getLogger(__name__)


class JumpState(Enum):
    """Vertical jump state machine states."""
    STANDING = "standing"
    LOADING = "loading"      # Countermovement/squat phase
    TAKEOFF = "takeoff"      # Leaving ground
    FLIGHT = "flight"        # Airborne
    PEAK = "peak"            # Maximum height
    LANDING = "landing"      # Touching ground
    RECOVERY = "recovery"    # Post-landing stabilization


class TestValidity(Enum):
    VALID = "valid"
    INVALID = "invalid"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass
class JumpAttempt:
    """Single vertical jump attempt with all metrics."""
    attempt_number: int
    validity: TestValidity
    metrics: Dict[str, Any]
    confidence_score: Optional[int]
    evidence: Dict[str, Any] = field(default_factory=dict)
    calibration_available: bool = False
    error: Optional[str] = None


@dataclass
class VerticalJumpResult:
    """Complete vertical jump analysis result."""
    test_id: str = "vertical_jump"
    success: bool = False
    valid: bool = False
    validity: TestValidity = TestValidity.INSUFFICIENT_EVIDENCE
    attempts: List[JumpAttempt] = field(default_factory=list)
    confidence_score: Optional[int] = None
    overall_score: Optional[float] = None  # Always None per rules
    model_version: str = "cv-vertical-jump-v2"
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


class VerticalJumpAnalyzer:
    """
    Vertical jump analyzer using real MediaPipe landmarks.
    
    State machine: STANDING -> LOADING -> TAKEOFF -> FLIGHT -> PEAK -> LANDING -> RECOVERY -> STANDING
    
    Key principles:
    - Uses body-relative vertical displacement (hip center relative to standing baseline)
    - No fake jump heights - returns None for cm without calibration
    - Validates evidence quality at each step
    - Returns structured attempt data with validity flags
    - LANDING MUST NEVER occur before TAKEOFF
    - Requires minimum flight frames and duration before LANDING
    - Prevents duplicate attempt detection
    """
    
    # Landmark indices for key body points
    KEY_LANDMARKS = {
        "hip_center": ("left_hip", "right_hip"),
        "knee_center": ("left_knee", "right_knee"),
        "ankle_center": ("left_ankle", "right_ankle"),
        "heel_center": ("left_heel", "right_heel"),
        "foot_center": ("left_foot_index", "right_foot_index"),
        "shoulder_center": ("left_shoulder", "right_shoulder"),
    }
    
    # State transition thresholds (configurable)
    LOADING_KNEE_ANGLE_THRESHOLD = 150.0  # degrees - below this = loading
    TAKEOFF_VERTICAL_VELOCITY_THRESHOLD = 0.015  # normalized units/frame
    FLIGHT_MIN_FRAMES = 5
    MIN_FLIGHT_DURATION_MS = 200
    LANDING_VERTICAL_VELOCITY_THRESHOLD = -0.008  # normalized units/frame
    LANDING_MIN_ANKLE_VISIBILITY = 0.4
    RECOVERY_STABILITY_FRAMES = 8
    
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
        self.state = JumpState.STANDING
        self.standing_baseline_y: Optional[float] = None
        self.state_history: List[JumpState] = []
        self.attempts: List[JumpAttempt] = []
        self.current_attempt: Optional[JumpAttempt] = None
        self.attempt_number = 0
        
        # Track state machine integrity
        self._takeoff_occurred = False
        self._landing_occurred = False
        self._in_flight = False
        self._flight_frame_count = 0
        self._takeoff_timestamp = None
        self._last_takeoff_frame = -1
        self._last_landing_frame = -1
        
    def analyze(self, landmarks_history: List[Dict[str, Any]], fps: float, video_metadata: Dict[str, Any]) -> VerticalJumpResult:
        """
        Analyze vertical jump from landmarks history.
        
        Args:
            landmarks_history: List of landmark frames from assessment_pipeline
            fps: Video frames per second
            video_metadata: Video metadata including width, height
            
        Returns:
            VerticalJumpResult with all attempts and metrics
        """
        self.fps = fps
        self.frame_interval = 1.0 / fps
        self.video_width = video_metadata.get("width", 640)
        self.video_height = video_metadata.get("height", 480)
        
        # Reset state for new analysis
        self._reset_state()
        
        # Extract hip center Y position for each frame
        self._extract_body_signals(landmarks_history)
        
        if len(self.frame_data) < 10:
            return VerticalJumpResult(
                success=False,
                error="Insufficient frames with pose detection",
                validity=TestValidity.INSUFFICIENT_EVIDENCE
            )
        
        # Establish standing baseline from first stable frames
        self._establish_standing_baseline()
        
        if self.standing_baseline_y is None:
            return VerticalJumpResult(
                success=False,
                error="Could not establish standing baseline",
                validity=TestValidity.INSUFFICIENT_EVIDENCE
            )
        
        # Compute vertical displacement signal
        self._compute_vertical_displacement()
        
        # Run state machine detection
        self._run_state_machine()
        
        # Extract attempts from state transitions
        self._extract_attempts()
        
        # Compute overall confidence
        confidence = self._compute_overall_confidence(landmarks_history)
        
        # Build result
        result = VerticalJumpResult(
            success=len(self.attempts) > 0,
            valid=any(a.validity == TestValidity.VALID for a in self.attempts),
            validity=TestValidity.VALID if any(a.validity == TestValidity.VALID for a in self.attempts) else TestValidity.INVALID,
            attempts=self.attempts,
            confidence_score=confidence,
            overall_score=None,  # Always None per rules
        )
        
        if not result.success:
            result.error = "No valid jump attempts detected"
            result.validity = TestValidity.INSUFFICIENT_EVIDENCE
        
        return result
    
    def _reset_state(self):
        """Reset all state for a new analysis."""
        self.frame_data = []
        self.state = JumpState.STANDING
        self.standing_baseline_y = None
        self.state_history = []
        self.attempts = []
        self.current_attempt = None
        self.attempt_number = 0
        self._takeoff_occurred = False
        self._landing_occurred = False
        self._in_flight = False
        self._flight_frame_count = 0
        self._takeoff_timestamp = None
        self._last_takeoff_frame = -1
        self._last_landing_frame = -1
        self.takeoff_frame = None
        self.takeoff_timestamp = None
        self.takeoff_displacement = None
        self.flight_start_frame = None
        self.flight_start_timestamp = None
        self.peak_displacement = -float('inf')
        self.peak_frame = None
        self.peak_timestamp = None
        self.landing_frame = None
        self.landing_timestamp = None
        self.landing_displacement = None
        self.knee_angle_at_loading = None
        self.recovery_start_frame = None
    
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
            
            # Compute hip center (primary vertical displacement reference)
            hip_center_y = None
            hip_center_x = None
            hip_visibility = 0.0
            
            if "left_hip" in lm and "right_hip" in lm:
                hip_center_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
                hip_center_x = (lm["left_hip"]["x"] + lm["right_hip"]["x"]) / 2
                hip_visibility = (lm["left_hip"]["visibility"] + lm["right_hip"]["visibility"]) / 2
            
            # Compute knee angles
            left_knee_angle = self._calculate_knee_angle(lm, "left")
            right_knee_angle = self._calculate_knee_angle(lm, "right")
            knee_angle = None
            if left_knee_angle is not None and right_knee_angle is not None:
                knee_angle = (left_knee_angle + right_knee_angle) / 2
            elif left_knee_angle is not None:
                knee_angle = left_knee_angle
            elif right_knee_angle is not None:
                knee_angle = right_knee_angle
            
            # Compute ankle visibility for ground contact
            ankle_visibility = 0.0
            if "left_ankle" in lm and "right_ankle" in lm:
                ankle_visibility = (lm["left_ankle"]["visibility"] + lm["right_ankle"]["visibility"]) / 2
            
            # Shoulder center for body alignment
            shoulder_center_y = None
            if "left_shoulder" in lm and "right_shoulder" in lm:
                shoulder_center_y = (lm["left_shoulder"]["y"] + lm["right_shoulder"]["y"]) / 2
            
            self.frame_data.append({
                "valid": True,
                "frame_idx": frame.get("frame_idx", 0),
                "timestamp_sec": frame.get("timestamp_sec", 0.0),
                "hip_center_y": hip_center_y,
                "hip_center_x": hip_center_x,
                "hip_visibility": hip_visibility,
                "knee_angle": knee_angle,
                "ankle_visibility": ankle_visibility,
                "shoulder_center_y": shoulder_center_y,
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
    
    def _establish_standing_baseline(self):
        """Establish standing baseline from first stable frames."""
        # Use first 15 valid frames (or up to 0.5 seconds) to establish baseline
        valid_frames = [f for f in self.frame_data[:15] if f["valid"] and f["hip_center_y"] is not None]
        
        if len(valid_frames) < 5:
            return
        
        # Check stability - hip should not move much
        y_values = [f["hip_center_y"] for f in valid_frames]
        x_values = [f["hip_center_x"] for f in valid_frames if f["hip_center_x"] is not None]
        
        y_std = np.std(y_values)
        x_std = np.std(x_values) if x_values else 0
        
        # Baseline is stable if movement is minimal (< 0.02 normalized = ~1.2% of frame height)
        if y_std < 0.02 and x_std < 0.02:
            self.standing_baseline_y = float(np.mean(y_values))
            self.standing_baseline_x = float(np.mean(x_values)) if x_values else None
            logger.info(f"Standing baseline established: y={self.standing_baseline_y:.4f}, x={self.standing_baseline_x}")
        else:
            logger.warning(f"Baseline unstable: y_std={y_std:.4f}, x_std={x_std:.4f}")
    
    def _compute_vertical_displacement(self):
        """Compute vertical displacement relative to standing baseline."""
        if self.standing_baseline_y is None:
            return
        
        for frame in self.frame_data:
            if frame["valid"] and frame["hip_center_y"] is not None:
                # Positive = upward (lower y = higher in image coordinates)
                frame["vertical_displacement"] = self.standing_baseline_y - frame["hip_center_y"]
            else:
                frame["vertical_displacement"] = 0.0
    
    def _run_state_machine(self):
        """Run the state machine to detect jump phases with strict invariants."""
        if not self.frame_data:
            return
        
        # Smooth displacement signal for velocity computation
        displacements = [f.get("vertical_displacement", 0) for f in self.frame_data]
        
        # Compute velocity (displacement change per frame)
        velocities = [0.0]
        for i in range(1, len(displacements)):
            velocities.append(displacements[i] - displacements[i-1])
        
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
            frame["displacement"] = frame.get("vertical_displacement", 0.0)
            
            # State transitions with strict invariants
            prev_state = self.state
            
            # State: STANDING -> LOADING
            if self.state == JumpState.STANDING:
                # Transition to LOADING when knee angle drops below threshold
                if frame.get("knee_angle") is not None and frame["knee_angle"] < self.LOADING_KNEE_ANGLE_THRESHOLD:
                    self.state = JumpState.LOADING
                    logger.debug(f"Frame {i}: STANDING -> LOADING (knee_angle={frame['knee_angle']:.1f})")
            
            # State: LOADING -> TAKEOFF
            elif self.state == JumpState.LOADING:
                # Transition to TAKEOFF when upward velocity exceeds threshold AND knee is extending
                if (frame.get("velocity", 0) > self.TAKEOFF_VERTICAL_VELOCITY_THRESHOLD and
                    frame.get("knee_angle", 180) > self.LOADING_KNEE_ANGLE_THRESHOLD):
                    # Ensure we haven't just had a takeoff (debounce)
                    if i - self._last_takeoff_frame > 10:  # minimum 10 frames between takeoffs
                        self._takeoff_occurred = True
                        self._in_flight = True
                        self._flight_frame_count = 0
                        self._takeoff_timestamp = frame.get("timestamp_sec", 0)
                        self._last_takeoff_frame = i
                        self.state = JumpState.TAKEOFF
                        self._mark_takeoff(i, frame)
                        logger.debug(f"Frame {i}: LOADING -> TAKEOFF (velocity={frame['velocity']:.4f})")
            
            # State: TAKEOFF -> FLIGHT
            elif self.state == JumpState.TAKEOFF:
                # Immediately transition to FLIGHT
                self._in_flight = True
                self._flight_frame_count = 0
                self.state = JumpState.FLIGHT
                self._mark_flight_start(i, frame)
            
            # State: FLIGHT -> PEAK -> LANDING
            elif self.state == JumpState.FLIGHT:
                self._in_flight = True
                self._flight_frame_count += 1
                
                # Track peak (maximum displacement)
                if frame.get("displacement", 0) > getattr(self, 'peak_displacement', -float('inf')):
                    self.peak_displacement = frame.get("displacement", 0)
                    self.peak_frame = i
                    self.peak_timestamp = frame.get("timestamp_sec", 0)
                
                # Transition to LANDING - STRICT REQUIREMENTS:
                # 1. Must have been in flight for minimum frames
                # 2. Must have minimum flight duration
                # 3. Downward velocity exceeds threshold
                # 4. Ankle/foot visibility indicates ground contact
                # 5. TAKEOFF must have occurred
                can_land = (
                    self._takeoff_occurred and
                    self._flight_frame_count >= self.FLIGHT_MIN_FRAMES and
                    (self._takeoff_timestamp is not None and 
                     (frame.get("timestamp_sec", 0) - self._takeoff_timestamp) * 1000 >= self.MIN_FLIGHT_DURATION_MS) and
                    frame.get("velocity", 0) < self.LANDING_VERTICAL_VELOCITY_THRESHOLD and
                    frame.get("ankle_visibility", 0) >= self.LANDING_MIN_ANKLE_VISIBILITY
                )
                
                if can_land and i - self._last_landing_frame > 10:  # debounce landings
                    self._landing_occurred = True
                    self._in_flight = False
                    self._last_landing_frame = i
                    self.state = JumpState.LANDING
                    self._mark_landing(i, frame)
                    logger.debug(f"Frame {i}: FLIGHT -> LANDING (velocity={frame['velocity']:.4f}, flight_frames={self._flight_frame_count})")
            
            # State: LANDING -> RECOVERY
            elif self.state == JumpState.LANDING:
                self.state = JumpState.RECOVERY
                self.recovery_start_frame = i
            
            # State: RECOVERY -> STANDING
            elif self.state == JumpState.RECOVERY:
                # Check if stabilized (low velocity, stable knee angle, sufficient recovery frames)
                if (i - getattr(self, 'recovery_start_frame', i) >= self.RECOVERY_STABILITY_FRAMES and
                    abs(frame.get("velocity", 0)) < 0.003 and
                    frame.get("knee_angle", 180) > 160):  # knee nearly extended
                    self.state = JumpState.STANDING
                    # Reset flight tracking for next potential jump
                    self._takeoff_occurred = False
                    self._landing_occurred = False
                    self._in_flight = False
                    self._flight_frame_count = 0
                    logger.debug(f"Frame {i}: RECOVERY -> STANDING")
            
            self.state_history.append(self.state)
            frame["state"] = self.state.value
            
            # Log state transitions
            if prev_state != self.state:
                logger.info(f"State transition: {prev_state.value} -> {self.state.value} at frame {i} (t={frame.get('timestamp_sec', 0):.3f}s)")
    
    def _mark_takeoff(self, frame_idx: int, frame: Dict):
        """Mark takeoff event."""
        self.takeoff_frame = frame_idx
        self.takeoff_timestamp = frame.get("timestamp_sec", 0)
        self.takeoff_displacement = frame.get("displacement", 0)
        self.knee_angle_at_loading = frame.get("knee_angle")
        self._takeoff_occurred = True
    
    def _mark_flight_start(self, frame_idx: int, frame: Dict):
        """Mark flight start."""
        self.flight_start_frame = frame_idx
        self.flight_start_timestamp = frame.get("timestamp_sec", 0)
        self.peak_displacement = -float('inf')
        self.peak_frame = frame_idx
        self.peak_timestamp = frame.get("timestamp_sec", 0)
        self._flight_frame_count = 0
    
    def _mark_landing(self, frame_idx: int, frame: Dict):
        """Mark landing event."""
        self.landing_frame = frame_idx
        self.landing_timestamp = frame.get("timestamp_sec", 0)
        self.landing_displacement = frame.get("displacement", 0)
        self._landing_occurred = True
    
    def _extract_attempts(self):
        """Extract jump attempts from state transitions - one per complete TAKEOFF->LANDING cycle."""
        # Find complete jump cycles: TAKEOFF -> FLIGHT -> LANDING -> RECOVERY
        in_jump = False
        attempt_start = None
        
        for i, state in enumerate(self.state_history):
            # Start new attempt on TAKEOFF (only if not already in a jump)
            if state == JumpState.TAKEOFF and not in_jump:
                in_jump = True
                attempt_start = i
                self.attempt_number += 1
                self.current_attempt = JumpAttempt(
                    attempt_number=self.attempt_number,
                    validity=TestValidity.INSUFFICIENT_EVIDENCE,
                    metrics={},
                    confidence_score=None,
                )
            
            # End attempt on RECOVERY (completed cycle)
            elif state == JumpState.RECOVERY and in_jump:
                in_jump = False
                if attempt_start is not None and self.current_attempt:
                    self._finalize_attempt(attempt_start, i)
        
        # Handle case where jump ends without recovery (video ended mid-jump)
        if in_jump and attempt_start is not None and self.current_attempt:
            self._finalize_attempt(attempt_start, len(self.state_history) - 1)
    
    def _finalize_attempt(self, start_frame: int, end_frame: int):
        """Finalize and validate a jump attempt."""
        if not self.current_attempt:
            return
        
        attempt = self.current_attempt
        
        # Extract timing
        takeoff_time = getattr(self, 'takeoff_timestamp', None)
        landing_time = getattr(self, 'landing_timestamp', None)
        peak_time = getattr(self, 'peak_timestamp', None)
        
        # INVARIANT: landing must occur after takeoff
        if takeoff_time is None:
            # No takeoff detected - don't finalize, will be handled by state machine
            logger.debug(f"Jump attempt discarded: no takeoff detected")
            return
        
        if landing_time is None:
            # No landing detected - don't finalize
            logger.debug(f"Jump attempt discarded: no landing detected")
            return
        
        if landing_time <= takeoff_time:
            # IMPOSSIBLE: landing before takeoff - discard this attempt
            logger.debug(f"Jump attempt discarded: landing_time ({landing_time}) <= takeoff_time ({takeoff_time})")
            return
        
        # Compute metrics
        metrics = {}
        evidence = {}
        
        # Flight time must be positive
        flight_time = (landing_time - takeoff_time) * 1000  # ms
        if flight_time > 0:
            metrics["flight_time_ms"] = round(flight_time, 1)
            evidence["flight_time_detected"] = True
        else:
            evidence["flight_time_detected"] = False
            evidence["invalid_flight_time"] = True
        
        if takeoff_time is not None:
            metrics["takeoff_timestamp_ms"] = round(takeoff_time * 1000)
        
        if peak_time is not None:
            metrics["peak_timestamp_ms"] = round(peak_time * 1000)
        
        if landing_time is not None:
            metrics["landing_timestamp_ms"] = round(landing_time * 1000)
        
        # Normalized vertical displacement (peak - takeoff)
        if hasattr(self, 'peak_displacement') and hasattr(self, 'takeoff_displacement'):
            normalized_disp = self.peak_displacement - self.takeoff_displacement
            metrics["normalized_vertical_displacement"] = round(normalized_disp, 4)
            evidence["peak_displacement"] = self.peak_displacement
            evidence["takeoff_displacement"] = self.takeoff_displacement
        
        # Knee angle at loading
        if self.knee_angle_at_loading is not None:
            metrics["knee_angle_at_loading_deg"] = round(self.knee_angle_at_loading, 1)
        
        # Body alignment score (shoulder-hip alignment during flight)
        flight_frames = self.frame_data[start_frame:end_frame+1]
        alignment_scores = []
        for f in flight_frames:
            if f["valid"] and f.get("shoulder_center_y") is not None and f.get("hip_center_y") is not None:
                # Shoulder-hip vertical alignment (should be roughly parallel)
                alignment = abs(f["shoulder_center_y"] - f["hip_center_y"])
                alignment_scores.append(alignment)
        
        if alignment_scores:
            # Lower alignment value = better alignment
            avg_alignment = np.mean(alignment_scores)
            metrics["body_alignment_score"] = round(1.0 / (1.0 + avg_alignment * 10), 3)
        
        # Jump height in cm - ONLY if calibration available
        if self.calibration_available and self.calibration_factor:
            if "normalized_vertical_displacement" in metrics:
                metrics["jump_height_cm"] = round(metrics["normalized_vertical_displacement"] * self.calibration_factor, 1)
        else:
            metrics["jump_height_cm"] = None  # Explicitly None per rules
        
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
    
    def _validate_attempt(self, attempt: JumpAttempt, evidence: Dict) -> TestValidity:
        """Validate a jump attempt based on evidence."""
        metrics = attempt.metrics
        
        # Check required evidence
        if not evidence.get("flight_time_detected", False):
            return TestValidity.INVALID
        
        if evidence.get("invalid_flight_time", False):
            return TestValidity.INVALID
        
        if "normalized_vertical_displacement" not in metrics:
            return TestValidity.INSUFFICIENT_EVIDENCE
        
        if metrics.get("normalized_vertical_displacement", 0) < 0.01:  # ~0.6% of frame height
            return TestValidity.INVALID
        
        # Flight time should be reasonable (100-1000ms)
        flight_time = metrics.get("flight_time_ms", 0)
        if flight_time < 100 or flight_time > 1500:
            return TestValidity.INVALID
        
        # Knee angle at loading should show countermovement
        knee_angle = metrics.get("knee_angle_at_loading_deg")
        if knee_angle is not None and knee_angle > 170:
            return TestValidity.INVALID  # No countermovement
        
        return TestValidity.VALID
    
    def _compute_attempt_confidence(self, attempt: JumpAttempt, evidence: Dict) -> Optional[int]:
        """Compute confidence score for an attempt."""
        if attempt.validity != TestValidity.VALID:
            return None
        
        confidence = 0
        
        # Flight time detection quality
        if evidence.get("flight_time_detected"):
            confidence += 25
        
        # Displacement magnitude (higher = more confident it's real)
        disp = attempt.metrics.get("normalized_vertical_displacement", 0)
        confidence += min(25, int(disp * 500))  # Up to 25 for displacement
        
        # Body alignment
        alignment = attempt.metrics.get("body_alignment_score", 0)
        confidence += int(alignment * 25)
        
        # Knee angle validity
        if "knee_angle_at_loading_deg" in attempt.metrics:
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
        
        # Confidence calculation similar to base pipeline
        confidence = 0
        confidence += min(30, int(detection_rate * 30))
        confidence += min(25, int(avg_visibility * 25))
        confidence += min(25, int(min(valid_frames / 30.0, 1.0) * 25))
        confidence += min(20, 20 if len(self.attempts) > 0 else 0)
        
        return min(100, confidence) if confidence > 0 else None


def analyze_vertical_jump(
    landmarks_history: List[Dict[str, Any]], 
    fps: float, 
    video_metadata: Dict[str, Any],
    calibration_available: bool = False,
    calibration_factor: Optional[float] = None
    ) -> VerticalJumpResult:
    """
    Main entry point for vertical jump analysis.
    
    Args:
        landmarks_history: List of landmark frames from assessment_pipeline
        fps: Video frames per second
        video_metadata: Video metadata (width, height, etc.)
        calibration_available: Whether calibration reference is available
        calibration_factor: Pixels per cm calibration factor
        
    Returns:
        VerticalJumpResult with all attempts and metrics
    """
    analyzer = VerticalJumpAnalyzer(
        calibration_available=calibration_available,
        calibration_factor=calibration_factor,
    )
    return analyzer.analyze(landmarks_history, fps, video_metadata)