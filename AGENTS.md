# THE ELITEZ — DEVELOPMENT RULES

## Core Rule

Never modify unrelated files.

Never redesign the architecture unless explicitly instructed.

Never delete existing functionality without explicit approval.

Never replace working implementations with mock implementations.

Never introduce a new framework when an existing project dependency can solve the problem.

Never rename API response fields without explicit approval.

Never change database contracts without explaining the migration.

Never hardcode secrets or API keys.

Never put service-role credentials in Flutter/mobile code.

Never invent AI scores.

AI assessment results must originate from measurable metrics.

AI-generated coaching text may explain measured results but must not fabricate measurements.

## Assessment

Assessment lifecycle:

created
→ uploading
→ uploaded
→ pending_analysis
→ processing
→ completed
or
failed

Do not mark an assessment completed before the analysis pipeline actually completes.

## Preparation Mode

Preparation and Official Assessment must use the same core assessment engine.

Differentiate them using an explicit assessment mode.

Preparation assessments may contribute to:

- activity
- streak
- XP
- improvement
- personal best
- badges
- leaderboard

Official assessments may additionally support future authority submission.

## AI

Initial AI pipeline:

Video
→ OpenCV
→ MediaPipe
→ landmarks
→ feature extraction
→ metrics
→ scoring
→ confidence/quality
→ result
→ coaching explanation

Do not train a custom model unless explicitly approved.

 ## OFFLINE AI REQUIREMENT

Preparation Mode must be designed to support offline assessment.

The core assessment pipeline must not depend on:
- internet access
- OpenAI API
- cloud LLM
- Supabase availability
- remote inference

Video measurement must be performed locally using on-device/local CV
capabilities.

LLMs are optional and must only provide coaching explanations based on
already-measured metrics.

AI measurement and scoring must remain deterministic and auditable.

When offline:
- assessment results must be stored locally
- XP/streak/badge events must be queued locally
- synchronization must occur when connectivity returns

When online:
- local results synchronize with FastAPI/Supabase
- duplicate synchronization must be prevented using idempotent event IDs.

## Gamification

XP must be idempotent.

Badges must be idempotent.

Streak updates must be idempotent.

Never award duplicate XP for the same event.

## Testing

After every change:

1. run relevant tests
2. run type checking
3. run linting where applicable
4. verify API contracts
5. verify frontend integration

Do not declare success without testing.

## Change Discipline

Before modifying files:

1. explain which files will change
2. explain why
3. implement only those changes
4. report files changed
5. report tests executed
6. report remaining risks

If implementation requires additional files, stop and explain why before expanding scope.

# AGENTS.md — Sports Talent Platform

## Project Overview
Multi-platform sports talent assessment platform:
- **Frontend (Web)**: React 18 + TypeScript + Vite + TailwindCSS — `src/`, `server.ts` (Express dev server)
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + Supabase — `backend/`
- **Mobile**: Flutter 3.x + Dart — `mobile/`
- **AI/CV**: OpenCV + MediaPipe (planned, not yet implemented)
- **Infrastructure**: Supabase (Auth, PostgreSQL, Storage), Docker Compose for local dev

---

## Key Commands

### Frontend (root)
```bash
npm run dev        # Start dev server (Express + Vite) on :3000
npm run build      # Vite build + esbuild server bundle → dist/
npm run start      # Run production build (node dist/server.cjs)
npm run lint       # TypeScript type-check (tsc --noEmit)
```

### Backend (from `backend/`)
```bash
# Requires .env with Supabase credentials
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Or: python -m app.main
```

### Mobile (from `mobile/`)
```bash
flutter pub get
flutter run
```

### Docker (local multi-service)
```bash
docker-compose up --build   # Builds backend, runs on :8000
```

---

## Architecture Essentials

| Component | Responsibility | Key Files |
|-----------|----------------|-----------|
| **Flutter** | Screens, navigation, video recording, API calls, auth state | `mobile/lib/` |
| **FastAPI** | API routes, validation, auth, business logic, AI orchestration, DB | `backend/app/` |
| **Supabase Auth** | User identity, registration, login, JWT tokens | Config in `backend/app/core/config.py` |
| **PostgreSQL** | Structured data (profiles, assessments, metrics, scores) | Models in `backend/app/models/` |
| **Supabase Storage** | Videos, images, large media | Bucket: `assessment-videos` |
| **Lovable** | Coach/scout web dashboard (consumes same API) | External, not in repo |

**Critical Rule**: Both Flutter and Lovable must use the **same FastAPI backend + Supabase**. No duplicate backends.

---

## Development Workflow

### Git Branching (from `docs/GIT_WORKFLOW.md`)
```
main (protected, demo-ready)
  └─ develop (integration branch)
        ├─ feature/auth
        ├─ feature/profile
        ├─ feature/video-upload
        ├─ feature/assessment
        ├─ feature/results
        ├─ feature/leaderboard
        └─ feature/coach-dashboard
```
- Start work: `git checkout develop && git pull && git checkout -b feature/your-feature`
- PR: `feature/* → develop` (requires review + checks)
- Never push directly to `main`

