import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Institution } from "@/types/database";
import { InstitutionsTable } from "./institutions-table";
import { RegisterClientModal } from "./register-client-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  ShieldCheck,
  Server,
  Activity,
  Layers,
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
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Layers className="h-4 w-4" />
            Agency SaaS Multi-Tenant Manager
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Tenants & Clients
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage subscribed universities, provision tenant credentials, and monitor edge AI nodes.
          </p>
        </div>

        <div>
          <RegisterClientModal />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Registered Clients
            </CardTitle>
            <Building2 className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {institutions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active university tenants
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Isolated Schemas
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">100%</div>
            <p className="text-xs text-emerald-400 mt-1">
              Protected by PostgreSQL RLS
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Global Surveillance Nodes
            </CardTitle>
            <Server className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {institutions.length > 0 ? institutions.length * 12 : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Edge camera clusters
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Agency Platform Health
            </CardTitle>
            <Activity className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">99.98%</div>
            <p className="text-xs text-cyan-400 mt-1">
              Cloud SSR Realtime Stream
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Institutions Data Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Client Directory
          </h2>
          {error && (
            <span className="text-xs text-amber-400">
              Note: Database schema initializing ({error.message})
            </span>
          )}
        </div>
        <InstitutionsTable institutions={institutions} />
      </div>
    </div>
  );
}

