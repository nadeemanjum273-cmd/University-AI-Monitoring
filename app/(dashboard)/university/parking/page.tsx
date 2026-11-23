import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Car, ArrowLeft, ShieldCheck, Video, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Parking & Vehicle AI | Campus AI",
};

export default async function ParkingPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const institutionId = profile.institution_id;
  const supabase = await createClient();

  // Query actual completed vehicle videos for this institution
  const { data: rawVideos } = await supabase
    .from("videos")
    .select("*, processing_jobs(*)")
    .eq("institution_id", institutionId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const vehicleVideos = (rawVideos || []).filter((v) => {
    const job = Array.isArray(v.processing_jobs) ? v.processing_jobs[0] : v.processing_jobs;
    const res = job?.results_json || {};
    return (
      res.video_type === "vehicle" ||
      res.total_vehicles_entered !== undefined ||
      v.title.toLowerCase().includes("gate") ||
      v.title.toLowerCase().includes("car") ||
      v.title.toLowerCase().includes("vehicle") ||
      v.title.toLowerCase().includes("parking")
    );
  });

  const gatesCount = vehicleVideos.length;
  let totalEntries = 0;
  let vehicleLog: any[] = [];

  if (vehicleVideos.length > 0) {
    const job = Array.isArray(vehicleVideos[0].processing_jobs)
      ? vehicleVideos[0].processing_jobs[0]
      : vehicleVideos[0].processing_jobs;
    const res = job?.results_json || {};
    totalEntries = Number(res.total_vehicles_entered) || (res.vehicle_log?.length ?? 1);
    vehicleLog = Array.isArray(res.vehicle_log) ? res.vehicle_log : [];
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm">
          <Link href="/university" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </Button>

        <Badge className="bg-sky-50 text-sky-700 border-sky-200 shadow-none font-semibold text-xs py-1 px-3">
          ByteTrack Gate Boundary Ingress Active
        </Badge>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Gate & Vehicle Influx AI</h1>
            <p className="text-sm text-slate-500 mt-1">
              Virtual barrier crossing detection, ANPR license plate recognition, and real-time ingress event logging.
            </p>
          </div>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monitored Gates
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Video className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {gatesCount} {gatesCount === 1 ? "Gate Barrier" : "Gate Barriers"}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {gatesCount > 0 ? "Real-time barrier line tracking" : "No vehicle video uploaded"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recorded Influx Count
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Car className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {totalEntries} {totalEntries === 1 ? "Vehicle" : "Vehicles"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalEntries > 0 ? "De-duplicated barrier line crossings" : "Awaiting vehicle passages"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Barrier Status
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {totalEntries > 0 ? "100% Cleared" : "Ready"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {vehicleLog.length > 0
                ? `Latest: ${vehicleLog[0].license_plate} (${vehicleLog[0].direction})`
                : "ANPR Active on Barrier"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Recordings List */}
      {gatesCount > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Gate Barrier Surveillance Streams</h3>
          <div className="divide-y divide-slate-100">
            {vehicleVideos.map((v) => (
              <div key={v.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{v.title}</h4>
                    <p className="text-xs text-slate-500">
                      Main Entry Barrier • {totalEntries} Vehicle Cleared • ANPR Plate Logged
                    </p>
                  </div>
                </div>

                <Button size="sm" asChild className="bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold">
                  <Link href={`/university/reports/${v.id}`}>
                    <span>View Inspection</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">No gate surveillance videos uploaded yet.</p>
          <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold">
            <Link href="/university/videos">Upload Gate Video</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
