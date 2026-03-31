import { createClient } from "@/lib/supabase/server";
import { GarageRulesView } from "@/components/rules/garage-rules-view";

export default async function RulesPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("hackathon_date")
    .eq("id", 1)
    .single();

  return <GarageRulesView hackathonDate={settings?.hackathon_date ?? null} />;
}
