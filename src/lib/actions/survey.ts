"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils";
import type { SurveyQuestion, SurveyStats, SurveyQuestionResult } from "@/lib/types";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Brak dostępu");
  return user;
}

async function requireParticipant(hackathonId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Musisz być zalogowany");
  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("hackathon_participants")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .single();
  if (!participant) throw new Error("Nie jesteś uczestnikiem tego hackathonu");
  return user;
}

export async function getQuestionsForSurvey(
  hackathonId: string
): Promise<{ questions: SurveyQuestion[]; hasResponded: boolean }> {
  const user = await requireParticipant(hackathonId);
  const supabase = await createClient();

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("survey_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.survey_open) return { questions: [], hasResponded: false };

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("order");

  const { data: existing } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .eq("user_id", user.id)
    .limit(1);

  return {
    questions: (questions ?? []) as SurveyQuestion[],
    hasResponded: (existing?.length ?? 0) > 0,
  };
}

export async function submitSurvey(
  answers: { question_id: string; answer_text?: string; answer_rating?: number }[],
  hackathonId: string
): Promise<{ success?: boolean; error?: string }> {
  let user;
  try {
    user = await requireParticipant(hackathonId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();

  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("survey_open")
    .eq("id", hackathonId)
    .single();

  if (!hackathon?.survey_open) return { error: "Ankieta nie jest otwarta." };

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, type")
    .eq("hackathon_id", hackathonId);

  const questionMap = new Map((questions ?? []).map((q) => [q.id, q.type]));

  for (const answer of answers) {
    const type = questionMap.get(answer.question_id);
    if (!type) return { error: `Nieprawidłowe pytanie.` };
    if (type === "rating") {
      if (!answer.answer_rating || answer.answer_rating < 1 || answer.answer_rating > 5) {
        return { error: "Ocena musi być liczbą od 1 do 5." };
      }
    }
    if (type === "text" && !answer.answer_text?.trim()) {
      return { error: "Odpowiedź tekstowa nie może być pusta." };
    }
  }

  const rows = answers.map((a) => ({
    hackathon_id: hackathonId,
    question_id: a.question_id,
    user_id: user.id,
    answer_text: a.answer_text ?? null,
    answer_rating: a.answer_rating ?? null,
  }));

  const { error } = await supabase.from("survey_responses").insert(rows);
  if (error) {
    if (error.code === "23505") return { error: "Ankieta już wypełniona." };
    return { error: "Nie udało się zapisać odpowiedzi." };
  }

  return { success: true };
}

export async function getQuestionsForAdmin(hackathonId: string): Promise<SurveyQuestion[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("hackathon_id", hackathonId)
    .order("order");
  return (data ?? []) as SurveyQuestion[];
}

export async function getSurveyResults(hackathonId: string): Promise<SurveyStats> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: questions }, { data: responses }, { data: participants }] = await Promise.all([
    supabase.from("survey_questions").select("*").eq("hackathon_id", hackathonId).order("order"),
    supabase.from("survey_responses").select("*, profile:profiles!user_id(display_name)").eq("hackathon_id", hackathonId),
    supabase.from("hackathon_participants").select("id").eq("hackathon_id", hackathonId),
  ]);

  const qs = (questions ?? []) as SurveyQuestion[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rs = (responses ?? []) as any[];

  const uniqueResponders = new Set(rs.map((r) => r.user_id)).size;

  const results: SurveyQuestionResult[] = qs.map((q) => {
    const qr = rs.filter((r) => r.question_id === q.id);
    if (q.type === "rating") {
      const ratings = qr.map((r) => r.answer_rating).filter(Boolean) as number[];
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of ratings) distribution[r] = (distribution[r] ?? 0) + 1;
      return {
        question_id: q.id, question: q.question, type: q.type,
        avg_rating: avg, distribution,
        responses: qr.map((r) => ({ user_id: r.user_id, display_name: r.profile?.display_name ?? "?", answer: r.answer_rating })),
      };
    }
    return {
      question_id: q.id, question: q.question, type: q.type,
      avg_rating: null, distribution: null,
      responses: qr.map((r) => ({ user_id: r.user_id, display_name: r.profile?.display_name ?? "?", answer: r.answer_text })),
    };
  });

  return {
    total_participants: (participants ?? []).length,
    total_responses: uniqueResponders,
    results,
  };
}

export async function updateSurveyQuestions(
  questions: { question: string; type: "text" | "rating"; order: number }[],
  hackathonId: string
): Promise<{ success?: boolean; error?: string }> {
  try { await requireAdmin(); } catch { return { error: "Brak dostępu" }; }
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("survey_questions")
    .delete()
    .eq("hackathon_id", hackathonId);

  if (deleteError) return { error: "Nie udało się zaktualizować pytań." };
  if (questions.length === 0) {
    revalidatePath("/h/[slug]/admin", "page");
    return { success: true };
  }

  const rows = questions.map((q, i) => ({
    hackathon_id: hackathonId,
    question: q.question,
    type: q.type,
    order: q.order ?? i,
  }));

  const { error: insertError } = await supabase.from("survey_questions").insert(rows);
  if (insertError) return { error: "Nie udało się dodać pytań." };

  revalidatePath("/h/[slug]/admin", "page");
  return { success: true };
}
