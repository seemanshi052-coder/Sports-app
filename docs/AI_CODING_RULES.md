# AI CODING RULES

## 1. PROJECT AUTHORITY

This repository is the authoritative source of truth.

Never create a replacement architecture.

Never create a second application.

Never create a second backend.

Never create a second database.

Never create a second authentication system.

Never replace Flutter with native Android.

Never replace FastAPI with another backend framework.

Never replace Supabase PostgreSQL with Room, SQLite, Firebase, or another database.

---

## 2. TECHNOLOGY STACK

Mobile:
Flutter + Dart

Backend:
Python + FastAPI + Pydantic

Database:
Supabase PostgreSQL

Authentication:
Supabase Auth

File storage:
Supabase Storage

AI/CV:
Python + OpenCV + MediaPipe + appropriate open-source ML libraries/models

Web:
Lovable-generated frontend

API:
FastAPI REST API

Version control:
Git + GitHub

---

## 3. SINGLE DATABASE RULE

There is exactly ONE application database.

Supabase PostgreSQL is the source of truth.

Flutter must not create a second application database.

Lovable must not create a second application database.

AI must not create a second application database.

---

## 4. SINGLE AUTHENTICATION RULE

Supabase Auth is the authentication provider.

Do not implement a separate authentication database.

Do not create custom password storage.

Do not create fake authentication.

Do not hardcode users.

---

## 5. NO MOCK DATA

Production features must never use:

- fake users
- fake API responses
- hardcoded assessment results
- fake leaderboard data
- fake AI scores
- simulated backend responses

If the backend does not exist yet:

STOP.

Report the missing backend contract.

Do not invent one.

---

## 6. MOBILE ARCHITECTURE

The mobile application is Flutter/Dart.

Never introduce:

- Kotlin application architecture
- Jetpack Compose
- Room
- Retrofit
- Android ViewModels as the main architecture

Android-specific native code may only be introduced when required by a Flutter plugin/platform integration.

---

## 7. AI ARCHITECTURE

AI/CV processing belongs in /ai and/or backend services.

Never place production AI scoring logic inside Flutter.

Never use mock pose detection.

Never use hardcoded AI results.

---

## 8. WEB ARCHITECTURE

The web dashboard is a client of the same FastAPI backend.

It must use:

FastAPI
+
Supabase

It must not create its own backend or database.

---

## 9. API CONTRACT

Before creating an API call:

Read:

docs/API_CONTRACT.md

Do not invent endpoint names or response formats.

If an endpoint is missing, update the contract before implementation.

---

## 10. DATABASE CONTRACT

Before creating database operations:

Read:

docs/DATABASE_SCHEMA.md

Do not invent tables casually.

Do not change existing schema without documenting the change.

---

## 11. ARCHITECTURE CHANGES

If a proposed change affects:

- database
- authentication
- API contract
- project architecture
- AI architecture

STOP and explain the proposed change before implementing it.

---

## 12. VERTICAL FEATURES

Features must be implemented end-to-end.

A feature is not complete until:

UI
→ API
→ backend
→ database/storage/AI
→ response
→ UI

works with real data.

---

## 13. TESTING

Every important backend feature requires tests.

Every completed vertical feature must be manually verified end-to-end.

Do not claim a feature is complete merely because the code compiles.

---

## 14. EXISTING DESIGN

The Google AI Studio Android project is a DESIGN REFERENCE ONLY.

Its UI may inspire the Flutter implementation.

Its architecture must NOT be copied.

Its Kotlin code must NOT be copied into the Flutter application.

---

## 15. WHEN UNCERTAIN

Do not guess.

First inspect:

README.md
docs/PROJECT.md
docs/ARCHITECTURE.md
docs/API_CONTRACT.md
docs/DATABASE_SCHEMA.md
docs/AI_PIPELINE.md
docs/GIT_WORKFLOW.md
docs/CONTRIBUTING.md
docs/AI_CODING_RULES.md

Then explain the conflict.