import { notFound } from "next/navigation";
import { getHackathonBySlug, getRulesContent } from "@/lib/utils";
import { GarageRulesView } from "@/components/rules/garage-rules-view";
import { AdminEditButton } from "@/components/admin/admin-edit-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RulesPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const rules = await getRulesContent(hackathon.id);
  if (!rules) {
    return (
      <>
        <div className="mx-auto max-w-2xl py-20 text-center text-on-surface-muted">
          Brak treści dla tej edycji. Administrator może je dodać w panelu admina.
        </div>
        <AdminEditButton href={`/h/${slug}/admin/content/rules`} />
      </>
    );
  }

  return (
    <>
      <GarageRulesView hackathonDate={hackathon.hackathon_date} content={rules} />
      <AdminEditButton href={`/h/${slug}/admin/content/rules`} />
    </>
  );
}
