from typing import Optional, Dict, Any
import httpx
from jose import jwt, jwk
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

# In-memory cache for Supabase JWKS keys
_cached_jwks: Optional[Dict[str, Any]] = None

async def get_supabase_jwks() -> Dict[str, Any]:
    global _cached_jwks
    if _cached_jwks:
        return _cached_jwks
    
    jwks_url = settings.jwks_url
    if not jwks_url:
        return {"keys": []}
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(jwks_url, timeout=5.0)
            if resp.status_code == 200:
                _cached_jwks = resp.json()
                return _cached_jwks
    except Exception as e:
        print(f"Error fetching Supabase JWKS: {e}")
    return {"keys": []}

async def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verifies Supabase Auth JWT token using Supabase JWKS public keys.
    """
    jwks_data = await get_supabase_jwks()
    keys = jwks_data.get("keys", [])
    
    # Try unverified header to match kid
    try:
        unverified_headers = jwt.get_unverified_header(token)
        kid = unverified_headers.get("kid")
        
        matching_key = None
        for k in keys:
            if k.get("kid") == kid:
                matching_key = k
                break
                
        if matching_key:
            public_key = jwk.construct(matching_key)
            payload = jwt.decode(
                token,
                public_key.to_pem().decode("utf-8"),
                algorithms=["RS256", "ES256", "HS256"],
                options={"verify_aud": False}
            )
            return payload
    except Exception as jwks_err:
        pass

    # Fallback to Supabase Auth API verification
    if settings.normalized_supabase_url and settings.SUPABASE_PUBLISHABLE_KEY:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"{settings.normalized_supabase_url}/auth/v1/user",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": settings.SUPABASE_PUBLISHABLE_KEY
                    },
                    timeout=5.0
                )
                if res.status_code == 200:
                    user_data = res.json()
                    return {
                        "sub": user_data.get("id"),
                        "email": user_data.get("email"),
                        "user_metadata": user_data.get("user_metadata", {}),
                        "role": user_data.get("role", "authenticated")
                    }
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired Supabase authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = await verify_supabase_jwt(token)
    return {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("user_metadata", {}).get("role", "athlete"),
        "name": payload.get("user_metadata", {}).get("name", "Athlete")
    }
