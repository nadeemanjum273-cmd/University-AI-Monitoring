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
  BarChart3,
  TrendingUp,
  GraduationCap,
  Car,
  Clock,
  Layers,
  Building2,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

export const metadata = {
  title: "Agency Analytics | Campus AI",
};

export default async function AgencyAnalyticsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.role !== "agency_admin") {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch institutions and video job stats across all clients
  const { data: institutions } = await supabase
    .from("institutions")
    .select("*, profiles(*), videos(*)");

  const instList = institutions || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated cross-campus AI surveillance metrics, inference load, and client utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 shadow-sm py-1.5 px-3">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            Last 30 Days Telemetry
          </Badge>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inferences
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">42,850</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Classroom Hours
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,240 hrs</div>
            <p className="text-xs text-slate-500 mt-1">Student presence & teaching audits</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gate Influx Events
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Car className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">18,920</div>
            <p className="text-xs text-slate-500 mt-1">ByteTrack virtual barrier crossings</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Processing Time
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">4.2s / min</div>
            <p className="text-xs text-slate-500 mt-1">YOLOv8 frame stride acceleration</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Utilization Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            University Client Utilization Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Resource usage, camera density, and AI storage quotas per enrolled client tenant.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="py-3 px-4">University Name</th>
                <th className="py-3 px-4">Enrolled Admin</th>
                <th className="py-3 px-4">Videos Processed</th>
                <th className="py-3 px-4">Storage Usage</th>
                <th className="py-3 px-4">Tier Status</th>
                <th className="py-3 px-4 text-right">Quota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instList.map((inst: any) => {
                const videoCount = inst.videos?.length || 0;
                return (
                  <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      {inst.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {inst.profiles?.[0]?.email || "Admin unassigned"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">
                      {videoCount} videos
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {(videoCount * 45).toFixed(0)} MB / 50 GB
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-medium text-[11px]">
                        Enterprise Tier
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold text-emerald-600 text-xs">Healthy (12%)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

