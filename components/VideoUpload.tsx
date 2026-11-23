"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerUploadedVideo } from "@/app/actions/video";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Film,
  HardDrive,
  ShieldCheck,
  GraduationCap,
  Car,
  Sparkles,
} from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

interface VideoUploadProps {
  institutionId: string;
  onUploadSuccess?: () => void;
}

export function VideoUpload({ institutionId, onUploadSuccess }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoType, setVideoType] = useState<"auto" | "classroom" | "vehicle">("auto");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const validateFile = (file: File): string | null => {
    // 1. File type check (must be .mp4)
    const isMp4 =
      file.name.toLowerCase().endsWith(".mp4") ||
      file.type === "video/mp4";

    if (!isMp4) {
      return "Invalid file format. Only MP4 (.mp4) surveillance video files are accepted.";
    }

    // 2. File size check (max 100MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File exceeds limit (${sizeMb}MB). Maximum allowed video payload is 100MB.`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error("File Validation Error", error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  /**
   * Direct-to-Cloud Upload Pipeline
   * Uploads file directly to Supabase Storage 'raw_videos' bucket with XHR progress.
   */
  const handleUpload = async () => {
    if (!selectedFile || !institutionId) return;

    setIsUploading(true);
    setUploadProgress(0);

    const supabase = createClient();

    try {
      // 1. Generate unique storage path
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${institutionId}/${Date.now()}_${sanitizedName}`;

      // 2. Get Supabase session token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Authentication session expired. Please sign in again.");
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Missing Supabase configuration keys.");
      }

      const uploadEndpoint = `${supabaseUrl}/storage/v1/object/raw_videos/${storagePath}`;

      // 3. Upload directly via XHR to report real-time percentage
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadEndpoint, true);

        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "video/mp4");
        xhr.setRequestHeader("x-upsert", "false");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const res = JSON.parse(xhr.responseText);
              reject(new Error(res.message || res.error || "Storage upload rejected."));
            } catch {
              reject(new Error(`Storage error status code: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network interruption during direct-to-cloud upload."));
        };

        xhr.send(selectedFile);
      });

      // 4. Register metadata in PostgreSQL via Server Action with explicit videoType
      const videoTitle = selectedFile.name.replace(/\.[^/.]+$/, "");
      const registration = await registerUploadedVideo(
        videoTitle,
        storagePath,
        institutionId,
        videoType
      );

      if (!registration.success) {
        throw new Error(registration.error || "Failed to register video record in database.");
      }

      toast.success(
        "Upload Complete",
        `Video '${selectedFile.name}' registered. Queued for AI background analysis.`
      );

      // Reset state
      setSelectedFile(null);
      setUploadProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      console.error("Direct upload failed:", err);
      toast.error("Upload Failed", err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <UploadCloud className="h-5 w-5 text-blue-600" />
          <span>Direct Surveillance Upload</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Target Bucket: <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-semibold">raw_videos</code></span>
          <span>&bull;</span>
          <span>Bypasses Vercel payload limits</span>
        </div>
      </div>

      {/* AI Pipeline Category Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Target AI Analytics Pipeline
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setVideoType("vehicle")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              videoType === "vehicle"
                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/20"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            <div className={`p-2 rounded-lg ${videoType === "vehicle" ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
              <Car className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Vehicle & Parking AI</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">Gate barrier, ByteTrack</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVideoType("classroom")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              videoType === "classroom"
                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/20"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            <div className={`p-2 rounded-lg ${videoType === "classroom" ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Classroom AI</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">Students & active teacher</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVideoType("auto")}
            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
              videoType === "auto"
                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500/20"
                : "border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            <div className={`p-2 rounded-lg ${videoType === "auto" ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Auto-Detect Scene</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">Smart CV frame probe</p>
            </div>
          </button>
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 bg-slate-50/40"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,video/mp4"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          disabled={isUploading}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 mb-4 transition-transform">
          <UploadCloud className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            {isDragging
              ? "Drop your MP4 file here"
              : "Click to select or drag & drop campus surveillance video"}
          </p>
          <p className="text-xs text-slate-500">
            MP4 format only &bull; Max payload limit: <strong className="text-slate-800">100 MB</strong>
          </p>
        </div>
      </div>

      {/* Selected File Card & Progress */}
      {selectedFile && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <FileVideo className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for upload
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Real-time Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading to Supabase Storage...
                </span>
                <span className="font-bold text-blue-700 font-mono">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60">
                <div
                  className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-500/20"
              >
                Start Direct-to-Cloud Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
