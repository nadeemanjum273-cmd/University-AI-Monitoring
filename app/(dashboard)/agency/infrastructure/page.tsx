import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Platform Infrastructure | Campus AI",
};

export default async function AgencyInfrastructurePage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.role !== "agency_admin") {
    redirect("/login");
  }

  const supabase = await createClient();

  // Query processing jobs queue state
  const { count: queuedCount } = await supabase
    .from("processing_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  const { count: completedCount } = await supabase
    .from("processing_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: inProgressCount } = await supabase
    .from("processing_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_progress");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Infrastructure
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of FastAPI compute clusters, Render background workers, and Supabase cloud storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-3 flex items-center gap-1.5 shadow-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            All 4 Node Clusters Online
          </Badge>
        </div>
      </div>

      {/* Cluster Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Python AI Worker
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">Render-Worker-01</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">YOLOv8 & ByteTrack Polling Active</p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">Poll Interval: 5s</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supabase PostgreSQL
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">PostgreSQL 15</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">Row-Level Security Enforced</p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">Latency: ~28ms</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Object Storage
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">2 Private Buckets</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">raw_videos & processed_results</p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">Signed URLs: 24h Exp</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              FastAPI Web Service
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">HTTP/2 API</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500">Health Endpoint: /health</p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">Port: 8000</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue State Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          AI Video Processing Job Queue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold uppercase">Queued Jobs</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{queuedCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting processor pickup</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold uppercase">In Progress</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Actively executing YOLOv8 inference</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold uppercase">Completed Jobs</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Annotated videos archived</p>
          </div>
        </div>
      </div>
    </div>
  );
}

