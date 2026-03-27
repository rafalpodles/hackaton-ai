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
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  function toggle() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
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
        playsInline
        className="h-full w-full object-cover"
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary shadow-lg shadow-secondary/30">
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
      )}
    </div>
  );
}
