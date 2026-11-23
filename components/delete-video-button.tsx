"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteVideoButtonProps {
  videoId: string;
  videoTitle: string;
  redirectUrl?: string;
  variant?: "outline" | "destructive" | "ghost" | "default";
  className?: string;
  buttonText?: string;
}

export function DeleteVideoButton({
  videoId,
  videoTitle,
  redirectUrl,
  variant = "outline",
  className,
  buttonText = "Delete Recording",
}: DeleteVideoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${videoTitle}"?\n\nThis will remove the raw recording, annotated AI video, snapshots, and all forensic telemetry.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }

      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(`Error deleting video: ${err.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleDelete}
      disabled={isDeleting}
      className={className || "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl shadow-sm text-xs font-semibold gap-1.5"}
      title="Delete this surveillance recording"
    >
      {isDeleting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
          <span>Deleting...</span>
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5 text-red-600" />
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
}

