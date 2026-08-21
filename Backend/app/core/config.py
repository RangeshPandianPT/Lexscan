from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "LexScan API"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://lexscan:lexscan@localhost:5432/lexscan_db"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Internal service key for Group 1's ingest calls
    SERVICE_API_KEY: str = "lexscan-internal-service-key"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Group 3 Next.js frontend
        "http://localhost:4000",  # json-server mock
        "http://localhost:8000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
