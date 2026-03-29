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
  if (bucket.includes("video"))
    return (
      <svg className="h-10 w-10 text-primary-dim transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    );
  if (bucket.includes("presentation"))
    return (
      <svg className="h-10 w-10 text-primary-dim transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    );
  return (
    <svg className="h-10 w-10 text-primary-dim transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18V6a2.25 2.25 0 0 1 2.25-2.25h15A2.25 2.25 0 0 1 21.75 6v12A2.25 2.25 0 0 1 19.5 20.25H4.5A2.25 2.25 0 0 1 2.25 18Z" />
    </svg>
  );
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

      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        setError(`Plik za duży. Maksymalny rozmiar to ${maxSizeMb} MB.`);
        return;
      }

      let duration: number | undefined;
      if (maxDurationSec && file.type.startsWith("video/")) {
        try {
          duration = await getVideoDuration(file);
          if (duration > maxDurationSec) {
            setError(
              `Wideo za długie (${Math.round(duration)}s). Maksymalnie ${maxDurationSec}s.`
            );
            return;
          }
        } catch {
          setError("Nie udało się odczytać długości wideo.");
          return;
        }
      }

      setUploading(true);
      setProgress(0);

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
        setError(err instanceof Error ? err.message : "Przesyłanie nie powiodło się");
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

  const isVideo = bucket.includes("video");

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-all duration-500 ${
        isVideo ? "aspect-video" : "p-10"
      } flex flex-col items-center justify-center ${
        dragOver
          ? "border-secondary bg-secondary/10"
          : uploaded
            ? "border-primary/40 bg-primary/5"
            : "border-outline hover:border-primary/50 bg-surface-low"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={onFileChange}
      />

      <div className="pointer-events-none flex flex-col items-center space-y-3">
        {bucketIcon(bucket)}

        <p className="font-space-grotesk text-sm font-bold uppercase tracking-widest text-on-surface">
          {uploaded ? `${label} — przesłano` : `Prześlij ${label}`}
        </p>
        <p className="text-xs font-light text-on-surface-muted">{hint}</p>

        {uploading && (
          <div className="mt-2 h-1.5 w-3/4 overflow-hidden rounded-full bg-surface-high">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {uploaded && !uploading && (
          <p className="font-space-grotesk text-xs font-semibold text-primary-dim">
            Przesłano &#10003;
          </p>
        )}

        {error && (
          <p className="text-xs font-semibold text-secondary">{error}</p>
        )}
      </div>
    </div>
  );
}
