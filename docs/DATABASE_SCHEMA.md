# DATABASE_SCHEMA.md

## 1. Purpose

This document describes the structured information stored in PostgreSQL.

The schema below is the initial design. It must be reviewed against the final problem requirements before production implementation.

## 2. Storage Rule

Use PostgreSQL for structured data.

Use object storage for files.

```text
PostgreSQL:
- IDs
- names
- metadata
- statuses
- scores
- relationships
- timestamps

Storage:
- videos
- images
- large media files
```

## 3. Users

Authentication identity is handled by the chosen authentication system.

Application-specific profile data should be stored separately.

### profiles

Suggested fields:

```text
id
auth_user_id
name
role
created_at
updated_at
```

`auth_user_id` links the application profile to the authenticated identity.

Roles may include:

```text
athlete
coach
scout
admin
```

Only include roles actually required by the final product.

## 4. Athlete Profiles

### athlete_profiles

Suggested fields:

```text
id
profile_id
date_of_birth_or_age_if_approved
height_cm
weight_kg
primary_sport_id
position
experience_level
created_at
updated_at
```

Do not collect sensitive demographic information unless it has a clear product/legal purpose.

## 5. Sports

### sports

Suggested fields:

```text
id
name
description
is_active
created_at
```

Examples:

```text
football
cricket
basketball
athletics
```

The actual supported sports list must come from the final product scope.

## 6. Assessment Definitions

### assessment_types

Suggested fields:

```text
id
sport_id
name
description
instructions
version
is_active
created_at
updated_at
```

An assessment definition describes what an athlete is being asked to perform.

## 7. Assessments

### assessments

Suggested fields:

```text
id
athlete_id
assessment_type_id
video_storage_path
status
started_at
completed_at
overall_score
confidence_score
error_message
created_at
updated_at
```

Suggested status values:

```text
created
uploading
uploaded
queued
processing
completed
failed
```

Do not store the actual video binary in this table.

Store a storage path/reference.

## 8. Assessment Metrics

### assessment_metrics

Suggested fields:

```text
id
assessment_id
metric_name
metric_value
unit
normalized_value
score
confidence
created_at
```

This flexible structure can be used initially.

If the final project has stable metrics, strongly typed columns may be preferable.

Example:

```text
speed
stride_length
knee_angle
body_angle
reaction_time
```

Only metrics supported by the assessment should be added.

## 9. Assessment Results

Depending on the final design, results can be stored directly on `assessments` or in a separate result table.

Possible:

### assessment_results

```text
id
assessment_id
overall_score
summary
strengths
improvement_areas
model_version
created_at
```

## 10. Training Recommendations

### training_recommendations

Suggested fields:

```text
id
athlete_id
assessment_id
title
description
priority
created_at
```

Recommendations must be traceable to an assessment when possible.

## 11. Relationships

```text
auth_user
    |
    v
profile
    |
    v
athlete_profile
    |
    +------> sports
    |
    +------> assessments
                |
                +------> assessment_type
                |
                +------> assessment_metrics
                |
                +------> assessment_result
                |
                +------> training_recommendations
```

## 12. Important Database Rules

1. Every table should have a stable primary key.
2. Use foreign keys for relationships.
3. Add timestamps.
4. Add indexes based on real query patterns.
5. Do not store passwords ourselves when using managed authentication.
6. Do not store service-role secrets in tables.
7. Do not store video binary inside ordinary relational records.
8. Use migrations for schema changes.
9. Do not manually modify production tables without documenting the migration.
