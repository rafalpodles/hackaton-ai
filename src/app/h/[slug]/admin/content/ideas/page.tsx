// src/app/h/[slug]/admin/content/ideas/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getHackathonBySlug, getIdeasForHackathon } from "@/lib/utils";
import IdeasEditor from "@/components/admin/ideas-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminIdeasPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/");

  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) notFound();

  const ideas = await getIdeasForHackathon(hackathon.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-space-grotesk text-2xl font-bold text-on-surface">
          Pomysły — {hackathon.name}
        </h1>
        <Link
          href={`/h/${slug}/ideas`}
          className="text-sm text-on-surface-muted hover:text-on-surface"
        >
          ← podgląd publiczny
        </Link>
      </div>
      <IdeasEditor hackathonId={hackathon.id} initial={ideas} />
    </div>
  );
}
