import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HackathonGuideStep } from "@/lib/types";

interface CustomGuideStepProps {
  step: HackathonGuideStep;
}

export function CustomGuideStep({ step }: CustomGuideStepProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-surface-low/60 p-6 backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          hackathon
        </span>
        <h3 className="font-space-grotesk text-lg font-bold text-on-surface">
          {step.title}
        </h3>
      </div>
      <div className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:border prose-img:border-outline prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {step.content_md}
        </ReactMarkdown>
      </div>
    </div>
  );
}
