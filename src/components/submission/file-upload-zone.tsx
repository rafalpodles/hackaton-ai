"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FileUploadZoneProps {
  bucket: string;
  projectId: string;
  path: string;
  accept: string;
  label: string;
  hint: string;
  maxSizeMb?: number;
  maxDurationSec?: number;
  currentUrl?: string | null;
  onUploadComplete: (url: string, duration?: number) => void;
}

function bucketIcon(bucket: string) {
  if (bucket.includes("video")) return "\uD83C\uDFAC";
  if (bucket.includes("pdf") || bucket.includes("presentation")) return "\uD83D\uDCC4";
  return "\uD83D\uDDBC\uFE0F";
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Could not read video metadata"));
    video.src = URL.createObjectURL(file);
  });
}

export function FileUploadZone({
  bucket,
  projectId,
  path,
  accept,
  label,
  hint,
  maxSizeMb,
  maxDurationSec,
  currentUrl,
  onUploadComplete,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(!!currentUrl);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate size
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMb} MB.`);
        return;
      }

      // Validate video duration
      let duration: number | undefined;
      if (maxDurationSec && file.type.startsWith("video/")) {
        try {
          duration = await getVideoDuration(file);
          if (duration > maxDurationSec) {
            setError(
              `Video too long (${Math.round(duration)}s). Maximum is ${maxDurationSec}s.`
            );
            return;
          }
        } catch {
          setError("Could not read video duration.");
          return;
        }
      }

      setUploading(true);
      setProgress(0);

      // Simulate progress while uploading (Supabase JS client doesn't emit progress)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 90));
      }, 200);

      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "";
        const filePath = `${projectId}/${path}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        clearInterval(progressInterval);
        setProgress(100);
        setUploaded(true);
        onUploadComplete(publicUrl, duration);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
      }
    },
    [bucket, projectId, path, maxSizeMb, maxDurationSec, onUploadComplete]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragOver
          ? "border-secondary bg-secondary/5"
          : uploaded
            ? "border-primary/40 bg-primary/5"
            : "border-outline bg-surface-low"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={onFileChange}
      />

      <div className="pointer-events-none space-y-2">
        <div className="text-3xl">{bucketIcon(bucket)}</div>
        <p className="font-space-grotesk text-sm font-bold text-on-surface">
          {label}
        </p>
        <p className="text-xs text-on-surface-muted">{hint}</p>

        {uploading && (
          <div className="mx-auto mt-3 h-1.5 w-3/4 overflow-hidden rounded-full bg-surface-high">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {uploaded && !uploading && (
          <p className="mt-2 text-xs font-semibold text-primary-dim">
            Uploaded &#10003;
          </p>
        )}

        {error && (
          <p className="mt-2 text-xs font-semibold text-secondary">{error}</p>
        )}
      </div>
    </div>
  );
}
