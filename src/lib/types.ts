export type Role = "participant" | "admin";
export type VoteCategory = "best_overall" | "best_demo_ux" | "most_creative";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  project_id: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  idea_origin: string;
  journey: string;
  tech_stack: string[];
  video_url: string | null;
  video_duration: number | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithTeam extends Project {
  team: Pick<Profile, "id" | "display_name" | "avatar_url">[];
}

export interface Vote {
  id: string;
  voter_id: string;
  project_id: string;
  category: VoteCategory;
  created_at: string;
}

export interface VoteResult {
  project_id: string;
  project_name: string;
  team_members: string[];
  category: VoteCategory;
  vote_count: number;
}
