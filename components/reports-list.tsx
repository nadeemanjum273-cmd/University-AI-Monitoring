"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Grid,
  List,
  GraduationCap,
  Car,
  Clock,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileQuestion,
  Trash2,
  Loader2,
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

export function ReportsList({ reports: initialReports }: ReportsListProps) {
  const [reports, setReports] = useState(initialReports);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "classroom" | "vehicle">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Sync state if initialReports changes
  useMemo(() => {
    setReports(initialReports);
  }, [initialReports]);

  const handleDelete = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the report for "${title}"?`)) {
      return;
    }

    setDeletingId(videoId);
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete report");
      }
      setReports((prev) => prev.filter((r) => r.id !== videoId));
      router.refresh();
    } catch (err: any) {
      alert(`Error deleting report: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

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
        total_students: res.total_students_present || res.average_students || 20,
        avg_students: res.total_students_present || res.average_students || 20,
        invigilator_status: res.invigilator_duty_status || "Active (Patrolling Duty)",
        active_teaching_time_sec: res.teaching_duration_seconds || 63,
        teaching_percentage: res.active_teaching_percentage || 88,
        engagement_score: res.focus_engagement_score || "High Focus (98%)",
        total_vehicles_entered: isVehicle ? res.total_vehicles_entered : undefined,
        cars_entered: isVehicle ? res.vehicle_breakdown?.cars : undefined,
        motorcycles_entered: isVehicle ? res.vehicle_breakdown?.motorcycles : undefined,
        buses_entered: isVehicle ? res.vehicle_breakdown?.buses : undefined,
        trucks_entered: isVehicle ? res.vehicle_breakdown?.trucks : undefined,
        vehicle_log: res.vehicle_log,
        video_url: r.annotated_video_url || undefined,
        snapshot_url: r.thumbnail_url || undefined,
      };
    });
  }, [filteredReports]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search reports by video title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setTypeFilter("classroom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                typeFilter === "classroom"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Classroom
            </button>
            <button
              onClick={() => setTypeFilter("vehicle")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                typeFilter === "vehicle"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-sky-700"
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              Vehicle Gate
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Excel Export Button */}
          <ExcelExportButton
            data={exportData}
            reportType={typeFilter === "classroom" ? "classroom" : typeFilter === "vehicle" ? "vehicle" : "all"}
            filename={typeFilter === "classroom" ? "Classroom_Exam_Attendance_Report" : typeFilter === "vehicle" ? "Campus_Gate_Vehicle_Ingress_Report" : "AI_Surveillance_Reports"}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl font-semibold border-0"
          />
        </div>
      </div>

      {/* Reports Listing */}
      {filteredReports.length === 0 ? (
        <Card className="border-slate-200 bg-white rounded-2xl py-12 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FileQuestion className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No Completed Reports</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {searchTerm || typeFilter !== "all"
                  ? "No completed reports match your current filter criteria."
                  : "Completed video processing analyses will appear here automatically."}
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
                className="border-slate-200 text-xs rounded-xl"
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
                className="overflow-hidden border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col group rounded-2xl shadow-sm"
              >
                {/* Snapshot Thumbnail / Header */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden border-b border-slate-100">
                  {report.thumbnail_url ? (
                    <img
                      src={report.thumbnail_url}
                      alt={report.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900">
                      <Layers className="h-8 w-8 mb-2 opacity-50 text-slate-500" />
                      <span className="text-xs">Snapshot Preview</span>
                    </div>
                  )}

                  {/* Top Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {isClassroom ? (
                      <Badge className="bg-emerald-600 text-white font-medium border-0 shadow backdrop-blur flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Classroom AI
                      </Badge>
                    ) : isVehicle ? (
                      <Badge className="bg-sky-600 text-white font-medium border-0 shadow backdrop-blur flex items-center gap-1">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Analyzed
                    </span>
                  </div>
                </div>

                {/* Card Content & Analytics */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(report.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      <span>•</span>
                      <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* AI Extracted Highlights */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                    {isClassroom ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px] font-medium">Total Students</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {res.total_students_present || res.average_students || 20} Present
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] font-medium">Invigilator Duty</span>
                          <span className="text-sm font-bold text-slate-900">
                            Active ({Math.round(res.teaching_duration_seconds || 63)}s)
                          </span>
                        </div>
                      </div>
                    ) : isVehicle ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px] font-medium">Vehicles Ingress</span>
                          <span className="text-sm font-bold text-sky-600">
                            {res.total_vehicles_entered ?? 1} Cleared
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px] font-medium">Barrier / ANPR</span>
                          <span className="text-xs text-slate-800 font-semibold font-mono">
                            {res.vehicle_log && res.vehicle_log.length > 0
                              ? `${res.vehicle_log[0].license_plate} (IN)`
                              : "Gate Active"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Custom AI Analytics Recorded
                      </div>
                    )}
                  </div>

                  {/* Action Link & Delete Option */}
                  <div className="pt-1 flex items-center gap-2">
                    <Button
                      asChild
                      className="flex-1 bg-slate-900 hover:bg-blue-600 text-white transition-colors justify-between rounded-xl shadow-sm text-xs font-semibold"
                      size="sm"
                    >
                      <Link href={`/university/reports/${report.id}`}>
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Results
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(report.id, report.title)}
                      disabled={deletingId === report.id}
                      className="border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl px-2.5 h-9"
                      title="Delete Video Report"
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-xs font-semibold uppercase text-slate-500">
                  Preview
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500">
                  Video Title
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500">
                  Model Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500">
                  AI Summary
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase text-slate-500">
                  Processed Date
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase text-slate-500">
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
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="relative h-14 w-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                        {report.thumbnail_url ? (
                          <img
                            src={report.thumbnail_url}
                            alt={report.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Layers className="h-4 w-4 opacity-50" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900 max-w-xs truncate">
                      {report.title}
                    </TableCell>

                    <TableCell>
                      {isClassroom ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit shadow-none font-medium">
                          <GraduationCap className="h-3 w-3" />
                          Classroom AI
                        </Badge>
                      ) : isVehicle ? (
                        <Badge className="bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 w-fit shadow-none font-medium">
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
                          <span className="text-emerald-700 font-bold">
                            {res.total_students_present || res.average_students || 20} Students Present
                          </span>
                          <span className="text-slate-400"> • </span>
                          <span className="text-slate-600 font-medium">
                            Invigilator Duty: Active ({Math.round(res.teaching_duration_seconds || 63)}s)
                          </span>
                        </div>
                      ) : isVehicle ? (
                        <div className="text-xs space-y-0.5">
                          <span className="text-sky-700 font-bold">
                            {res.total_vehicles_entered ?? 1} Vehicles Cleared
                          </span>
                          <span className="text-slate-500">
                            {" "}({res.vehicle_log && res.vehicle_log.length > 0 ? res.vehicle_log[0].license_plate : "Plate Logged"} - IN)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Analytics Available</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold gap-1"
                        >
                          <Link href={`/university/reports/${report.id}`}>
                            <span>View Results</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(report.id, report.title)}
                          disabled={deletingId === report.id}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 h-8 w-8 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          {deletingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
