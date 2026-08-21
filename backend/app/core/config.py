import os
import re
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

# Resolve .env path relative to config.py's location.
# config.py is at backend/app/core/config.py; .env sits at the repository root.
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_FILE = _REPO_ROOT / ".env"


def normalize_supabase_url(raw_url: Optional[str]) -> str:
    if not raw_url:
        return ""
    trimmed = raw_url.strip()
    match = re.search(r"supabase\.com/dashboard/project/([a-zA-Z0-9_-]+)", trimmed)
    if match and match.group(1):
        return f"https://{match.group(1)}.supabase.co"
    return trimmed


class Settings(BaseSettings):
    PROJECT_NAME: str = "The Elitez - Sports Talent Platform API"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    DATABASE_URL: str = ""
    
    # Storage Configuration
    SUPABASE_STORAGE_BUCKET: str = "assessment-videos"
    
    # Environment
    ENVIRONMENT: str = "development"
    PORT: int = 10000
    
    @property
    def normalized_supabase_url(self) -> str:
        return normalize_supabase_url(self.SUPABASE_URL)

    @property
    def jwks_url(self) -> str:
        base = self.normalized_supabase_url
        if base:
            return f"{base}/auth/v1/.well-known/jwks.json"
        return ""

    class Config:
        env_file = str(_ENV_FILE)
        case_sensitive = True

settings = Settings()