// src/app/h/[slug]/admin/content/prompts/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getPromptsForHackathon } from "@/lib/utils";
import PromptsEditor from "@/components/admin/prompts-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminPromptsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const prompts = await getPromptsForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-chakra-petch text-2xl font-bold text-on-surface">
          Prompty — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/prompts`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <PromptsEditor hackathonId={hackathon.id} initial={prompts} />
    </div>
  );
}
