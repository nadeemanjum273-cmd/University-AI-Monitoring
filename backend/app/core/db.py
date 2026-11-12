import sys
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Initializes and returns the singleton Supabase admin client using the Service Role Key.
    This gives the background worker full administrative privileges to claim processing_jobs
    and read/write to private storage buckets (raw_videos, processed_results).
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not url or "your-project-id" in url:
        print(
            "⚠️ [WARNING] SUPABASE_URL is not configured or using placeholder value in backend/.env",
            file=sys.stderr,
        )

    if not key or key == "your-supabase-service-role-key-here":
        print(
            "⚠️ [WARNING] SUPABASE_SERVICE_ROLE_KEY is missing or using placeholder in backend/.env. "
            "Database queries and storage access will fail until valid service role credentials are provided.",
            file=sys.stderr,
        )

    try:
        _supabase_client = create_client(url, key)
        print(f"✅ [Supabase DB] Admin client initialized successfully against: {url}")
        return _supabase_client
    except Exception as exc:
        print(f"❌ [Supabase DB] Failed to initialize Supabase client: {exc}", file=sys.stderr)
        raise exc


# Singleton client instance
supabase: Client = get_supabase_client()

