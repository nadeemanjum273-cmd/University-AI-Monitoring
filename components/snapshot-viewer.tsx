"use client";

import { useState } from "react";
import { Download, ExternalLink, Maximize2, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SnapshotViewerProps {
  snapshotUrl?: string | null;
  title: string;
  timestamp?: string;
}

export function SnapshotViewer({ snapshotUrl, title, timestamp }: SnapshotViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!snapshotUrl) {
    return (
      <Card className="border-border/40 bg-slate-900/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Camera className="h-4 w-4 text-cyan-400" />
            Forensic Snapshot Evidence
          </CardTitle>
          <CardDescription>AI extracted representative keyframe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-xl bg-slate-950 flex flex-col items-center justify-center text-muted-foreground border border-border/40">
            <Camera className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">No snapshot evidence available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/40 bg-slate-900/60 backdrop-blur overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-cyan-400" />
              Forensic Snapshot Evidence
            </CardTitle>
            <CardDescription className="text-xs">Keyframe extracted at peak detection density</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="h-8 px-2.5 text-xs border-border/60 text-slate-300 hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-1 text-cyan-400" />
              Expand
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-2.5 text-xs border-border/60 text-slate-300 hover:text-white"
            >
              <a href={snapshotUrl} download={`evidence_${title.replace(/\s+/g, "_")}.jpg`} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                Save
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            onClick={() => setIsOpen(true)}
            className="group relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-border/40 cursor-pointer shadow-inner"
          >
            <img
              src={snapshotUrl}
              alt={`Evidence snapshot for ${title}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
                Click to inspect full resolution evidence
              </span>
            </div>
            {timestamp && (
              <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-border/40">
                {timestamp}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 border border-border/60 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white truncate max-w-md">
                  Forensic Keyframe: {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 border-border/60 text-xs"
                >
                  <a href={snapshotUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open Original
                  </a>
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={snapshotUrl}
                alt={title}
                className="max-h-[72vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

