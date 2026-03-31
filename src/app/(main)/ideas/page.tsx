import { projectIdeas } from "@/lib/guide-data";

export default function IdeasPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Pomysły na projekty
        </h1>
        <p className="mt-2 text-on-surface-muted">
          Nie wiesz co zbudować? Oto kilka inspiracji. Możesz zbudować
          cokolwiek — liczy się realizacja i wykorzystanie AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projectIdeas.map((idea) => (
          <div
            key={idea.name}
            className="rounded-xl border border-outline bg-surface-high/30 p-5 transition-colors hover:border-primary/25 hover:bg-surface-high/50"
          >
            <h3 className="font-space-grotesk text-base font-bold text-on-surface mb-2">
              {idea.name}
            </h3>
            <p className="text-sm text-on-surface-muted leading-relaxed mb-3">
              {idea.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-0.5 font-space-grotesk text-[10px] font-medium text-primary-dim"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
