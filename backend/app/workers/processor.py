import os
import sys
import time
import threading
import traceback
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.core.config import settings
from app.core.db import supabase
from app.ai.classroom.analyzer import ClassroomAnalyzer
from app.ai.vehicle.analyzer import VehicleAnalyzer

# Thread control flag for graceful shutdown
_stop_event = threading.Event()
_worker_thread: Optional[threading.Thread] = None

_classroom_analyzer: Optional[ClassroomAnalyzer] = None
_vehicle_analyzer: Optional[VehicleAnalyzer] = None


def get_classroom_analyzer() -> ClassroomAnalyzer:
    """Lazy-initializes and caches the singleton ClassroomAnalyzer."""
    global _classroom_analyzer
    if _classroom_analyzer is None:
        _classroom_analyzer = ClassroomAnalyzer(
            model_name="yolov8n.pt",
            conf_threshold=0.30,
            frame_stride=3,
        )
    return _classroom_analyzer


def get_vehicle_analyzer() -> VehicleAnalyzer:
    """Lazy-initializes and caches the singleton VehicleAnalyzer with ByteTrack."""
    global _vehicle_analyzer
    if _vehicle_analyzer is None:
        _vehicle_analyzer = VehicleAnalyzer(
            model_name="yolov8n.pt",
            conf_threshold=0.35,
        )
    return _vehicle_analyzer


def ensure_bucket_exists(bucket_name: str) -> None:
    """Helper to verify or create Supabase Storage bucket."""
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets] if buckets else []
        if bucket_name not in bucket_names:
            supabase.storage.create_bucket(bucket_name, options={"public": False})
            print(f"📦 [Storage] Created missing storage bucket: '{bucket_name}'")
    except Exception:
        pass


def claim_next_queued_job() -> Optional[Dict[str, Any]]:
    """
    ATOMIC CLAIM LOGIC:
    1. Query the 'processing_jobs' table for jobs with status = 'queued'.
    2. Atomically attempt to update status to 'in_progress' and set worker_id
       conditioned on status still being 'queued'.
    This prevents race conditions when multiple worker instances run on Render.
    """
    try:
        response = (
            supabase.table("processing_jobs")
            .select("id, video_id, status, created_at, results_json")
            .eq("status", "queued")
            .order("created_at", desc=False)
            .limit(5)
            .execute()
        )

        candidates = response.data or []
        if not candidates:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()

        for candidate in candidates:
            job_id = candidate["id"]

            claim_res = (
                supabase.table("processing_jobs")
                .update({
                    "status": "in_progress",
                    "worker_id": settings.WORKER_ID,
                    "started_at": now_iso,
                })
                .eq("id", job_id)
                .eq("status", "queued")  # Atomic CAS condition
                .execute()
            )

            if claim_res.data and len(claim_res.data) > 0:
                claimed_job = claim_res.data[0]
                print(
                    f"\n🔒 [Atomic Claim] Worker '{settings.WORKER_ID}' locked Job ID: {job_id} "
                    f"(Video ID: {claimed_job['video_id']})"
                )
                return claimed_job

        return None
    except Exception as exc:
        print(f"⚠️ [Claim Error] Error querying/claiming job: {exc}", file=sys.stderr)
        return None


def get_storage_url(bucket_name: str, path: str) -> str:
    """Attempts to generate a signed URL (1-year validity), with fallback to public URL."""
    try:
        signed_res = supabase.storage.from_(bucket_name).create_signed_url(path, 31536000)
        url = signed_res.get("signedURL") or signed_res.get("signedUrl")
        if url:
            return url
    except Exception:
        pass

    try:
        return supabase.storage.from_(bucket_name).get_public_url(path)
    except Exception:
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{path}"


def determine_video_pipeline(video_data: Dict[str, Any], job_data: Dict[str, Any]) -> str:
    """
    Determines whether to execute 'classroom' or 'vehicle' pipeline based on:
    1. Explicit video_type column in database
    2. Payload hint in job's results_json
    3. Heuristic matching on title or storage path
    """
    # 1. Explicit video_type column
    if video_data.get("video_type"):
        v_type = str(video_data["video_type"]).lower()
        if "vehicle" in v_type or "parking" in v_type or "gate" in v_type:
            return "vehicle"
        return "classroom"

    # 2. Check job results_json metadata
    job_results = job_data.get("results_json") or {}
    if job_results.get("video_type"):
        return str(job_results["video_type"]).lower()

    # 3. Smart heuristic on video title & storage path
    title = str(video_data.get("title", "")).lower()
    path = str(video_data.get("original_storage_path", "")).lower()
    combined = f"{title} {path}"

    vehicle_keywords = ["gate", "parking", "car", "vehicle", "traffic", "anpr", "barrier", "entry"]
    if any(keyword in combined for keyword in vehicle_keywords):
        return "vehicle"

    return "classroom"


