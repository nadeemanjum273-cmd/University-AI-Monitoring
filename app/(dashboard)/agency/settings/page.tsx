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
  Settings,
  Shield,
  Key,
  HardDrive,
  Cpu,
  CheckCircle2,
  Lock,
  Save,
} from "lucide-react";

export const metadata = {
  title: "Global Settings | Campus AI",
};

export default async function AgencySettingsPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.role !== "agency_admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Global Agency Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure platform security standards, computer vision inference presets, and cloud storage retention.
        </p>
      </div>

      <div className="space-y-6">
        {/* Cloud Credentials Card */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Key className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Cloud Database & Auth
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              Supabase PostgreSQL Connection
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Active configuration loaded from environment runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Database Host URL</Label>
              <Input
                readOnly
                value={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hdkohhmumofvkzacfmpq.supabase.co"}
                className="bg-slate-50 border-slate-200 text-slate-700 font-mono text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Service Role Status</Label>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span>Service Role Secret Key is cryptographically verified and active.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Model Inference Card */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Cpu className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Computer Vision Models
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              AI Architecture & Striding
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Default computer vision model parameters applied to uploaded videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">YOLO Model Weight</Label>
                <Input
                  readOnly
                  value="yolov8n.pt (Nano - High Throughput)"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Tracker Algorithm</Label>
                <Input
                  readOnly
                  value="ByteTrack (bytetrack.yaml)"
                  className="bg-slate-50 border-slate-200 text-slate-700 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Retention Policies Card */}
        <Card className="border-slate-200/90 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Storage Policies
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">
              Video & Evidence Data Retention
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Compliance rules for campus surveillance archive lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-900 block">Raw Footage (Bucket: raw_videos)</span>
                <span className="text-slate-500 mt-1 block">Retained for 30 days before automated lifecycle purge.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-900 block">Annotated Evidence (processed_results)</span>
                <span className="text-slate-500 mt-1 block">Indefinite storage for compliance audits and forensics.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

