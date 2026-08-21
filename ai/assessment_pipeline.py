"""
Core CV Assessment Pipeline for The Elitez.

Video -> OpenCV -> MediaPipe Pose -> Landmarks -> Features -> Metrics -> Scoring -> Result
"""

import os
import logging
import math
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum

import cv2
import numpy as np

from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
from mediapipe.tasks.python.vision.core.image import ImageFormat
from mediapipe.tasks.python.vision.core import image as mp_image
from mediapipe.tasks.python.core.base_options import BaseOptions

# Fitness test analyzer integration
from ai.fitness_tests import (
    analyze_fitness_test,
    is_fitness_test,
    get_fitness_test_definitions,
)

# Shared constants
from ai.constants import POSE_LANDMARKS, JOINT_ANGLES

logger = logging.getLogger(__name__)

MODEL_VERSION = "cv-mediapipe-v1"

# Default model filename
DEFAULT_MODEL_FILENAME = "pose_landmarker_full.task"

# Environment variable for custom model path
MODEL_PATH_ENV_VAR = "POSE_LANDMARKER_MODEL_PATH"


def _get_repo_root() -> str:
    """Get the repository root directory (where this file's parent's parent is)."""
    # This file is at ai/assessment_pipeline.py, repo root is parent of ai/
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resolve_model_path(explicit_path: Optional[str] = None) -> str:
    """
    Resolve the MediaPipe Pose Landmarker model path.

    Priority order:
    1. Explicit path passed to AssessmentPipeline(model_asset_path=...)
    2. Default location: <repo_root>/ai/models/pose_landmarker_full.task
    3. Environment variable: POSE_LANDMARKER_MODEL_PATH

    Args:
        explicit_path: Optional explicit model path from constructor

    Returns:
        Absolute path to the model file

    Raises:
        FileNotFoundError: If no model is found at any expected location
    """
    # 1. Explicit path takes highest priority
    if explicit_path:
        abs_path = os.path.abspath(explicit_path)
        if os.path.isfile(abs_path):
            logger.info(f"Using explicit model path: {abs_path}")
            return abs_path
        else:
            raise FileNotFoundError(
                f"Explicit model path does not exist: {abs_path}"
            )

    # 2. Default repo-relative location
    repo_root = _get_repo_root()
    default_path = os.path.join(repo_root, "ai", "models", DEFAULT_MODEL_FILENAME)
    if os.path.isfile(default_path):
        logger.info(f"Using default model path: {default_path}")
        return default_path

    # 3. Environment variable
    env_path = os.environ.get(MODEL_PATH_ENV_VAR)
    if env_path:
        abs_env_path = os.path.abspath(env_path)
        if os.path.isfile(abs_env_path):
            logger.info(f"Using model path from environment: {abs_env_path}")
            return abs_env_path
        else:
            raise FileNotFoundError(
                f"Model path from {MODEL_PATH_ENV_VAR} does not exist: {abs_env_path}"
            )

    # None found - provide actionable error
    checked_locations = [
        f"Explicit path (model_asset_path parameter): {explicit_path or 'not provided'}",
        f"Default repo location: {default_path}",
        f"Environment variable {MODEL_PATH_ENV_VAR}: {env_path or 'not set'}",
    ]
    error_msg = (
        "MediaPipe Pose Landmarker model not found.\n"
        "Checked locations:\n  - " + "\n  - ".join(checked_locations) + "\n\n"
        f"Download the model from: https://mediapipe.dev/ace/pose-landmarker\n"
        f"Place at: {default_path}\n"
        f"Or set environment variable: {MODEL_PATH_ENV_VAR}=/path/to/pose_landmarker_full.task"
    )
    raise FileNotFoundError(error_msg)


class AnalysisStatus(Enum):
    SUCCESS = "success"
    INSUFFICIENT_QUALITY = "insufficient_quality"
    VIDEO_ERROR = "video_error"
    PROCESSING_ERROR = "processing_error"
    NO_POSE_DETECTED = "no_pose_detected"


@dataclass
class VideoMetadata:
    path: str
    fps: float
    frame_count: int
    duration_sec: float
    width: int
    height: int
    codec: str


