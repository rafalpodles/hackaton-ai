"use client";

import { useGeocities } from "./geocities-provider";
import { useState, useEffect } from "react";
import { GeocitiesAudio } from "./geocities-audio";

export default function GeocitiesExtras() {
  const { enabled } = useGeocities();
  const [visitors, setVisitors] = useState(0);
  const [cursorTrail, setCursorTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    if (!enabled) return;
    // "Visitor counter" - random big number + increments
    const base = 48_213 + Math.floor(Math.random() * 1000);
    setVisitors(base);
    const interval = setInterval(() => {
      setVisitors((v) => v + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Star cursor trail
  useEffect(() => {
    if (!enabled) {
      setCursorTrail([]);
      return;
    }
    let idCounter = 0;
    const handleMove = (e: MouseEvent) => {
      const id = idCounter++;
      setCursorTrail((prev) => [...prev.slice(-12), { x: e.clientX, y: e.clientY, id }]);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [enabled]);

  // Clean up old trail particles
  useEffect(() => {
    if (!enabled || cursorTrail.length === 0) return;
    const timeout = setTimeout(() => {
      setCursorTrail((prev) => prev.slice(1));
    }, 150);
    return () => clearTimeout(timeout);
  }, [enabled, cursorTrail]);

  if (!enabled) return null;

  const stars = ["*", "+", "~", ".", "*"];

  return (
    <>
      {/* Cursor trail */}
      {cursorTrail.map((point, i) => (
        <div
          key={point.id}
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: point.x - 6,
            top: point.y - 6,
            opacity: (i + 1) / cursorTrail.length,
            fontSize: `${8 + i}px`,
            color: `hsl(${(i * 30 + Date.now() / 20) % 360}, 100%, 50%)`,
            transition: "opacity 0.15s",
            fontFamily: "serif",
            textShadow: "0 0 4px currentColor",
          }}
        >
          {stars[i % stars.length]}
        </div>
      ))}

      {/* Bottom bar with visitor counter + marquee */}
      <div
        className="geocities-bottom-bar fixed bottom-0 left-0 right-0 z-[9998]"
        style={{
          background: "linear-gradient(to right, #000080, #0000a0, #000080)",
          borderTop: "3px ridge #c0c0c0",
          padding: "4px 0",
          fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
        }}
      >
        <div className="flex items-center justify-between px-4">
          {/* Visitor counter */}
          <div
            className="flex items-center gap-2"
            style={{
              background: "#000",
              border: "2px inset #808080",
              padding: "2px 8px",
            }}
          >
            <span style={{ color: "#00ff00", fontSize: "10px" }}>
              VISITORS:
            </span>
            <span
              style={{
                color: "#ff0",
                fontSize: "12px",
                fontFamily: '"Courier New", monospace',
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              {visitors.toLocaleString("en-US").padStart(6, "0")}
            </span>
          </div>

          {/* Marquee */}
          <div className="flex-1 overflow-hidden mx-4">
            <div className="geocities-marquee whitespace-nowrap" style={{ color: "#ffff00", fontSize: "11px" }}>
              *** Welcome to the BEST hackathon page on the ENTIRE World Wide Web!!! ***
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              This page is best viewed in Netscape Navigator 4.0 at 800x600 resolution
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              Sign my Guestbook!!!
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              You are visitor #{visitors.toLocaleString()}!!!
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              Made with Notepad.exe
              &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
              Under Construction - Last updated: January 14, 1998
            </div>
          </div>

          {/* "Best viewed" badge */}
          <div
            style={{
              background: "#c0c0c0",
              border: "2px outset #c0c0c0",
              padding: "1px 6px",
              fontSize: "9px",
              color: "#000",
              fontWeight: "bold",
            }}
          >
            IE 4.0
          </div>
        </div>
      </div>

      {/* Under construction banner - top right */}
      <div
        className="fixed right-4 top-4 z-[9998] geocities-blink"
        style={{
          background: "#ffff00",
          border: "3px double #ff0000",
          padding: "4px 12px",
          fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
          fontSize: "11px",
          color: "#ff0000",
          fontWeight: "bold",
          transform: "rotate(3deg)",
        }}
      >
        UNDER CONSTRUCTION!!!
      </div>

      {/* Audio system */}
      <GeocitiesAudio />

      {/* Animated "NEW!" badge */}
      <div
        className="fixed right-4 top-16 z-[9998]"
        style={{
          fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
          fontSize: "14px",
          fontWeight: "bold",
          animation: "geocities-rainbow 2s linear infinite",
        }}
      >
        NEW!
      </div>
    </>
  );
}
