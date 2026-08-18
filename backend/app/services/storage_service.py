from typing import Optional, Dict, Any
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client:
        return _supabase_client
    
    url = settings.normalized_supabase_url
    key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY
    if url and key:
        try:
            _supabase_client = create_client(url, key)
            return _supabase_client
        except Exception as e:
            print(f"Supabase client initialization error: {e}")
    return None

class StorageService:
    @staticmethod
    async def create_signed_upload_url(
        bucket_name: str,
        storage_path: str
    ) -> Dict[str, Any]:
        supabase = get_supabase_client()
        if not supabase:
            return {
                "bucket": bucket_name,
                "storage_path": storage_path,
                "signed_upload_url": None,
                "token": None
            }
        
        try:
            # Ensure bucket exists
            try:
                supabase.storage.get_bucket(bucket_name)
            except Exception:
                try:
                    supabase.storage.create_bucket(bucket_name, options={"public": False})
                except Exception:
                    pass
            
            res = supabase.storage.from_(bucket_name).create_signed_upload_url(storage_path)
            return {
                "bucket": bucket_name,
                "storage_path": storage_path,
                "signed_upload_url": res.get("signed_url") or res.get("signedUrl"),
                "token": res.get("token")
            }
        except Exception as e:
            print(f"Error creating signed upload URL: {e}")
            return {
                "bucket": bucket_name,
                "storage_path": storage_path,
                "signed_upload_url": None,
                "token": None
            }

    @staticmethod
    async def create_signed_download_url(
        bucket_name: str,
        storage_path: str,
        expires_in: int = 900
    ) -> Optional[str]:
        supabase = get_supabase_client()
        if not supabase:
            return None
        try:
            res = supabase.storage.from_(bucket_name).create_signed_url(storage_path, expires_in)
            return res.get("signed_url") or res.get("signedUrl")
        except Exception as e:
            print(f"Error creating signed download URL: {e}")
            return None
