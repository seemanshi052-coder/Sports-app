# AI_PIPELINE.md

## 1. Goal

The AI subsystem should convert an athlete's submitted video into measurable performance information and an understandable assessment result.

The initial goal is NOT to train a giant custom model.

The initial goal is:

```text
Video
 -> reliable preprocessing
 -> pose/object information
 -> measurable features
 -> metrics
 -> validated scoring
 -> understandable result
```

## 2. Proposed Pipeline

```text
                VIDEO
                  |
                  v
          Video Validation
                  |
                  v
          Frame Extraction
              (OpenCV)
                  |
                  v
         Pose/Body Detection
             (MediaPipe)
                  |
                  v
          Body Landmarks
                  |
                  v
        Feature Extraction
                  |
                  v
         Derived Metrics
                  |
                  v
      Scoring / ML Inference
                  |
                  v
       Quality/Confidence Check
                  |
                  v
         Assessment Result
                  |
                  v
             PostgreSQL
```

## 3. OpenCV Responsibilities

OpenCV may be used for:
- reading video files
- extracting frames
- resizing frames
- frame-rate handling
- basic image processing
- validating video properties

OpenCV is not automatically responsible for deciding whether an athlete is talented.

## 4. MediaPipe Responsibilities

MediaPipe can be used to obtain body/pose landmarks.

Conceptually:

```text
Frame
  |
  v
MediaPipe
  |
  v
Body landmarks
  |
  +-- shoulder
  +-- elbow
  +-- wrist
  +-- hip
  +-- knee
  +-- ankle
  ...
```

The exact landmarks and model configuration depend on the final implementation.

## 5. Feature Extraction

Landmarks are not the final performance metrics.

We may derive:

```text
angles
distances
relative positions
movement ranges
temporal changes
velocity-like quantities
consistency measures
```

The exact feature set must be defined per sport and assessment.

## 6. Scoring

Separate these concepts:

### Raw measurement

Example:

```text
time = 4.8 seconds
```

### Derived metric

Example:

```text
average_stride_length = ...
```

### Normalized metric

Example:

```text
normalized_speed = ...
```

### Component score

Example:

```text
speed_score = 88
```

### Overall score

Example:

```text
overall_score = ...
```

Do not invent weights until the product team validates them.

## 7. Confidence and Quality

A model confidence score is not automatically the same thing as athlete performance confidence.

Track video/measurement quality separately where possible.

Examples:

```text
pose_detection_quality
video_quality
frame_coverage
assessment_confidence
```

## 8. AI Versioning

Every generated assessment should be traceable to the version of the AI/scoring logic used.

Example:

```text
model_version = "assessment-v1.0"
```

If scoring changes later, old assessments should remain explainable.

## 9. Custom ML

Use custom ML only if it provides clear value.

Possible uses:
- prediction from extracted features
- classification
- regression
- athlete similarity
- ranking support

Do not train a custom model merely to claim that the application uses AI.

## 10. Fairness

Sports assessment can be sensitive to:
- camera angle
- lighting
- clothing
- device quality
- athlete height/body proportions
- environment
- recording distance

The team should document limitations and avoid claiming that the system is an objective replacement for professional assessment.

## 11. AI Testing

Test with:
- controlled videos
- different lighting
- different distances
- different camera angles
- incomplete poses
- poor-quality videos
- invalid files

The system should fail safely when analysis quality is insufficient.
