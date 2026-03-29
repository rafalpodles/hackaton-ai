import Link from "next/link";
import { getSubmittedProjects } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { ProjectGrid } from "@/components/projects/project-grid";

export default async function HomePage() {
  const projects = await getSubmittedProjects();

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-space-grotesk text-5xl font-bold leading-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary-dim to-secondary bg-clip-text text-transparent">
            SPYROSOFT AI
          </span>{" "}
          <span className="text-on-surface">HACKATHON</span>
        </h1>

        <Link href="/feed">
          <GradientButton>Oglądaj wszystkie dema</GradientButton>
        </Link>
      </div>

      {/* Project Grid */}
      {projects.length > 0 ? (
        <ProjectGrid projects={projects} />
      ) : (
        <p className="text-center text-on-surface-muted">
          Brak zgłoszonych projektów.
        </p>
      )}

      {/* Project count */}
      <p className="text-center text-sm text-on-surface-muted">
        {projects.length}{" "}
        {projects.length === 1 ? "projekt" : projects.length >= 2 && projects.length <= 4 ? "projekty" : "projektów"} zgłoszonych
      </p>
    </div>
  );
}