@dataclass
class ProcessingStats:
    frames_read: int = 0
    frames_sampled: int = 0
    frames_with_pose: int = 0
    pose_detection_rate: float = 0.0
    avg_visible_landmarks: float = 0.0
    avg_landmark_visibility: float = 0.0
    processing_time_sec: float = 0.0


@dataclass
class QualityInfo:
    sufficient: bool
    pose_detection_rate: float
    avg_visible_landmarks: float
    avg_landmark_visibility: float
    min_frames_required: int = 10
    min_detection_rate: float = 0.5
    min_avg_visible_landmarks: int = 15
    min_avg_visibility: float = 0.5
    failure_reasons: List[str] = field(default_factory=list)


@dataclass
class LandmarkFrame:
    frame_idx: int
    timestamp_sec: float
    landmarks: List[Dict[str, float]]  # list of {x, y, z, visibility, presence}
    world_landmarks: List[Dict[str, float]]


@dataclass
class RawMeasurements:
    joint_angles: Dict[str, List[float]] = field(default_factory=dict)
    landmark_positions: Dict[str, List[Tuple[float, float, float]]] = field(default_factory=dict)
    movement_ranges: Dict[str, float] = field(default_factory=dict)
    temporal_metrics: Dict[str, float] = field(default_factory=dict)


@dataclass
class PipelineResult:
    success: bool
    status: AnalysisStatus
    error: Optional[str] = None
    video_metadata: Optional[VideoMetadata] = None
    processing_stats: Optional[ProcessingStats] = None
    quality_info: Optional[QualityInfo] = None
    raw_measurements: Optional[RawMeasurements] = None
    metrics: Optional[Dict[str, Any]] = None
    overall_score: Optional[float] = None
    confidence_score: Optional[int] = None
    biomechanics: Optional[Dict[str, Any]] = None
    model_version: str = MODEL_VERSION


