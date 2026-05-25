import { notFound } from "next/navigation";
import { getHackathonBySlug, getPromptsForHackathon } from "@/lib/utils";
import PromptsList from "./prompts-list";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PromptsPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const prompts = await getPromptsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-space-grotesk text-3xl font-bold text-on-surface">
          Przydatne prompty
        </h1>
        <p className="mt-2 text-on-surface-muted">
          5 promptów, które przeprowadzą Cię od pomysłu do kodu. Traktuj AI jak
          seniora, który prowadzi Cię przez proces.
        </p>
      </div>

      {prompts.length === 0 ? (
        <p className="text-on-surface-muted">Brak promptów dla tej edycji.</p>
      ) : (
        <PromptsList prompts={prompts} />
      )}
    </div>
  );
}
