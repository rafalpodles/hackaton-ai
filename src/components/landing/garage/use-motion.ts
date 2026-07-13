"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export const BOOTED_KEY = "ghos_booted";
export const BOOTED_EVENT = "gos:booted";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

function subscribeBooted(onChange: () => void): () => void {
  window.addEventListener(BOOTED_EVENT, onChange);
  return () => window.removeEventListener(BOOTED_EVENT, onChange);
}

export function useBooted(): boolean {
  return useSyncExternalStore(
    subscribeBooted,
    () => {
      try {
        return localStorage.getItem(BOOTED_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );
}

export function useMagnetic(xFactor = 0.22, yFactor = 0.32) {
  const reduced = usePrefersReducedMotion();

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (reduced) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * xFactor}px, ${
        (e.clientY - (r.top + r.height / 2)) * yFactor
      }px)`;
    },
    [reduced, xFactor, yFactor]
  );

  const onPointerLeave = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "translate(0, 0)";
  }, []);

  return { onPointerMove, onPointerLeave, style: { transition: "transform .18s ease" } };
}

export function useTilt(deg = 6) {
  const reduced = usePrefersReducedMotion();

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (reduced) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - (r.top + r.height / 2)) / r.height) * -deg;
      const ry = ((e.clientX - (r.left + r.width / 2)) / r.width) * deg;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    },
    [reduced, deg]
  );

  const onPointerLeave = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }, []);

  return { onPointerMove, onPointerLeave, style: { transition: "transform .2s ease" } };
}
