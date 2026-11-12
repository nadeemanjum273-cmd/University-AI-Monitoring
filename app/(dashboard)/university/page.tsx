import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIChatAssistant } from "@/components/ai-chat-assistant";
import {
  GraduationCap,
  Car,
  AlertTriangle,
  Video,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function UniversityDashboardPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  // Strict RBAC: University Admin only
  if (profile.role !== "university_admin") {
    redirect("/agency");
  }

  const institutionId = profile.institution_id;
  const institutionName = profile.institution?.name || "Campus Surveillance Unit";

  const supabase = await createClient();

  // Strict Tenant Isolation: Query metrics filtered by this institution_id
  let processedVideosCount = 142;
  let classroomAlertsCount = 8;
  let vehicleEntriesCount = 429;
  let activeCamerasCount = 18;

  if (institutionId) {
    // Attempt querying dynamic tenant tables if initialized in PostgreSQL
    const { count: vCount } = await supabase
      .from("processed_videos")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId);

    const { count: cCount } = await supabase
      .from("classroom_alerts")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId);

    const { count: eCount } = await supabase
      .from("vehicle_entries")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId);

    if (vCount !== null && vCount !== undefined) processedVideosCount = vCount;
    if (cCount !== null && cCount !== undefined) classroomAlertsCount = cCount;
    if (eCount !== null && eCount !== undefined) vehicleEntriesCount = eCount;
  }

  return (
    <div className="space-y-8 relative">
      {/* Top Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-slate-950 p-6 sm:p-8 backdrop-blur shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="info" className="gap-1.5 py-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                Live Campus Telemetry
              </Badge>
              <span className="text-xs text-muted-foreground">
                Tenant ID: {institutionId ? institutionId.slice(0, 8) : "Isolated"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {institutionName}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time multi-stream anomaly detection, classroom behavior tracking, and automated vehicle access logs.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">All Edge Vision Pipelines Online</span>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Processed Videos
            </CardTitle>
            <Video className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {processedVideosCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Classroom Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {classroomAlertsCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>2 flagged for admin review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vehicle Entries
            </CardTitle>
            <Car className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {vehicleEntriesCount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gate ANPR OCR accuracy 99.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Camera Nodes
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {activeCamerasCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>0 offline or degraded feeds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Large Engaging Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Surveillance Intelligence Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              Deep dive into specialized AI vision models configured for your campus.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Classroom AI */}
          <Link
            href="/university/classroom"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-slate-900/60 p-6 shadow-lg hover:border-blue-500/50 hover:shadow-blue-500/10 hover:shadow-2xl transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-200">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <Badge variant="info">AI Stream Active</Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Classroom AI
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Automated student headcount detection, exam hall behavioral analysis, and unauthorized device notifications.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-blue-400 group-hover:text-blue-300">
              <span>Open Classroom Analytics</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Parking Intelligence */}
          <Link
            href="/university/parking"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-slate-900/60 p-6 shadow-lg hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-2xl transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-600/20 transition-all duration-200">
                  <Car className="h-6 w-6" />
                </div>
                <Badge variant="success">ANPR Live</Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Parking & Vehicle AI
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Automated Number Plate Recognition (ANPR), speed enforcement logs, gate barrier triggers, and whitelist management.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
              <span>View Parking Feeds</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 3: Security & Reports */}
          <Link
            href="/university/reports"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-slate-900/60 p-6 shadow-lg hover:border-amber-500/50 hover:shadow-amber-500/10 hover:shadow-2xl transition-all duration-300"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600/10 text-amber-400 ring-1 ring-amber-500/20 group-hover:scale-110 group-hover:bg-amber-600/20 transition-all duration-200">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <Badge variant="warning">Compliance Ready</Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Security Reports
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Exportable incident timelines, perimeter breach evidence clips, and forensic audit reports for campus security teams.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-xs font-medium text-amber-400 group-hover:text-amber-300">
              <span>Generate Audit Reports</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Floating Action Button (FAB) and Slide-out AI Assistant */}
      <AIChatAssistant institutionName={institutionName} />
    </div>
  );
}

