# PROJECT.md

## 1. Project Identity

**Problem Statement ID:** 25073

**Problem Statement Title:** AI-Powered Mobile Platform for Democratizing Sports Talent Assessment

## 2. Problem

Traditional sports talent assessment can depend heavily on access to coaches, academies, geography, infrastructure, and subjective evaluation.

The proposed platform aims to make structured sports assessment more accessible by allowing athletes to perform defined assessments using a mobile device and receive consistent, AI-assisted feedback.

## 3. Product Vision

Create a platform where an athlete can:

1. Create a profile.
2. Select a sport.
3. Select an assessment.
4. Record/upload a video.
5. Receive measurable performance metrics.
6. Receive an overall score.
7. Understand strengths and weaknesses.
8. Track progress over time.

A coach/scout can:

1. View athletes.
2. Review assessments.
3. Compare athletes.
4. Review performance trends.
5. Discover promising talent.

## 4. Important Product Principle

The system should not present an unexplained number such as:

`Score = 82`

It should aim to provide:

```text
Overall Score: 82

Speed: 88
Agility: 79
Technique: 84
Consistency: 76

Strength:
- Strong acceleration

Improvement:
- Improve change-of-direction efficiency
```

The exact metrics and scoring formula must be validated against the final assessment requirements.

## 5. Target Users

### Athlete
The athlete is the primary mobile user.

### Coach/Scout
The coach/scout reviews athlete performance through the web dashboard.

### Administrator
An administrator may be introduced later for managing sports, assessment definitions, benchmarks, or platform content.

## 6. MVP User Journey

```text
Open app
  |
  v
Register/Login
  |
  v
Create Athlete Profile
  |
  v
Choose Sport
  |
  v
Choose Assessment
  |
  v
Record/Upload Video
  |
  v
Submit
  |
  v
Processing
  |
  v
AI/CV Analysis
  |
  v
Metrics
  |
  v
Score
  |
  v
Results
  |
  v
Progress/Leaderboard
```

## 7. Product Rules

1. Every important action must have clear loading, success, and error states.
2. The user must never be shown an assessment result without knowing whether processing is complete.
3. AI output should be traceable to measurable metrics wherever possible.
4. The system must distinguish between raw measurements, derived metrics, and final scores.
5. Videos must be stored in object storage, not as binary blobs inside ordinary relational tables.
6. Secrets must never be committed to GitHub.
7. APIs must have explicit request and response contracts.
8. Frontend and backend must integrate continuously.
9. Mock data may be used during development, but the API contract should remain stable.
10. A feature is complete only when its end-to-end flow works.

## 8. MVP Success Criteria

The demo should be able to show:

```text
Athlete logs in
 -> selects assessment
 -> uploads/records video
 -> receives processing state
 -> AI pipeline processes sample
 -> result appears
 -> coach/scout can see result
```

## 9. Decisions Requiring Validation

The team must explicitly validate:
- exact sports supported
- exact assessment types
- required athlete demographics
- benchmark data
- scoring formula
- whether gender/age normalization is appropriate
- fairness and bias considerations
- whether the selected camera/video setup is sufficient
- AI confidence methodology
