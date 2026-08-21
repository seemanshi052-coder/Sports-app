"""
Fitness Test Analyzers Registry - Integrates test-specific analyzers with the CV pipeline.
"""

import logging
from typing import Dict, Any, List, Optional

from ai.fitness_tests.test_definitions import (
    get_test_definition, 
    get_implemented_tests,
    get_test_list_for_api,
    get_sih_core_tests,
    get_elitez_extended_tests,
    get_tests_by_category,
    get_all_tests,
    get_test_definition,
    TestDefinition,
    TestCategory,
)
from ai.fitness_tests.vertical_jump_analyzer import (
    analyze_vertical_jump,
    VerticalJumpResult,
)
from ai.fitness_tests.squat_analyzer import (
    analyze_squat,
    SquatResult,
)
from ai.fitness_tests.push_up_analyzer import (
    analyze_push_up,
    PushUpResult,
)
from ai.fitness_tests.sit_up_analyzer import (
    analyze_sit_up,
    SitUpResult,
)

logger = logging.getLogger(__name__)


class FitnessTestAnalyzer:
    """
    Main entry point for fitness test analysis.
    Routes assessment types to their specific analyzers.
    """
    
    def __init__(self):
        self.analyzers = {
            "vertical_jump": self._analyze_vertical_jump,
            "squat": self._analyze_squat,
            "push_up": self._analyze_push_up,
            "sit_up": self._analyze_sit_up,
        }
    
    def analyze(
        self,
        assessment_type: str,
        landmarks_history: List[Dict[str, Any]],
        fps: float,
        video_metadata: Dict[str, Any],
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Analyze a fitness test video.
        
        Args:
            assessment_type: The test type ID (e.g., "vertical_jump")
            landmarks_history: Landmark frames from assessment_pipeline
            fps: Video frames per second
            video_metadata: Video metadata
            calibration_available: Whether calibration is available
            calibration_factor: Calibration factor (pixels per cm)
            
        Returns:
            Analysis result dictionary compatible with existing pipeline
        """
        analyzer = self.analyzers.get(assessment_type)
        
        if not analyzer:
            logger.warning(f"No analyzer for assessment type: {assessment_type}")
            return self._unsupported_test_result(assessment_type)
        
        try:
            result = analyzer(
                landmarks_history=landmarks_history,
                fps=fps,
                video_metadata=video_metadata,
                calibration_available=calibration_available,
                calibration_factor=calibration_factor,
            )
            return self._result_to_pipeline_format(result, assessment_type)
        except Exception as e:
            logger.exception(f"Error analyzing {assessment_type}: {e}")
            return self._error_result(assessment_type, str(e))
    
    def _analyze_vertical_jump(
        self,
        landmarks_history: List[Dict[str, Any]],
        fps: float,
        video_metadata: Dict[str, Any],
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
    ) -> VerticalJumpResult:
        """Analyze vertical jump."""
        return analyze_vertical_jump(
            landmarks_history=landmarks_history,
            fps=fps,
            video_metadata=video_metadata,
            calibration_available=calibration_available,
            calibration_factor=calibration_factor,
        )
    
    def _analyze_squat(
        self,
        landmarks_history: List[Dict[str, Any]],
        fps: float,
        video_metadata: Dict[str, Any],
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
    ) -> SquatResult:
        """Analyze squat."""
        return analyze_squat(
            landmarks_history=landmarks_history,
            fps=fps,
            video_metadata=video_metadata,
            calibration_available=calibration_available,
            calibration_factor=calibration_factor,
        )
    
    def _analyze_push_up(
        self,
        landmarks_history: List[Dict[str, Any]],
        fps: float,
        video_metadata: Dict[str, Any],
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
    ) -> PushUpResult:
        """Analyze push-up."""
        return analyze_push_up(
            landmarks_history=landmarks_history,
            fps=fps,
            video_metadata=video_metadata,
            calibration_available=calibration_available,
            calibration_factor=calibration_factor,
        )
    
    def _analyze_sit_up(
        self,
        landmarks_history: List[Dict[str, Any]],
        fps: float,
        video_metadata: Dict[str, Any],
        calibration_available: bool = False,
        calibration_factor: Optional[float] = None,
    ) -> SitUpResult:
        """Analyze sit-up."""
        return analyze_sit_up(
            landmarks_history=landmarks_history,
            fps=fps,
            video_metadata=video_metadata,
            calibration_available=calibration_available,
            calibration_factor=calibration_factor,
        )
    
    def _result_to_pipeline_format(self, result: Any, assessment_type: str) -> Dict[str, Any]:
        """Convert analyzer result to pipeline-compatible format."""
        if not result.success:
            return {
                "success": False,
                "status": "analysis_failed",
                "error": result.error or "Analysis failed",
                "metrics": {"quality_insufficient": True},
                "overall_score": None,
                "confidence_score": None,
                "biomechanics": None,
                "model_version": result.model_version,
            }
        
        # For the main pipeline, we aggregate the best attempt
        valid_attempts = [a for a in result.attempts if a.validity.value == "valid"]
        
        if not valid_attempts:
            return {
                "success": False,
                "status": "no_valid_attempts",
                "error": "No valid attempts detected",
                "metrics": {"quality_insufficient": True},
                "overall_score": None,
                "confidence_score": None,
                "biomechanics": None,
                "model_version": result.model_version,
            }
        
        # Use the best attempt (highest confidence)
        best_attempt = max(valid_attempts, key=lambda a: a.confidence_score or 0)
        
        # Build metrics dict
        metrics = {}
        metrics.update(best_attempt.metrics)
        
        # Add attempt summary
        metrics["attempts_count"] = len(result.attempts)
        metrics["valid_attempts"] = len(valid_attempts)
        metrics["best_attempt_number"] = best_attempt.attempt_number
        
        # Include all attempt data in raw_measurements equivalent
        raw_measurements = {
            "attempts": [
                {
                    "attempt_number": a.attempt_number,
                    "validity": a.validity.value,
                    "metrics": a.metrics,
                    "confidence_score": a.confidence_score,
                    "evidence": a.evidence,
                }
                for a in result.attempts
            ]
        }
        
        return {
            "success": True,
            "status": "completed",
            "error": None,
            "metrics": metrics,
            "raw_measurements": raw_measurements,
            "biomechanics": {
                "test_type": assessment_type,
                "attempts": len(result.attempts),
                "valid_attempts": len(valid_attempts),
            },
            "overall_score": None,  # Always None per rules
            "confidence_score": result.confidence_score,
            "model_version": result.model_version,
        }
    
    def _unsupported_test_result(self, assessment_type: str) -> Dict[str, Any]:
        """Result for unsupported test types."""
        return {
            "success": False,
            "status": "analyzer_not_implemented",
            "error": f"Analyzer not implemented for {assessment_type}",
            "metrics": {"analyzer_not_implemented": True},
            "overall_score": None,
            "confidence_score": None,
            "biomechanics": None,
            "model_version": "cv-fitness-v1",
        }
    
    def _error_result(self, assessment_type: str, error: str) -> Dict[str, Any]:
        """Result for analysis errors."""
        return {
            "success": False,
            "status": "analysis_error",
            "error": f"Analysis error for {assessment_type}: {error}",
            "metrics": {"analysis_error": True},
            "overall_score": None,
            "confidence_score": None,
            "biomechanics": None,
            "model_version": "cv-fitness-v1",
        }


# Global analyzer instance
_fitness_analyzer = None


def get_fitness_analyzer() -> FitnessTestAnalyzer:
    """Get or create the global fitness test analyzer."""
    global _fitness_analyzer
    if _fitness_analyzer is None:
        _fitness_analyzer = FitnessTestAnalyzer()
    return _fitness_analyzer


def analyze_fitness_test(
    assessment_type: str,
    landmarks_history: List[Dict[str, Any]],
    fps: float,
    video_metadata: Dict[str, Any],
    calibration_available: bool = False,
    calibration_factor: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Main entry point for fitness test analysis from the assessment pipeline.
    
    This function is called by assessment_pipeline._determine_sport_metrics()
    when the assessment_type matches a fitness test.
    """
    analyzer = get_fitness_analyzer()
    return analyzer.analyze(
        assessment_type=assessment_type,
        landmarks_history=landmarks_history,
        fps=fps,
        video_metadata=video_metadata,
        calibration_available=calibration_available,
        calibration_factor=calibration_factor,
    )


def is_fitness_test(assessment_type: str) -> bool:
    """Check if an assessment type is a fitness test."""
    return assessment_type in get_implemented_tests()


def get_fitness_test_definitions() -> List[Dict[str, Any]]:
    """Get all fitness test definitions for API."""
    return get_test_list_for_api()


# Re-export test definition functions for external use
__all__ = [
    "FitnessTestAnalyzer",
    "get_fitness_analyzer",
    "analyze_fitness_test",
    "is_fitness_test",
    "get_fitness_test_definitions",
    "get_test_list_for_api",
    "get_sih_core_tests",
    "get_elitez_extended_tests",
    "get_implemented_tests",
    "get_tests_by_category",
    "get_all_tests",
    "get_test_definition",
    "analyze_vertical_jump",
    "VerticalJumpResult",
    "analyze_squat",
    "SquatResult",
    "analyze_push_up",
    "PushUpResult",
    "analyze_sit_up",
    "SitUpResult",
    "TestDefinition",
    "TestCategory",
]