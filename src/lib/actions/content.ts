"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth-guards";
import type { RulesContent } from "@/lib/types";

type ActionResult = { success?: true; error?: string };

function validateRulesContent(c: unknown): c is RulesContent {
  if (!c || typeof c !== "object") return false;
  const r = c as Partial<RulesContent>;
  return (
    typeof r.tagline === "string" &&
    typeof r.time_range === "string" &&
    typeof r.what_is_md === "string" &&
    Array.isArray(r.rules_cards) &&
    typeof r.before_intro === "string" &&
    Array.isArray(r.before_checklist) &&
    typeof r.tokens_box_md === "string" &&
    Array.isArray(r.dont_come_if) &&
    Array.isArray(r.prizes) &&
    Array.isArray(r.schedule) &&
    typeof r.closing_callout_md === "string"
  );
}

export async function updateRules(
  hackathonId: string,
  content: RulesContent
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (!validateRulesContent(content)) {
    return { error: "Nieprawidłowa struktura treści." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathons")
    .update({ rules_content: content })
    .eq("id", hackathonId);

  if (error) return { error: "Nie udało się zapisać treści." };

  revalidatePath(`/h/[slug]/rules`, "page");
  revalidatePath(`/h/[slug]/admin/content/rules`, "page");
  return { success: true };
}

export interface FaqSectionInput {
  slug: string;
  title: string;
  icon: string;
  items: { question: string; answer: string }[];
}

export async function updateFaq(
  hackathonId: string,
  sections: FaqSectionInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const s of sections) {
    if (!s.slug?.trim() || !s.title?.trim() || !s.icon?.trim()) {
      return { error: "Wszystkie sekcje wymagają slug, title i icon." };
    }
    for (const i of s.items) {
      if (!i.question?.trim() || !i.answer?.trim()) {
        return { error: "Wszystkie pytania i odpowiedzi muszą być wypełnione." };
      }
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_faq_sections")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich sekcji." };

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const { data: inserted, error: insErr } = await supabase
      .from("hackathon_faq_sections")
      .insert({
        hackathon_id: hackathonId,
        slug: s.slug.trim(),
        title: s.title.trim(),
        icon: s.icon.trim(),
        display_order: i,
      })
      .select("id")
      .single();
    if (insErr || !inserted) return { error: "Nie udało się dodać sekcji." };

    if (s.items.length > 0) {
      const itemRows = s.items.map((it, idx) => ({
        section_id: inserted.id,
        question: it.question.trim(),
        answer: it.answer.trim(),
        display_order: idx,
      }));
      const { error: itemErr } = await supabase.from("hackathon_faq_items").insert(itemRows);
      if (itemErr) return { error: "Nie udało się dodać pytań." };
    }
  }

  revalidatePath(`/h/[slug]/faq`, "page");
  revalidatePath(`/h/[slug]/admin/content/faq`, "page");
  return { success: true };
}

export interface ProjectIdeaInput {
  name: string;
  description: string;
  tags: string[];
}

export async function updateIdeas(
  hackathonId: string,
  ideas: ProjectIdeaInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const i of ideas) {
    if (!i.name?.trim() || !i.description?.trim()) {
      return { error: "Każdy pomysł wymaga nazwy i opisu." };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_project_ideas")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich pomysłów." };

  if (ideas.length > 0) {
    const { error: insertError } = await supabase
      .from("hackathon_project_ideas")
      .insert(
        ideas.map((idea, i) => ({
          hackathon_id: hackathonId,
          name: idea.name.trim(),
          description: idea.description.trim(),
          tags: idea.tags.map((t) => t.trim()).filter(Boolean),
          display_order: i,
        }))
      );
    if (insertError) return { error: "Nie udało się dodać pomysłów." };
  }

  revalidatePath(`/h/[slug]/ideas`, "page");
  revalidatePath(`/h/[slug]/admin/content/ideas`, "page");
  return { success: true };
}

export interface UsefulPromptInput {
  number: number;
  title: string;
  description: string;
  prompt: string;
}

export async function updatePrompts(
  hackathonId: string,
  prompts: UsefulPromptInput[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  for (const p of prompts) {
    if (!p.title?.trim() || !p.prompt?.trim()) {
      return { error: "Każdy prompt wymaga tytułu i treści." };
    }
    if (typeof p.number !== "number" || Number.isNaN(p.number)) {
      return { error: "Numer promptu musi być liczbą." };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("hackathon_prompts")
    .delete()
    .eq("hackathon_id", hackathonId);
  if (deleteError) return { error: "Nie udało się wyczyścić poprzednich promptów." };

  if (prompts.length > 0) {
    const { error: insertError } = await supabase
      .from("hackathon_prompts")
      .insert(
        prompts.map((p, i) => ({
          hackathon_id: hackathonId,
          number: p.number,
          title: p.title.trim(),
          description: p.description.trim(),
          prompt: p.prompt.trim(),
          display_order: i,
        }))
      );
    if (insertError) return { error: "Nie udało się dodać promptów." };
  }

  revalidatePath(`/h/[slug]/prompts`, "page");
  revalidatePath(`/h/[slug]/admin/content/prompts`, "page");
  return { success: true };
}