### Feature Development (Vertical Slices)
Per `README.md` and `docs/CONTRIBUTING.md`:
```
Authentication → Flutter + FastAPI/Supabase + testing
Athlete Profile → Flutter + API + PostgreSQL + testing
Video Assessment → Flutter + Storage + API + AI + PostgreSQL + testing
Results → API + database + Flutter + testing
```

### Definition of Done
- UI implemented
- API implemented where required
- DB/storage integrated
- Validation + error handling
- Tests pass
- Integration verified end-to-end
- Documentation updated
- PR reviewed + merged to `develop`

---

## Environment Setup

1. Copy `.env.example` → `.env` and fill in:
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   SUPABASE_STORAGE_BUCKET=assessment-videos
   ENVIRONMENT=development
   ```

2. Frontend dev server proxies to backend on `:8000` (see `server.ts`)

3. Backend health check: `GET http://localhost:8000/health`

4. API docs: `http://localhost:8000/docs` (Swagger), `/openapi.json`

---

## API Contract (from `docs/API_CONTRACT.md`)

- **Base URL**: `http://localhost:8000/api/v1`
- **Auth**: `Authorization: Bearer <access_token>` (Supabase JWT)
- **Success**: `{ "success": true, "data": {}, "message": "..." }`
- **Error**: `{ "success": false, "error": { "code": 400, "message": "..." } }`

### Key Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Create user |
| POST | `/auth/login` | Authenticate |
| GET | `/athletes/me` | Current athlete profile |
| PUT | `/athletes/me` | Update profile |
| POST | `/assessments` | Create assessment (with video path) |
| GET | `/assessments/{id}` | Get assessment + results |
| GET | `/leaderboard` | Rankings (query: sport, page, limit) |
| POST | `/storage/upload-url` | Get signed URL for video upload |

---

## Database (from `docs/DATABASE_SCHEMA.md`)

- **PostgreSQL** for structured data; **Storage** for files
- Key tables: `profiles`, `athlete_profiles`, `sports`, `assessment_types`, `assessments`, `assessment_metrics`, `assessment_results`, `training_recommendations`
- **Never** store video binary in PostgreSQL — use storage path
- Use migrations for schema changes; update `DATABASE_SCHEMA.md` on conceptual changes
- Init script: `backend/app/db/init_db.py` (seeds sports catalog + assessment types)

---

## Non-Negotiable Rules

1. **End-to-end completion**: Feature not done until UI → API → DB/Storage/AI → Response → UI works
2. **No secrets in git**: `.env`, API keys, JWT secrets, service-role keys stay out
3. **API stability**: Don't change response fields casually; discuss breaking changes
4. **Migrations only**: No manual production table edits
5. **Error handling**: Every user action handles loading, success, empty, validation, network, server, processing failure
6. **Vertical slices**: Develop features across layers, not in isolation

---

## Testing Notes

- No formal test suite detected in repo (no `pytest`, `flutter_test` configs found)
- Backend: Manual testing via Swagger (`/docs`) or curl
- Frontend: TypeScript type-check via `npm run lint`
- Mobile: `flutter test` (when tests added)

---

## Important Files Reference

| File | Purpose |
|------|---------|
| `README.md` | Project overview, architecture, MVP scope |
| `docs/ARCHITECTURE.md` | Component responsibilities, request/video flows |
| `docs/API_CONTRACT.md` | Exact endpoint contracts, response formats |
| `docs/DATABASE_SCHEMA.md` | Table definitions, relationships, rules |
| `docs/AI_PIPELINE.md` | Video → metrics → scoring pipeline design |
| `docs/GIT_WORKFLOW.md` | Branching, PR process, commit conventions |
| `docs/CONTRIBUTING.md` | Feature flow, naming, AI tool usage, Lovable rules |
| `docs/PROJECT.md` | Product vision, user journeys, success criteria |
| `backend/app/core/config.py` | Settings, Supabase URL normalization |
| `server.ts` | Express dev server with full API implementation |
| `backend/app/main.py` | FastAPI app entrypoint |

---

## Gotchas

- **Frontend dev server** (`server.ts:3000`) is NOT the FastAPI backend (`:8000`) — both run simultaneously
- **Supabase URL normalization**: Config accepts dashboard URLs (`supabase.com/dashboard/project/xxx`) and converts to API URL (`https://xxx.supabase.co`)
- **Storage bucket**: Must exist (`assessment-videos`) — auto-created on startup if credentials present
- **AI pipeline**: Currently placeholder — returns mock scores; real OpenCV/MediaPipe integration pending
- **Mock data**: `server.ts` uses in-memory stores + Supabase fallback; backend uses real Supabase/PostgreSQL
- **CORS**: Backend allows all origins (`*`) for development