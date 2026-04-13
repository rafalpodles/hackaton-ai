import { createClient } from "@/lib/supabase/server";
import type { HackathonCategory, VoteResult } from "@/lib/types";

export interface VoteResultsData {
  categories: HackathonCategory[];
  grouped: Record<string, VoteResult[]>;
}

export async function getVoteResults(hackathonId: string): Promise<VoteResultsData> {
  const supabase = await createClient();

  const { data: categoriesData } = await supabase
    .from("hackathon_categories")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("display_order", { ascending: true });

  const categories = (categoriesData ?? []) as HackathonCategory[];

  const { data: votes } = await supabase
    .from("votes")
    .select("category, project_id, projects!project_id(id, name)")
    .eq("hackathon_id", hackathonId);

  const { data: participants } = await supabase
    .from("hackathon_participants")
    .select("project_id, user:profiles!user_id(display_name)")
    .eq("hackathon_id", hackathonId)
    .not("project_id", "is", null);

  const teamMap: Record<string, string[]> = {};
  for (const p of participants ?? []) {
    if (p.project_id && p.user) {
      const u = p.user as unknown as { display_name: string };
      if (!teamMap[p.project_id]) teamMap[p.project_id] = [];
      teamMap[p.project_id].push(u.display_name);
    }
  }

  const countMap: Record<string, VoteResult> = {};
  for (const v of votes ?? []) {
    const proj = v.projects as unknown as { id: string; name: string };
    if (!proj) continue;
    const key = `${proj.id}_${v.category}`;
    if (!countMap[key]) {
      countMap[key] = {
        project_id: proj.id,
        project_name: proj.name,
        team_members: teamMap[proj.id] ?? [],
        category: v.category,
        vote_count: 0,
      };
    }
    countMap[key].vote_count++;
  }

  const voteResults = Object.values(countMap);

  const grouped: Record<string, VoteResult[]> = {};
  for (const cat of categories) {
    grouped[cat.slug] = [];
  }
  for (const r of voteResults) {
    if (grouped[r.category]) {
      grouped[r.category].push(r);
    }
  }
  for (const cat of categories) {
    grouped[cat.slug].sort((a, b) => b.vote_count - a.vote_count);
  }

  return { categories, grouped };
}

export function voteLabel(count: number): string {
  if (count === 1) return "głos";
  if (count >= 2 && count <= 4) return "głosy";
  return "głosów";
}
