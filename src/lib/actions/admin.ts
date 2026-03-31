"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import ExcelJS from "exceljs";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

export async function toggleVoting(open: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({ voting_open: open })
    .eq("id", 1);

  if (error) throw new Error("Nie udało się zaktualizować statusu głosowania");

  revalidatePath("/admin");
  revalidatePath("/vote");
}

export async function toggleUserRole(userId: string, role: "admin" | "participant") {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Nie możesz zmienić własnej roli");

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw new Error("Nie udało się zmienić roli");

  revalidatePath("/admin");
}

export async function toggleSubmissions(open: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({ submission_open: open })
    .eq("id", 1);

  if (error) throw new Error("Nie udało się zmienić statusu zgłoszeń");

  revalidatePath("/admin");
  revalidatePath("/my-project");
  revalidatePath("/");
}

export async function setSubmissionDeadline(deadline: string | null) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({ submission_deadline: deadline })
    .eq("id", 1);

  if (error) throw new Error("Nie udało się ustawić deadline'u");

  revalidatePath("/admin");
  revalidatePath("/my-project");
  revalidatePath("/");
}

export async function setHackathonDate(date: string | null) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_settings")
    .update({ hackathon_date: date })
    .eq("id", 1);

  if (error) throw new Error("Nie udało się ustawić daty hackathonu");

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProject(projectId: string) {
  await requireAdmin();
  const supabase = await createClient();

  // Remove files from storage buckets
  const buckets = ["videos", "presentations", "thumbnails"];
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
  const { error: unlinkError } = await supabase
    .from("profiles")
    .update({ project_id: null })
    .eq("project_id", projectId);

  if (unlinkError) throw new Error("Nie udało się odłączyć członków zespołu");

  // Delete project (cascades votes)
  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (deleteError) throw new Error("Nie udało się usunąć projektu");

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/feed");
}

export async function generateOpenRouterKey(
  userId: string,
  limit: number = 5
) {
  await requireAdmin();
  const supabase = await createClient();

  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!managementKey) throw new Error("Brak klucza zarządzania OpenRouter");

  // Get user display name for key naming
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, openrouter_key_hash")
    .eq("id", userId)
    .single();

  if (!profile) throw new Error("Nie znaleziono użytkownika");

  // If user already has a key, delete it first
  if (profile.openrouter_key_hash) {
    await fetch(
      `https://openrouter.ai/api/v1/keys/${profile.openrouter_key_hash}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managementKey}` },
      }
    );
  }

  // Create new key
  const res = await fetch("https://openrouter.ai/api/v1/keys", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Hackathon - ${profile.display_name}`,
      limit,
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  const apiKey: string = data.key;
  const keyHash: string = data.data?.hash ?? data.hash;

  // Save to profile and clear request flag
  const { error } = await supabase
    .from("profiles")
    .update({
      openrouter_api_key: apiKey,
      openrouter_key_hash: keyHash,
      api_key_requested: false,
    })
    .eq("id", userId);

  if (error) throw new Error("Nie udało się zapisać klucza");

  revalidatePath("/admin");
  revalidatePath("/profile");
}

export async function deleteOpenRouterKey(userId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!managementKey) throw new Error("Brak klucza zarządzania OpenRouter");

  const { data: profile } = await supabase
    .from("profiles")
    .select("openrouter_key_hash")
    .eq("id", userId)
    .single();

  if (!profile?.openrouter_key_hash)
    throw new Error("Użytkownik nie ma klucza API");

  // Delete from OpenRouter
  const res = await fetch(
    `https://openrouter.ai/api/v1/keys/${profile.openrouter_key_hash}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${managementKey}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error("Nie udało się usunąć klucza z OpenRouter");
  }

  // Clear from profile and reset request state
  const { error } = await supabase
    .from("profiles")
    .update({
      openrouter_api_key: null,
      openrouter_key_hash: null,
      api_key_requested: false,
      api_key_requested_at: null,
    })
    .eq("id", userId);

  if (error) throw new Error("Nie udało się wyczyścić klucza");

  revalidatePath("/admin");
  revalidatePath("/profile");
}

export async function getOpenRouterKeyUsage(
  keyHash: string
): Promise<{ usage: number; limit: number | null } | null> {
  await requireAdmin();

  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!managementKey) return null;

  const res = await fetch(
    `https://openrouter.ai/api/v1/keys/${keyHash}`,
    {
      headers: { Authorization: `Bearer ${managementKey}` },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) return null;

  const { data } = await res.json();
  return {
    usage: data?.usage ?? 0,
    limit: data?.limit ?? null,
  };
}

export async function exportResults(): Promise<string> {
  await requireAdmin();
  const supabase = await createClient();

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Results — direct query instead of RPC
  const { data: votes } = await supabase
    .from("votes")
    .select("category, project_id, projects!project_id(name, id), profiles!voter_id(email)");

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("display_name, project_id")
    .not("project_id", "is", null);

  // Build team members map
  const teamMap: Record<string, string[]> = {};
  for (const p of allProfiles ?? []) {
    if (p.project_id) {
      if (!teamMap[p.project_id]) teamMap[p.project_id] = [];
      teamMap[p.project_id].push(p.display_name);
    }
  }

  // Aggregate vote counts
  const countMap: Record<string, { project_id: string; project_name: string; category: string; vote_count: number }> = {};
  for (const v of votes ?? []) {
    const proj = v.projects as unknown as { id: string; name: string };
    const key = `${proj.id}_${v.category}`;
    if (!countMap[key]) {
      countMap[key] = {
        project_id: proj.id,
        project_name: proj.name,
        category: v.category,
        vote_count: 0,
      };
    }
    countMap[key].vote_count++;
  }

  const results = Object.values(countMap).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return b.vote_count - a.vote_count;
  });

  const resultsSheet = workbook.addWorksheet("Results");
  resultsSheet.columns = [
    { header: "Category", key: "category", width: 20 },
    { header: "Rank", key: "rank", width: 8 },
    { header: "Project Name", key: "project_name", width: 30 },
    { header: "Team", key: "team", width: 40 },
    { header: "Vote Count", key: "vote_count", width: 12 },
  ];

  let currentCategory = "";
  let rank = 0;
  for (const r of results) {
    if (r.category !== currentCategory) {
      currentCategory = r.category;
      rank = 1;
    } else {
      rank++;
    }
    resultsSheet.addRow({
      category: r.category,
      rank,
      project_name: r.project_name,
      team: (teamMap[r.project_id] ?? []).join(", "),
      vote_count: r.vote_count,
    });
  }

  // Sheet 2: All Votes
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
