import Link from "next/link";
import { Car, ArrowLeft, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ParkingPage() {
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

      <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Parking & Vehicle Access Intelligence</h1>
              <Badge variant="success">ANPR Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automated Number Plate Recognition (ANPR), barrier control, and perimeter parking occupancy logs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Car className="h-4 w-4 text-emerald-400" />
              Occupied Slots
            </CardTitle>
            <CardDescription>Zone A & B Main Campus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">245 / 300</div>
            <p className="text-xs text-muted-foreground mt-1">81% capacity</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Whitelisted Plates Logged
            </CardTitle>
            <CardDescription>Faculty & Registered Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">401</div>
            <p className="text-xs text-emerald-400 mt-1">Auto-barrier dispatched</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Unauthorized Visitors
            </CardTitle>
            <CardDescription>Security gate hold queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">28</div>
            <p className="text-xs text-amber-400 mt-1">Temporary pass issued</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

