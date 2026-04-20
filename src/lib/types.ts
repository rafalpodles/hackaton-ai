export type Role = "participant" | "admin";

export interface Hackathon {
  id: string;
  name: string;
  slug: string;
  description: string;
  hackathon_date: string | null;
  submission_deadline: string | null;
  submission_open: boolean;
  voting_open: boolean;
  survey_open: boolean;
  status: "upcoming" | "active" | "voting" | "finished";
  created_at: string;
  updated_at: string;
}

export interface HackathonCategory {
  id: string;
  hackathon_id: string;
  slug: string;
  label: string;
  display_order: number;
}

export interface HackathonParticipant {
  id: string;
  hackathon_id: string;
  user_id: string;
  role: Role;
  team_id: string | null;
  project_id: string | null;
  is_solo: boolean;
  joined_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: Role;
  openrouter_api_key: string | null;
  openrouter_key_hash: string | null;
  api_key_requested: boolean;
  api_key_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  hackathon_id: string;
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
  hackathon_id: string;
  description: string;
  idea_origin: string;
  journey: string;
  tech_stack: string[];
  video_url: string | null;
  video_duration: number | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  repo_url: string | null;
  app_url: string | null;
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
  hackathon_id: string;
  category: string;
  created_at: string;
}

export interface VoteResult {
  project_id: string;
  project_name: string;
  team_members: string[];
  category: string;
  vote_count: number;
}

export interface HackathonWithStats extends Hackathon {
  project_count: number;
  participant_count: number;
}

export interface SurveyQuestion {
  id: string;
  hackathon_id: string;
  question: string;
  type: "text" | "rating";
  order: number;
  created_at: string;
}

export interface SurveyQuestionResult {
  question_id: string;
  question: string;
  type: "text" | "rating";
  avg_rating: number | null;
  distribution: Record<number, number> | null;
  responses: { user_id: string; display_name: string; answer: string | number | null }[];
}

export interface SurveyStats {
  total_participants: number;
  total_responses: number;
  results: SurveyQuestionResult[];
}
