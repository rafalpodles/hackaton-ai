export type Role = "participant" | "admin";
export type VoteCategory = "concept_to_reality" | "creativity" | "usefulness";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  project_id: string | null;
  team_id: string | null;
  is_solo: boolean;
  role: Role;
  openrouter_api_key: string | null;
  openrouter_key_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembers extends Team {
  members: Pick<Profile, "id" | "display_name" | "avatar_url" | "email">[];
}

export interface TeamRequest {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
}

export interface TeamRequestWithUser extends TeamRequest {
  user: Pick<Profile, "id" | "display_name" | "email">;
}

export interface TeamRequestWithTeam extends TeamRequest {
  team: Pick<Team, "id" | "name">;
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
