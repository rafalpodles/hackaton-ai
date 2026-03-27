import type { ReactNode } from "react";
import type { Phase } from "@/lib/types";

interface PhaseGateProps {
  currentPhase: Phase;
  allowedPhases: Phase[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PhaseGate({
  currentPhase,
  allowedPhases,
  children,
  fallback,
}: PhaseGateProps) {
  if (!allowedPhases.includes(currentPhase)) {
    return (
      fallback ?? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="font-space-grotesk text-lg text-on-surface-muted">
            Not available yet
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
