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
  ShieldAlert,
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const performDirectCloudUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const supabase = createClient();
    const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();
    const storagePath = `${institutionId}/${timestamp}-${cleanFileName}`;

    try {
      // 1. Fetch current session auth token for direct storage upload
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const authToken = session?.access_token || supabaseAnonKey;

      // 2. Direct-to-Cloud Upload via XMLHttpRequest to get exact byte progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const uploadUrl = `${supabaseUrl}/storage/v1/object/raw_videos/${storagePath}`;

        xhr.open("POST", uploadUrl, true);
        xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
        xhr.setRequestHeader("apikey", supabaseAnonKey);
        xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.setRequestHeader("x-upsert", "true");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve();
          } else {
            // If XHR encounters status error, try standard Supabase JS client fallback
            try {
              const { error: fallbackError } = await supabase.storage
                .from("raw_videos")
                .upload(storagePath, selectedFile, {
                  contentType: "video/mp4",
                  upsert: true,
                });

              if (fallbackError) {
                reject(new Error(fallbackError.message));
              } else {
                setUploadProgress(100);
                resolve();
              }
            } catch (fbErr: any) {
              reject(
                new Error(
                  xhr.responseText || fbErr.message || "Cloud upload failed."
                )
              );
            }
          }
        };

        xhr.onerror = async () => {
          // Attempt SDK fallback on network error
          try {
            const { error: fallbackError } = await supabase.storage
              .from("raw_videos")
              .upload(storagePath, selectedFile, {
                contentType: "video/mp4",
                upsert: true,
              });

            if (fallbackError) {
              reject(new Error(fallbackError.message));
            } else {
              setUploadProgress(100);
              resolve();
            }
          } catch (fbErr: any) {
            reject(new Error("Direct upload connection error."));
          }
        };

        xhr.send(selectedFile);
      });

      // 3. Register the uploaded video via Server Action
      toast.info(
        "Upload Complete",
        "Registering video in PostgreSQL pipeline..."
      );

      const result = await registerUploadedVideo(
        selectedFile.name,
        storagePath,
        institutionId
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to register video in database.");
      }

      toast.success(
        "Pipeline Initialized",
        `"${selectedFile.name}" stored in 'raw_videos' bucket. AI processing job queued!`
      );

      // Clean up state
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Notify parent page to refresh video list
      onUploadSuccess?.();
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(
        "Upload Failed",
        err.message ||
          "Could not upload video to storage bucket. Verify RLS permissions for 'raw_videos'."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-slate-900/60 p-6 backdrop-blur shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Film className="h-4 w-4" />
            Direct-to-Cloud Ingestion
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Surveillance Stream Uploader
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <HardDrive className="h-3.5 w-3.5 text-blue-400" />
          <span>Bucket: <code className="text-blue-300 bg-slate-800/80 px-1.5 py-0.5 rounded font-mono">raw_videos</code></span>
          <span className="text-slate-600">&bull;</span>
          <span>Bypasses Vercel 4.5MB limit</span>
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
            : "border-border/60 hover:border-blue-500/50 hover:bg-slate-800/40 bg-slate-950/40"
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

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
          <UploadCloud className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            {isDragging
              ? "Drop your MP4 file here"
              : "Click to browse or drag & drop campus surveillance video"}
          </p>
          <p className="text-xs text-muted-foreground">
            Strictly MP4 format &bull; Maximum file size: <strong className="text-slate-300">100 MB</strong>
          </p>
        </div>
      </div>

      {/* Selected File Card & Progress */}
      {selectedFile && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <FileVideo className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for cloud stream
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
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Real-time Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  Streaming directly to Supabase S3...
                </span>
                <span className="font-bold text-blue-400 font-mono">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-150 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger */}
          {!isUploading && (
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="border-border/60 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={performDirectCloudUpload}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20 gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                Start Direct Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

