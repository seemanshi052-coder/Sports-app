# ARCHITECTURE.md

## 1. Purpose

This document explains where each major part of the system lives and how components communicate.

## 2. High-Level Architecture

```text
                         +----------------+
                         |    ATHLETE     |
                         +-------+--------+
                                 |
                                 v
                       +--------------------+
                       | Flutter Mobile App |
                       +---------+----------+
                                 |
                              HTTPS
                                 |
                                 v
                       +--------------------+
                       |  FastAPI Backend  |
                       +---------+----------+
                                 |
          +----------------------+----------------------+
          |                      |                      |
          v                      v                      v
 +----------------+    +------------------+    +----------------+
 | Supabase Auth  |    | AI/CV Pipeline   |    | Supabase      |
 |                |    |                  |    | Storage        |
 +-------+--------+    | OpenCV           |    +-------+--------+
         |             | MediaPipe        |            |
         |             | Scoring/ML       |            |
         |             +--------+---------+            |
         |                      |                      |
         +----------------------+----------------------+
                                |
                                v
                       +--------------------+
                       | PostgreSQL Database|
                       +---------+----------+
                                 |
                                 v
                       Assessment Results
                                 |
                                 v
                         Flutter / Web UI


                         +----------------+
                         | COACH / SCOUT  |
                         +-------+--------+
                                 |
                                 v
                       +--------------------+
                       | Lovable Web App    |
                       +---------+----------+
                                 |
                              HTTPS
                                 |
                                 v
                         Same FastAPI API
                         Same Supabase
```

## 3. Component Responsibilities

### Flutter

Responsible for:
- screens
- navigation
- forms
- video selection/recording
- API calls
- authentication state
- displaying assessment results
- displaying loading/error states

Flutter must NOT contain:
- database credentials
- service-role Supabase keys
- AI scoring secrets
- business-critical scoring logic that must be protected

### FastAPI

Responsible for:
- API routes
- request validation
- authorization
- business logic
- assessment orchestration
- calling AI services
- reading/writing application data
- returning stable JSON responses

### Supabase Auth

Responsible for:
- user identity
- registration/login
- session/token handling
- password-related authentication workflows

### PostgreSQL

Responsible for structured relational data:
- users/profile metadata
- sports
- assessments
- assessment metrics
- scores
- recommendations
- relationships

### Supabase Storage

Responsible for files:
- assessment videos
- profile images
- other uploaded media

### AI/CV

Responsible for:
- video preprocessing
- pose landmark extraction
- feature extraction
- measurable metrics
- scoring/model inference
- confidence/quality indicators

### Lovable

Responsible for:
- coach/scout web interface
- dashboards
- charts
- athlete tables
- assessment review

Lovable must consume the same backend/data contract instead of creating an independent system.

## 4. Request Flow

Example: athlete requests assessment results.

```text
Flutter
  |
  | GET /api/v1/assessments/A123
  v
FastAPI
  |
  | authenticate user
  | authorize access
  | fetch assessment
  v
PostgreSQL
  |
  | result
  v
FastAPI
  |
  | JSON
  v
Flutter
```

## 5. Video Flow

```text
Flutter
  |
  | Upload video
  v
Storage
  |
  | file URL/path
  v
FastAPI
  |
  | create assessment
  v
PostgreSQL
  |
  | processing status
  v
AI Pipeline
  |
  | metrics
  v
FastAPI
  |
  | save result
  v
PostgreSQL
  |
  | completed
  v
Flutter
```

## 6. Why We Use One Backend

Flutter and the web dashboard must not implement separate business logic.

Correct:

```text
Flutter ----\
              \
               -> FastAPI -> Supabase
              /
Lovable -----/
```

Incorrect:

```text
Flutter -> Backend A -> Database A

Lovable -> Backend B -> Database B
```

The second architecture creates duplicate logic and integration problems.

## 7. Environments

The project should eventually have:

```text
Development
Staging
Production
```

For the initial hackathon, development and a controlled demo environment are sufficient.

## 8. Configuration

Configuration comes from environment variables.

Never hardcode:
- passwords
- API keys
- JWT secrets
- service-role keys
- private credentials

See `.env.example` in the repository root.
