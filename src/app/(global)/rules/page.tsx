import { createClient } from "@/lib/supabase/server";
import { GarageRulesView } from "@/components/rules/garage-rules-view";

export default async function RulesPage() {
  const supabase = await createClient();

  // Get the latest hackathon date for display
  const { data: hackathon } = await supabase
    .from("hackathons")
    .select("hackathon_date")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return <GarageRulesView hackathonDate={hackathon?.hackathon_date ?? null} />;
}
