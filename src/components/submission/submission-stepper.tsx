interface SubmissionStepperProps {
  currentStep: number;
  totalSteps: number;
}

export function SubmissionStepper({
  currentStep,
  totalSteps,
}: SubmissionStepperProps) {
  return (
    <div className="space-y-3">
      <p className="font-space-grotesk text-xs tracking-widest uppercase text-on-surface-muted">
        Step{" "}
        <span className="text-on-surface">
          {String(currentStep + 1).padStart(2, "0")}
        </span>{" "}
        / {String(totalSteps).padStart(2, "0")}
      </p>

      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          let barClass =
            "h-1.5 flex-1 rounded-full transition-all duration-300";

          if (i < currentStep) {
            // Past step — gradient
            barClass += " bg-gradient-to-r from-primary to-secondary";
          } else if (i === currentStep) {
            // Current step — secondary with glow
            barClass +=
              " bg-secondary shadow-[0_0_12px_rgba(255,77,41,0.5)]";
          } else {
            // Future step
            barClass += " bg-surface-high";
          }

          return <div key={i} className={barClass} />;
        })}
      </div>
    </div>
  );
}
