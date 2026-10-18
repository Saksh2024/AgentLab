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

settings = Settings()
