import { createClient } from "@/lib/supabase/server";
import { AllProjectsList } from "@/components/projects/all-projects-list";
import type { Profile, Project } from "@/lib/types";

interface ProjectListItem extends Project {
  team_name: string | null;
  members: Pick<Profile, "id" | "display_name" | "avatar_url">[];
  is_solo: boolean;
  solo_user: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
}

export default async function HomePage() {
  const supabase = await createClient();

  // Get all projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("is_submitted", { ascending: false })
    .order("created_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface mb-4">
          Projekty
        </h1>
        <p className="text-on-surface-muted">Brak projektów.</p>
      </div>
    );
  }

  const projectIds = projects.map((p) => p.id);

  // Get teams that own these projects
  const { data: teams } = await supabase
    .from("teams")
    .select("project_id, name, members:profiles!team_id(id, display_name, avatar_url)")
    .in("project_id", projectIds);

  // Get solo users that own these projects
  const { data: soloProfiles } = await supabase
    .from("profiles")
    .select("project_id, id, display_name, avatar_url")
    .in("project_id", projectIds)
    .eq("is_solo", true);

  const teamMap = new Map<string, { name: string; members: Pick<Profile, "id" | "display_name" | "avatar_url">[] }>();
  for (const t of teams ?? []) {
    if (t.project_id) {
      teamMap.set(t.project_id, {
        name: t.name,
        members: (t.members ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url">[],
      });
    }
  }

  const soloMap = new Map<string, Pick<Profile, "id" | "display_name" | "avatar_url">>();
  for (const p of soloProfiles ?? []) {
    if (p.project_id) {
      soloMap.set(p.project_id, { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url });
    }
  }

  const projectList: ProjectListItem[] = projects.map((p) => {
    const team = teamMap.get(p.id);
    const solo = soloMap.get(p.id);
    return {
      ...p,
      team_name: team?.name ?? null,
      members: team?.members ?? (solo ? [solo] : []),
      is_solo: !!solo,
      solo_user: solo ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Projekty
        </h1>
        <p className="mt-1 text-on-surface-muted">
          {projects.length}{" "}
          {projects.length === 1 ? "projekt" : projects.length >= 2 && projects.length <= 4 ? "projekty" : "projektów"}
        </p>
      </div>

      <AllProjectsList projects={projectList} />
    </div>
  );
}
