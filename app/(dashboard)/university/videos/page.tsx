import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VideoRecord } from "@/types/database";
import { VideoUpload } from "@/components/VideoUpload";
import { SampleDemoLoader } from "@/components/sample-demo-loader";
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
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Surveillance Video Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Direct upload pipeline into private bucket storage for {institutionName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 shadow-sm py-1.5 px-3 gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            RLS Isolated
          </Badge>
        </div>
      </div>

      {/* Pipeline Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ingested
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {videos.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct-to-cloud streams
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              In Processing Queue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {pendingCount + processingCount}
            </div>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              {processingCount > 0
                ? `${processingCount} actively analyzing`
                : "Awaiting next batch"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI Analysis Completed
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {completedCount}
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Classroom & parking telemetry ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VIP Vendor One-Click Demo Presets */}
      <section className="space-y-2">
        <SampleDemoLoader />
      </section>

      {/* 1. Direct-to-Cloud Video Upload Component */}
      <section className="space-y-2">
        <VideoUpload institutionId={institutionId} />
      </section>

      {/* 2. Institutional Video Library Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Ingested Video Library
            </h2>
            <p className="text-xs text-slate-500">
              Surveillance recordings registered under your institution's tenant partition.
            </p>
          </div>
          {error && (
            <span className="text-xs text-amber-600">
              Note: Database schema initializing ({error.message})
            </span>
          )}
        </div>

        <VideoTable initialVideos={videos} />
      </section>
    </div>
  );
}
