export function GarageBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden bg-ink"
      style={{ pointerEvents: "none", contain: "strict" }}
    >
      <div
        data-gos-anim
        className="absolute rounded-full"
        style={{
          width: "70vw",
          height: "70vw",
          left: "-15vw",
          top: "-25vh",
          background: "radial-gradient(circle, rgba(99,102,241,.55), transparent 60%)",
          willChange: "transform",
          filter: "blur(60px)",
          animation: "auroraA 22s ease-in-out infinite",
        }}
      />
      <div
        data-gos-anim
        className="absolute rounded-full"
        style={{
          width: "65vw",
          height: "65vw",
          right: "-18vw",
          top: "5vh",
          background: "radial-gradient(circle, rgba(255,90,77,.42), transparent 60%)",
          willChange: "transform",
          filter: "blur(70px)",
          animation: "auroraB 26s ease-in-out infinite",
        }}
      />
      <div
        data-gos-anim
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          left: "25vw",
          bottom: "-30vh",
          background: "radial-gradient(circle, rgba(46,230,207,.28), transparent 62%)",
          willChange: "transform",
          filter: "blur(80px)",
          animation: "auroraA 30s ease-in-out infinite reverse",
        }}
      />
      <div
        data-gos-anim
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          animation: "gridPan 40s linear infinite",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 30%, #000 40%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 30%, #000 40%, transparent 90%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0, rgba(0,0,0,.16) 1px, transparent 1px, transparent 3px)",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
