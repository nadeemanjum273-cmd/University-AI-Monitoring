import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Bell,
  School,
  Lock,
  Mail,
  CheckCircle2,
  HardDrive,
  Save,
} from "lucide-react";

export const metadata = {
  title: "Campus Settings | Campus AI",
};

export default async function UniversitySettingsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const institution = profile.institution;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Security Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your institutional identity, automated surveillance thresholds, and notification alerts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Institution Info Card */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <School className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Tenant Identity
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              Enrolled Institution Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Assigned by your managing agency administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Institution Name</Label>
                <Input
                  readOnly
                  value={institution?.name || "Campus Surveillance Unit"}
                  className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Tenant UUID</Label>
                <Input
                  readOnly
                  value={profile.institution_id || "Unassigned"}
                  className="bg-slate-50 border-slate-200 text-slate-600 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Designated Campus Administrator</Label>
              <Input
                readOnly
                value={profile.email}
                className="bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Automated Alert Rules Card */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Bell className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Automated Incident Thresholds
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              Real-time Alert Triggers
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Triggers notifications when YOLOv8 detects anomalies in video streams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-semibold text-slate-900 block">Classroom Inactivity Alert</span>
                <span className="text-slate-500 block">Flags session if podium area remains unoccupied for more than 15 minutes during scheduled classes.</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-medium mt-1">Enabled</Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-semibold text-slate-900 block">Gate Congestion Spike</span>
                <span className="text-slate-500 block">Notifies security dispatch when vehicle influx exceeds 20 vehicles/minute across barrier lines.</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-medium mt-1">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Isolation Status */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Data Protection
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              Tenant Isolation & Encryption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>All video records are cryptographically scoped to your <code>institution_id</code>.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Direct-to-cloud uploads use authenticated signed tokens bypassing intermediary servers.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Annotated videos & forensic snapshots are stored in private Supabase buckets.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

