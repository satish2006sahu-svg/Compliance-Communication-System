import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Regulatory Compliance Communication System"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "compliance-secret-key-change-in-production-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (SQLite)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'compliance.db'}")
    
    # Firecrawl
    FIRECRAWL_API_KEY: Optional[str] = os.getenv("FIRECRAWL_API_KEY", "")
    FIRECRAWL_BASE_URL: str = os.getenv("FIRECRAWL_BASE_URL", "https://api.firecrawl.dev")
    
    # LLM Settings (supports Gemini, OpenAI, or OpenAI-compatible endpoints e.g. Groq, Ollama)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" or "openai" or "ollama"
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: Optional[str] = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Memento Persistent Memory Settings
    MEMENTO_STORAGE_DIR: str = os.getenv("MEMENTO_STORAGE_DIR", str(BASE_DIR / "data" / "memento"))
    MEMENTO_EMBEDDING_PROVIDER: str = os.getenv("MEMENTO_EMBEDDING_PROVIDER", "deterministic") # "openai", "sentence-transformers", or "deterministic"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "allow"

settings = Settings()
