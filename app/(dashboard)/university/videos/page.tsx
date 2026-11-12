import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VideoRecord } from "@/types/database";
import { VideoUpload } from "@/components/VideoUpload";
import { VideoTable } from "./video-table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Film,
  HardDrive,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default async function UniversityVideosPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  // Ensure user has campus admin privileges
  if (profile.role !== "university_admin" && profile.role !== "agency_admin") {
    redirect("/login");
  }

  const institutionId = profile.institution_id;
  const institutionName =
    profile.institution?.name || "Campus Surveillance Unit";

  if (!institutionId) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-300">
        <h2 className="text-lg font-bold">No Institution Association</h2>
        <p className="text-sm mt-1">
          Your account is not currently linked to an active university tenant.
          Please contact your Agency Administrator.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch videos for this institution using Supabase SSR & PostgreSQL RLS
  const { data: rawVideos, error } = await supabase
    .from("videos")
    .select("*, processing_jobs(*)")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  const videos: VideoRecord[] = (rawVideos as VideoRecord[]) || [];

  const pendingCount = videos.filter((v) => v.status === "pending").length;
  const processingCount = videos.filter(
    (v) => v.status === "processing"
  ).length;
  const completedCount = videos.filter((v) => v.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Film className="h-4 w-4" />
            AI Video Pipeline & Storage
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Surveillance Video Ingestion
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Direct-to-cloud payload streaming into{" "}
            <code className="text-blue-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">
              raw_videos
            </code>{" "}
            private bucket for {institutionName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 py-1 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            RLS Tenant Scoped
          </Badge>
        </div>
      </div>

      {/* Pipeline Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Ingested
            </CardTitle>
            <HardDrive className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {videos.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Direct-to-cloud streams
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Awaiting / In Queue
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {pendingCount + processingCount}
            </div>
            <p className="text-xs text-amber-400 mt-1">
              {processingCount > 0
                ? `${processingCount} currently processing`
                : "Ready for inference worker"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Inference Complete
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {completedCount}
            </div>
            <p className="text-xs text-emerald-400 mt-1">
              Classroom & parking telemetry ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1. Direct-to-Cloud Video Upload Component */}
      <section className="space-y-2">
        <VideoUpload institutionId={institutionId} />
      </section>

      {/* 2. Institutional Video Library Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Ingested Video Library
            </h2>
            <p className="text-xs text-muted-foreground">
              Surveillance recordings registered under your institution's tenant partition.
            </p>
          </div>
          {error && (
            <span className="text-xs text-amber-400">
              Note: Database schema initializing ({error.message})
            </span>
          )}
        </div>

        <VideoTable initialVideos={videos} />
      </section>
    </div>
  );
}

