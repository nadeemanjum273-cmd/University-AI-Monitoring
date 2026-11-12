"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReportExportRow {
  video_id: string;
  title: string;
  uploaded_at: string;
  completed_at?: string;
  pipeline_type: string;
  avg_students?: string | number;
  active_teaching_time_sec?: string | number;
  teaching_percentage?: string | number;
  total_vehicles_entered?: string | number;
  cars_entered?: string | number;
  motorcycles_entered?: string | number;
  buses_entered?: string | number;
  trucks_entered?: string | number;
  status: string;
  video_url?: string;
  snapshot_url?: string;
}

interface ExcelExportButtonProps {
  data: ReportExportRow[];
  filename?: string;
  sheetName?: string;
  buttonText?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExcelExportButton({
  data,
  filename = "AI_Campus_Surveillance_Report",
  sheetName = "AI Analytics Summary",
  buttonText = "Download Excel Report",
  className,
  variant = "default",
  size = "default",
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);

      // Transform rows into clean, human-readable column headers for the spreadsheet
      const exportRows = data.map((item, index) => ({
        "No.": index + 1,
        "Video ID": item.video_id,
        "Video Title": item.title,
        "Detection Model": item.pipeline_type,
        "Status": item.status,
        "Upload Timestamp": item.uploaded_at,
        "Completion Timestamp": item.completed_at || "N/A",
        "Avg Student Headcount": item.avg_students ?? "N/A",
        "Active Teaching (Sec)": item.active_teaching_time_sec ?? "N/A",
        "Teaching Engagement (%)": item.teaching_percentage ? `${item.teaching_percentage}%` : "N/A",
        "Total Vehicles Entered": item.total_vehicles_entered ?? "N/A",
        "Cars Count": item.cars_entered ?? "N/A",
        "Motorcycles Count": item.motorcycles_entered ?? "N/A",
        "Buses Count": item.buses_entered ?? "N/A",
        "Trucks Count": item.trucks_entered ?? "N/A",
        "Annotated Video Stream": item.video_url || "N/A",
        "Evidence Snapshot": item.snapshot_url || "N/A",
      }));

      // Create sheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Auto-fit column widths
      const colWidths = [
        { wch: 6 },  // No.
        { wch: 38 }, // Video ID
        { wch: 28 }, // Video Title
        { wch: 18 }, // Detection Model
        { wch: 14 }, // Status
        { wch: 22 }, // Upload Timestamp
        { wch: 22 }, // Completion Timestamp
        { wch: 22 }, // Avg Student Headcount
        { wch: 20 }, // Active Teaching (Sec)
        { wch: 22 }, // Teaching Engagement (%)
        { wch: 22 }, // Total Vehicles Entered
        { wch: 14 }, // Cars Count
        { wch: 18 }, // Motorcycles Count
        { wch: 14 }, // Buses Count
        { wch: 14 }, // Trucks Count
        { wch: 45 }, // Annotated Video Stream
        { wch: 45 }, // Evidence Snapshot
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const timestamp = new Date().toISOString().slice(0, 10);
      const fullFilename = `${filename}_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, fullFilename);
    } catch (err) {
      console.error("Failed to generate Excel report:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" />
      )}
      {buttonText}
    </Button>
  );
}

