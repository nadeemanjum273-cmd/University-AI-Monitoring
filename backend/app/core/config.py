import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Locate .env file relative to this module or current working directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    # Supabase PostgreSQL & Storage configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project-id.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Background worker configuration
    WORKER_ID: str = os.getenv("WORKER_ID", "render-ai-worker-01")
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
    TEMP_DIR: str = os.getenv("TEMP_DIR", "./temp")

    # Supabase storage bucket names
    RAW_BUCKET: str = os.getenv("RAW_BUCKET", "raw_videos")
    PROCESSED_BUCKET: str = os.getenv("PROCESSED_BUCKET", "processed_results")

    model_config = SettingsConfigDict(
        env_file=str(env_path),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

