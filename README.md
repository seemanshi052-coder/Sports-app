# The Elitez — Sports Talent Assessment Platform

Problem Statement ID: 25073

Problem Statement Title: AI-Powered Mobile Platform for Democratizing Sports Talent Assessment

## 1. Project Goal

Build a mobile-first sports talent assessment platform that allows athletes to perform standardized assessments, submit videos, receive AI-assisted performance analysis, and view understandable performance results.

A web dashboard can be provided for coaches/scouts.

## 2. Core Product Flow

Athlete:
1. Register/login.
2. Create athlete profile.
3. Select sport and assessment.
4. Record or upload a video.
5. Submit the assessment.
6. Backend stores assessment metadata and video reference.
7. AI pipeline processes the video.
8. Performance metrics are calculated.
9. Score/result is stored.
10. Mobile app displays the result and improvement areas.

Coach/scout:
1. Login.
2. View athletes.
3. View assessments.
4. Compare performance.
5. Review rankings/leaderboards.

## 3. Architecture

```text
                    ATHLETE
                       |
                       v
                Flutter Mobile App
                       |
                    HTTPS/REST
                       |
                       v
                 FastAPI Backend
                       |
          +------------+-------------+
          |            |             |
          v            v             v
      Supabase       AI/CV        Supabase
       Auth        Processing      Storage
          |            |             |
          v            v             v
      Identity     MediaPipe       Videos
      + JWT        OpenCV          Images
          |
          v
      PostgreSQL
          |
          v
   Assessment Results
          |
          v
     Flutter App


                    COACH/SCOUT
                       |
                       v
               Web Dashboard
                 (Lovable)
                       |
                    HTTPS/REST
                       |
                       v
                 Same FastAPI
                 + Same Supabase
```

## 4. Technology Stack

### Mobile
- Flutter
- Dart

### Backend
- Python
- FastAPI
- Pydantic

### Data/platform
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

### AI/computer vision
- Python
- OpenCV
- MediaPipe
- scikit-learn only when a learned model is justified
- YOLO only if object detection is actually required

### Collaboration
- Git
- GitHub
- Pull Requests
- GitHub Actions

### Development assistants
- Antigravity for coding/debugging/testing assistance
- Lovable for the coach/scout web dashboard

### Deployment
- Docker
- Docker Compose for local multi-service development

## 5. Non-Negotiable Team Rule

> NO FEATURE IS COMPLETE UNTIL IT WORKS END-TO-END.

A feature must be connected through the relevant layers:

```text
UI
 -> API
 -> Backend
 -> Database/Storage/AI
 -> Response
 -> UI
```

## 6. Repository Structure

```text
sports-talent-platform/
├── mobile/
├── backend/
├── ai/
├── web-dashboard/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 7. Development Strategy

Do not permanently divide the project into:
- frontend person
- backend person
- AI person
- database person

Instead, develop vertical feature slices.

Example:

```text
Authentication
  Flutter + FastAPI/Supabase + testing

Athlete Profile
  Flutter + API + PostgreSQL + testing

Video Assessment
  Flutter + Storage + API + AI + PostgreSQL + testing

Results
  API + database + Flutter + testing
```

Technical ownership still exists:
- Mobile standards owner
- Backend standards owner
- AI standards owner
- Integration/DevOps owner

But nobody works in isolation.

## 8. MVP Scope

### Required
- Authentication
- Athlete profile
- Sport/assessment selection
- Video upload
- Assessment processing
- AI-assisted metrics
- Performance score
- Results dashboard
- Basic leaderboard
- Coach/scout dashboard

### Later
- Personalized training plans
- Advanced athlete comparison
- Progress analytics
- Talent discovery
- Notifications
- More sports
- More assessment types

## 9. What We Will Not Build Initially

Do not add these unless requirements force us to:
- Kubernetes
- Kafka
- Microservices
- Complex event-driven architecture
- Redis cluster
- Custom foundation models
- Large custom deep-learning training pipelines

The first objective is a reliable integrated MVP.

## 10. Documentation

Read these files before making architectural changes:

- `docs/PROJECT.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACT.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/AI_PIPELINE.md`
- `docs/GIT_WORKFLOW.md`
- `docs/CONTRIBUTING.md`
