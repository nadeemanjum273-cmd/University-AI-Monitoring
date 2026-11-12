"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Grid,
  List,
  GraduationCap,
  Car,
  Clock,
  Users,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileQuestion,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExcelExportButton, ReportExportRow } from "./excel-export-button";

export interface EnrichedReportItem {
  id: string;
  title: string;
  created_at: string;
  completed_at?: string;
  pipeline_type: "classroom" | "vehicle" | "unknown";
  thumbnail_url?: string | null;
  annotated_video_url?: string | null;
  results_json?: any;
  status: string;
}

interface ReportsListProps {
  reports: EnrichedReportItem[];
}

export function ReportsList({ reports }: ReportsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "classroom" | "vehicle">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === "all" ? true : item.pipeline_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [reports, searchTerm, typeFilter]);

  // Prepare data for Excel export
  const exportData: ReportExportRow[] = useMemo(() => {
    return filteredReports.map((r) => {
      const res = r.results_json || {};
      const isClassroom = r.pipeline_type === "classroom";
      const isVehicle = r.pipeline_type === "vehicle";

      return {
        video_id: r.id,
        title: r.title,
        uploaded_at: new Date(r.created_at).toLocaleString(),
        completed_at: r.completed_at ? new Date(r.completed_at).toLocaleString() : undefined,
        pipeline_type: isClassroom ? "Classroom AI" : isVehicle ? "Vehicle Gate AI" : "AI Surveillance",
        status: r.status,
        avg_students: isClassroom ? res.average_students : undefined,
        active_teaching_time_sec: isClassroom ? res.teaching_duration_seconds : undefined,
        teaching_percentage: isClassroom ? res.active_teaching_percentage : undefined,
        total_vehicles_entered: isVehicle ? res.total_vehicles_entered : undefined,
        cars_entered: isVehicle ? res.vehicle_breakdown?.cars : undefined,
        motorcycles_entered: isVehicle ? res.vehicle_breakdown?.motorcycles : undefined,
        buses_entered: isVehicle ? res.vehicle_breakdown?.buses : undefined,
        trucks_entered: isVehicle ? res.vehicle_breakdown?.trucks : undefined,
        video_url: r.annotated_video_url || undefined,
        snapshot_url: r.thumbnail_url || undefined,
      };
    });
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-border/40 backdrop-blur">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search reports by video title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-950/60 border-border/60 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-border/40">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-muted-foreground hover:text-slate-200"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setTypeFilter("classroom")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === "classroom"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                  : "text-muted-foreground hover:text-emerald-300"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Classroom
            </button>
            <button
              onClick={() => setTypeFilter("vehicle")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === "vehicle"
                  ? "bg-sky-950/80 text-sky-300 border border-sky-500/30"
                  : "text-muted-foreground hover:text-sky-300"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              Vehicle Gate
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-border/40">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-800 text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-slate-800 text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Excel Export Button */}
          <ExcelExportButton
            data={exportData}
            filename="AI_Surveillance_Completed_Reports"
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-0"
          />
        </div>
      </div>

      {/* Reports Listing */}
      {filteredReports.length === 0 ? (
        <Card className="border-border/40 bg-card/40 backdrop-blur py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-border/60 text-muted-foreground">
              <FileQuestion className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">No Completed Reports Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchTerm || typeFilter !== "all"
                  ? "No completed reports match your current filter criteria. Try resetting your search."
                  : "AI video processing jobs in progress will appear here automatically once completed."}
              </p>
            </div>
            {(searchTerm || typeFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                }}
                className="border-border/60 text-xs"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const res = report.results_json || {};
            const isClassroom = report.pipeline_type === "classroom";
            const isVehicle = report.pipeline_type === "vehicle";

            return (
              <Card
                key={report.id}
                className="overflow-hidden border-border/40 bg-slate-900/60 hover:border-cyan-500/40 transition-all duration-300 flex flex-col group hover:shadow-lg hover:shadow-cyan-950/20"
              >
                {/* Snapshot Thumbnail / Header */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-border/40">
                  {report.thumbnail_url ? (
                    <img
                      src={report.thumbnail_url}
                      alt={report.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-slate-950">
                      <Layers className="h-8 w-8 mb-2 opacity-40" />
                      <span className="text-xs">Snapshot Unavailable</span>
                    </div>
                  )}

                  {/* Top Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {isClassroom ? (
                      <Badge className="bg-emerald-500/90 text-white font-medium border-0 shadow backdrop-blur flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Classroom AI
                      </Badge>
                    ) : isVehicle ? (
                      <Badge className="bg-sky-500/90 text-white font-medium border-0 shadow backdrop-blur flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        Vehicle Gate
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="backdrop-blur">
                        Surveillance AI
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 backdrop-blur">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  </div>
                </div>

                {/* Card Content & Analytics */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-base leading-snug line-clamp-1 group-hover:text-cyan-300 transition-colors">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(report.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      <span>•</span>
                      <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* AI Extracted Highlights */}
                  <div className="rounded-xl bg-slate-950/70 border border-border/40 p-3 space-y-2">
                    {isClassroom ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Avg Students</span>
                          <span className="text-sm font-bold text-emerald-400">
                            {res.average_students !== undefined ? `${res.average_students} attendees` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Teaching Time</span>
                          <span className="text-sm font-bold text-white">
                            {res.teaching_duration_seconds !== undefined
                              ? `${Math.round(res.teaching_duration_seconds)}s (${res.active_teaching_percentage || 0}%)`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : isVehicle ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Vehicles Counted</span>
                          <span className="text-sm font-bold text-sky-400">
                            {res.total_vehicles_entered !== undefined ? `${res.total_vehicles_entered} entries` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Breakdown</span>
                          <span className="text-xs text-slate-300 font-mono">
                            {res.vehicle_breakdown
                              ? `${res.vehicle_breakdown.cars || 0}C / ${res.vehicle_breakdown.motorcycles || 0}M / ${res.vehicle_breakdown.buses || 0}B`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        Custom AI Analytics Recorded
                      </div>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="pt-1">
                    <Button
                      asChild
                      className="w-full bg-slate-800 hover:bg-cyan-600 text-white transition-colors group/btn justify-between"
                      size="sm"
                    >
                      <Link href={`/university/reports/${report.id}`}>
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-cyan-400 group-hover/btn:text-white" />
                          View Detailed Results
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-xl border border-border/40 bg-slate-900/60 overflow-hidden backdrop-blur">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-[100px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Preview
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Video Title
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Model Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  AI Summary
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Processed Date
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const res = report.results_json || {};
                const isClassroom = report.pipeline_type === "classroom";
                const isVehicle = report.pipeline_type === "vehicle";

                return (
                  <TableRow
                    key={report.id}
                    className="border-border/40 hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="relative h-14 w-24 rounded-lg overflow-hidden bg-slate-950 border border-border/40 flex-shrink-0">
                        {report.thumbnail_url ? (
                          <img
                            src={report.thumbnail_url}
                            alt={report.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Layers className="h-4 w-4 opacity-40" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-white max-w-xs truncate">
                      {report.title}
                    </TableCell>

                    <TableCell>
                      {isClassroom ? (
                        <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/30 flex items-center gap-1 w-fit">
                          <GraduationCap className="h-3 w-3" />
                          Classroom AI
                        </Badge>
                      ) : isVehicle ? (
                        <Badge className="bg-sky-950 text-sky-300 border-sky-500/30 flex items-center gap-1 w-fit">
                          <Car className="h-3 w-3" />
                          Vehicle Gate
                        </Badge>
                      ) : (
                        <Badge variant="outline">Surveillance</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {isClassroom ? (
                        <div className="text-xs space-y-0.5">
                          <span className="text-emerald-400 font-semibold">
                            {res.average_students ?? 0} Students
                          </span>
                          <span className="text-muted-foreground"> • </span>
                          <span className="text-slate-300">
                            {Math.round(res.teaching_duration_seconds || 0)}s podium
                          </span>
                        </div>
                      ) : isVehicle ? (
                        <div className="text-xs space-y-0.5">
                          <span className="text-sky-400 font-semibold">
                            {res.total_vehicles_entered ?? 0} Vehicles
                          </span>
                          <span className="text-muted-foreground"> (Cars: {res.vehicle_breakdown?.cars || 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Analytics Available</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-xs"
                      >
                        <Link href={`/university/reports/${report.id}`} className="gap-1.5">
                          <span>View Results</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

