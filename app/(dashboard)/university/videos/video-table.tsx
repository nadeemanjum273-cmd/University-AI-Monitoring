"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoRecord } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileVideo,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  RefreshCw,
  Cpu,
  ArrowRight,
  Trash2,
} from "lucide-react";

interface VideoTableProps {
  initialVideos: VideoRecord[];
}

export function VideoTable({ initialVideos }: VideoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleDelete = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    setDeletingId(videoId);
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }
      router.refresh();
    } catch (err: any) {
      alert(`Error deleting video: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = initialVideos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.original_storage_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: VideoRecord["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            className="gap-1.5 font-medium border-amber-200 bg-amber-50 text-amber-700 shadow-none text-xs"
          >
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge
            className="gap-1.5 font-medium border-blue-200 bg-blue-50 text-blue-700 shadow-none text-xs"
          >
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge
            className="gap-1.5 font-medium border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none text-xs"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            className="gap-1.5 font-medium border-red-200 bg-red-50 text-red-700 shadow-none text-xs"
          >
            <AlertCircle className="h-3 w-3 text-red-600" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search recordings by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-sm"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 text-blue-600 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[320px] text-xs font-semibold uppercase text-slate-500">Video Recording</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Storage Location</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Uploaded</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-500">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-44 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <FileVideo className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-700">
                      No surveillance videos found
                    </p>
                    <p className="text-xs text-slate-500">
                      {searchTerm
                        ? "No recordings match your search filter."
                        : "Drag and drop an MP4 video above to start an AI analysis."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVideos.map((video) => {
                const job = Array.isArray(video.processing_jobs)
                  ? video.processing_jobs[0]
                  : video.processing_jobs;

                return (
                  <TableRow
                    key={video.id}
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100 shrink-0">
                          <FileVideo className="h-4 w-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-slate-900 truncate">
                            {video.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            ID: {video.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        raw_videos/{video.original_storage_path.split("/").pop()}
                      </span>
                    </TableCell>

                    <TableCell>{getStatusBadge(video.status)}</TableCell>

                    <TableCell className="text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(video.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {video.status === "completed" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold gap-1"
                          >
                            <Link href={`/university/reports/${video.id}`}>
                              <span>View AI Results</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic mr-2">
                            {video.status === "processing" ? "Analyzing..." : "In Queue"}
                          </span>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(video.id, video.title)}
                          disabled={deletingId === video.id}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 h-8 w-8 rounded-lg transition-colors"
                          title="Delete Recording"
                        >
                          {deletingId === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
