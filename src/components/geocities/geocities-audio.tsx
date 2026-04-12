"use client";

import { useGeocities } from "./geocities-provider";
import { useEffect, useRef, useState, useCallback, memo } from "react";

// Simple 90s-style MIDI melody using Web Audio API
function createMelody(ctx: AudioContext): { play: () => void; stop: () => void } {
  let playing = false;
  let timeoutIds: ReturnType<typeof setTimeout>[] = [];

  // Classic 90s chiptune melody
  const notes = [
    [523.25, 0.2, 0],    [587.33, 0.2, 0.25], [659.25, 0.4, 0.5],
    [523.25, 0.2, 1.0],  [587.33, 0.2, 1.25], [783.99, 0.4, 1.5],
    [659.25, 0.4, 2.0],  [523.25, 0.2, 2.5],  [493.88, 0.2, 2.75],
    [440.00, 0.4, 3.0],  [493.88, 0.2, 3.5],  [523.25, 0.4, 3.75],
    [440.00, 0.2, 4.25], [392.00, 0.6, 4.5],
    [523.25, 0.2, 5.5],  [659.25, 0.2, 5.75], [783.99, 0.4, 6.0],
    [880.00, 0.2, 6.5],  [783.99, 0.2, 6.75], [659.25, 0.4, 7.0],
    [523.25, 0.2, 7.5],  [587.33, 0.2, 7.75], [523.25, 0.6, 8.0],
  ] as const;

  const loopDuration = 9.0;

  function playNote(freq: number, duration: number, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.04, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    // Cleanup: disconnect nodes after they finish
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
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

  osc.type = "square";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);

  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

export const GeocitiesAudio = memo(function GeocitiesAudio() {
  const { enabled } = useGeocities();
  const ctxRef = useRef<AudioContext | null>(null);
  const melodyRef = useRef<{ play: () => void; stop: () => void } | null>(null);
  const [musicOn, setMusicOn] = useState(true); // ON by default

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const closeCtx = useCallback(() => {
    melodyRef.current?.stop();
    melodyRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
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

  // Full cleanup on disable or unmount
  useEffect(() => {
    if (!enabled) {
      setMusicOn(true); // reset to default ON for next enable
      closeCtx();
    }
  }, [enabled, closeCtx]);

  // Cleanup on unmount
  useEffect(() => {
    return () => closeCtx();
  }, [closeCtx]);

  if (!enabled) return null;

  return (
    <div
      className="fixed bottom-12 z-40 left-4 lg:left-64"
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
});
