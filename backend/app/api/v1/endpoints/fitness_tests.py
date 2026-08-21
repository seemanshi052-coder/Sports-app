from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.sport import AssessmentType

router = APIRouter()


@router.get("", response_model=List[dict])
async def get_fitness_tests(db: Session = Depends(get_db)):
    """
    Get all available fitness test definitions (SIH Core + Elitez Extended).
    Returns test definitions from the centralized fitness test taxonomy.
    """
    from ai.fitness_tests import get_test_list_for_api
    
    test_list = get_test_list_for_api()
    
    # Enrich with database assessment types if they exist
    db_types = {at.id: at for at in db.query(AssessmentType).all()}
    
    for test in test_list:
        if test["id"] in db_types:
            db_type = db_types[test["id"]]
            test["db_duration_sec"] = db_type.duration_sec
            test["db_camera_angle"] = db_type.camera_angle
            test["db_metrics_measured"] = db_type.metrics_measured or []
            test["db_instructions"] = db_type.instructions or []
            test["db_requirements"] = db_type.requirements or []
    
    return test_list


@router.get("/sih-core", response_model=List[dict])
async def get_sih_core_tests():
    """Get SIH Core fitness tests only."""
    from ai.fitness_tests import get_sih_core_tests
    
    sih_tests = get_sih_core_tests()
    result = []
    for test_id, test_def in sih_tests.items():
        result.append({
            "id": test_id,
            "name": test_def.display_name,
            "category": test_def.category.value,
            "requires_video": test_def.requires_video,
            "required_duration_sec": test_def.required_duration_sec,
            "required_landmarks": test_def.required_landmarks,
            "metrics": test_def.metrics,
            "validation_rules": test_def.validation_rules,
            "analyzer_type": test_def.analyzer_type,
            "instructions": test_def.instructions,
            "setup_requirements": test_def.setup_requirements,
            "calibration_required": test_def.calibration_required,
            "calibration_method": test_def.calibration_method,
            "ai_analysis_available": test_def.analyzer_type != "not_implemented",
        })
    return result


@router.get("/elitez-extended", response_model=List[dict])
async def get_elitez_extended_tests():
    """Get Elitez Extended fitness tests only."""
    from ai.fitness_tests import get_elitez_extended_tests
    
    elitez_tests = get_elitez_extended_tests()
    result = []
    for test_id, test_def in elitez_tests.items():
        result.append({
            "id": test_id,
            "name": test_def.display_name,
            "category": test_def.category.value,
            "requires_video": test_def.requires_video,
            "required_duration_sec": test_def.required_duration_sec,
            "required_landmarks": test_def.required_landmarks,
            "metrics": test_def.metrics,
            "validation_rules": test_def.validation_rules,
            "analyzer_type": test_def.analyzer_type,
            "instructions": test_def.instructions,
            "setup_requirements": test_def.setup_requirements,
            "calibration_required": test_def.calibration_required,
            "calibration_method": test_def.calibration_method,
            "ai_analysis_available": test_def.analyzer_type != "not_implemented",
        })
    return result


@router.get("/implemented", response_model=List[dict])
async def get_implemented_tests():
    """Get only tests with implemented AI analyzers."""
    from ai.fitness_tests import get_implemented_tests
    
    impl_tests = get_implemented_tests()
    result = []
    for test_id, test_def in impl_tests.items():
        result.append({
            "id": test_id,
            "name": test_def.display_name,
            "category": test_def.category.value,
            "requires_video": test_def.requires_video,
            "ai_analysis_available": True,
        })
    return result


@router.get("/elitez-core", response_model=List[dict])
async def get_elitez_core_tests():
    """
    Get the active Elitez core assessment battery.
    
    These are the 4 tests that have AI analysis implemented:
    - squat
    - push_up
    - sit_up
    - vertical_jump
    
    This is the user-facing active test battery for the Elitez platform.
    """
    from ai.fitness_tests import get_test_definition, TestCategory
    
    elitez_core_ids = ["squat", "push_up", "sit_up", "vertical_jump"]
    result = []
    
    for test_id in elitez_core_ids:
        test_def = get_test_definition(test_id)
        if test_def and test_def.category in [TestCategory.SIH_CORE, TestCategory.ELITEZ_EXTENDED]:
            result.append({
                "id": test_id,
                "name": test_def.display_name,
                "ai_analysis_available": test_def.analyzer_type != "not_implemented",
                "category": test_def.category.value,
                "requires_video": test_def.requires_video,
                "required_duration_sec": test_def.required_duration_sec,
            })
    
    return result