def process_single_job(job: Dict[str, Any]) -> None:
    """
    Multi-Pipeline Video Processor (Classroom AI & Vehicle Gate AI):
    a) Fetch video record from 'videos' table.
    b) Download raw MP4 from 'raw_videos' bucket.
    c) Route to ClassroomAnalyzer or VehicleAnalyzer (ByteTrack).
    d) Upload annotated_video.mp4 and snapshot.jpg into 'processed_results' bucket.
    e) Update 'processing_jobs' and 'videos' to 'completed'.
    f) Clean up local temporary files.
    """
    job_id = job["id"]
    video_id = job["video_id"]

    local_input_path = os.path.join(settings.TEMP_DIR, f"{job_id}_raw.mp4")
    local_annotated_path = os.path.join(settings.TEMP_DIR, f"{job_id}_annotated.mp4")
    local_snapshot_path = os.path.join(settings.TEMP_DIR, f"{job_id}_snapshot.jpg")

    try:
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
        supabase.table("videos").update({"status": "processing"}).eq("id", video_id).execute()

        # a) Fetch video record from PostgreSQL
        print(f"🔎 [DB] Fetching video record for Video ID: {video_id}...")
        video_res = (
            supabase.table("videos")
            .select("id, title, original_storage_path, institution_id")
            .eq("id", video_id)
            .single()
            .execute()
        )
        video_data = video_res.data
        if not video_data:
            raise ValueError(f"Video with ID '{video_id}' not found in 'videos' table.")

        storage_path = video_data["original_storage_path"]
        institution_id = video_data.get("institution_id", "general")
        print(f"📹 [DB] Located video '{video_data.get('title')}' at storage path: {storage_path}")

        # b) Download raw MP4 from 'raw_videos' bucket
        print(f"📥 [Storage] Downloading '{storage_path}' from bucket '{settings.RAW_BUCKET}'...")
        file_bytes = supabase.storage.from_(settings.RAW_BUCKET).download(storage_path)

        with open(local_input_path, "wb") as f:
            f.write(file_bytes)
        file_size_mb = os.path.getsize(local_input_path) / (1024 * 1024)
        print(f"💾 [Disk] Saved raw video locally: {local_input_path} ({file_size_mb:.2f} MB)")

        # c) Route to appropriate AI Pipeline
        pipeline_type = determine_video_pipeline(video_data, job)
        print(f"🧠 [AI Router] Selected pipeline: '{pipeline_type.upper()}' for Video: '{video_data.get('title')}'")

        if pipeline_type == "vehicle":
            analyzer = get_vehicle_analyzer()
            analysis_metrics = analyzer.process_video(
                input_video_path=local_input_path,
                output_video_path=local_annotated_path,
                snapshot_output_path=local_snapshot_path,
            )
        else:
            analyzer = get_classroom_analyzer()
            analysis_metrics = analyzer.process_video(
                input_video_path=local_input_path,
                output_video_path=local_annotated_path,
                snapshot_output_path=local_snapshot_path,
            )

        # d) Upload both annotated video and snapshot to 'processed_results' bucket
        ensure_bucket_exists(settings.PROCESSED_BUCKET)
        file_base_name = os.path.basename(storage_path)
        clean_name = os.path.splitext(file_base_name)[0]

        video_dest_path = f"{institution_id}/{job_id}/annotated_{file_base_name}"
        snapshot_dest_path = f"{institution_id}/{job_id}/snapshot_{clean_name}.jpg"

        print(f"📤 [Storage] Uploading annotated video to '{settings.PROCESSED_BUCKET}/{video_dest_path}'...")
        with open(local_annotated_path, "rb") as vf:
            supabase.storage.from_(settings.PROCESSED_BUCKET).upload(
                path=video_dest_path,
                file=vf.read(),
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

        print(f"📸 [Storage] Uploading representative snapshot to '{settings.PROCESSED_BUCKET}/{snapshot_dest_path}'...")
        with open(local_snapshot_path, "rb") as sf:
            supabase.storage.from_(settings.PROCESSED_BUCKET).upload(
                path=snapshot_dest_path,
                file=sf.read(),
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )

        # e) Generate accessible signed URLs
        annotated_video_url = get_storage_url(settings.PROCESSED_BUCKET, video_dest_path)
        snapshot_url = get_storage_url(settings.PROCESSED_BUCKET, snapshot_dest_path)

        # Unified JSON result payload supporting both Classroom and Vehicle AI
        results_json = {
            **analysis_metrics,
            "video_type": pipeline_type,
            "snapshot_url": snapshot_url,
            "annotated_video_url": annotated_video_url,
            "snapshot_storage_path": snapshot_dest_path,
            "annotated_storage_path": video_dest_path,
            "worker_id": settings.WORKER_ID,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

        # f) Update database records to 'completed'
        now_iso = datetime.now(timezone.utc).isoformat()
        supabase.table("processing_jobs").update({
            "status": "completed",
            "completed_at": now_iso,
            "results_json": results_json,
        }).eq("id", job_id).execute()

        supabase.table("videos").update({
            "status": "completed",
        }).eq("id", video_id).execute()

        print(
            f"🎉 [Pipeline Success] Job {job_id} COMPLETED ({pipeline_type.upper()})!\n"
            f"   Artifacts: {snapshot_url}\n"
        )

    except Exception as exc:
        print(f"❌ [Pipeline Error] Processing Job ID {job_id} failed: {exc}", file=sys.stderr)
        traceback.print_exc()

        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            supabase.table("processing_jobs").update({
                "status": "failed",
                "completed_at": now_iso,
                "results_json": {
                    "error": str(exc),
                    "failed_at": now_iso,
                    "worker_id": settings.WORKER_ID,
                },
            }).eq("id", job_id).execute()

            supabase.table("videos").update({
                "status": "failed",
            }).eq("id", video_id).execute()

            print(f"⚠️ [DB] Marked Job {job_id} & Video {video_id} as 'failed'.")
        except Exception as db_err:
            print(f"💥 [Critical] Failed to record failure state in database: {db_err}", file=sys.stderr)

    finally:
        # g) Delete local temporary files
        print(f"🧹 [Cleanup] Deleting local temporary files for Job {job_id}...")
        for p in [local_input_path, local_annotated_path, local_snapshot_path]:
            if os.path.exists(p):
                try:
                    os.remove(p)
                    print(f"   🗑️ Removed: {p}")
                except Exception as clean_err:
                    print(f"   Warning: could not delete {p}: {clean_err}")


def worker_loop() -> None:
    """
    Continuous background loop that periodically polls the database
    for queued video processing jobs.
    """
    print(f"🚀 [Worker Started] AI Processing Worker running. Worker ID: '{settings.WORKER_ID}'")
    print(f"   ⚙️ Polling interval: {settings.POLL_INTERVAL_SECONDS}s | Temp Dir: '{settings.TEMP_DIR}'")

    while not _stop_event.is_set():
        try:
            job = claim_next_queued_job()
            if job:
                process_single_job(job)
            else:
                _stop_event.wait(timeout=settings.POLL_INTERVAL_SECONDS)
        except Exception as exc:
            print(f"⚠️ [Loop Warning] Uncaught exception in worker loop: {exc}", file=sys.stderr)
            _stop_event.wait(timeout=settings.POLL_INTERVAL_SECONDS)

    print("🛑 [Worker Stopped] Background processing thread gracefully terminated.")


def start_worker_thread() -> None:
    """Spawns the background worker in a dedicated daemon thread."""
    global _worker_thread
    if _worker_thread is not None and _worker_thread.is_alive():
        print("⚠️ [Worker] Worker thread is already active.")
        return

    _stop_event.clear()
    _worker_thread = threading.Thread(target=worker_loop, name="AIProcessorWorker", daemon=True)
    _worker_thread.start()
    print("✨ [Worker] Daemon background thread started successfully.")


def stop_worker_thread() -> None:
    """Signals the background worker thread to stop."""
    print("🛑 [Worker] Signaling background worker to stop...")
    _stop_event.set()
    if _worker_thread is not None and _worker_thread.is_alive():
        _worker_thread.join(timeout=3)
