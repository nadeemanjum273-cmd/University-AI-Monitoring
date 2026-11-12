"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { VideoRecord, ProcessingJob } from "@/types/database";

export interface RegisterVideoResult {
  success: boolean;
  error?: string;
  video?: VideoRecord;
  job?: ProcessingJob;
}

/**
 * Server Action: Registers a direct-to-cloud uploaded video and queues a processing job
 * for the Render Python worker.
 *
 * Conforms strictly to schema:
 * - public.videos (id, institution_id, title, original_storage_path, status)
 * - public.processing_jobs (id, video_id, status)
 */
export async function registerUploadedVideo(
  fileName: string,
  storagePath: string,
  institutionId: string
): Promise<RegisterVideoResult> {
  try {
    const { user, profile } = await getCurrentProfile();

    if (!user || !profile) {
      return { success: false, error: "Unauthorized: You must be logged in to upload surveillance videos." };
    }

    const effectiveInstitutionId = profile.institution_id || institutionId;
    if (!effectiveInstitutionId) {
      return { success: false, error: "Tenant identification error: No institutional ID linked to profile." };
    }

    if (profile.role !== "agency_admin" && profile.institution_id !== effectiveInstitutionId) {
      return { success: false, error: "Forbidden: Cannot register video for a different institution." };
    }

    const supabase = await createClient();

    // 1. Insert into 'videos' table with status 'pending'
    const title = fileName.replace(/\.[^/.]+$/, "");

    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert([
        {
          institution_id: effectiveInstitutionId,
          title,
          original_storage_path: storagePath,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (videoError) {
      return {
        success: false,
        error: `Database registration failed: ${videoError.message}`,
      };
    }

    const videoRecord = videoData as VideoRecord;

    // 2. Automatically queue record in 'processing_jobs' table for Render Python worker
    const { data: jobData, error: jobError } = await supabase
      .from("processing_jobs")
      .insert([
        {
          video_id: videoRecord.id,
          status: "queued",
        },
      ])
      .select()
      .single();

    if (jobError) {
      console.error("Warning: processing_jobs insertion issue:", jobError.message);
    }

    revalidatePath("/university/videos");
    revalidatePath("/university");

    return {
      success: true,
      video: videoRecord,
      job: (jobData as ProcessingJob) || undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during video registration.",
    };
  }
}
