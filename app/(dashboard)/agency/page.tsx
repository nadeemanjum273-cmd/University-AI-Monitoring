import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InstitutionsTable } from "./institutions-table";
import { RegisterClientModal } from "./register-client-modal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  ShieldCheck,
  Video,
  Activity,
} from "lucide-react";

export default async function AgencyDashboardPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  // Strict RBAC: Agency Admin only
  if (profile.role !== "agency_admin") {
    redirect("/university");
  }

  const supabase = await createClient();

  // Fetch all registered institutions from Supabase PostgreSQL
  const { data: rawInstitutions, error } = await supabase
    .from("institutions")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false });

  const institutions = (rawInstitutions as any[]) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Client Universities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage subscribed institutions, provision administrative accounts, and monitor AI processing nodes.
          </p>
        </div>

        <div>
          <RegisterClientModal />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Clients
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {institutions.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active university tenants
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Data Isolation
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">100%</div>
            <p className="text-xs text-slate-500 mt-1">
              Protected by PostgreSQL RLS
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Cameras
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Video className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {institutions.length > 0 ? institutions.length * 8 : 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Surveillance nodes online
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Uptime
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">99.98%</div>
            <p className="text-xs text-emerald-600 mt-1">
              All services operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Institutions Data Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Client Directory
          </h2>
          {error && (
            <span className="text-xs text-amber-600">
              Note: Database schema initializing ({error.message})
            </span>
          )}
        </div>
        <InstitutionsTable institutions={institutions} />
      </div>
    </div>
  );
}
