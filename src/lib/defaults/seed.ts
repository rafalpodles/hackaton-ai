import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RULES } from "./rules";
import { DEFAULT_FAQ } from "./faq";
import { DEFAULT_IDEAS } from "./ideas";
import { DEFAULT_PROMPTS } from "./prompts";

const DEFAULT_CATEGORIES = [
  { slug: "concept_to_reality", label: "Droga od koncepcji do realizacji ⚡", display_order: 1 },
  { slug: "creativity", label: "Kreatywność pomysłu ✨", display_order: 2 },
  { slug: "usefulness", label: "Przydatność / wartość użytkowa ⚙️", display_order: 3 },
];

export async function seedHackathonContent(
  supabase: SupabaseClient,
  hackathonId: string
): Promise<{ rules: boolean; faq: boolean; ideas: boolean; prompts: boolean; categories: boolean }> {
  const result = { rules: false, faq: false, ideas: false, prompts: false, categories: false };

  const { data: h } = await supabase
    .from("hackathons")
    .select("rules_content")
    .eq("id", hackathonId)
    .single();
  if (h && h.rules_content === null) {
    await supabase
      .from("hackathons")
      .update({ rules_content: DEFAULT_RULES })
      .eq("id", hackathonId);
    result.rules = true;
  }

  const { data: existingSections } = await supabase
    .from("hackathon_faq_sections")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingSections || existingSections.length === 0) {
    for (let i = 0; i < DEFAULT_FAQ.length; i++) {
      const section = DEFAULT_FAQ[i];
      const { data: inserted } = await supabase
        .from("hackathon_faq_sections")
        .insert({
          hackathon_id: hackathonId,
          slug: section.slug,
          title: section.title,
          icon: section.icon,
          display_order: i,
        })
        .select("id")
        .single();
      if (inserted) {
        const itemRows = section.items.map((item, idx) => ({
          section_id: inserted.id,
          question: item.question,
          answer: item.answer,
          display_order: idx,
        }));
        if (itemRows.length > 0) {
          await supabase.from("hackathon_faq_items").insert(itemRows);
        }
      }
    }
    result.faq = true;
  }

  const { data: existingIdeas } = await supabase
    .from("hackathon_project_ideas")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingIdeas || existingIdeas.length === 0) {
    await supabase.from("hackathon_project_ideas").insert(
      DEFAULT_IDEAS.map((idea, i) => ({
        hackathon_id: hackathonId,
        name: idea.name,
        description: idea.description,
        tags: idea.tags,
        display_order: i,
      }))
    );
    result.ideas = true;
  }

  const { data: existingPrompts } = await supabase
    .from("hackathon_prompts")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingPrompts || existingPrompts.length === 0) {
    await supabase.from("hackathon_prompts").insert(
      DEFAULT_PROMPTS.map((p, i) => ({
        hackathon_id: hackathonId,
        number: p.number,
        title: p.title,
        description: p.description,
        prompt: p.prompt,
        display_order: i,
      }))
    );
    result.prompts = true;
  }

  const { data: existingCategories } = await supabase
    .from("hackathon_categories")
    .select("id")
    .eq("hackathon_id", hackathonId)
    .limit(1);
  if (!existingCategories || existingCategories.length === 0) {
    await supabase.from("hackathon_categories").insert(
      DEFAULT_CATEGORIES.map((cat) => ({
        hackathon_id: hackathonId,
        slug: cat.slug,
        label: cat.label,
        display_order: cat.display_order,
      }))
    );
    result.categories = true;
  }

  return result;
}
