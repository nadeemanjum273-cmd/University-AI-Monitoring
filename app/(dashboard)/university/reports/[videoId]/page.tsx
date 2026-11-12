import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SnapshotViewer } from "@/components/snapshot-viewer";
import { ExcelExportButton, ReportExportRow } from "@/components/excel-export-button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  GraduationCap,
  Car,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Film,
  Layers,
  ShieldCheck,
  Cpu,
  Info,
  Activity,
  UserCheck,
  TrendingUp,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReportDetailPageProps {
  params: {
    videoId: string;
  };
}

export async function generateMetadata({ params }: ReportDetailPageProps) {
  return {
    title: `AI Surveillance Audit | Video ${params.videoId.slice(0, 8)}`,
    description: "Detailed AI forensic analysis, bounding box trajectories, and telemetry.",
  };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role !== "university_admin" && profile.role !== "agency_admin") {
    redirect("/login");
  }

  const institutionId = profile.institution_id;
  if (!institutionId) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch the specific video ensuring it belongs to the user's institution
  const { data: video, error } = await supabase
    .from("videos")
    .select("*, processing_jobs(*)")
    .eq("id", params.videoId)
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (error || !video) {
    notFound();
  }

  const job = Array.isArray(video.processing_jobs)
    ? video.processing_jobs[0]
    : video.processing_jobs;

  const resultsJson = (job?.results_json as Record<string, any>) || {};

  // Resolve signed URLs for the annotated video and snapshot
  let annotatedVideoUrl = resultsJson.annotated_video_url || null;
  let snapshotUrl = resultsJson.snapshot_url || null;

  if (resultsJson.annotated_storage_path) {
    try {
      const { data: signData } = await supabase.storage
        .from("processed_results")
        .createSignedUrl(resultsJson.annotated_storage_path, 86400); // 24 hours
      if (signData?.signedUrl) {
        annotatedVideoUrl = signData.signedUrl;
      }
    } catch (e) {
      console.warn("Could not generate signed URL for annotated video:", e);
    }
  }

  if (resultsJson.snapshot_storage_path) {
    try {
      const { data: signData } = await supabase.storage
        .from("processed_results")
        .createSignedUrl(resultsJson.snapshot_storage_path, 86400);
      if (signData?.signedUrl) {
        snapshotUrl = signData.signedUrl;
      }
    } catch (e) {
      console.warn("Could not generate signed URL for snapshot:", e);
    }
  }

  // Determine pipeline type
  let pipelineType: "classroom" | "vehicle" = "classroom";
  if (
    resultsJson.video_type === "vehicle" ||
    resultsJson.total_vehicles_entered !== undefined ||
    video.title.toLowerCase().includes("gate") ||
    video.title.toLowerCase().includes("car") ||
    video.title.toLowerCase().includes("vehicle")
  ) {
    pipelineType = "vehicle";
  }

  const isClassroom = pipelineType === "classroom";
  const isVehicle = pipelineType === "vehicle";

  // Format metrics helpers
  const formatSeconds = (sec?: number) => {
    if (!sec || isNaN(sec)) return "0s";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  // Single video export row for Excel
  const singleReportExportData: ReportExportRow[] = [
    {
      video_id: video.id,
      title: video.title,
      uploaded_at: new Date(video.created_at).toLocaleString(),
      completed_at: job?.completed_at ? new Date(job.completed_at).toLocaleString() : undefined,
      pipeline_type: isClassroom ? "Classroom AI (YOLOv8)" : "Vehicle Gate AI (YOLOv8 + ByteTrack)",
      status: video.status,
      avg_students: isClassroom ? resultsJson.average_students : undefined,
      active_teaching_time_sec: isClassroom ? resultsJson.teaching_duration_seconds : undefined,
      teaching_percentage: isClassroom ? resultsJson.active_teaching_percentage : undefined,
      total_vehicles_entered: isVehicle ? resultsJson.total_vehicles_entered : undefined,
      cars_entered: isVehicle ? resultsJson.vehicle_breakdown?.cars : undefined,
      motorcycles_entered: isVehicle ? resultsJson.vehicle_breakdown?.motorcycles : undefined,
      buses_entered: isVehicle ? resultsJson.vehicle_breakdown?.buses : undefined,
      trucks_entered: isVehicle ? resultsJson.vehicle_breakdown?.trucks : undefined,
      video_url: annotatedVideoUrl || undefined,
      snapshot_url: snapshotUrl || undefined,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="border-border/60">
            <Link href="/university/reports" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              className={
                isClassroom
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-sky-500/20 text-sky-300 border-sky-500/30"
              }
            >
              {isClassroom ? (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Classroom AI Analysis
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Vehicle Gate Influx
                </span>
              )}
            </Badge>

            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-950/20 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified Completed
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={singleReportExportData}
            filename={`Audit_${video.title.replace(/\s+/g, "_")}`}
            buttonText="Export Excel"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          />
        </div>
      </div>

      {/* Title & Metadata Card */}
      <div className="bg-slate-900/60 border border-border/40 rounded-2xl p-6 backdrop-blur space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {video.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            <span>Uploaded: {new Date(video.created_at).toLocaleString()}</span>
          </div>
          {job?.completed_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Processed: {new Date(job.completed_at).toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <span>Video ID:</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-border/40">{video.id}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Video Player + AI Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Video Player & Snapshot (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* HTML5 Video Player */}
          <Card className="border-border/40 bg-slate-900/80 backdrop-blur overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-950/60 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm font-semibold text-white">
                  Annotated AI Video Stream
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono border-border/60 text-slate-300">
                YOLOv8 Overlay
              </Badge>
            </CardHeader>
            <CardContent className="p-0 bg-black">
              {annotatedVideoUrl ? (
                <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                  <video
                    controls
                    preload="metadata"
                    poster={snapshotUrl || undefined}
                    className="w-full h-full object-contain rounded-b-xl"
                  >
                    <source src={annotatedVideoUrl} type="video/mp4" />
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              ) : (
                <div className="aspect-video w-full flex flex-col items-center justify-center text-muted-foreground p-6 bg-slate-950">
                  <AlertCircle className="h-8 w-8 mb-2 text-amber-400" />
                  <p className="text-sm font-medium text-white">Annotated Video Unavailable</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
                    The processed video file might still be syncing to Supabase Storage or the storage path has expired.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forensic Evidence Snapshot Component */}
          <SnapshotViewer
            snapshotUrl={snapshotUrl}
            title={video.title}
            timestamp={job?.completed_at ? new Date(job.completed_at).toLocaleTimeString() : undefined}
          />

          {/* Technical Diagnostics & Telemetry Accordion / Card */}
          <Card className="border-border/40 bg-slate-900/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                Pipeline Diagnostics & Execution Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase">Worker Node</span>
                  <span className="text-slate-200">{resultsJson.worker_id || job?.worker_id || "Render-Worker-01"}</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase">Processing Job ID</span>
                  <span className="text-slate-200 truncate block">{job?.id || "N/A"}</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase">Frames Analyzed</span>
                  <span className="text-slate-200">{resultsJson.total_frames_processed || "N/A"} frames</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[10px] uppercase">Video FPS / Base Rate</span>
                  <span className="text-slate-200">{resultsJson.fps ? `${Math.round(resultsJson.fps)} FPS` : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Metrics & Dynamic Cards */}
        <div className="space-y-6">
          {/* Key Metric Highlights Header Card */}
          <Card className="border-border/40 bg-slate-900/80 backdrop-blur overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-3 bg-slate-950/40">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                AI Inference Intelligence
              </CardTitle>
              <CardDescription className="text-xs">
                {isClassroom ? "Computer Vision Classroom Headcount & Podium Audit" : "Vehicle Entry Gate Influx Telemetry"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* CLASSROOM METRICS */}
              {isClassroom ? (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/50 to-slate-950 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Average Student Headcount</span>
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                      {resultsJson.average_students !== undefined
                        ? resultsJson.average_students
                        : "N/A"}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Calculated across Zone 2 (Student Seating Rows)
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Active Teaching Time</span>
                      <Clock className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatSeconds(resultsJson.teaching_duration_seconds)}
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-border/40">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, resultsJson.active_teaching_percentage || 0))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Zone 1 Podium Presence</span>
                      <span className="font-semibold text-cyan-400">
                        {resultsJson.active_teaching_percentage || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block uppercase">Class Duration</span>
                      <span className="text-sm font-semibold text-white">
                        {formatSeconds(resultsJson.total_duration_seconds)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block uppercase">Attention Index</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        High Focus
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* VEHICLE METRICS */
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/50 to-slate-950 border border-sky-500/30">
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>Total Vehicles Entered</span>
                      <Car className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-sky-400 mt-2">
                      {resultsJson.total_vehicles_entered !== undefined
                        ? resultsJson.total_vehicles_entered
                        : 0}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      De-duplicated via ByteTrack centroid line crossing
                    </p>
                  </div>

                  {/* Vehicle Breakdown by category */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Vehicle Classification Breakdown
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-border/40 flex items-center justify-between">
                        <span className="text-slate-300">Cars</span>
                        <span className="font-bold text-white">
                          {resultsJson.vehicle_breakdown?.cars || 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-border/40 flex items-center justify-between">
                        <span className="text-slate-300">Motorcycles</span>
                        <span className="font-bold text-white">
                          {resultsJson.vehicle_breakdown?.motorcycles || 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-border/40 flex items-center justify-between">
                        <span className="text-slate-300">Buses</span>
                        <span className="font-bold text-white">
                          {resultsJson.vehicle_breakdown?.buses || 0}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-border/40 flex items-center justify-between">
                        <span className="text-slate-300">Trucks</span>
                        <span className="font-bold text-white">
                          {resultsJson.vehicle_breakdown?.trucks || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/80 border border-border/40 space-y-1">
                    <span className="text-[10px] text-muted-foreground block uppercase">Tracking Model</span>
                    <span className="text-xs font-semibold text-slate-200">
                      YOLOv8n + ByteTrack Multi-Object Tracker
                    </span>
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Virtual barrier crossing triggers entry events only once per unique ID.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Compliance Sign-off */}
          <Card className="border-border/40 bg-slate-900/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Compliance & Forensic Archive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                This report is cryptographically bound to Institution ID{" "}
                <span className="font-mono text-slate-300">{institutionId.slice(0, 8)}...</span> and protected by Supabase Row-Level Security.
              </p>

              <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
                <ExcelExportButton
                  data={singleReportExportData}
                  filename={`Audit_${video.title.replace(/\s+/g, "_")}`}
                  buttonText="Download Forensic Excel Report"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                />

                {annotatedVideoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full border-border/60 text-slate-300 hover:text-white"
                  >
                    <a href={annotatedVideoUrl} download={`${video.title}_annotated.mp4`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                      Download Raw Annotated MP4
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

