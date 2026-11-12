import Link from "next/link";
import { GraduationCap, ArrowLeft, Users, AlertCircle, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClassroomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild className="border-border/60">
          <Link href="/university" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Classroom AI Vision Stream</h1>
              <Badge variant="info">Phase 3 Pipeline</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automated student attendance tracking, examination room anomaly alerts, and behavioral monitoring.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-400" />
              Live Lecture Halls
            </CardTitle>
            <CardDescription>Monitored video feeds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">12 / 12</div>
            <p className="text-xs text-emerald-400 mt-1">100% feed uptime</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Realtime Headcount
            </CardTitle>
            <CardDescription>Cumulative student count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">418</div>
            <p className="text-xs text-muted-foreground mt-1">YOLOv8 pose & face detection</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Prohibited Items Flagged
            </CardTitle>
            <CardDescription>Active exam session alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">2</div>
            <p className="text-xs text-amber-400 mt-1">Mobile device detected in Hall 3</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

