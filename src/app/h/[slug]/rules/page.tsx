import { createClient } from "@/lib/supabase/server";
import { getHackathonBySlug } from "@/lib/utils";
import { notFound } from "next/navigation";
import { GarageRulesView } from "@/components/rules/garage-rules-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HackathonRulesPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  return <GarageRulesView hackathonDate={hackathon.hackathon_date ?? null} />;
}
