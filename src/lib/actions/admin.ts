"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  // Remove files from storage buckets
  const buckets = ["videos", "pdfs", "thumbnails"];
  for (const bucket of buckets) {
    const { data: files } = await supabase.storage
      .from(bucket)
      .list(projectId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${projectId}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }
  }

  // Unlink profiles
  await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("project_id", projectId);

  // Delete project (cascades votes)
  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (deleteError) throw new Error("Failed to delete project");

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/feed");
}

export async function exportResults(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Results
  const { data: results } = await supabase.rpc("get_vote_results");
  const resultsSheet = workbook.addWorksheet("Results");
  resultsSheet.columns = [
    { header: "Category", key: "category", width: 20 },
    { header: "Rank", key: "rank", width: 8 },
    { header: "Project Name", key: "project_name", width: 30 },
    { header: "Team", key: "team", width: 40 },
    { header: "Vote Count", key: "vote_count", width: 12 },
  ];

  const grouped: Record<string, typeof results> = {};
  for (const r of results ?? []) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort(
      (a: { vote_count: number }, b: { vote_count: number }) =>
        b.vote_count - a.vote_count
    );
    grouped[cat].forEach(
      (
        r: {
          category: string;
          project_name: string;
          team_members: string[];
          vote_count: number;
        },
        i: number
      ) => {
        resultsSheet.addRow({
          category: r.category,
          rank: i + 1,
          project_name: r.project_name,
          team: r.team_members.join(", "),
          vote_count: r.vote_count,
        });
      }
    );
  }

  // Sheet 2: All Votes
  const { data: votes } = await supabase
    .from("votes")
    .select("category, profiles!voter_id(email), projects!project_id(name)");

  const votesSheet = workbook.addWorksheet("All Votes");
  votesSheet.columns = [
    { header: "Voter Email", key: "voter_email", width: 30 },
    { header: "Category", key: "category", width: 20 },
    { header: "Project Name", key: "project_name", width: 30 },
  ];

  for (const v of votes ?? []) {
    votesSheet.addRow({
      voter_email: (v.profiles as unknown as { email: string })?.email ?? "",
      category: v.category,
      project_name: (v.projects as unknown as { name: string })?.name ?? "",
    });
  }

  // Sheet 3: Projects
  const { data: projects } = await supabase.from("projects").select("*");
  const projectsSheet = workbook.addWorksheet("Projects");
  projectsSheet.columns = [
    { header: "ID", key: "id", width: 36 },
    { header: "Name", key: "name", width: 30 },
    { header: "Description", key: "description", width: 50 },
    { header: "Idea Origin", key: "idea_origin", width: 30 },
    { header: "Journey", key: "journey", width: 30 },
    { header: "Tech Stack", key: "tech_stack", width: 30 },
    { header: "Video URL", key: "video_url", width: 40 },
    { header: "PDF URL", key: "pdf_url", width: 40 },
    { header: "Submitted", key: "is_submitted", width: 10 },
    { header: "Created At", key: "created_at", width: 20 },
  ];

  for (const p of projects ?? []) {
    projectsSheet.addRow({
      ...p,
      tech_stack: p.tech_stack?.join(", ") ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer as ArrayBuffer).toString("base64");
  return base64;
}
