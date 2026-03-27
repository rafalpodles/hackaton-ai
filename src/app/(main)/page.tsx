import { getAppSettings } from "@/lib/utils";

const phaseLabels: Record<string, string> = {
  submission: "Submission",
  browsing: "Browsing",
  voting: "Voting",
  results: "Results",
};

export default async function HomePage() {
  const settings = await getAppSettings();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="font-space-grotesk text-5xl font-bold leading-tight md:text-6xl">
        <span className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent">
          SPYROSOFT AI
        </span>{" "}
        <span className="text-on-surface">HACKATHON</span>
      </h1>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-outline bg-surface-high/60 px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-primary-dim animate-pulse" />
        <span className="font-space-grotesk text-xs uppercase tracking-wider text-on-surface-muted">
          Phase: {phaseLabels[settings.current_phase] ?? settings.current_phase}
        </span>
      </div>

      <p className="mt-8 text-on-surface-muted">
        Project grid coming soon...
      </p>
    </div>
  );
}
