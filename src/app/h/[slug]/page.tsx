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
    <div className="space-y-6">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Projekty
        </h1>
        <p className="mt-1 text-on-surface-muted">
          {projects.length} zgłoszonych projektów
        </p>
      </div>

      <ProjectGrid projects={projects} showAuthors={isAdmin} />
    </div>
  );
}
