import sys
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import supabase
from app.workers.processor import start_worker_thread, stop_worker_thread


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager that starts the AI background worker
    when FastAPI starts up and stops it gracefully on shutdown.
    """
    print("\n" + "=" * 60)
    print("🚀 [FastAPI] Initializing AI Campus Surveillance Backend...")
    print(f"   Worker ID: {settings.WORKER_ID}")
    print(f"   Supabase Target: {settings.SUPABASE_URL}")
    print("=" * 60)

    # Start the continuous worker loop in a separate thread
    start_worker_thread()

    yield

    # Clean shutdown
    print("\n🛑 [FastAPI] Shutting down backend services...")
    stop_worker_thread()
    print("👋 [FastAPI] Shutdown sequence complete.\n")


app = FastAPI(
    title="AI Campus Surveillance SaaS - Processing Backend",
    description="Remote background worker and video processing pipeline for Render deployment.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js dashboard requests if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    """Root endpoint verifying API availability."""
    return {
        "service": "AI Campus Surveillance SaaS - Processing Backend",
        "worker_id": settings.WORKER_ID,
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
    }


@app.get("/health", tags=["Monitoring"], status_code=status.HTTP_200_OK)
async def health_check():
    """
    Render health check endpoint.
    Used by Render's health monitoring to confirm the web service is responsive.
    """
    db_connected = False
    try:
        # Quick health query against Supabase PostgreSQL
        res = supabase.table("processing_jobs").select("id", count="exact").limit(1).execute()
        db_connected = True
        queued_count = (
            supabase.table("processing_jobs")
            .select("id", count="exact")
            .eq("status", "queued")
            .execute()
            .count
            or 0
        )
    except Exception as exc:
        print(f"⚠️ [Health] Supabase ping warning: {exc}", file=sys.stderr)
        queued_count = None

    return {
        "status": "healthy" if db_connected else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "worker_id": settings.WORKER_ID,
        "database": {
            "connected": db_connected,
            "target": settings.SUPABASE_URL,
            "queued_jobs": queued_count,
        },
        "storage": {
            "raw_bucket": settings.RAW_BUCKET,
            "processed_bucket": settings.PROCESSED_BUCKET,
        },
    }


@app.get("/jobs/stats", tags=["Monitoring"])
async def get_job_stats():
    """Returns current telemetry metrics on video processing queues."""
    try:
        queued = (
            supabase.table("processing_jobs")
            .select("id", count="exact")
            .eq("status", "queued")
            .execute()
            .count
            or 0
        )
        in_progress = (
            supabase.table("processing_jobs")
            .select("id", count="exact")
            .eq("status", "in_progress")
            .execute()
            .count
            or 0
        )
        completed = (
            supabase.table("processing_jobs")
            .select("id", count="exact")
            .eq("status", "completed")
            .execute()
            .count
            or 0
        )
        failed = (
            supabase.table("processing_jobs")
            .select("id", count="exact")
            .eq("status", "failed")
            .execute()
            .count
            or 0
        )

        return {
            "queued": queued,
            "in_progress": in_progress,
            "completed": completed,
            "failed": failed,
            "total": queued + in_progress + completed + failed,
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve job statistics: {str(e)}"},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

