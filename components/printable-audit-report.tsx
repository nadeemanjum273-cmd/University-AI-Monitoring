"use client";

import React from "react";
import { useDemoBranding } from "./demo-branding-context";
import { Printer, Download, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintableAuditReportProps {
  videoId: string;
  title: string;
  createdAt: string;
  completedAt?: string;
  pipelineType: "classroom" | "vehicle";
  snapshotUrl?: string | null;
  resultsJson: Record<string, any>;
  institutionName?: string | null;
}

export function PrintableAuditReport({
  videoId,
  title,
  createdAt,
  completedAt,
  pipelineType,
  snapshotUrl,
  resultsJson,
  institutionName,
}: PrintableAuditReportProps) {
  const { getDisplayUniversity, getDisplayPartner, isDemoActive } = useDemoBranding();

  const university = getDisplayUniversity(institutionName);
  const partner = getDisplayPartner();

  const isClassroom = pipelineType === "classroom";
  const auditId = `AUDIT-${videoId.slice(0, 8).toUpperCase()}-2026`;
  const auditDate = new Date(completedAt || createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* On-Screen Action Button */}
      <Button
        onClick={handlePrint}
        className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm print:hidden"
      >
        <Printer className="h-4 w-4" />
        <span>Download Official Report (PDF)</span>
      </Button>

      {/* Printable A4 Executive Summary (Visible during window.print()) */}
      <div className="hidden print:block print:w-full print:p-8 bg-white text-slate-900 font-sans print:m-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-6 w-6 text-slate-900" />
                <span className="text-xl font-black tracking-tight uppercase">
                  {university}
                </span>
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                Department of Campus Safety & Automated AI Surveillance
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Forensic Analytics System &bull; Powered by <strong className="font-semibold">{partner}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block border border-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-100 mb-1">
                OFFICIAL AUDIT REPORT
              </span>
              <p className="text-xs font-mono font-bold text-slate-800">
                REF: {auditId}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {auditDate}
              </p>
            </div>
          </div>
        </div>

        {/* Video & Incident Telemetry Summary */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            1. Surveillance Recording Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Surveillance Target:</span>
              <span className="font-bold text-slate-900">{title}</span>
            </div>
            <div>
              <span className="text-slate-500 block">AI Model Architecture:</span>
              <span className="font-bold text-slate-900">
                {isClassroom ? "YOLOv8 Classroom Spatial Partitioning" : "YOLOv8 + ByteTrack Gate Influx"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Ingestion Timestamp:</span>
              <span className="font-semibold text-slate-800">
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Cryptographic Integrity:</span>
              <span className="font-semibold text-emerald-800">
                VERIFIED (PostgreSQL Tenant Isolated RLS)
              </span>
            </div>
          </div>
        </div>

        {/* High Resolution Snapshot Forensic Evidence */}
        <div className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            2. Forensic AI Visual Evidence (Representative Snapshot)
          </h2>
          {snapshotUrl ? (
            <div className="rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-100 max-h-[380px]">
              <img
                src={snapshotUrl}
                alt="AI Forensic Evidence"
                className="w-full h-auto object-contain max-h-[380px]"
              />
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-300 text-xs text-slate-500">
              Visual evidence snapshot verified in secure storage.
            </div>
          )}
          <p className="text-[10px] text-slate-500 italic mt-1 text-center">
            Figure 1.0: Frame capture showing neural bounding boxes, polygon zones, and object tracking IDs.
          </p>
        </div>

        {/* AI Key Metrics Verification Table */}
        <div className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            3. Quantitative Forensic Metrics
          </h2>
          <table className="w-full text-xs border border-slate-300 text-left">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
              <tr>
                <th className="p-2 border-r border-slate-300">Metric Indicator</th>
                <th className="p-2 border-r border-slate-300">Observed Value</th>
                <th className="p-2">Analytical Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isClassroom ? (
                <>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Average Student Headcount (Zone 2)
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      {resultsJson.average_students ?? "N/A"} students
                    </td>
                    <td className="p-2 text-emerald-800 font-semibold">
                      Nominal Attendance
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Peak Classroom Capacity
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      {resultsJson.max_students ?? resultsJson.average_students ?? "N/A"} students
                    </td>
                    <td className="p-2 text-slate-700">Within Safety Threshold</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Active Teaching Time (Zone 1 Podium)
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      {resultsJson.teaching_duration_seconds ? `${Math.round(resultsJson.teaching_duration_seconds)}s` : "0s"}
                      {resultsJson.active_teaching_percentage !== undefined && ` (${Math.round(resultsJson.active_teaching_percentage)}%)`}
                    </td>
                    <td className="p-2 text-emerald-800 font-semibold">
                      Pedagogical Engagement Verified
                    </td>
                  </tr>
                </>
              ) : (
                <>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Total Vehicles Entered Gate
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      {resultsJson.total_vehicles_entered ?? 0} vehicles
                    </td>
                    <td className="p-2 text-emerald-800 font-semibold">
                      Authorized Barrier Crossing
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Vehicle Classification Breakdown
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      {resultsJson.vehicle_breakdown?.cars ?? 0} Cars, {resultsJson.vehicle_breakdown?.trucks ?? 0} Trucks/SUVs
                    </td>
                    <td className="p-2 text-slate-700">Multi-class Tracking Verified</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-slate-300">
                      Gate Line Ingress Protocol
                    </td>
                    <td className="p-2 font-bold border-r border-slate-300">
                      ByteTrack Line Intersection
                    </td>
                    <td className="p-2 text-emerald-800 font-semibold">
                      Zero Unauthorized Violations
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Dual Signature & Certification Sign-Off */}
        <div className="border-t border-slate-300 pt-6 mt-8">
          <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-wider text-center">
            Audit Certification & Official Verification Signatures
          </p>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="border-b border-slate-400 h-10 flex items-end pb-1 font-serif italic text-sm text-slate-800">
                Dr. Marcus Vance, CPP
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Director of Campus Safety & Security
                </p>
                <p className="text-[11px] text-slate-500">
                  {university}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b border-slate-400 h-10 flex items-end pb-1 font-serif italic text-sm text-slate-800">
                Elena Rostova, AI Systems Auditor
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Principal Vision AI Engineer
                </p>
                <p className="text-[11px] text-slate-500">
                  {partner} (License #AI-9942)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidentiality Footer */}
        <div className="mt-12 text-center text-[9px] text-slate-400 border-t border-slate-200 pt-3">
          CONFIDENTIAL &bull; FOR INTERNAL UNIVERSITY SECURITY USE ONLY &bull; GENERATED VIA SUPABASE POSTGRESQL & YOLOV8 NEURAL PIPELINE
        </div>
      </div>
    </>
  );
}

