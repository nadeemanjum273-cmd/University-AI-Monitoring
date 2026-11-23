import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Video,
  Radio,
  Eye,
  ShieldCheck,
  GraduationCap,
  Car,
  Layers,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
} from "lucide-react";

export const metadata = {
  title: "Live Camera Streams | Campus AI",
};

export default async function UniversityCamerasPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const institutionId = profile.institution_id;
  const institutionName = profile.institution?.name || "Campus Surveillance Unit";

  const supabase = await createClient();

  // Query actual video feeds for this institution
  const { data: rawVideos } = await supabase
    .from("videos")
    .select("*, processing_jobs(*)")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: false });

  const videos = rawVideos || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm">
          <Link href="/university" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </Button>

        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 shadow-sm gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {videos.filter((v) => v.status === "completed").length} Active Vision Feeds
        </Badge>
      </div>

      {/* Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Surveillance Nodes</h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitored edge camera feeds connected to YOLOv8 inference for {institutionName}.
            </p>
          </div>
        </div>

        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-xs font-semibold">
          <Link href="/university/videos" className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload New Video Feed
          </Link>
        </Button>
      </div>

      {/* Cameras Grid */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Video className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Surveillance Feeds Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload MP4 surveillance recordings or connect edge RTSP nodes to start automated AI analysis.
          </p>
          <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
            <Link href="/university/videos">Upload Video Stream</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v) => {
            const job = Array.isArray(v.processing_jobs) ? v.processing_jobs[0] : v.processing_jobs;
            const res = job?.results_json || {};
            const isClass =
              res.video_type === "classroom" ||
              res.average_students !== undefined ||
              res.total_students_present !== undefined ||
              v.title.toLowerCase().includes("class");

            const isVeh =
              res.video_type === "vehicle" ||
              res.total_vehicles_entered !== undefined ||
              v.title.toLowerCase().includes("gate") ||
              v.title.toLowerCase().includes("car") ||
              v.title.toLowerCase().includes("vehicle") ||
              v.title.toLowerCase().includes("parking");

            const pipelineName = isClass
              ? "Classroom AI (Headcount & Invigilator)"
              : isVeh
              ? "Vehicle AI (ByteTrack & ANPR)"
              : "Standard Surveillance";

            return (
              <Card
                key={v.id}
                className="overflow-hidden border-slate-200 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Video header */}
                  <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    {res.snapshot_url ? (
                      <img
                        src={res.snapshot_url}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Video className="h-8 w-8 text-slate-600" />
                        <span className="text-xs font-mono">Stream ID: {v.id.slice(0, 8)}</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-600 text-white border-0 gap-1 text-[10px] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {v.status === "completed" ? "ONLINE" : v.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/60 text-white backdrop-blur border-0 text-[10px] font-mono">
                        30 FPS &bull; FHD
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        {isClass ? <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> : <Car className="h-3.5 w-3.5 text-sky-600" />}
                        {pipelineName}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-600">
                      {isClass ? (
                        <span>
                          <strong className="text-emerald-700 font-bold">{res.total_students_present || res.average_students || 20} Students</strong> present &bull; Invigilator active
                        </span>
                      ) : isVeh ? (
                        <span>
                          <strong className="text-sky-700 font-bold">{res.total_vehicles_entered || 1} Vehicle(s)</strong> cleared barrier &bull; Plate logged
                        </span>
                      ) : (
                        <span>Surveillance stream recorded</span>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold justify-between"
                  >
                    <Link href={`/university/reports/${v.id}`}>
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Inspect Stream Telemetry
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
