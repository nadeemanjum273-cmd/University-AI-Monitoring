import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportsList, EnrichedReportItem } from "@/components/reports-list";
import {
  FileText,
  ArrowLeft,
  GraduationCap,
  Car,
  ShieldCheck,
  CheckCircle2,
  Video,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "AI Surveillance Reports | Campus Security",
  description: "Forensic analytics, detection timelines, and exportable AI surveillance reports.",
};

export default async function ReportsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  // Ensure user has university or agency admin privileges
  if (profile.role !== "university_admin" && profile.role !== "agency_admin") {
    redirect("/login");
  }

  const institutionId = profile.institution_id;
  const institutionName = profile.institution?.name || "Campus Surveillance Unit";

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

  // Fetch all completed videos joined with processing_jobs for this institution
  const { data: rawVideos, error } = await supabase
    .from("videos")
    .select("*, processing_jobs(*)")
    .eq("institution_id", institutionId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to query completed reports:", error);
  }

  const videos = rawVideos || [];

  // Generate signed URLs in parallel for snapshots and annotated videos
  const enrichedReports: EnrichedReportItem[] = await Promise.all(
    videos.map(async (v) => {
      const job = Array.isArray(v.processing_jobs)
        ? v.processing_jobs[0]
        : v.processing_jobs;

      const resJson = job?.results_json || {};

      let thumbnailUrl = resJson.snapshot_url || null;
      let annotatedVideoUrl = resJson.annotated_video_url || null;

      // If storage paths are provided, obtain fresh signed URLs (valid 24 hours)
      if (resJson.snapshot_storage_path) {
        try {
          const { data: signData } = await supabase.storage
            .from("processed_results")
            .createSignedUrl(resJson.snapshot_storage_path, 86400);
          if (signData?.signedUrl) {
            thumbnailUrl = signData.signedUrl;
          }
        } catch {
          // fallback to resJson.snapshot_url
        }
      }

      if (resJson.annotated_storage_path) {
        try {
          const { data: signData } = await supabase.storage
            .from("processed_results")
            .createSignedUrl(resJson.annotated_storage_path, 86400);
          if (signData?.signedUrl) {
            annotatedVideoUrl = signData.signedUrl;
          }
        } catch {
          // fallback to resJson.annotated_video_url
        }
      }

      // Infer pipeline type
      let pipelineType: "classroom" | "vehicle" | "unknown" = "unknown";
      if (resJson.video_type === "classroom" || resJson.average_students !== undefined) {
        pipelineType = "classroom";
      } else if (resJson.video_type === "vehicle" || resJson.total_vehicles_entered !== undefined) {
        pipelineType = "vehicle";
      } else {
        const titleLower = v.title.toLowerCase();
        if (titleLower.includes("gate") || titleLower.includes("car") || titleLower.includes("vehicle") || titleLower.includes("parking")) {
          pipelineType = "vehicle";
        } else {
          pipelineType = "classroom";
        }
      }

      return {
        id: v.id,
        title: v.title,
        created_at: v.created_at,
        completed_at: job?.completed_at || undefined,
        pipeline_type: pipelineType,
        thumbnail_url: thumbnailUrl,
        annotated_video_url: annotatedVideoUrl,
        results_json: resJson,
        status: v.status,
      };
    })
  );

  // Compute summary stats
  const totalReports = enrichedReports.length;
  const classroomCount = enrichedReports.filter((r) => r.pipeline_type === "classroom").length;
  const vehicleCount = enrichedReports.filter((r) => r.pipeline_type === "vehicle").length;
  const totalVehiclesSum = enrichedReports
    .filter((r) => r.pipeline_type === "vehicle")
    .reduce((sum, r) => sum + (Number(r.results_json?.total_vehicles_entered) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="border-border/60">
          <Link href="/university" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </Button>

        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/20 px-3 py-1">
          {institutionName}
        </Badge>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 p-6 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Surveillance Reports & Analytics</h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                Live Forensics
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review completed YOLOv8 classroom attendances, ByteTrack vehicle logs, and download compliance spreadsheets.
            </p>
          </div>
        </div>

        <Button variant="outline" asChild className="border-border/60 text-slate-300 hover:text-white self-start sm:self-auto">
          <Link href="/university/videos" className="gap-2">
            <Video className="h-4 w-4 text-cyan-400" />
            Upload New Video
          </Link>
        </Button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Completed Audits</span>
              <FileText className="h-4 w-4 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for audit & compliance</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Classroom Sessions</span>
              <GraduationCap className="h-4 w-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{classroomCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Student & podium zone analyses</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Vehicle Entries</span>
              <Car className="h-4 w-4 text-sky-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-400">{totalVehiclesSum}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {vehicleCount} gate camera audits</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Data Protection</span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">PostgreSQL RLS</div>
            <p className="text-xs text-indigo-300 mt-1">Signed URL authenticated access</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Listing with Search, Tabs, View Toggle, and Excel Export */}
      <ReportsList reports={enrichedReports} />
    </div>
  );
}
