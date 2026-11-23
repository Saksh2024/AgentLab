from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None
    OPENAI_MODEL: str = "gemini-3.5-flash"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Voice Agent Studio API"
    DATABASE_PATH: Optional[str] = None
    ALLOWED_ORIGINS: str = "*"
    # Optional shared secret; when set, API routes require an `X-API-Key` header.
    API_KEY: Optional[str] = None
    # Requests per client per minute on API routes (0 disables rate limiting).
    RATE_LIMIT_PER_MINUTE: int = 60
    # Honour X-Forwarded-For for client IPs (enable only behind a trusted proxy).
    TRUST_PROXY_HEADERS: bool = False

settings = Settings()
