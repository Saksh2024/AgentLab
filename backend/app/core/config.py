from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    OPENAI_API_KEY: Optional[str] = None
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Voice Agent Studio API"

settings = Settings()
