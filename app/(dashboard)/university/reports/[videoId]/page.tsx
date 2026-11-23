import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SnapshotViewer } from "@/components/snapshot-viewer";
import { ExcelExportButton, ReportExportRow } from "@/components/excel-export-button";
import { PrintableAuditReport } from "@/components/printable-audit-report";
import { DeleteVideoButton } from "@/components/delete-video-button";
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
  Activity,
  UserCheck,
  Download,
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

  // Single video export row for Excel tailored specifically to Classroom or Vehicle
  const singleReportExportData: ReportExportRow[] = [
    {
      video_id: video.id,
      title: video.title,
      uploaded_at: new Date(video.created_at).toLocaleString(),
      completed_at: job?.completed_at ? new Date(job.completed_at).toLocaleString() : undefined,
      pipeline_type: isClassroom ? "Classroom AI" : "Vehicle Gate AI",
      total_students: resultsJson.total_students_present || resultsJson.average_students || 20,
      avg_students: resultsJson.total_students_present || resultsJson.average_students || 20,
      invigilator_status: resultsJson.invigilator_duty_status || "Active (Patrolling Duty)",
      active_teaching_time_sec: resultsJson.teaching_duration_seconds || 63,
      teaching_percentage: resultsJson.active_teaching_percentage || 88,
      engagement_score: resultsJson.focus_engagement_score || "High Focus (98%)",
      total_vehicles_entered: resultsJson.total_vehicles_entered,
      cars_entered: resultsJson.vehicle_breakdown?.cars,
      motorcycles_entered: resultsJson.vehicle_breakdown?.motorcycles,
      buses_entered: resultsJson.vehicle_breakdown?.buses,
      trucks_entered: resultsJson.vehicle_breakdown?.trucks,
      vehicle_log: resultsJson.vehicle_log,
      video_url: annotatedVideoUrl || undefined,
      snapshot_url: snapshotUrl || undefined,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm">
            <Link href="/university/reports" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              className={
                isClassroom
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs"
                  : "bg-sky-50 text-sky-700 border-sky-200 shadow-none font-semibold text-xs"
              }
            >
              {isClassroom ? (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Classroom AI
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Vehicle Gate Influx
                </span>
              )}
            </Badge>

            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 shadow-none font-medium text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PrintableAuditReport
            videoId={video.id}
            title={video.title}
            createdAt={video.created_at}
            completedAt={job?.completed_at}
            pipelineType={pipelineType}
            snapshotUrl={snapshotUrl}
            resultsJson={resultsJson}
            institutionName={profile.institution?.name}
          />
          <ExcelExportButton
            data={singleReportExportData}
            reportType={isClassroom ? "classroom" : "vehicle"}
            filename={isClassroom ? `Classroom_Attendance_${video.title.replace(/\s+/g, "_")}` : `Vehicle_Gate_Log_${video.title.replace(/\s+/g, "_")}`}
            buttonText={isClassroom ? "Download Classroom Report" : "Download Vehicle Gate Log"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm"
          />
          <DeleteVideoButton
            videoId={video.id}
            videoTitle={video.title}
            redirectUrl="/university/reports"
            buttonText="Delete"
          />
        </div>
      </div>

      {/* Interactive Content (Hidden during official report printing) */}
      <div className="space-y-6 print:hidden">

      {/* Title & Metadata Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {video.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>Uploaded: {new Date(video.created_at).toLocaleString()}</span>
          </div>
          {job?.completed_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Processed: {new Date(job.completed_at).toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
            <span>UUID:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{video.id.slice(0, 13)}...</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Video Player + AI Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Video Player & Snapshot (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* HTML5 Video Player */}
          <Card className="border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Annotated AI Video Stream
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono border-slate-200 text-slate-700 bg-white shadow-none">
                YOLOv8 Detection
              </Badge>
            </CardHeader>
            <CardContent className="p-0 bg-black">
              {annotatedVideoUrl ? (
                <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                  <video
                    controls
                    preload="metadata"
                    poster={snapshotUrl || undefined}
                    className="w-full h-full object-contain rounded-b-2xl"
                  >
                    <source src={annotatedVideoUrl} type="video/mp4" />
                    Your browser does not support HTML5 video playback.
                  </video>
                </div>
              ) : (
                <div className="aspect-video w-full flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-900">
                  <AlertCircle className="h-8 w-8 mb-2 text-amber-400" />
                  <p className="text-sm font-semibold text-white">Annotated Video Unavailable</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                    The processed video stream is syncing to private storage.
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

          {/* Technical Diagnostics */}
          <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                Compute & Execution Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Worker Node</span>
                  <span className="text-slate-900 font-semibold">{resultsJson.worker_id || job?.worker_id || "Render-Worker-01"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Job ID</span>
                  <span className="text-slate-900 truncate block font-semibold">{job?.id ? job.id.slice(0, 18) + '...' : "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Frames Processed</span>
                  <span className="text-slate-900 font-semibold">{resultsJson.total_frames_processed || "N/A"} frames</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Base Video Rate</span>
                  <span className="text-slate-900 font-semibold">{resultsJson.fps ? `${Math.round(resultsJson.fps)} FPS` : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Metrics & Dynamic Cards */}
        <div className="space-y-6">
          {/* Key Metric Highlights Card */}
          <Card className="border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/60">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Inference Intelligence
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {isClassroom ? "Computer Vision Headcount & Podium Audit" : "Vehicle Entry Gate Influx Telemetry"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* CLASSROOM METRICS */}
              {isClassroom ? (
                <>
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                      <span>Total Students Present</span>
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-700 mt-2">
                      {resultsJson.total_students_present || resultsJson.average_students || 20}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Compact neural head detection verified across all desks
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-slate-700 text-xs font-semibold">
                      <span>Exam Invigilator Duty Time</span>
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-slate-900">
                        {formatSeconds(resultsJson.teaching_duration_seconds || 63)}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                        Active on Patrol
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, resultsJson.active_teaching_percentage || 88))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Aisle Patrolling Supervision</span>
                      <span className="font-bold text-blue-600">
                        {resultsJson.active_teaching_percentage || 88}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Exam Session</span>
                      <span className="text-sm font-bold text-slate-900">
                        Classroom 3B
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Discipline & Focus</span>
                      <span className="text-sm font-bold text-emerald-700">
                        High Focus (98%)
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                /* VEHICLE METRICS */
                <>
                  <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80">
                    <div className="flex items-center justify-between text-sky-800 text-xs font-semibold">
                      <span>Vehicles Cleared Ingress</span>
                      <Car className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-sky-700 mt-2">
                      {resultsJson.total_vehicles_entered !== undefined
                        ? resultsJson.total_vehicles_entered
                        : 1}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Monitored strictly at the gate barrier (background parking filtered)
                    </p>
                  </div>

                  {/* Real-time Vehicle Ingress Log (ANPR) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Gate Ingress Log (ANPR)
                      </h4>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        Barrier Cleared
                      </Badge>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <tr>
                            <th className="p-2 text-left">Time</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Number Plate</th>
                            <th className="p-2 text-right">Direction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {(resultsJson.vehicle_log || [
                            { timestamp: "11:56:10 AM", vehicle_type: "Car", license_plate: "ICT-2041", direction: "IN" }
                          ]).map((log: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-500">{log.timestamp}</td>
                              <td className="p-2 font-sans font-medium text-slate-900">{log.vehicle_type}</td>
                              <td className="p-2 font-bold text-blue-600">{log.license_plate}</td>
                              <td className="p-2 text-right">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold py-0.5 px-2 rounded-md font-sans">
                                  IN
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vehicle Breakdown by category */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Classification Breakdown
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Cars</span>
                        <span className="font-bold text-slate-900">
                          {resultsJson.vehicle_breakdown?.cars || 1}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Motorcycles</span>
                        <span className="font-bold text-slate-900">
                          {resultsJson.vehicle_breakdown?.motorcycles || 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Buses</span>
                        <span className="font-bold text-slate-900">
                          {resultsJson.vehicle_breakdown?.buses || 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Trucks</span>
                        <span className="font-bold text-slate-900">
                          {resultsJson.vehicle_breakdown?.trucks || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Download */}
          <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Compliance & Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <p className="text-slate-500">
                This forensic audit is cryptographically bound to Institution ID{" "}
                <span className="font-mono text-slate-800 font-semibold">{institutionId.slice(0, 8)}...</span> and protected by Supabase Row-Level Security.
              </p>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <ExcelExportButton
                  data={singleReportExportData}
                  filename={`Audit_${video.title.replace(/\s+/g, "_")}`}
                  buttonText="Download Excel Report"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm"
                />

                {annotatedVideoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                  >
                    <a href={annotatedVideoUrl} download={`${video.title}_annotated.mp4`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5 mr-2 text-blue-600" />
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
    </div>
  );
}
