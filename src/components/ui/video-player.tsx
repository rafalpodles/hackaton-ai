"use client";

import { useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  autoPlay = false,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  }

  return (
    <div
      className={`relative cursor-pointer overflow-hidden rounded-lg ${className}`}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? "Pause video" : "Play video"}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={autoPlay}
        playsInline
        className="h-full w-full object-cover"
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-high/80">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )}

      {/* Play/pause overlay with smooth transition */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${
          isPlaying ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary shadow-lg shadow-secondary/30 transition-transform duration-200 hover:scale-110">
          <svg
            className="ml-1 h-7 w-7 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
