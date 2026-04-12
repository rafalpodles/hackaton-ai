"use client";

import { useGeocities } from "./geocities-provider";
import { useState, useEffect, useRef } from "react";
import { GeocitiesAudio } from "./geocities-audio";

export default function GeocitiesExtras() {
  const { enabled } = useGeocities();
  const [visitors, setVisitors] = useState(0);
  const trailContainerRef = useRef<HTMLDivElement>(null);
  const visitorsRef = useRef(0);
  const marqueeVisitorRef = useRef<HTMLSpanElement>(null);

  // Visitor counter — update ref + marquee span directly to avoid re-rendering marquee
  useEffect(() => {
    if (!enabled) return;
    const base = 48_213 + Math.floor(Math.random() * 1000);
    setVisitors(base);
    visitorsRef.current = base;
    const interval = setInterval(() => {
      visitorsRef.current += Math.floor(Math.random() * 3);
      setVisitors(visitorsRef.current);
      if (marqueeVisitorRef.current) {
        marqueeVisitorRef.current.textContent = visitorsRef.current.toLocaleString();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Cursor trail — pure DOM, no React state
  useEffect(() => {
    if (!enabled) return;

    const container = trailContainerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    const MAX = 12;
    const stars = ["✦", "✧", "⊹", "·", "✦"];
    let lastTime = 0;

    const handleMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTime < 50) return; // throttle to ~20fps
      lastTime = now;

      const el = document.createElement("div");
      el.className = "pointer-events-none fixed z-[9999]";
      el.style.cssText = `left:${e.clientX - 6}px;top:${e.clientY - 6}px;font-size:12px;color:hsl(${Math.random() * 360},100%,50%);font-family:serif;text-shadow:0 0 4px currentColor;transition:opacity 0.3s;opacity:1;`;
      el.textContent = stars[particles.length % stars.length];
      container.appendChild(el);
      particles.push(el);

      if (particles.length > MAX) {
        const old = particles.shift()!;
        old.style.opacity = "0";
        setTimeout(() => old.remove(), 300);
      }
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      particles.forEach((el) => el.remove());
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Trail container — direct DOM manipulation, no React renders */}
      <div ref={trailContainerRef} />

      {/* Audio system */}
      <GeocitiesAudio />

      {/* Bottom bar with visitor counter + marquee */}
      <div
        className="geocities-bottom-bar fixed bottom-0 left-0 right-0 z-40 lg:left-60"
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
              You are visitor #<span ref={marqueeVisitorRef}>{visitors.toLocaleString()}</span>!!!
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
