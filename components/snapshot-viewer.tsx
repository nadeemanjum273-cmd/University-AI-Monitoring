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
      <Card className="border-slate-200 bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-600" />
            Forensic Snapshot Evidence
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Representative keyframe extracted during AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200">
            <Camera className="h-8 w-8 mb-2 opacity-50 text-slate-400" />
            <p className="text-xs font-medium">No snapshot available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              Forensic Keyframe Evidence
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Keyframe extracted at peak detection density
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="h-8 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-1 text-blue-600" />
              Expand
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <a href={snapshotUrl} download={`evidence_${title.replace(/\s+/g, "_")}.jpg`} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Save
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div
            onClick={() => setIsOpen(true)}
            className="group relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer shadow-sm"
          >
            <img
              src={snapshotUrl}
              alt={`Evidence snapshot for ${title}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5" />
                Click to inspect full resolution evidence
              </span>
            </div>
            {timestamp && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white border border-white/20">
                {timestamp}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  Forensic Keyframe: {title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 border-slate-200 text-xs rounded-xl"
                >
                  <a href={snapshotUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open Original
                  </a>
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
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
