import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { user, profile } = await getCurrentProfile();

    if (!user || !profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = params;
    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch video record
    const { data: video, error: fetchErr } = await supabase
      .from("videos")
      .select("*, processing_jobs(*)")
      .eq("id", videoId)
      .single();

    if (fetchErr || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // RBAC: University admin can only delete within their institution
    if (
      profile.role !== "agency_admin" &&
      video.institution_id !== profile.institution_id
    ) {
      return NextResponse.json({ error: "Forbidden: cross-tenant access denied" }, { status: 403 });
    }

    // 2. Cleanup storage files if any
    const rawPath = video.original_storage_path;
    if (rawPath) {
      try {
        await supabase.storage.from("raw_videos").remove([rawPath]);
      } catch (err) {
        console.warn("Storage deletion warning (raw_videos):", err);
      }
    }

    const jobs = Array.isArray(video.processing_jobs)
      ? video.processing_jobs
      : video.processing_jobs
      ? [video.processing_jobs]
      : [];

    for (const job of jobs) {
      const res = job.results_json || {};
      const toRemove: string[] = [];
      if (res.snapshot_storage_path) toRemove.push(res.snapshot_storage_path);
      if (res.annotated_storage_path) toRemove.push(res.annotated_storage_path);
      if (toRemove.length > 0) {
        try {
          await supabase.storage.from("processed_results").remove(toRemove);
        } catch (err) {
          console.warn("Storage deletion warning (processed_results):", err);
        }
      }
    }

    // 3. Delete processing jobs
    await supabase.from("processing_jobs").delete().eq("video_id", videoId);

    // 4. Delete video record
    const { error: delErr } = await supabase.from("videos").delete().eq("id", videoId);
    if (delErr) {
      console.error("Failed to delete video record:", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Video '${video.title}' successfully deleted`,
    });
  } catch (error: any) {
    console.error("Delete video handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
