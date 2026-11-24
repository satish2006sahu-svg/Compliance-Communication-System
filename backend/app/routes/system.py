import os
import re
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings, BASE_DIR
from app.security import require_admin
from app.services.firecrawl_service import firecrawl_service
from app.services.llm_service import llm_service
from app.services.memento_service import memento_service

router = APIRouter(prefix="/system", tags=["System & Health"])

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
        pattern = rf"^{var_name}=.*$"
        new_line = f'{var_name}="{value}"'
        if re.search(pattern, content, flags=re.MULTILINE):
            content = re.sub(pattern, new_line, content, flags=re.MULTILINE)
        else:
            content += f"\n{new_line}\n"

    with open(env_path, "w", encoding="utf-8") as f:
        f.write(content)

@router.get("/status")
def get_system_status():
    """
    Returns system status, active integrations, and configuration checks.
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
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "firecrawl": {
            "configured": has_firecrawl,
            "masked_key": _mask_key(fc_key),
            "base_url": settings.FIRECRAWL_BASE_URL
        },
        "llm": {
            "configured": has_gemini or has_openai,
            "active_provider": active_llm,
            "gemini_configured": has_gemini,
            "gemini_model": llm_service.active_gemini_model,
            "gemini_masked": _mask_key(gemini_key),
            "openai_configured": has_openai,
            "openai_masked": _mask_key(openai_key)
        },
        "memento": {
            "configured": True,
            "storage_directory": str(memento_dir),
            "healthy": memento_ok,
            "embedding_provider": settings.MEMENTO_EMBEDDING_PROVIDER
        }
    }

@router.post("/config")
def update_system_config(
    payload: ConfigUpdateRequest,
    admin=Depends(require_admin)
):
    """
    Allows administrator to update API keys dynamically without restarting the server.
    Updates in-memory settings and persists to backend/.env.
    """
    updates = {}
    
    if payload.firecrawl_api_key is not None:
        key = payload.firecrawl_api_key.strip()
        settings.FIRECRAWL_API_KEY = key
        firecrawl_service.api_key = key
        os.environ["FIRECRAWL_API_KEY"] = key
        updates["FIRECRAWL_API_KEY"] = key
        
    if payload.gemini_api_key is not None:
        key = payload.gemini_api_key.strip()
        settings.GEMINI_API_KEY = key
        llm_service.gemini_key = key
        os.environ["GEMINI_API_KEY"] = key
        updates["GEMINI_API_KEY"] = key
        if key:
            settings.LLM_PROVIDER = "gemini"
            llm_service.provider = "gemini"
            os.environ["LLM_PROVIDER"] = "gemini"
            updates["LLM_PROVIDER"] = "gemini"

    if payload.gemini_model is not None:
        m = payload.gemini_model.strip()
        if m:
            settings.GEMINI_MODEL = m
            llm_service.gemini_model = m
            os.environ["GEMINI_MODEL"] = m
            updates["GEMINI_MODEL"] = m

    if payload.openai_api_key is not None:
        key = payload.openai_api_key.strip()
        settings.OPENAI_API_KEY = key
        llm_service.openai_key = key
        os.environ["OPENAI_API_KEY"] = key
        updates["OPENAI_API_KEY"] = key
        if key and not settings.GEMINI_API_KEY:
            settings.LLM_PROVIDER = "openai"
            llm_service.provider = "openai"
            os.environ["LLM_PROVIDER"] = "openai"
            updates["LLM_PROVIDER"] = "openai"

    if payload.llm_provider is not None:
        p = payload.llm_provider.strip().lower()
        if p in ("gemini", "openai"):
            settings.LLM_PROVIDER = p
            llm_service.provider = p
            os.environ["LLM_PROVIDER"] = p
            updates["LLM_PROVIDER"] = p

    # Persist to .env
    try:
        _update_env_file(updates)
    except Exception as e:
        print(f"Warning writing to .env: {e}")

    return {
        "message": "API keys and configuration successfully updated and applied in real time.",
        "status": get_system_status()
    }
