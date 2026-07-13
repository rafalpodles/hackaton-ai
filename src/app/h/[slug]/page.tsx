import { notFound } from "next/navigation";
import { getCurrentUser, getHackathonBySlug, getSubmittedProjects } from "@/lib/utils";
import { ProjectGrid } from "@/components/projects/project-grid";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonProjectsPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const projects = await getSubmittedProjects(hackathon.id);

  if (projects.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-on-surface-muted">
          Brak zgłoszonych projektów. Sprawdź później!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1
          className="font-chakra-petch font-bold leading-[0.95] text-on-surface"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Projekty
        </h1>
        <span className="font-jetbrains-mono text-[13px] text-on-surface-dim">
          {projects.length} zgłoszonych projektów
        </span>
      </div>

      <ProjectGrid projects={projects} showAuthors={isAdmin} />
    </div>
  );
}
