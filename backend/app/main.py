from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Central Athlete Talent Verification & Assessment Backend (FastAPI + Supabase)"
)

# CORS configuration for mobile and web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database initialization encountered an issue: {e}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "The Elitez - FastAPI Sports Talent Platform",
        "supabase_url": settings.normalized_supabase_url,
        "database": "connected" if settings.DATABASE_URL else "local_sqlite_fallback"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
