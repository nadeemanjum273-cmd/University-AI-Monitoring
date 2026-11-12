"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface VideoTableProps {
  initialVideos: VideoRecord[];
}

export function VideoTable({ initialVideos }: VideoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
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
            variant="warning"
            className="gap-1.5 font-medium border-amber-500/30 bg-amber-500/10 text-amber-400"
          >
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="info"
            className="gap-1.5 font-medium border-blue-500/30 bg-blue-500/10 text-blue-400"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="success"
            className="gap-1.5 font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          >
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="destructive"
            className="gap-1.5 font-medium border-red-500/30 bg-red-500/10 text-red-400"
          >
            <AlertCircle className="h-3 w-3" />
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos by title or path..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/60 border-input"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-border/60 text-slate-300 hover:bg-slate-800 gap-1.5 text-xs h-9"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Telemetry
          </Button>
          <span className="text-xs text-muted-foreground ml-2">
            <strong>{filteredVideos.length}</strong> videos
          </span>
        </div>
      </div>

      {/* Video Table */}
      <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow>
              <TableHead className="w-[340px]">Video Title & Reference</TableHead>
              <TableHead>Storage Path (`raw_videos`)</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>AI Worker State</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-44 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileVideo className="h-8 w-8 text-slate-500" />
                    <p className="font-medium text-slate-300">
                      No surveillance videos found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? "No videos matched your query."
                        : "Use the direct uploader above to ingest your first MP4 campus stream."}
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
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                          <FileVideo className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-white truncate max-w-[240px]">
                            {video.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[240px]">
                            ID: {video.id.slice(0, 13)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-border/40 truncate inline-block max-w-[200px]">
                        {video.original_storage_path}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(video.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Cpu className="h-3.5 w-3.5 text-slate-400" />
                        <span className="capitalize text-slate-300">
                          {job?.status || "queued for python worker"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(video.status)}
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
