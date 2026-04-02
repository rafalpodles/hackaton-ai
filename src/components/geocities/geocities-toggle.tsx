"use client";

import { useGeocities } from "./geocities-provider";

export default function GeocitiesToggle() {
  const { enabled, toggle } = useGeocities();

  return (
    <button
      onClick={toggle}
      className="geocities-toggle-btn group relative mx-auto mb-1 flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition-all"
      title={enabled ? "Wyłącz tryb Geocities" : "Tajny tryb..."}
      style={
        enabled
          ? {
              background: "linear-gradient(to bottom, #c0c0c0, #808080)",
              border: "2px outset #c0c0c0",
              color: "#000080",
              fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
              fontWeight: 700,
              textShadow: "1px 1px 0 #fff",
              imageRendering: "pixelated",
            }
          : {}
      }
    >
      {enabled ? (
        <>
          <span className="inline-block animate-spin text-xs" style={{ animationDuration: "2s" }}>
            *
          </span>
          <span>GEOCITIES ON!</span>
          <span className="inline-block animate-spin text-xs" style={{ animationDuration: "2s", animationDirection: "reverse" }}>
            *
          </span>
        </>
      ) : (
        <span className="text-on-surface-muted/30 transition-colors group-hover:text-on-surface-muted">
          {"<"}90s{">"}
        </span>
      )}
    </button>
  );
}
