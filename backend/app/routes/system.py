import os
import re
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from app.config import settings, BASE_DIR
from app.database import get_db
from app.models import User
from app.security import require_admin
from app.services.firecrawl_service import firecrawl_service
from app.services.llm_service import llm_service
from app.services.memento_service import memento_service

router = APIRouter(prefix="/system", tags=["System & Health"])
optional_bearer = HTTPBearer(auto_error=False)

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        pass
    return None

class ConfigUpdateRequest(BaseModel):
    firecrawl_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    openai_api_key: Optional[str] = None
    llm_provider: Optional[str] = None

def _mask_key(key: Optional[str]) -> str:
    if not key or not key.strip():
        return ""
    k = key.strip()
    if len(k) <= 8:
        return "********"
    return k[:4] + "*" * (len(k) - 8) + k[-4:]

def _update_env_file(updates: dict):
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        # Create from example or blank
        content = ""
    else:
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()

    for var_name, value in updates.items():
        if value is None:
            continue
        # Validate var_name against injection
        if not re.match(r"^[A-Z0-9_]+$", var_name):
            continue
        clean_val = str(value).strip().replace("\r", "").replace("\n", "")
        clean_val = clean_val.replace('"', '\\"')

        pattern = rf"^{var_name}=.*$"
        new_line = f'{var_name}="{clean_val}"'
        if re.search(pattern, content, flags=re.MULTILINE):
            content = re.sub(pattern, new_line, content, flags=re.MULTILINE)
        else:
            content += f"\n{new_line}\n"

    with open(env_path, "w", encoding="utf-8") as f:
        f.write(content)

@router.get("/status")
def get_system_status(current_user: Optional[User] = Depends(get_optional_user)):
    """
    Returns system status, active integrations, and configuration checks.
    Public callers receive health status; logged-in administrators receive full integration diagnostics.
    """
    fc_key = firecrawl_service.active_api_key
    gemini_key = llm_service.active_gemini_key
    openai_key = llm_service.active_openai_key
    
    has_firecrawl = bool(fc_key)
    has_gemini = bool(gemini_key)
    has_openai = bool(openai_key)
    
    active_llm = "gemini" if has_gemini else ("openai" if has_openai else "none")
    
    memento_dir = memento_service.storage_dir
    memento_ok = memento_dir.exists() and os.access(memento_dir, os.W_OK)
    
    status_info = {
        "status": "healthy",
        "version": settings.VERSION,
        "firecrawl": {
            "configured": has_firecrawl,
            "base_url": settings.FIRECRAWL_BASE_URL
        },
        "llm": {
            "configured": has_gemini or has_openai,
            "active_provider": active_llm,
            "gemini_configured": has_gemini,
            "gemini_model": llm_service.active_gemini_model,
            "openai_configured": has_openai,
        },
        "memento": {
            "configured": True,
            "healthy": memento_ok,
            "embedding_provider": settings.MEMENTO_EMBEDDING_PROVIDER
        }
    }

    # Only expose sensitive masked keys and storage paths if authenticated as Admin
    if current_user and current_user.role == "admin":
        status_info["firecrawl"]["masked_key"] = _mask_key(fc_key)
        status_info["llm"]["gemini_masked"] = _mask_key(gemini_key)
        status_info["llm"]["openai_masked"] = _mask_key(openai_key)
        status_info["memento"]["storage_directory"] = str(memento_dir)

    return status_info

@router.post("/config")
def update_system_config(
    payload: ConfigUpdateRequest,
    admin=Depends(require_admin)
):
    """
    In-browser API key modification is disabled for enterprise security.
    Credentials must be configured directly on the server in backend/.env.
    """
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="In-browser API key configuration has been disabled for enterprise security. Please configure API credentials directly in backend/.env on the server."
    )
