import os
import sys
import time
import requests
import traceback
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.db import supabase
from app.ai.vehicle.analyzer import VehicleAnalyzer
from app.ai.classroom.analyzer import ClassroomAnalyzer
from app.workers.processor import get_storage_url, ensure_bucket_exists

PARKING_VIDEO_ID = "d0d31b41-a26f-4be2-887c-fe3a2f4514c8"
CLASSROOM_VIDEO_ID = "1dfcef90-f01e-4977-b6cd-a5ce5735b3f9"

def download_storage_file(bucket_name: str, storage_path: str, local_path: str):
    """Downloads a storage file using robust HTTP/1.1 stream with retries."""
    url = f"{settings.SUPABASE_URL}/storage/v1/object/authenticated/{bucket_name}/{storage_path}"
    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
    }
    for attempt in range(1, 4):
        try:
            print(f"📥 [Download Attempt {attempt}] Fetching {storage_path}...")
            with requests.get(url, headers=headers, stream=True, timeout=60) as resp:
                resp.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=65536):
                        if chunk:
                            f.write(chunk)
            file_size_mb = os.path.getsize(local_path) / (1024 * 1024)
            print(f"💾 Successfully saved {file_size_mb:.2f} MB to {local_path}")
            return
        except Exception as e:
            print(f"⚠️ Download attempt {attempt} failed: {e}")
            time.sleep(2)
    raise RuntimeError(f"Failed to download {storage_path} after 3 attempts.")


def process_single_video(video_id: str, pipeline_type: str, friendly_title: str):
    print(f"\n=======================================================")
    print(f"🚀 Processing Video ID: {video_id} as [{pipeline_type.upper()}]")
    print(f"=======================================================")

    # 1. Fetch Video and Job records
    v_res = supabase.table("videos").select("*").eq("id", video_id).single().execute()
    video_data = v_res.data
    if not video_data:
        raise ValueError(f"Video {video_id} not found in database.")

    j_res = supabase.table("processing_jobs").select("*").eq("video_id", video_id).execute()
    if not j_res.data or len(j_res.data) == 0:
        raise ValueError(f"Job for video {video_id} not found.")
    job_data = j_res.data[0]
    job_id = job_data["id"]
    institution_id = video_data.get("institution_id") or "4eed86cd-e499-477b-9abb-84a6134e3a20"

    storage_path = video_data["original_storage_path"]
    os.makedirs(settings.TEMP_DIR, exist_ok=True)

    local_input = os.path.join(settings.TEMP_DIR, f"{job_id}_raw.mp4")
    local_annotated = os.path.join(settings.TEMP_DIR, f"{job_id}_annotated.mp4")
    local_snapshot = os.path.join(settings.TEMP_DIR, f"{job_id}_snapshot.jpg")

    try:
        # 2. Download raw MP4 using HTTP/1.1
        download_storage_file(settings.RAW_BUCKET, storage_path, local_input)

        # 3. Execute AI Pipeline
        if pipeline_type == "vehicle":
            print("🚗 Initializing VehicleAnalyzer (YOLOv8 + ByteTrack)...")
            analyzer = VehicleAnalyzer()
            metrics = analyzer.process_video(
                input_video_path=local_input,
                output_video_path=local_annotated,
                snapshot_output_path=local_snapshot,
            )
        else:
            print("🎓 Initializing ClassroomAnalyzer (YOLOv8 Student & Teacher Detection)...")
            analyzer = ClassroomAnalyzer()
            metrics = analyzer.process_video(
                input_video_path=local_input,
                output_video_path=local_annotated,
                snapshot_output_path=local_snapshot,
            )

        print(f"✅ AI Analysis complete! Metrics: {metrics}")

        # 4. Upload annotated video and snapshot to Supabase Storage
        ensure_bucket_exists(settings.PROCESSED_BUCKET)
        file_base_name = os.path.basename(storage_path)
        clean_name = os.path.splitext(file_base_name)[0]

        video_dest_path = f"{institution_id}/{job_id}/annotated_{file_base_name}"
        snapshot_dest_path = f"{institution_id}/{job_id}/snapshot_{clean_name}.jpg"

        print(f"📤 Uploading annotated video to '{video_dest_path}'...")
        with open(local_annotated, "rb") as vf:
            supabase.storage.from_(settings.PROCESSED_BUCKET).upload(
                path=video_dest_path,
                file=vf.read(),
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

        print(f"📸 Uploading snapshot to '{snapshot_dest_path}'...")
        with open(local_snapshot, "rb") as sf:
            supabase.storage.from_(settings.PROCESSED_BUCKET).upload(
                path=snapshot_dest_path,
                file=sf.read(),
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )

        # 5. Generate URLs and Payload
        annotated_video_url = get_storage_url(settings.PROCESSED_BUCKET, video_dest_path)
        snapshot_url = get_storage_url(settings.PROCESSED_BUCKET, snapshot_dest_path)

        now_iso = datetime.now(timezone.utc).isoformat()
        results_json = {
            **metrics,
            "video_type": pipeline_type,
            "snapshot_url": snapshot_url,
            "annotated_video_url": annotated_video_url,
            "snapshot_storage_path": snapshot_dest_path,
            "annotated_storage_path": video_dest_path,
            "worker_id": "render-ai-worker-01",
            "completed_at": now_iso,
        }

        # 6. Update Database
        print("💾 Updating database records in PostgreSQL...")
        supabase.table("processing_jobs").update({
            "status": "completed",
            "completed_at": now_iso,
            "results_json": results_json,
        }).eq("id", job_id).execute()

        supabase.table("videos").update({
            "title": friendly_title,
            "status": "completed",
        }).eq("id", video_id).execute()

        print(f"🎉 SUCCESS! {friendly_title} processed and saved.")

    finally:
        for p in [local_input, local_annotated, local_snapshot]:
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

if __name__ == "__main__":
    print("==================================================")
    print("🔁 REPROCESSING CAMPUS SURVEILLANCE VIDEOS")
    print("==================================================")
    
    # Reprocess Parking Video with VehicleAnalyzer
    process_single_video(
        video_id=PARKING_VIDEO_ID,
        pipeline_type="vehicle",
        friendly_title="Parking & Gate Access (WhatsApp 11.56.59 AM)"
    )

    # Reprocess Classroom Video with ClassroomAnalyzer
    process_single_video(
        video_id=CLASSROOM_VIDEO_ID,
        pipeline_type="classroom",
        friendly_title="Classroom Lecture Hall (WhatsApp 11.57.02 AM)"
    )

    print("\n🌟 ALL VIDEOS SUCCESSFULLY REPROCESSED!")
