"use client";

import { useGeocities } from "./geocities-provider";
import { useEffect, useRef, useState, useCallback } from "react";

// Simple 90s-style MIDI melody using Web Audio API
function createMelody(ctx: AudioContext): { play: () => void; stop: () => void } {
  let playing = false;
  let timeoutIds: ReturnType<typeof setTimeout>[] = [];

  // Classic 90s chiptune melody (think Geocities MIDI vibes)
  const notes = [
    // freq, duration, delay
    [523.25, 0.2, 0],    // C5
    [587.33, 0.2, 0.25], // D5
    [659.25, 0.4, 0.5],  // E5
    [523.25, 0.2, 1.0],  // C5
    [587.33, 0.2, 1.25], // D5
    [783.99, 0.4, 1.5],  // G5
    [659.25, 0.4, 2.0],  // E5
    [523.25, 0.2, 2.5],  // C5
    [493.88, 0.2, 2.75], // B4
    [440.00, 0.4, 3.0],  // A4
    [493.88, 0.2, 3.5],  // B4
    [523.25, 0.4, 3.75], // C5
    [440.00, 0.2, 4.25], // A4
    [392.00, 0.6, 4.5],  // G4
    // second phrase
    [523.25, 0.2, 5.5],  // C5
    [659.25, 0.2, 5.75], // E5
    [783.99, 0.4, 6.0],  // G5
    [880.00, 0.2, 6.5],  // A5
    [783.99, 0.2, 6.75], // G5
    [659.25, 0.4, 7.0],  // E5
    [523.25, 0.2, 7.5],  // C5
    [587.33, 0.2, 7.75], // D5
    [523.25, 0.6, 8.0],  // C5
  ] as const;

  const loopDuration = 9.0; // seconds per loop

  function playNote(freq: number, duration: number, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square"; // Classic chiptune sound
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.04, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function scheduleLoop() {
    if (!playing) return;
    const now = ctx.currentTime + 0.1;
    for (const [freq, dur, delay] of notes) {
      playNote(freq, dur, now + delay);
    }
    const tid = setTimeout(scheduleLoop, loopDuration * 1000);
    timeoutIds.push(tid);
  }

  return {
    play() {
      if (playing) return;
      playing = true;
      scheduleLoop();
    },
    stop() {
      playing = false;
      timeoutIds.forEach(clearTimeout);
      timeoutIds = [];
    },
  };
}

function playClickSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Short blip sound
  osc.type = "square";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

export function GeocitiesAudio() {
  const { enabled } = useGeocities();
  const ctxRef = useRef<AudioContext | null>(null);
  const melodyRef = useRef<{ play: () => void; stop: () => void } | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  // Initialize AudioContext lazily (needs user gesture)
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Click sounds
  useEffect(() => {
    if (!enabled) return;

    const handleClick = () => {
      try {
        const ctx = ensureCtx();
        playClickSound(ctx);
      } catch {
        // AudioContext may not be available
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [enabled, ensureCtx]);

  // Music toggle
  useEffect(() => {
    if (!enabled || !musicOn) {
      melodyRef.current?.stop();
      melodyRef.current = null;
      return;
    }

    try {
      const ctx = ensureCtx();
      const melody = createMelody(ctx);
      melodyRef.current = melody;
      melody.play();
      return () => melody.stop();
    } catch {
      // ignore
    }
  }, [enabled, musicOn, ensureCtx]);

  // Cleanup on disable
  useEffect(() => {
    if (!enabled) {
      setMusicOn(false);
      melodyRef.current?.stop();
      melodyRef.current = null;
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="fixed left-4 bottom-12 z-[9999]"
      style={{ fontFamily: '"Comic Sans MS", cursive' }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          ensureCtx();
          setMusicOn((v) => !v);
        }}
        style={{
          background: musicOn
            ? "linear-gradient(to bottom, #004000, #002000)"
            : "linear-gradient(to bottom, #400000, #200000)",
          border: "2px outset #808080",
          padding: "3px 10px",
          fontSize: "10px",
          fontWeight: "bold",
          color: musicOn ? "#00ff00" : "#ff4444",
          cursor: "pointer",
          fontFamily: '"Comic Sans MS", cursive',
        }}
        title={musicOn ? "Mute the MIDI!" : "Play some tunes!"}
      >
        {musicOn ? "♫ MIDI ON" : "♫ MIDI OFF"}
      </button>
    </div>
  );
}
