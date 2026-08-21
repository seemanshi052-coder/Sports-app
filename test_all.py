from ai.assessment_pipeline import analyze_video
import logging
logging.basicConfig(level=logging.WARNING)

for test_video, atype in [
    ('test_videos/squat.mp4', 'squat'),
    ('test_videos/push_up.mp4', 'push_up'),
    ('test_videos/vertical_jump.mp4', 'vertical_jump'),
    ('test_videos/sit_up.mp4', 'sit_up'),
]:
    print('=== %s / %s ===' % (test_video, atype))
    result = analyze_video(test_video, atype)
    print('  success:', result.success)
    print('  status:', result.status.value)
    print('  error:', result.error)
    print('  confidence_score:', result.confidence_score)
    print('  overall_score:', result.overall_score)
    print('  metrics:', result.metrics)
    print('  biomechanics:', result.biomechanics)
    print()