"""
Fitness Test Definitions - Centralized source of truth for all assessment tests.

SIH Core Tests (from problem statement):
- height
- weight
- vertical_jump
- shuttle_run
- sit_up
- endurance_run

Elitez Extended Tests:
- squat
- push_up
- jump_variations
- sprint
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field


class TestCategory(Enum):
    SIH_CORE = "SIH_CORE"
    ELITEZ_EXTENDED = "ELITEZ_EXTENDED"


class CaptureMode(Enum):
    VIDEO = "video"
    MANUAL = "manual"
    SENSOR = "sensor"


class TestValidity(Enum):
    VALID = "valid"
    INVALID = "invalid"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass
class TestDefinition:
    """
    Centralized test definition - single source of truth for all test metadata.
    """
    id: str
    display_name: str
    category: TestCategory
    capture_mode: CaptureMode
    requires_video: bool
    required_duration_sec: int
    required_landmarks: List[str]
    metrics: List[str]
    validation_rules: Dict[str, Any]
    analyzer_type: str
    instructions: List[str]
    setup_requirements: List[str]
    calibration_required: bool = False
    calibration_method: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "display_name": self.display_name,
            "category": self.category.value,
            "capture_mode": self.capture_mode.value,
            "requires_video": self.requires_video,
            "required_duration_sec": self.required_duration_sec,
            "required_landmarks": self.required_landmarks,
            "metrics": self.metrics,
            "validation_rules": self.validation_rules,
            "analyzer_type": self.analyzer_type,
            "instructions": self.instructions,
            "setup_requirements": self.setup_requirements,
            "calibration_required": self.calibration_required,
            "calibration_method": self.calibration_method,
            "ai_analysis_available": self.analyzer_type != "not_implemented",
        }


# =============================================================================
# SIH CORE TEST DEFINITIONS
# =============================================================================

SIH_CORE_TESTS = {
    "vertical_jump": TestDefinition(
        id="vertical_jump",
        display_name="Vertical Jump",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=10,
        required_landmarks=[
            "nose", "left_shoulder", "right_shoulder",
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle",
            "left_heel", "right_heel",
            "left_foot_index", "right_foot_index"
        ],
        metrics=[
            "jump_height_cm",
            "normalized_vertical_displacement",
            "flight_time_ms",
            "takeoff_timestamp_ms",
            "peak_timestamp_ms",
            "landing_timestamp_ms",
            "knee_angle_at_loading_deg",
            "body_alignment_score"
        ],
        validation_rules={
            "min_pose_detection_rate": 0.5,
            "min_visible_landmarks": 15,
            "min_landmark_visibility": 0.5,
            "min_frames": 10,
            "require_single_person": True,
            "require_stable_camera": True,
        },
        analyzer_type="vertical_jump",
        instructions=[
            "Stand upright with feet shoulder-width apart, facing the camera",
            "Ensure your full body is visible in the frame (head to feet)",
            "Camera should be stationary at chest level, ~4 meters away",
            "Ensure adequate lighting - avoid shadows on your body",
            "Perform a rapid countermovement dip with arm swing",
            "Explode vertically for maximum height",
            "Land on both feet and hold the landing for 2 seconds",
            "Only one athlete should be visible in the frame"
        ],
        setup_requirements=[
            "Flat court surface with overhead clearance",
            "Calibrated height marker or wall line (for calibration)",
            "Contrast athletic clothing",
            "Camera at chest level, 4 meters distance"
        ],
        calibration_required=True,
        calibration_method="Known reference object (height marker) in camera frame"
    ),
    
    "height": TestDefinition(
        id="height",
        display_name="Height",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=5,
        required_landmarks=["nose", "left_heel", "right_heel"],
        metrics=["height_cm"],
        validation_rules={
            "min_pose_detection_rate": 0.7,
            "require_calibration_object": True,
        },
        analyzer_type="not_implemented",
        instructions=[
            "Stand upright against a wall with a known height marker",
            "Camera should capture full body including the marker",
            "Remain still for 3 seconds"
        ],
        setup_requirements=[
            "Wall with known height calibration markers",
            "Camera positioned to capture full height"
        ],
        calibration_required=True,
        calibration_method="Known height reference markers on wall"
    ),
    
    "weight": TestDefinition(
        id="weight",
        display_name="Weight",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.MANUAL,
        requires_video=False,
        required_duration_sec=0,
        required_landmarks=[],
        metrics=["weight_kg"],
        validation_rules={},
        analyzer_type="not_implemented",
        instructions=[
            "Step on calibrated digital scale",
            "Record weight to nearest 0.1 kg",
            "Enter manually in the app"
        ],
        setup_requirements=[
            "Calibrated digital weighing scale"
        ],
        calibration_required=False
    ),
    
    "shuttle_run": TestDefinition(
        id="shuttle_run",
        display_name="Shuttle Run",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=20,
        required_landmarks=[
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle",
            "left_foot_index", "right_foot_index"
        ],
        metrics=["total_time_sec", "split_times", "change_of_direction_count"],
        validation_rules={
            "min_pose_detection_rate": 0.5,
            "require_multiple_turns": True,
        },
        analyzer_type="not_implemented",
        instructions=[
            "Set up cones 10 meters apart",
            "Start behind first cone",
            "Sprint to second cone, touch, return",
            "Repeat for required number of shuttles"
        ],
        setup_requirements=[
            "Two cones 10 meters apart",
            "Flat non-slip surface",
            "Camera covering full shuttle distance"
        ],
        calibration_required=False
    ),
    
    "sit_up": TestDefinition(
        id="sit_up",
        display_name="Sit-ups",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=60,
        required_landmarks=[
            "nose", "left_shoulder", "right_shoulder",
            "left_hip", "right_hip",
            "left_knee", "right_knee"
        ],
        metrics=["rep_count", "tempo", "form_score"],
        validation_rules={
            "min_pose_detection_rate": 0.6,
            "require_full_range_of_motion": True,
        },
        analyzer_type="sit_up",
        instructions=[
            "Lie on back with knees bent, feet flat",
            "Hands across chest or behind head",
            "Perform as many sit-ups as possible in 60 seconds",
            "Full range: shoulders touch floor, elbows touch knees"
        ],
        setup_requirements=[
            "Exercise mat",
            "Camera at side angle, 2 meters away",
            "Timer visible or audio cue"
        ],
        calibration_required=False
    ),
    
    "endurance_run": TestDefinition(
        id="endurance_run",
        display_name="Endurance Run",
        category=TestCategory.SIH_CORE,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=300,
        required_landmarks=[
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle"
        ],
        metrics=["distance_m", "pace", "heart_rate_estimate"],
        validation_rules={
            "min_pose_detection_rate": 0.4,
            "min_duration_sec": 60,
        },
        analyzer_type="not_implemented",
        instructions=[
            "Run at steady pace for prescribed distance/time",
            "Camera should track movement (or use GPS fallback)",
            "Maintain consistent form"
        ],
        setup_requirements=[
            "Measured running track or course",
            "Camera positioned for tracking"
        ],
        calibration_required=False
    ),
}


# =============================================================================
# ELITEZ EXTENDED TEST DEFINITIONS
# =============================================================================

ELITEZ_EXTENDED_TESTS = {
    "squat": TestDefinition(
        id="squat",
        display_name="Squat",
        category=TestCategory.ELITEZ_EXTENDED,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=15,
        required_landmarks=[
            "left_shoulder", "right_shoulder",
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle"
        ],
        metrics=[
            "depth_cm", "knee_angle_min_deg", "tempo", 
            "symmetry_score", "bar_path_deviation"
        ],
        validation_rules={
            "min_pose_detection_rate": 0.5,
            "min_knee_angle": 60,
        },
        analyzer_type="squat",
        instructions=[
            "Stand with feet shoulder-width apart",
            "Squat to parallel or below",
            "Keep chest up, knees tracking over toes",
            "Return to standing"
        ],
        setup_requirements=[
            "Camera at side angle, 3 meters away",
            "Contrast clothing for joint visibility"
        ],
        calibration_required=False
    ),
    
    "push_up": TestDefinition(
        id="push_up",
        display_name="Push-up",
        category=TestCategory.ELITEZ_EXTENDED,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=60,
        required_landmarks=[
            "nose", "left_shoulder", "right_shoulder",
            "left_elbow", "right_elbow",
            "left_wrist", "right_wrist",
            "left_hip", "right_hip"
        ],
        metrics=["rep_count", "depth_consistency", "tempo", "body_alignment"],
        validation_rules={
            "min_pose_detection_rate": 0.6,
            "require_full_extension": True,
        },
        analyzer_type="push_up",
        instructions=[
            "Start in plank position, hands under shoulders",
            "Lower chest to floor, push back up",
            "Maintain straight body line",
            "Complete as many reps as possible"
        ],
        setup_requirements=[
            "Camera at side angle, 2 meters away",
            "Exercise mat"
        ],
        calibration_required=False
    ),
    
    "jump_variations": TestDefinition(
        id="jump_variations",
        display_name="Jump Variations",
        category=TestCategory.ELITEZ_EXTENDED,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=15,
        required_landmarks=[
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle",
            "left_foot_index", "right_foot_index"
        ],
        metrics=["jump_height_cm", "contact_time_ms", "rsi"],
        validation_rules={
            "min_pose_detection_rate": 0.5,
        },
        analyzer_type="not_implemented",
        instructions=[
            "Perform prescribed jump variation (box jump, broad jump, etc.)",
            "Land with control",
            "Reset between attempts"
        ],
        setup_requirements=[
            "Appropriate equipment for variation",
            "Camera covering full movement"
        ],
        calibration_required=True,
        calibration_method="Known reference object in frame"
    ),
    
    "sprint": TestDefinition(
        id="sprint",
        display_name="Sprint",
        category=TestCategory.ELITEZ_EXTENDED,
        capture_mode=CaptureMode.VIDEO,
        requires_video=True,
        required_duration_sec=10,
        required_landmarks=[
            "left_hip", "right_hip",
            "left_knee", "right_knee",
            "left_ankle", "right_ankle",
            "left_foot_index", "right_foot_index"
        ],
        metrics=["split_time", "max_velocity", "stride_length", "stride_frequency"],
        validation_rules={
            "min_pose_detection_rate": 0.5,
            "require_linear_motion": True,
        },
        analyzer_type="not_implemented",
        instructions=[
            "Start in blocks or standing start",
            "Sprint at maximum effort through finish",
            "Maintain form through finish line"
        ],
        setup_requirements=[
            "Measured sprint distance (10m, 20m, 40m)",
            "Camera at side angle covering full distance",
            "Starting blocks optional"
        ],
        calibration_required=True,
        calibration_method="Known distance markers in frame"
    ),
}


# =============================================================================
# REGISTRY AND LOOKUP
# =============================================================================

ALL_TESTS = {**SIH_CORE_TESTS, **ELITEZ_EXTENDED_TESTS}


def get_test_definition(test_id: str) -> Optional[TestDefinition]:
    """Get test definition by ID."""
    return ALL_TESTS.get(test_id)


def get_sih_core_tests() -> Dict[str, TestDefinition]:
    """Get all SIH core test definitions."""
    return SIH_CORE_TESTS.copy()


def get_elitez_extended_tests() -> Dict[str, TestDefinition]:
    """Get all Elitez extended test definitions."""
    return ELITEZ_EXTENDED_TESTS.copy()


def get_all_tests() -> Dict[str, TestDefinition]:
    """Get all test definitions."""
    return ALL_TESTS.copy()


def get_tests_by_category(category: TestCategory) -> Dict[str, TestDefinition]:
    """Get tests filtered by category."""
    return {k: v for k, v in ALL_TESTS.items() if v.category == category}


def get_implemented_tests() -> Dict[str, TestDefinition]:
    """Get only tests with implemented analyzers."""
    return {k: v for k, v in ALL_TESTS.items() if v.analyzer_type != "not_implemented"}


def get_test_list_for_api() -> List[Dict[str, Any]]:
    """Get test list formatted for API response."""
    result = []
    for test_id, test_def in ALL_TESTS.items():
        result.append({
            "id": test_id,
            "name": test_def.display_name,
            "category": test_def.category.value,
            "requires_video": test_def.requires_video,
            "ai_analysis_available": test_def.analyzer_type != "not_implemented",
        })
    return result