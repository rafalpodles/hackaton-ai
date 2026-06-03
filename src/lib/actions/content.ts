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

export interface GuideStepInput {
  category: "fundamenty" | "ai-tools" | "weryfikacja";
  title: string;
  content_md: string;
  order_index: number;
}

export async function createGuideStep(
  hackathonId: string,
  input: GuideStepInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (!input.title?.trim()) return { error: "Tytuł kroku jest wymagany." };
  if (!["fundamenty", "ai-tools", "weryfikacja"].includes(input.category)) {
    return { error: "Nieprawidłowa kategoria." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hackathon_guide_steps")
    .insert({
      hackathon_id: hackathonId,
      category: input.category,
      title: input.title.trim(),
      content_md: input.content_md,
      order_index: input.order_index,
    })
    .select("id")
    .single();

  if (error) return { error: "Nie udało się dodać kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true, id: data.id };
}

export async function updateGuideStep(
  stepId: string,
  hackathonId: string,
  input: Partial<GuideStepInput>
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  if (input.title !== undefined && !input.title.trim()) {
    return { error: "Tytuł kroku jest wymagany." };
  }
  if (input.category !== undefined && !["fundamenty", "ai-tools", "weryfikacja"].includes(input.category)) {
    return { error: "Nieprawidłowa kategoria." };
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.category !== undefined) patch.category = input.category;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.content_md !== undefined) patch.content_md = input.content_md;
  if (input.order_index !== undefined) patch.order_index = input.order_index;

  const { error } = await supabase
    .from("hackathon_guide_steps")
    .update(patch)
    .eq("id", stepId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: "Nie udało się zapisać kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function deleteGuideStep(
  stepId: string,
  hackathonId: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hackathon_guide_steps")
    .delete()
    .eq("id", stepId)
    .eq("hackathon_id", hackathonId);

  if (error) return { error: "Nie udało się usunąć kroku." };

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function reorderGuideSteps(
  hackathonId: string,
  steps: { id: string; order_index: number }[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const supabase = await createClient();
  for (const s of steps) {
    const { error } = await supabase
      .from("hackathon_guide_steps")
      .update({ order_index: s.order_index })
      .eq("id", s.id)
      .eq("hackathon_id", hackathonId);
    if (error) return { error: "Nie udało się zmienić kolejności kroków." };
  }

  revalidatePath(`/h/[slug]/guide`, "page");
  revalidatePath(`/h/[slug]/admin/content/guide`, "page");
  return { success: true };
}

export async function uploadGuideImage(
  hackathonId: string,
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Brak dostępu" };
  }

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Brak pliku." };

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Dozwolone formaty: JPG, PNG, GIF, WebP." };
  }

  const ext = file.name.split(".").pop() ?? "png";
  const fileName = `${hackathonId}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("guide-images")
    .upload(fileName, file, { contentType: file.type });

  if (error) return { error: "Nie udało się przesłać pliku." };

  const { data: { publicUrl } } = supabase.storage
    .from("guide-images")
    .getPublicUrl(fileName);

  return { success: true, url: publicUrl };
}
