"""
PRAGMA — Application Configuration

Reads settings from .env via pydantic-settings.
Import the `settings` singleton anywhere in the app.

Offline-first: Claude/Anthropic settings are optional legacy fields.
Primary AI engine is Ollama (local inference).
"""

from typing import Optional, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    # Railway: mount a volume at /data and set DATABASE_URL=sqlite:////data/pragma.db
    # Local:   defaults to a file in the backend working directory
    DATABASE_URL: str = "sqlite:///./pragma_demo.db"

    # ── AI Engine ─────────────────────────────────────────────────────────────
    # "ollama"     — use local Ollama inference (default, offline-safe)
    # "rule_based" — skip Ollama, use rule-based extraction only
    AI_ENGINE:      str = "ollama"
    OLLAMA_URL:     str = "http://localhost:11434"
    OLLAMA_BASE_URL: str = "http://localhost:11434"  # alias for backwards compat
    # Model priority: qwen3:8b > llama3.1:8b > phi3.5
    # System auto-selects best available model at startup
    OLLAMA_MODEL:         str = "qwen3:8b"
    OLLAMA_TIMEOUT:       int = 180    # seconds — full timeout (last-resort cap)
    OLLAMA_FAST_TIMEOUT:  int = 12     # seconds — primary model; exceed → switch to fallback
    OLLAMA_FALLBACK_MODEL: str = "phi3.5"  # used when primary model exceeds OLLAMA_FAST_TIMEOUT

    # ── Legacy — Claude API (not used in offline mode) ────────────────────────
    ANTHROPIC_API_KEY: Optional[str] = None
    CLAUDE_MODEL:      str           = "claude-sonnet-4-6"

    # ── Application ───────────────────────────────────────────────────────────
    APP_ENV:  str  = "development"
    APP_HOST: str  = "0.0.0.0"
    APP_PORT: int  = 8000
    DEBUG:    bool = True

    class Config:
        env_file       = ".env"
        case_sensitive = True


settings = Settings()

# Model priority list — tried in order when preferred model isn't pulled
OLLAMA_MODEL_PRIORITY: List[str] = [
    "qwen3:8b",
    "qwen3:4b",
    "llama3.1:8b",
    "llama3.2:3b",
    "phi3.5",
    "phi3:mini",
    "gemma3:12b",
    "mistral:7b",
]