class AssessmentPipeline:
    """Core CV assessment pipeline using OpenCV and MediaPipe."""

    def __init__(
        self,
        sample_interval: int = 2,
        min_detection_confidence: float = 0.5,
        min_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        model_asset_path: Optional[str] = None,
    ):
        self.sample_interval = sample_interval
        self.min_detection_confidence = min_detection_confidence
        self.min_presence_confidence = min_presence_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self.model_asset_path = model_asset_path
        self._resolved_model_path = resolve_model_path(model_asset_path)
        self._landmarker: Optional[PoseLandmarker] = None

    def _init_landmarker(self) -> PoseLandmarker:
        """Initialize MediaPipe Pose Landmarker."""
        if self._landmarker is not None:
            return self._landmarker

        base_options = BaseOptions(
            model_asset_path=self._resolved_model_path,
            delegate=BaseOptions.Delegate.CPU,
        )

        options = PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=self.min_detection_confidence,
            min_pose_presence_confidence=self.min_presence_confidence,
            min_tracking_confidence=self.min_tracking_confidence,
            output_segmentation_masks=False,
        )

        self._landmarker = PoseLandmarker.create_from_options(options)
        logger.info("MediaPipe Pose Landmarker initialized")
        return self._landmarker

    def _load_video(self, video_path: str) -> Tuple[cv2.VideoCapture, VideoMetadata]:
        """Load and validate video file."""
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        codec_int = int(cap.get(cv2.CAP_PROP_FOURCC))
        codec = "".join([chr((codec_int >> 8 * i) & 0xFF) for i in range(4)])

        if fps <= 0 or frame_count <= 0:
            raise ValueError(f"Invalid video properties: fps={fps}, frames={frame_count}")

        duration_sec = frame_count / fps

        metadata = VideoMetadata(
            path=video_path,
            fps=fps,
            frame_count=frame_count,
            duration_sec=duration_sec,
            width=width,
            height=height,
            codec=codec,
        )

        logger.info(
            f"Video loaded: {video_path}, {width}x{height}, {fps:.2f} FPS, "
            f"{frame_count} frames, {duration_sec:.2f}s"
        )
        return cap, metadata

    def _create_mp_image(self, frame: np.ndarray) -> mp_image.Image:
        """Convert OpenCV BGR frame to MediaPipe Image (SRGB format)."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return mp_image.Image(image_format=ImageFormat.SRGB, data=rgb_frame)

    def _extract_landmarks(self, result) -> Tuple[List[Dict], List[Dict], int, float]:
        """Extract normalized and world landmarks from MediaPipe result."""
        landmarks = []
        world_landmarks = []
        visible_count = 0
        visibility_sum = 0.0

        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            pose_landmarks = result.pose_landmarks[0]
            world_pose_landmarks = result.pose_world_landmarks[0] if result.pose_world_landmarks else []

            for i, lm in enumerate(pose_landmarks):
                lm_dict = {
                    "x": lm.x,
                    "y": lm.y,
                    "z": lm.z,
                    "visibility": lm.visibility,
                    "presence": lm.presence,
                }
                landmarks.append(lm_dict)

                if lm.visibility > 0.5:
                    visible_count += 1
                    visibility_sum += lm.visibility

            for i, lm in enumerate(world_pose_landmarks):
                world_landmarks.append({
                    "x": lm.x,
                    "y": lm.y,
                    "z": lm.z,
                })

        avg_visibility = visibility_sum / visible_count if visible_count > 0 else 0.0
        return landmarks, world_landmarks, visible_count, avg_visibility

    def _calculate_angle(self, p1: Dict, p2: Dict, p3: Dict) -> Optional[float]:
        """Calculate angle between three points (p1-p2-p3) in degrees."""
        try:
            v1 = np.array([p1["x"] - p2["x"], p1["y"] - p2["y"], p1["z"] - p2["z"]])
            v2 = np.array([p3["x"] - p2["x"], p3["y"] - p2["y"], p3["z"] - p2["z"]])

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

    def _compute_joint_angles(self, landmarks: List[Dict]) -> Dict[str, float]:
        """Compute all defined joint angles for a single frame."""
        angles = {}
        if len(landmarks) < 33:
            return angles

        lm = {name: landmarks[idx] for name, idx in POSE_LANDMARKS.items() if idx < len(landmarks)}

        for angle_name, (p1_name, p2_name, p3_name) in JOINT_ANGLES.items():
            if p1_name in lm and p2_name in lm and p3_name in lm:
                angle = self._calculate_angle(lm[p1_name], lm[p2_name], lm[p3_name])
                if angle is not None:
                    angles[angle_name] = angle

        return angles

    def _compute_movement_ranges(self, angle_history: Dict[str, List[float]]) -> Dict[str, float]:
        """Compute range of motion for each joint angle."""
        ranges = {}
        for angle_name, values in angle_history.items():
            if len(values) >= 2:
                ranges[f"{angle_name}_range"] = max(values) - min(values)
                ranges[f"{angle_name}_mean"] = float(np.mean(values))
                ranges[f"{angle_name}_std"] = float(np.std(values))
        return ranges

    def _compute_temporal_metrics(
        self,
        landmarks_history: List[LandmarkFrame],
        fps: float,
    ) -> Dict[str, float]:
        """Compute temporal metrics from landmark history."""
        metrics = {}

        if len(landmarks_history) < 2:
            return metrics

        # Time-based metrics
        total_time = landmarks_history[-1].timestamp_sec - landmarks_history[0].timestamp_sec
        metrics["total_analysis_time_sec"] = total_time

        # Center of mass movement (approximated by hip center)
        hip_positions = []
        for frame in landmarks_history:
            lm = {name: frame.landmarks[idx] for name, idx in POSE_LANDMARKS.items() if idx < len(frame.landmarks)}
            if "left_hip" in lm and "right_hip" in lm:
                hip_center_x = (lm["left_hip"]["x"] + lm["right_hip"]["x"]) / 2
                hip_center_y = (lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2
                hip_positions.append((hip_center_x, hip_center_y))

        if len(hip_positions) >= 2:
            # Total displacement
            total_disp = 0.0
            for i in range(1, len(hip_positions)):
                dx = hip_positions[i][0] - hip_positions[i-1][0]
                dy = hip_positions[i][1] - hip_positions[i-1][1]
                total_disp += math.sqrt(dx*dx + dy*dy)
            metrics["hip_center_total_displacement_normalized"] = total_disp
            metrics["hip_center_velocity_normalized_per_sec"] = total_disp / total_time if total_time > 0 else 0.0

        return metrics

    def _assess_quality(self, stats: ProcessingStats, frame_count: int) -> QualityInfo:
        """Assess analysis quality based on processing statistics."""
        reasons = []

        sufficient = True
        if stats.frames_read < 10:
            sufficient = False
            reasons.append(f"Insufficient frames read: {stats.frames_read} < 10")

        if stats.pose_detection_rate < 0.5:
            sufficient = False
            reasons.append(f"Low pose detection rate: {stats.pose_detection_rate:.2f} < 0.5")

        if stats.avg_visible_landmarks < 15:
            sufficient = False
            reasons.append(f"Low average visible landmarks: {stats.avg_visible_landmarks:.1f} < 15")

        if stats.avg_landmark_visibility < 0.5:
            sufficient = False
            reasons.append(f"Low average landmark visibility: {stats.avg_landmark_visibility:.2f} < 0.5")

        return QualityInfo(
            sufficient=sufficient,
            pose_detection_rate=stats.pose_detection_rate,
            avg_visible_landmarks=stats.avg_visible_landmarks,
            avg_landmark_visibility=stats.avg_landmark_visibility,
            failure_reasons=reasons,
        )

    def _extract_generic_metrics(
        self,
        angle_history: Dict[str, List[float]],
        landmarks_history: List[LandmarkFrame],
        fps: float,
    ) -> Dict[str, Any]:
        """Extract generic CV-derived metrics (not sport-specific)."""
        metrics = {}

        # Joint angle statistics
        for angle_name, values in angle_history.items():
            if len(values) >= 2:
                metrics[f"{angle_name}_mean_deg"] = float(np.mean(values))
                metrics[f"{angle_name}_std_deg"] = float(np.std(values))
                metrics[f"{angle_name}_range_deg"] = float(max(values) - min(values))
                metrics[f"{angle_name}_min_deg"] = float(min(values))
                metrics[f"{angle_name}_max_deg"] = float(max(values))

        # Movement ranges
        ranges = self._compute_movement_ranges(angle_history)
        metrics.update(ranges)

        # Temporal metrics
        temporal = self._compute_temporal_metrics(landmarks_history, fps)
        metrics.update(temporal)

        # Pose stability metrics
        if len(landmarks_history) >= 2:
            # Hip stability (lower variance = more stable)
            hip_y_values = []
            for frame in landmarks_history:
                lm = {name: frame.landmarks[idx] for name, idx in POSE_LANDMARKS.items() if idx < len(frame.landmarks)}
                if "left_hip" in lm and "right_hip" in lm:
                    hip_y_values.append((lm["left_hip"]["y"] + lm["right_hip"]["y"]) / 2)

            if len(hip_y_values) >= 2:
                metrics["hip_vertical_stability"] = float(1.0 / (1.0 + np.std(hip_y_values)))

        return metrics

    def _compute_confidence(self, quality: QualityInfo, stats: ProcessingStats) -> Optional[int]:
        """Compute confidence score based on quality metrics."""
        if not quality.sufficient:
            return None

        # Confidence based on quality metrics (0-100)
        confidence = 0
        confidence += min(30, int(quality.pose_detection_rate * 30))
        confidence += min(25, int((quality.avg_visible_landmarks / 33.0) * 25))
        confidence += min(25, int(quality.avg_landmark_visibility * 25))
        confidence += min(20, int(min(stats.frames_with_pose / 30.0, 1.0) * 20))

        return min(100, confidence)

    def _determine_sport_metrics(
        self,
        assessment_type: str,
        metrics: Dict[str, Any],
        quality: QualityInfo,
        landmarks_history: Optional[List[LandmarkFrame]] = None,
        fps: Optional[float] = None,
        video_metadata: Optional[VideoMetadata] = None,
    ) -> Tuple[Dict[str, Any], Optional[float], Optional[Dict[str, Any]]]:
        """
        Determine sport/fitness-specific metrics from generic CV metrics.

        Returns: (sport_metrics, overall_score, biomechanics)
        """
        sport_metrics = {}
        overall_score = None
        biomechanics = None

        # Check if this is a fitness test (SIH core or Elitez extended)
        if is_fitness_test(assessment_type):
            # Delegate to fitness test analyzer
            if landmarks_history and fps and quality.sufficient:
                # Convert LandmarkFrame objects to dict format expected by fitness analyzer
                landmarks_history_dict = [
                    {
                        "frame_idx": f.frame_idx,
                        "timestamp_sec": f.timestamp_sec,
                        "landmarks": f.landmarks,
                        "world_landmarks": f.world_landmarks,
                    }
                    for f in landmarks_history
                ]
                
                video_meta = {
                    "width": video_metadata.width if video_metadata else 640,
                    "height": video_metadata.height if video_metadata else 480,
                    "fps": fps,
                    "duration_sec": video_metadata.duration_sec if video_metadata else 0,
                }
                
                # For now, no calibration - returns None for jump_height_cm
                fitness_result = analyze_fitness_test(
                    assessment_type=assessment_type,
                    landmarks_history=landmarks_history_dict,
                    fps=fps,
                    video_metadata=video_meta,
                    calibration_available=False,
                    calibration_factor=None,
                )
                
                sport_metrics = fitness_result.get("metrics", {})
                biomechanics = fitness_result.get("biomechanics")
                # Store fitness confidence for later use (retrieved in analyze_video)
                sport_metrics["_fitness_confidence"] = fitness_result.get("confidence_score")
                # overall_score remains None per rules
                # confidence_score will be retrieved from sport_metrics["_fitness_confidence"]
            else:
                sport_metrics = {"quality_insufficient": True}
        else:
            # Existing sport-specific logic (for football, basketball, athletics drills)
            # For now, we only return generic CV metrics.
            # Sport-specific scoring requires validated biomechanical models
            # and ground truth data which are not available in this phase.
            # Per rules: do NOT invent scientifically unsupported metrics.

            if quality.sufficient:
                # We have reliable generic metrics - pass them through
                sport_metrics = metrics.copy()
            else:
                sport_metrics = {"quality_insufficient": True}

        return sport_metrics, overall_score, biomechanics

    def analyze_video(self, video_path: str, assessment_type: str) -> PipelineResult:
        """
        Analyze a video file for pose-based assessment metrics.

        Args:
            video_path: Path to local video file
            assessment_type: Type of assessment (e.g., "football_sprint_20m")

        Returns:
            PipelineResult with all analysis information
        """
        import time
        start_time = time.time()

        try:
            # Initialize landmarker
            landmarker = self._init_landmarker()

            # Load video
            cap, video_metadata = self._load_video(video_path)

            # Processing state
            frame_idx = 0
            sampled_count = 0
            pose_count = 0
            total_visible = 0
            total_visibility = 0.0

            angle_history: Dict[str, List[float]] = {name: [] for name in JOINT_ANGLES.keys()}
            landmarks_history: List[LandmarkFrame] = []

            # Process frames
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame_idx += 1

                # Sample frames at interval
                if frame_idx % self.sample_interval != 0:
                    continue

                sampled_count += 1

                # Convert to MediaPipe image
                mp_frame = self._create_mp_image(frame)

                # Run pose detection
                timestamp_ms = int(frame_idx / video_metadata.fps * 1000)
                result = landmarker.detect_for_video(mp_frame, timestamp_ms)

                # Extract landmarks
                landmarks, world_landmarks, visible_count, avg_vis = self._extract_landmarks(result)

                if landmarks:
                    pose_count += 1
                    total_visible += visible_count
                    total_visibility += avg_vis

                    # Compute joint angles
                    frame_angles = self._compute_joint_angles(landmarks)
                    for angle_name, angle_val in frame_angles.items():
                        angle_history[angle_name].append(angle_val)

                    # Store landmark frame
                    landmarks_history.append(LandmarkFrame(
                        frame_idx=frame_idx,
                        timestamp_sec=frame_idx / video_metadata.fps,
                        landmarks=landmarks,
                        world_landmarks=world_landmarks,
                    ))

            cap.release()

            # Compute processing stats
            processing_time = time.time() - start_time
            detection_rate = pose_count / sampled_count if sampled_count > 0 else 0.0
            avg_visible = total_visible / pose_count if pose_count > 0 else 0.0
            avg_visibility = total_visibility / pose_count if pose_count > 0 else 0.0

            stats = ProcessingStats(
                frames_read=frame_idx,
                frames_sampled=sampled_count,
                frames_with_pose=pose_count,
                pose_detection_rate=detection_rate,
                avg_visible_landmarks=avg_visible,
                avg_landmark_visibility=avg_visibility,
                processing_time_sec=processing_time,
            )

            # Assess quality
            quality = self._assess_quality(stats, frame_idx)

            # Extract generic metrics
            generic_metrics = self._extract_generic_metrics(
                angle_history, landmarks_history, video_metadata.fps
            )

            # Determine sport-specific metrics
            sport_metrics, overall_score, biomechanics = self._determine_sport_metrics(
                assessment_type, generic_metrics, quality,
                landmarks_history=landmarks_history,
                fps=video_metadata.fps,
                video_metadata=video_metadata,
            )
            
            # Compute confidence - use fitness test confidence if available
            fitness_confidence = sport_metrics.get("_fitness_confidence")
            if fitness_confidence is not None:
                confidence = fitness_confidence
            else:
                confidence = self._compute_confidence(quality, stats)

            # Prepare raw measurements
            raw_measurements = RawMeasurements()
            for angle_name, values in angle_history.items():
                if values:
                    raw_measurements.joint_angles[angle_name] = values

            # Build result
            result = PipelineResult(
                success=quality.sufficient,
                status=AnalysisStatus.SUCCESS if quality.sufficient else AnalysisStatus.INSUFFICIENT_QUALITY,
                error=None if quality.sufficient else "; ".join(quality.failure_reasons),
                video_metadata=video_metadata,
                processing_stats=stats,
                quality_info=quality,
                raw_measurements=raw_measurements,
                metrics=sport_metrics,
                overall_score=overall_score,
                confidence_score=confidence,
                biomechanics=biomechanics,
                model_version=MODEL_VERSION,
            )

            logger.info(
                f"Analysis complete: {video_path}, "
                f"frames_read={frame_idx}, sampled={sampled_count}, "
                f"pose_detected={pose_count}, detection_rate={detection_rate:.2f}, "
                f"quality_sufficient={quality.sufficient}, "
                f"score={overall_score}, confidence={confidence}"
            )

            return result

        except FileNotFoundError as e:
            logger.error(f"Video file not found: {e}")
            return PipelineResult(
                success=False,
                status=AnalysisStatus.VIDEO_ERROR,
                error=str(e),
                model_version=MODEL_VERSION,
            )
        except ValueError as e:
            logger.error(f"Video validation error: {e}")
            return PipelineResult(
                success=False,
                status=AnalysisStatus.VIDEO_ERROR,
                error=str(e),
                model_version=MODEL_VERSION,
            )
        except Exception as e:
            logger.exception(f"Pipeline processing error: {e}")
            return PipelineResult(
                success=False,
                status=AnalysisStatus.PROCESSING_ERROR,
                error=f"Processing error: {str(e)}",
                model_version=MODEL_VERSION,
            )


def analyze_video(video_path: str, assessment_type: str) -> PipelineResult:
    """
    Main entry point for video analysis.

    Args:
        video_path: Path to local video file
        assessment_type: Assessment type identifier

    Returns:
        PipelineResult with analysis results
    """
    pipeline = AssessmentPipeline()
    return pipeline.analyze_video(video_path, assessment_type)


if __name__ == "__main__":
    # Simple test if run directly
    logging.basicConfig(level=logging.INFO)
    import sys
    if len(sys.argv) > 1:
        result = analyze_video(sys.argv[1], "test")
        print(f"Success: {result.success}")
        print(f"Status: {result.status.value}")
        print(f"Error: {result.error}")
        print(f"Score: {result.overall_score}")
        print(f"Confidence: {result.confidence_score}")
        print(f"Model: {result.model_version}")
        if result.metrics:
            print(f"Metrics: {result.metrics}")
    else:
        print("Usage: python assessment_pipeline.py <video_path>")