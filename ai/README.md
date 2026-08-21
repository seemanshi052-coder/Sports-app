# AI/CV Assessment Pipeline

## Offline Model Setup

The assessment pipeline requires a local MediaPipe Pose Landmarker model file (`.task`) for offline inference. This model is **NOT** included in the repository.

### Required Model

- **File**: `pose_landmarker_full.task`
- **Expected location**: `ai/models/pose_landmarker_full.task`
- **Size**: ~8 MB
- **Source**: MediaPipe official models

### Download Instructions

1. Go to the MediaPipe Pose Landmarker model page:
   - https://mediapipe.dev/ace/pose-landmarker
   - Or GitHub: https://github.com/google/mediapipe/blob/master/mediapipe/tasks/vision/pose_landmarker/README.md

2. Download the full model: `pose_landmarker_full.task`

3. Place it in this directory:
   ```
   ai/
   ├── assessment_pipeline.py
   ├── models/
   │   └── pose_landmarker_full.task   <-- HERE
   └── README.md
   ```

### Alternative: Environment Variable

If you cannot place the model at `ai/models/pose_landmarker_full.task`, set the environment variable:

```bash
# Windows PowerShell
$env:POSE_LANDMARKER_MODEL_PATH = "C:\path\to\pose_landmarker_full.task"

# Linux/macOS
export POSE_LANDMARKER_MODEL_PATH="/path/to/pose_landmarker_full.task"
```

### Verification

After placing the model, test the pipeline:

```bash
python -c "
from ai.assessment_pipeline import AssessmentPipeline
p = AssessmentPipeline()
print('Pipeline initialized successfully')
print('Model path resolved:', p._resolved_model_path)
"
```

If the model is missing, you will see a clear error:

```
FileNotFoundError: MediaPipe Pose Landmarker model not found.
Expected at: ai/models/pose_landmarker_full.task
Download from: https://mediapipe.dev/ace/pose-landmarker
Set environment variable: POSE_LANDMARKER_MODEL_PATH=/path/to/pose_landmarker_full.task
```

### Offline Verification

Once the model is in place, the pipeline runs entirely offline:

- No HTTP requests
- No cloud AI calls
- No model downloads
- No remote inference
- No Supabase/Ollama dependency

All inference uses: LOCAL VIDEO + LOCAL MODEL + LOCAL PYTHON PACKAGES

### Notes

- Do NOT commit the `.task` file to Git (binary, large, licensing)
- The model must match MediaPipe 1.0.1 Tasks API
- Use `pose_landmarker_full.task` (not `lite` or `heavy` variants unless tested)
- Windows paths with spaces are supported