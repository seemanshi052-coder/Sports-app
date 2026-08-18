# API_CONTRACT.md

## 1. Purpose

This document is the agreement between clients and the backend.

The Flutter app and Lovable dashboard must use these contracts rather than guessing response formats.

## 2. Base URL

Development:

```text
http://localhost:8000
```

API prefix:

```text
/api/v1
```

Swagger:

```text
/docs
```

OpenAPI schema:

```text
/openapi.json
```

Production URLs will be configured later.

## 3. Standard Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

## 4. Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Human-readable error message"
  }
}
```

## 5. Authentication

Protected requests should send the authenticated user's access token according to the final authentication implementation.

Example:

```text
Authorization: Bearer <access_token>
```

Never put tokens in query parameters.

## 6. Authentication Endpoints

### POST /api/v1/auth/register

Purpose:
Create an authenticated user.

Example request:

```json
{
  "email": "athlete@example.com",
  "password": "example-password",
  "name": "Example Athlete"
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "user_id": "USER_ID"
  },
  "message": "Registration successful"
}
```

### POST /api/v1/auth/login

Purpose:
Authenticate a user.

Example request:

```json
{
  "email": "athlete@example.com",
  "password": "example-password"
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "access_token": "ACCESS_TOKEN",
    "token_type": "bearer",
    "user": {
      "id": "USER_ID",
      "email": "athlete@example.com"
    }
  },
  "message": "Login successful"
}
```

The exact response may be adjusted to match the chosen Supabase Auth integration.

## 7. Athlete Profile

### GET /api/v1/athletes/me

Purpose:
Return the current athlete profile.

### PUT /api/v1/athletes/me

Purpose:
Create/update athlete profile fields.

Example:

```json
{
  "name": "Example Athlete",
  "age": 20,
  "height_cm": 178,
  "weight_kg": 70,
  "sport": "football",
  "position": "winger"
}
```

## 8. Assessments

### POST /api/v1/assessments

Purpose:
Create a new assessment.

Example:

```json
{
  "sport": "football",
  "assessment_type": "sprint",
  "video_path": "assessments/USER_ID/VIDEO_ID.mp4"
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "assessment_id": "A123",
    "status": "processing"
  },
  "message": "Assessment created"
}
```

### GET /api/v1/assessments/{assessment_id}

Purpose:
Return one assessment and its current state/result.

Example:

```json
{
  "success": true,
  "data": {
    "assessment_id": "A123",
    "status": "completed",
    "overall_score": 82,
    "metrics": {
      "speed_score": 88,
      "agility_score": 79,
      "technique_score": 84,
      "consistency_score": 76
    }
  },
  "message": "Assessment retrieved"
}
```

These metric names are placeholders until the assessment design is finalized.

## 9. Video Upload

The exact upload mechanism should be chosen during implementation.

Preferred concept:

```text
Client
 -> authenticated upload to Storage
 -> obtain file path/reference
 -> call assessment API with file reference
```

Do not send very large video files through JSON.

## 10. Leaderboard

### GET /api/v1/leaderboard

Purpose:
Return ranking data according to the approved leaderboard definition.

Possible query parameters:

```text
sport
assessment_type
page
limit
```

Example response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rank": 1,
        "athlete_id": "A1",
        "display_name": "Athlete One",
        "score": 94
      }
    ],
    "page": 1,
    "limit": 20
  },
  "message": "Leaderboard retrieved"
}
```

## 11. API Rules

1. Do not change a response field casually.
2. If a breaking change is required, discuss it with the team first.
3. Add validation to all user-controlled input.
4. Return meaningful HTTP status codes.
5. Do not return internal stack traces to clients.
6. Never expose secrets.
7. Document every new endpoint.
8. Add at least one API test for important business behavior.
