"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Car,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const SAMPLE_VIDEOS = {
  classroom: {
    id: "1dfcef90-f01e-4977-b6cd-a5ce5735b3f9",
    title: "Classroom Lecture Hall (WhatsApp 11.57.02 AM)",
    type: "Classroom AI",
    badge: "YOLOv8 Dual Polygon",
    metrics: "8.2 Avg Students • 71.7s Active Teaching",
    description: "Evaluates Teacher Podium (Zone 1) and Student Seating Rows (Zone 2) with real-time headcount.",
  },
  parking: {
    id: "d0d31b41-a26f-4be2-887c-fe3a2f4514c8",
    title: "Parking & Gate Access (WhatsApp 11.56.59 AM)",
    type: "Vehicle & Gate AI",
    badge: "ByteTrack Line Crossing",
    metrics: "15 Vehicles Ingress • 8 Cars, 7 Trucks",
    description: "Tracks vehicles crossing virtual entry line barrier with dynamic color changes and trajectory tracking.",
  },
};

export function SampleDemoLoader() {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleLoadSample = (type: "classroom" | "parking") => {
    setLoadingType(type);
    const video = SAMPLE_VIDEOS[type];
    router.push(`/university/reports/${video.id}`);
  };

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/30">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                VIP Vendor Demo Presets
              </h3>
              <Badge className="bg-amber-200/70 text-amber-900 border-amber-300 text-[10px] font-bold px-2 py-0.5">
                Instant Playback
              </Badge>
            </div>
            <p className="text-xs text-slate-600">
              Skip upload & GPU inference. Demonstrate pre-computed telemetry on verified campus videos immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Pre-processed YOLOv8 & ByteTrack</span>
        </div>
      </div>

      {/* Preset Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Sample Classroom Button */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1">
                <GraduationCap className="h-3 w-3" />
                Classroom AI
              </Badge>
              <span className="text-[10px] font-semibold text-slate-400">
                Preset #1
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {SAMPLE_VIDEOS.classroom.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {SAMPLE_VIDEOS.classroom.description}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-semibold text-emerald-800 border border-slate-100">
              📊 {SAMPLE_VIDEOS.classroom.metrics}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handleLoadSample("classroom")}
            disabled={loadingType !== null}
            className="mt-3 w-full bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold py-2 gap-2 shadow-sm transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Load Sample Classroom (Instant Demo)</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>

        {/* Sample Parking Button */}
        <div className="group relative flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold gap-1">
                <Car className="h-3 w-3" />
                Vehicle Gate AI
              </Badge>
              <span className="text-[10px] font-semibold text-slate-400">
                Preset #2
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {SAMPLE_VIDEOS.parking.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {SAMPLE_VIDEOS.parking.description}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 text-[11px] font-semibold text-sky-800 border border-slate-100">
              🚗 {SAMPLE_VIDEOS.parking.metrics}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => handleLoadSample("parking")}
            disabled={loadingType !== null}
            className="mt-3 w-full bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold py-2 gap-2 shadow-sm transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Load Sample Parking (Instant Demo)</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

